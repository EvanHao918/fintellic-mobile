// src/components/CompanyFundamentalsAS.tsx
// AllSight 2026 — company fundamentals panel, faithful to the web metrics layer.
// Data (all REAL, same backend as web):
//   /metrics/{tk}            → metrics{}, valuation_bands{}, score{}
//   /metrics/{tk}/financials → periods[] (income/cashflow/balance over 24 quarters)
//   /companies/{tk}/analyst  → distribution + consensus + price_target
// Neutral throughout: quality = fundamentals percentile, never a buy/sell call.
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import apiClient from '../api/client';
import { AS } from '../theme/allsight';

interface Props { ticker: string }

// ---- formatters ----
const money = (v?: number | null): string => {
  if (v == null || isNaN(v)) return '—';
  const a = Math.abs(v), s = v < 0 ? '-$' : '$';
  if (a >= 1e12) return s + (a / 1e12).toFixed(1) + 'T';
  if (a >= 1e9) return s + (a / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return s + (a / 1e6).toFixed(0) + 'M';
  return s + a.toLocaleString();
};
const pct = (x?: number | null): string => (x == null || isNaN(x) ? '—' : (x * 100).toFixed(1) + '%');
const mult = (x?: number | null): string => (x == null || isNaN(x) ? '—' : x.toFixed(1) + '×');
const num = (x?: number | null, d = 2): string => (x == null || isNaN(x) ? '—' : x.toFixed(d));

const VERDICT_COLOR: Record<string, string> = { undervalued: AS.color.accent, overvalued: AS.color.bear, fair: AS.color.gold };

// TTM helpers (mirror web _ttmAt / _dig)
const dig = (o: any, path: string[]): number | null => {
  for (let i = 0; i < path.length && o != null; i++) o = o[path[i]];
  return o == null || isNaN(o) ? null : +o;
};
const ttmAt = (per: any[], path: string[], i: number): number | null => {
  if (i < 3) return null;
  let s = 0;
  for (let j = i - 3; j <= i; j++) { const v = dig(per[j], path); if (v == null) return null; s += v; }
  return s;
};

const Block: React.FC<{ title: string; sub?: string; children: React.ReactNode }> = ({ title, sub, children }) => (
  <View style={styles.block}>
    <View style={styles.bh}>
      <Text style={styles.bt}>{title}</Text>
      {!!sub && <Text style={styles.bs}>{sub}</Text>}
    </View>
    {children}
  </View>
);

const Spark: React.FC<{ series: (number | null)[]; color: string }> = ({ series, color }) => {
  const w = 120, h = 34, pad = 3;
  const real = series.filter((v): v is number => v != null && !isNaN(v));
  if (real.length < 2) return null;
  const mn = Math.min(...real), mx = Math.max(...real);
  const base = Math.min(mn, 0), top = Math.max(mx, 0), span = top - base || Math.abs(base || 1);
  const n = series.length, pts: [number, number][] = [];
  for (let i = 0; i < n; i++) { const v = series[i]; if (v == null || isNaN(v)) continue; const x = pad + (w - 2 * pad) * (i / (n - 1)); const y = h - pad - (h - 2 * pad) * ((v - base) / span); pts.push([x, y]); }
  if (pts.length < 2) return null;
  const line = 'M' + pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const area = line + ` L${pts[pts.length - 1][0].toFixed(1)} ${h - pad} L${pts[0][0].toFixed(1)} ${h - pad} Z`;
  const gid = 'sp' + Math.round(pts[0][1] * 1000) + color.replace(/\W/g, '');
  return (
    <Svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <Defs><LinearGradient id={gid} x1="0" x2="0" y1="0" y2="1"><Stop offset="0" stopColor={color} stopOpacity={0.16} /><Stop offset="1" stopColor={color} stopOpacity={0} /></LinearGradient></Defs>
      <Path d={area} fill={`url(#${gid})`} />
      <Path d={line} fill="none" stroke={color} strokeWidth={1.6} strokeLinejoin="round" strokeLinecap="round" />
    </Svg>
  );
};

const CompanyFundamentalsAS: React.FC<Props> = ({ ticker }) => {
  const [d, setD] = useState<any>(null);
  const [periods, setPeriods] = useState<any[]>([]);
  const [analyst, setAnalyst] = useState<any>(null);

  useEffect(() => {
    let alive = true;
    const tk = encodeURIComponent(ticker);
    apiClient.get(`/metrics/${tk}`).then((r: any) => alive && setD(r)).catch(() => {});
    apiClient.get(`/metrics/${tk}/financials`).then((r: any) => alive && setPeriods(r?.periods || [])).catch(() => {});
    apiClient.get(`/companies/${tk}/analyst`).then((r: any) => alive && setAnalyst(r)).catch(() => {});
    return () => { alive = false; };
  }, [ticker]);

  if (!d && !periods.length) return null;
  const m = d?.metrics, bands = d?.valuation_bands || {}, sc = d?.score;

  // ---- Score ----
  const DIM_NAMES: Record<string, string> = { profitability: 'Profitability', growth: 'Growth', financial_health: 'Financial health', management: 'Capital efficiency', valuation: 'Valuation' };
  const DIM_ORDER = ['profitability', 'growth', 'financial_health', 'management', 'valuation'];

  // ---- Key metrics grid ----
  const METRICS: [string, string, 'mult' | 'pct'][] = [
    ['P / E', 'price_to_earnings', 'mult'], ['P / S', 'price_to_sales', 'mult'],
    ['P / B', 'price_to_book', 'mult'], ['EV / EBITDA', 'ev_to_ebitda', 'mult'],
    ['Gross margin', 'gross_margin', 'pct'], ['Operating margin', 'operating_margin', 'pct'],
    ['Net margin', 'net_margin', 'pct'], ['FCF margin', 'fcf_margin', 'pct'],
    ['Return on equity', 'return_on_equity', 'pct'], ['ROIC', 'roic', 'pct'],
    ['Debt / equity', 'debt_to_equity', 'mult'], ['Rev. growth', 'revenue_growth', 'pct'],
  ];

  // ---- Valuation bands ----
  const BAND_ORDER: [string, string][] = [['pe', 'Price to Earnings'], ['ps', 'Price to Sales'], ['pocf', 'Price to OCF'], ['pfcf', 'Price to FCF'], ['pb', 'Price to Book'], ['ev_ebitda', 'EV / EBITDA']];

  // ---- Trends (TTM series from periods) ----
  const per = periods;
  const n = per.length;
  const seriesFor = (path: string[]) => Array.from({ length: n }, (_, i) => ttmAt(per, path, i));
  const fcfSeries = () => Array.from({ length: n }, (_, i) => {
    const o = ttmAt(per, ['cashflow', 'net_cash_from_operating_activities'], i);
    const c = ttmAt(per, ['cashflow', 'purchase_of_property_plant_and_equipment'], i);
    return o == null || c == null ? null : o - Math.abs(c);
  });
  const omSeries = () => Array.from({ length: n }, (_, i) => {
    const oi = ttmAt(per, ['income', 'operating_income'], i), rv = ttmAt(per, ['income', 'revenue'], i);
    return oi == null || rv == null || rv === 0 ? null : oi / rv;
  });
  const TRENDS: [string, (number | null)[], 'money' | 'pct'][] = n >= 6 ? [
    ['Revenue', seriesFor(['income', 'revenue']), 'money'],
    ['Net income', seriesFor(['income', 'consolidated_net_income_loss']), 'money'],
    ['Free cash flow', fcfSeries(), 'money'],
    ['Operating margin', omSeries(), 'pct'],
  ] : [];

  // ---- Analyst ----
  const a = analyst?.analyst, dist = a?.distribution, ptg = a?.price_target, price = analyst?.price;
  const SEGS: [string, number, string][] = dist ? [
    ['Strong buy', dist.strong_buy || 0, '#1E7A4E'], ['Buy', dist.buy || 0, '#4FB07A'],
    ['Hold', dist.hold || 0, '#C9A227'], ['Sell', dist.sell || 0, '#E08A4A'], ['Strong sell', dist.strong_sell || 0, '#D2544A'],
  ] : [];
  const anTotal = SEGS.reduce((s, x) => s + x[1], 0);
  const hasPT = ptg && ptg.consensus != null && !isNaN(+ptg.consensus);
  const upside = hasPT && price ? (+ptg.consensus / price - 1) * 100 : null;

  return (
    <View>
      {/* QUALITY SCORE */}
      {sc?.composite != null && (
        <Block title="Quality score" sub={`vs ${sc.peer_group || 'the whole market'} · ${sc.peer_count || 0} peers`}>
          <View style={styles.scoreTop}>
            <Text style={styles.scBig}>{Math.round(sc.composite)}</Text>
            <Text style={styles.scDen}>/100</Text>
            <Text style={styles.scSub}>percentile rank{'\n'}on fundamentals</Text>
          </View>
          {DIM_ORDER.map((k) => {
            const v = sc.dimensions?.[k];
            const low = k === sc.lowest_dimension;
            return (
              <View key={k} style={styles.sdim}>
                <View style={styles.sdTop}>
                  <Text style={styles.sdL}>{DIM_NAMES[k]}{low && <Text style={styles.slow}>  weakest</Text>}</Text>
                  <Text style={styles.sdV}>{v == null ? '—' : Math.round(v)}</Text>
                </View>
                <View style={styles.sdTrack}><View style={[styles.sdFill, { width: `${Math.max(0, Math.min(100, v || 0))}%`, backgroundColor: low ? AS.color.gold : AS.color.accent }]} /></View>
              </View>
            );
          })}
          <Text style={styles.note}>Where this company ranks against its sector on profitability, growth, balance-sheet health, capital efficiency and valuation — percentile of each metric vs peers, then averaged. <Text style={styles.noteB}>A quality ranking, not a price prediction.</Text></Text>
        </Block>
      )}

      {/* KEY METRICS */}
      {m && (
        <Block title="Key metrics" sub="trailing 12-month">
          <View style={styles.mgrid}>
            {METRICS.map(([label, key, kind]) => (
              <View key={key} style={styles.mcell}>
                <Text style={styles.mLabel}>{label}</Text>
                <Text style={styles.mVal}>{kind === 'pct' ? pct(m[key]) : mult(m[key])}</Text>
              </View>
            ))}
          </View>
        </Block>
      )}

      {/* 5-YEAR VALUATION BANDS */}
      {Object.keys(bands).length > 0 && (
        <Block title="5-year valuation" sub="where each multiple sits in its own 5-year range">
          {BAND_ORDER.filter(([k]) => bands[k]).map(([k, label]) => {
            const b = bands[k];
            const posP = Math.max(3, Math.min(97, b.position_pct));
            const col = VERDICT_COLOR[b.verdict] || AS.color.gold;
            return (
              <View key={k} style={styles.vrow}>
                <View style={styles.vbTop}>
                  <Text style={styles.vbL}>{label}</Text>
                  <Text style={[styles.vbVerdict, { color: col }]}>{b.verdict}</Text>
                </View>
                <View style={styles.vbar}>
                  <View style={[styles.vfill, { width: `${posP}%`, backgroundColor: col + '33' }]} />
                  <View style={styles.vtick} />
                  <View style={[styles.vdot, { left: `${posP}%`, backgroundColor: col }]} />
                </View>
                <View style={styles.vaxis}>
                  {[['0th', b.p0], ['25th', b.p25], ['50th', b.p50], ['75th', b.p75], ['100th', b.p100]].map(([lbl, val], i) => (
                    <View key={i} style={styles.vax}>
                      <Text style={styles.vaxl}>{lbl as string}</Text>
                      <Text style={styles.vaxv}>{num(val as number, 1)}×</Text>
                    </View>
                  ))}
                </View>
                <Text style={[styles.vcur, { color: col }]}>now {num(b.current, 1)}×</Text>
              </View>
            );
          })}
        </Block>
      )}

      {/* TRENDS */}
      {TRENDS.length > 0 && (
        <Block title="Trends" sub="trailing 12-month">
          {TRENDS.map(([label, series, kind]) => {
            const real = series.map((v, i) => [v, i] as [number | null, number]).filter(([v]) => v != null);
            if (real.length < 2) return null;
            const lastI = real[real.length - 1][1], cur = series[lastI];
            const prevI = lastI - 4, prev = prevI >= 0 ? series[prevI] : null;
            const yoy = prev != null && prev !== 0 ? cur! / Math.abs(prev) - 1 : null;
            const dcol = yoy == null ? AS.color.ink3 : yoy >= 0 ? AS.color.bull : AS.color.bear;
            return (
              <View key={label} style={styles.trc}>
                <View style={styles.trLeft}>
                  <Text style={styles.trL}>{label}</Text>
                  <Text style={styles.trV}>{kind === 'money' ? money(cur) : pct(cur)}</Text>
                  {yoy != null && <Text style={[styles.trD, { color: dcol }]}>{yoy >= 0 ? '▲' : '▼'}{Math.abs(yoy * 100).toFixed(1)}% YoY</Text>}
                </View>
                <Spark series={series} color={cur != null && cur < 0 ? AS.color.bear : AS.color.accent} />
              </View>
            );
          })}
        </Block>
      )}

      {/* ANALYST */}
      {(anTotal > 0 || hasPT) && (
        <Block title="Analyst ratings" sub={anTotal ? `${anTotal} analysts` : ''}>
          {anTotal > 0 && (
            <View style={{ marginBottom: hasPT ? 16 : 0 }}>
              <Text style={styles.ancons}>{a.consensus || '—'}</Text>
              <Text style={styles.ansub}>consensus of {anTotal} covering analysts</Text>
              <View style={styles.anbar}>
                {SEGS.filter((s) => s[1] > 0).map((s) => (<View key={s[0]} style={{ width: `${(s[1] / anTotal) * 100}%`, backgroundColor: s[2] }} />))}
              </View>
              <View style={styles.anleg}>
                {SEGS.filter((s) => s[1] > 0).map((s) => (
                  <View key={s[0]} style={styles.anlg}><View style={[styles.anlgDot, { backgroundColor: s[2] }]} /><Text style={styles.anlgTxt}>{s[0]} {s[1]}</Text></View>
                ))}
              </View>
            </View>
          )}
          {hasPT && (
            <View>
              <Text style={styles.antgt}>${(+ptg.consensus).toFixed(2)}</Text>
              <Text style={styles.ansub}>avg price target{upside != null && <Text style={{ color: upside >= 0 ? AS.color.bull : AS.color.bear, fontWeight: '700' }}>  {upside >= 0 ? '+' : '−'}{Math.abs(upside).toFixed(1)}% vs ${(+price).toFixed(2)}</Text>}</Text>
              {ptg.high > ptg.low && (() => {
                const lo = +ptg.low, hi = +ptg.high, cons = +ptg.consensus;
                const curPos = price ? Math.max(2, Math.min(98, ((price - lo) / (hi - lo)) * 100)) : null;
                const tgtPos = Math.max(2, Math.min(98, ((cons - lo) / (hi - lo)) * 100));
                return (
                  <>
                    <View style={styles.antrange}>
                      {curPos != null && <View style={[styles.antcur, { left: `${curPos}%` }]} />}
                      <View style={[styles.anttgt, { left: `${tgtPos}%` }]} />
                    </View>
                    <View style={styles.antax}>
                      <Text style={styles.antaxT}>${lo.toFixed(0)} low</Text>
                      <Text style={styles.antaxT}>target ${cons.toFixed(0)}</Text>
                      <Text style={styles.antaxT}>${hi.toFixed(0)} high</Text>
                    </View>
                  </>
                );
              })()}
            </View>
          )}
          <Text style={styles.note}>Ratings and price targets aggregated across covering firms. <Text style={styles.noteB}>A market signal — separate from the quality score, and not a recommendation.</Text></Text>
        </Block>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  block: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, padding: 16, marginBottom: 12 },
  bh: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 },
  bt: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 17, fontWeight: '600' },
  bs: { color: AS.color.ink3, fontSize: 11.5, flexShrink: 1, textAlign: 'right', marginLeft: 8 },
  note: { color: AS.color.ink3, fontSize: 11.5, lineHeight: 17, marginTop: 14 },
  noteB: { color: AS.color.ink2, fontWeight: '700' },

  // score
  scoreTop: { flexDirection: 'row', alignItems: 'baseline', marginBottom: 16 },
  scBig: { color: AS.color.accent, fontFamily: AS.font.mono, fontSize: 42, fontWeight: '800', lineHeight: 44 },
  scDen: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 16, marginLeft: 2 },
  scSub: { color: AS.color.ink3, fontSize: 11, lineHeight: 14, marginLeft: 12, flex: 1 },
  sdim: { marginBottom: 11 },
  sdTop: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 },
  sdL: { color: AS.color.ink2, fontSize: 13 },
  slow: { color: AS.color.gold, fontSize: 10.5, fontWeight: '700' },
  sdV: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700' },
  sdTrack: { height: 6, borderRadius: 3, backgroundColor: AS.color.line2, overflow: 'hidden' },
  sdFill: { height: 6, borderRadius: 3 },

  // metrics grid
  mgrid: { flexDirection: 'row', flexWrap: 'wrap' },
  mcell: { width: '50%', paddingVertical: 9, paddingRight: 10 },
  mLabel: { color: AS.color.ink3, fontSize: 11.5, marginBottom: 3 },
  mVal: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 16, fontWeight: '700' },

  // valuation bands
  vrow: { marginBottom: 20 },
  vbTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  vbL: { color: AS.color.ink, fontSize: 13.5, fontWeight: '600' },
  vbVerdict: { fontSize: 11.5, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  vbar: { height: 8, borderRadius: 4, backgroundColor: AS.color.line2, marginBottom: 8, position: 'relative', overflow: 'visible' },
  vfill: { height: 8, borderRadius: 4, position: 'absolute', left: 0, top: 0 },
  vtick: { position: 'absolute', left: '50%', top: -2, width: 1.5, height: 12, backgroundColor: AS.color.ink3, opacity: 0.5 },
  vdot: { position: 'absolute', top: -2, width: 12, height: 12, borderRadius: 6, marginLeft: -6, borderWidth: 2, borderColor: AS.color.surface },
  vaxis: { flexDirection: 'row', justifyContent: 'space-between' },
  vax: { alignItems: 'center', flex: 1 },
  vaxl: { color: AS.color.ink3, fontSize: 9 },
  vaxv: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 10.5, marginTop: 1 },
  vcur: { fontFamily: AS.font.mono, fontSize: 12, fontWeight: '700', marginTop: 6, textAlign: 'right' },

  // trends
  trc: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8, borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  trLeft: { flex: 1 },
  trL: { color: AS.color.ink2, fontSize: 13 },
  trV: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 17, fontWeight: '700', marginTop: 2 },
  trD: { fontFamily: AS.font.mono, fontSize: 11, fontWeight: '700', marginTop: 1 },

  // analyst
  ancons: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 19, fontWeight: '700' },
  ansub: { color: AS.color.ink3, fontSize: 12, marginTop: 2 },
  anbar: { flexDirection: 'row', height: 9, borderRadius: 5, overflow: 'hidden', marginTop: 10 },
  anleg: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 9 },
  anlg: { flexDirection: 'row', alignItems: 'center', marginRight: 12, marginBottom: 4 },
  anlgDot: { width: 8, height: 8, borderRadius: 2, marginRight: 5 },
  anlgTxt: { color: AS.color.ink2, fontSize: 11.5 },
  antgt: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 22, fontWeight: '800' },
  antrange: { height: 6, borderRadius: 3, backgroundColor: AS.color.line2, marginTop: 12, position: 'relative' },
  antcur: { position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6, marginLeft: -6, backgroundColor: AS.color.ink, borderWidth: 2, borderColor: AS.color.surface },
  anttgt: { position: 'absolute', top: -3, width: 12, height: 12, borderRadius: 6, marginLeft: -6, backgroundColor: AS.color.accent },
  antax: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  antaxT: { color: AS.color.ink3, fontSize: 10.5 },
});

export default CompanyFundamentalsAS;
