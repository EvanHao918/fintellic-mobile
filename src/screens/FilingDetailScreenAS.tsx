// src/screens/FilingDetailScreenAS.tsx
// AllSight 2026 decode detail — reads /filings/{id}/public (open, metered) + /metrics/{ticker}.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import apiClient from '../api/client';
import { RootState } from '../store';
import { Filing } from '../types';
import { AS, polarityColor } from '../theme/allsight';
import TickerLogo from '../components/TickerLogo';
import BrandMark from '../components/BrandMark';
import { gateRead, reconcile, gateFromServer, FREE_DAILY } from '../utils/meter';

type VoteCounts = { bullish: number; neutral: number; bearish: number };
const VOTE_RATIO_MIN = 100; // show % split at/above this many votes (mirrors web)
function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd'], v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

interface Props {
  filingId?: number | string;
  navigation?: any;
  route?: { params?: { filingId?: number | string } };
}

function fmtBig(n?: number | null): string {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
}

// Lightweight decode renderer: bold-lead paragraphs, strips inline cite markers, rough tables.
function DecodeBody({ text }: { text: string }) {
  const paras = (text || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  return (
    <View>
      {paras.map((raw, i) => {
        const clean = raw.replace(/〔\d+〕/g, '').replace(/⟦src:[^⟧]*⟧/g, '').trim();
        if (clean.includes('|') && /\|.*\|/.test(clean)) {
          // markdown table → real cell grid (drop separator rows, split on pipes)
          const rows = clean.split('\n')
            .filter((l) => l.includes('|') && !/^\s*\|?\s*:?-{2,}/.test(l))
            .map((l) => l.replace(/^\s*\|/, '').replace(/\|\s*$/, '').split('|').map((c) => c.replace(/\*\*/g, '').trim()));
          if (!rows.length) return null;
          return (
            <View key={i} style={styles.tableWrap}>
              {rows.map((cells, j) => (
                <View key={j} style={[styles.tr, j === 0 && styles.trHead, j < rows.length - 1 && styles.trBorder]}>
                  {cells.map((c, k) => (
                    <Text key={k} style={[styles.td, j === 0 && styles.tdHead, k === 0 && styles.tdFirst]} numberOfLines={3}>{c}</Text>
                  ))}
                </View>
              ))}
            </View>
          );
        }
        const m = clean.match(/^\*\*(.+?)\*\*\s*([\s\S]*)$/);
        if (m) {
          return (
            <Text key={i} style={styles.p}>
              <Text style={styles.pBold}>{m[1]} </Text>
              {m[2].replace(/\*\*/g, '')}
            </Text>
          );
        }
        return <Text key={i} style={styles.p}>{clean.replace(/\*\*/g, '')}</Text>;
      })}
    </View>
  );
}

// Free-read paywall — shown on the 4th decode of the day. Upgrade is the unlock; sign-in is the
// record step (and the path to Pro). Mirrors web: browsing is free, login is on-demand, pay = unlimited.
const PaywallView: React.FC<{ navigation?: any; isAuthed: boolean }> = ({ navigation, isAuthed }) => (
  <SafeAreaView style={styles.root} edges={['top']}>
    <View style={styles.nav}>
      <TouchableOpacity style={styles.navBtn} onPress={() => navigation && navigation.goBack()}><Text style={styles.navChev}>‹</Text></TouchableOpacity>
    </View>
    <View style={styles.pw}>
      <View style={{ marginBottom: 22 }}><BrandMark size={54} /></View>
      <Text style={styles.pwH}>You've read your {FREE_DAILY} free decodes today</Text>
      <Text style={styles.pwSub}>Come back tomorrow for {FREE_DAILY} more — or go unlimited. Same everything, no feature gates, just no daily cap.</Text>
      <TouchableOpacity style={styles.pwCta} activeOpacity={0.9} onPress={() => navigation && navigation.navigate('Subscription')}>
        <Text style={styles.pwCtaTxt}>Go unlimited — $19.99 / mo</Text>
      </TouchableOpacity>
      {!isAuthed && (
        <TouchableOpacity style={styles.pwSignin} onPress={() => navigation && navigation.navigate('Auth')}>
          <Text style={styles.pwSigninTxt}>Sign in</Text>
          <Text style={styles.pwSigninSub}>Save your reads, follow companies, get alerts on your phone.</Text>
        </TouchableOpacity>
      )}
      <Text style={styles.pwFoot}>AllSight decodes public SEC filings into plain English — never a buy or sell call.</Text>
    </View>
  </SafeAreaView>
);

const FilingDetailScreenAS: React.FC<Props> = ({ filingId, navigation, route }) => {
  const id = filingId ?? route?.params?.filingId;
  const isAuthed = useSelector((s: RootState) => s.auth.isAuthenticated);
  const isPro = useSelector((s: RootState) => String(s.auth.user?.tier || '').toLowerCase() === 'pro');
  const [f, setF] = useState<Filing | null>(null);
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const [gate, setGate] = useState<'checking' | 'ok' | 'paywall'>('checking');
  const [votes, setVotes] = useState<VoteCounts>({ bullish: 0, neutral: 0, bearish: 0 });
  const [myVote, setMyVote] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(null); setMyVote(null); setGate('checking');
    // Server is the source of truth for the free-read meter: view_limit_info counts logged-in users
    // BY ACCOUNT (shared across web + iOS → no double-dipping) and anon by IP. Pro = unlimited.
    // The local counter is only a fallback when the server didn't report view_limit_info.
    apiClient.get(`/filings/${id}/public`)
      .then(async (d: any) => {
        if (!alive) return;
        const vli = d?.view_limit_info;
        let allowed: boolean;
        if (isPro || vli?.is_pro) {
          allowed = true;
        } else if (vli) {
          await reconcile(vli.seen_ids || []);       // adopt the server's per-account truth
          allowed = gateFromServer(vli, id as any);
        } else {
          allowed = (await gateRead(id as any, false)).allowed;  // no server info → local fallback
        }
        if (!alive) return;
        if (!allowed) { setGate('paywall'); return; }
        setGate('ok');
        setF(d);
        const vc = d?.vote_counts;
        if (vc) setVotes({ bullish: vc.bullish || 0, neutral: vc.neutral || 0, bearish: vc.bearish || 0 });
        const tk = d?.company?.ticker;
        if (tk) apiClient.get(`/metrics/${tk}`).then((m: any) => alive && setMetrics(m)).catch(() => {});
      })
      .catch((e: any) => { if (!alive) return; if (e?.response?.status === 402) setGate('paywall'); else setErr('error'); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [id, isPro]);

  const castVote = useCallback((sentiment: 'bullish' | 'neutral' | 'bearish') => {
    if (!isAuthed) { navigation && navigation.navigate('Auth'); return; }
    if (voting) return;
    setVoting(true);
    apiClient.post(`/filings/${id}/vote`, { sentiment })
      .then((r: any) => {
        if (r?.vote_counts) setVotes({ bullish: r.vote_counts.bullish || 0, neutral: r.vote_counts.neutral || 0, bearish: r.vote_counts.bearish || 0 });
        setMyVote(r?.user_vote || sentiment);
      })
      .catch(() => {})
      .finally(() => setVoting(false));
  }, [id, isAuthed, voting, navigation]);

  const openEdgar = useCallback(() => { if (f?.filing_url) Linking.openURL(f.filing_url); }, [f]);

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={AS.color.accent} /></SafeAreaView>;
  }
  if (gate === 'paywall' || err === 'capped') {
    return <PaywallView navigation={navigation} isAuthed={isAuthed} />;
  }
  if (err || !f) {
    return <SafeAreaView style={styles.center}><Text style={styles.dim}>Couldn't load this filing.</Text></SafeAreaView>;
  }

  const ticker = f.company?.ticker || f.company_ticker || '';
  const name = f.company?.name || f.company_name || ticker;
  const exchange = f.company?.exchange || '';
  const filed = f.filing_date ? new Date(f.filing_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
  const category = f.event_type || (f.event_items && f.event_items[0] ? 'Item ' + f.event_items[0] : f.form_type);
  const hook = (f.card_summary || f.seo_hook || '').trim();
  const read = (f.read_label || f.ai_sentiment || '').trim();
  const readColor = polarityColor(f.polarity, f.ai_sentiment);
  const move = f.event_reacted && f.event_return_pct != null ? f.event_return_pct : (f.today_change_pct ?? null);
  const stats = f.stats || {};
  const band = metrics?.valuation_bands ? (metrics.valuation_bands.pe || metrics.valuation_bands.ps || metrics.valuation_bands.ev_ebitda || metrics.valuation_bands.pfcf) : null;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation && navigation.goBack()}>
          <Text style={styles.navChev}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.navTk}>{ticker ? '$' + ticker : ''}</Text>
        <View style={{ flex: 1 }} />
        <TouchableOpacity style={styles.navBtn}><Text style={styles.navIcon}>⤴</Text></TouchableOpacity>
        <TouchableOpacity style={styles.navBtn}><Text style={styles.navIcon}>☆</Text></TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.co}>
          <TickerLogo ticker={ticker} name={name} style={styles.av} textStyle={styles.avTxt} />
          <View style={{ flex: 1 }}>
            <Text style={styles.coName}>{name}</Text>
            <Text style={styles.coMeta}>{[ticker ? '$' + ticker : '', exchange, filed].filter(Boolean).join(' · ')}</Text>
          </View>
        </View>
        {!!category && <Text style={styles.cat}>{String(category).toUpperCase()}</Text>}

        <View style={styles.readBox}>
          <View style={styles.readTop}>
            {!!read && <View style={[styles.pill, { backgroundColor: readColor }]}><Text style={styles.pillTxt}>{read}</Text></View>}
            <View style={{ flex: 1 }} />
            {move != null && Math.abs(move) >= 0.05 && (
              <Text style={[styles.move, { color: move >= 0 ? AS.color.bull : AS.color.bear }]}>
                {(move >= 0 ? '▲' : '▼') + Math.abs(move).toFixed(1) + '% since filed'}
              </Text>
            )}
          </View>
          {!!f.read_basis && <Text style={styles.basis}>{f.read_basis}</Text>}
        </View>

        {!!hook && <Text style={styles.hook}>{hook}</Text>}

        <View style={styles.stats}>
          {[
            { l: 'Price', v: stats.price != null ? '$' + Number(stats.price).toFixed(2) : '—' },
            { l: 'Today', v: stats.change_pct != null ? (stats.change_pct >= 0 ? '▲' : '▼') + Math.abs(stats.change_pct).toFixed(1) + '%' : '—', c: stats.change_pct != null ? (stats.change_pct >= 0 ? AS.color.bull : AS.color.bear) : AS.color.ink },
            { l: 'Mkt cap', v: fmtBig(stats.market_cap ?? null) },
            { l: 'P / E', v: stats.pe != null ? Number(stats.pe).toFixed(1) : '—' },
          ].map((s, i) => (
            <View key={i} style={[styles.stat, i > 0 && styles.statBorder]}>
              <Text style={styles.statL}>{s.l}</Text>
              <Text style={[styles.statV, s.c ? { color: s.c } : null]}>{s.v}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.secH}>THE DECODE</Text>
        <DecodeBody text={f.unified_analysis || f.card_summary || ''} />

        {Array.isArray(f.receipts) && f.receipts.length > 0 && (
          <View style={{ marginTop: 6 }}>
            {f.receipts.slice(0, 4).map((r, i) => (
              <View key={i} style={styles.receipt}>
                <Text style={styles.receiptLbl}>FROM THE FILING</Text>
                <Text style={styles.receiptTxt}>“{r.quote}”</Text>
              </View>
            ))}
          </View>
        )}

        {!!f.whats_next && (
          <View style={styles.next}>
            <Text style={styles.nextTag}>NEXT</Text>
            <Text style={styles.nextTxt}>{f.whats_next}</Text>
          </View>
        )}

        {band && band.current != null && (
          <>
            <Text style={styles.secH}>FUNDAMENTAL CONTEXT</Text>
            <View style={styles.fctx}>
              <View style={styles.fctxTop}>
                <Text style={styles.fctxL}>Valuation vs its 5-year range</Text>
                {!!band.verdict && <Text style={styles.fctxV}>{String(band.verdict).toUpperCase()}</Text>}
              </View>
              <View style={styles.track}>
                <View style={[styles.fill, { width: `${Math.max(2, Math.min(100, band.position_pct ?? 50))}%` }]} />
              </View>
              <Text style={styles.fnote}>A ranking vs its own history — not a price prediction.</Text>
            </View>
          </>
        )}

        <Text style={styles.secH}>YOUR CALL</Text>
        {(() => {
          const total = votes.bullish + votes.neutral + votes.bearish;
          const showPct = total >= VOTE_RATIO_MIN;
          const opts: { key: 'bullish' | 'neutral' | 'bearish'; label: string; c: string }[] = [
            { key: 'bullish', label: '🚀 Bullish', c: AS.color.bull },
            { key: 'neutral', label: '🤷 Neutral', c: AS.color.neutral },
            { key: 'bearish', label: '📉 Bearish', c: AS.color.bear },
          ];
          return (
            <>
              <View style={styles.vote}>
                {opts.map((o) => {
                  const on = myVote === o.key;
                  const pct = total ? Math.round((votes[o.key] / total) * 100) : 0;
                  return (
                    <TouchableOpacity key={o.key} style={[styles.vb, on && { borderColor: o.c, backgroundColor: o.c + '22' }]} disabled={voting} onPress={() => castVote(o.key)}>
                      <Text style={[styles.vbTxt, on && { color: o.c }]}>{o.label}{showPct ? `  ${pct}%` : ''}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.vnote}>{showPct ? `${total.toLocaleString()} readers weighed in` : `Be the ${ordinal(total + 1)} to weigh in`}</Text>
            </>
          );
        })()}

        <TouchableOpacity style={styles.srcLink} onPress={openEdgar}>
          <Text style={styles.srcLinkTxt}>Read the original filing on SEC EDGAR ↗</Text>
        </TouchableOpacity>
        <Text style={styles.disc}>AllSight decodes the source in plain English and never makes a buy or sell call. The read is versus what the market expected — your decision is your own.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  center: { flex: 1, backgroundColor: AS.color.bg, alignItems: 'center', justifyContent: 'center', padding: 24 },
  dim: { color: AS.color.ink3, fontSize: 14, textAlign: 'center' },
  pw: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 50 },
  pwMark: { width: 54, height: 54, borderRadius: 999, backgroundColor: AS.color.accent, alignItems: 'center', justifyContent: 'center', marginBottom: 22 },
  pwMarkTxt: { color: AS.color.accentInk, fontSize: 28, fontWeight: '900', marginTop: -2 },
  pwH: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 25, fontWeight: '600', textAlign: 'center', lineHeight: 31 },
  pwSub: { color: AS.color.ink3, fontSize: 14.5, textAlign: 'center', marginTop: 12, lineHeight: 21 },
  pwCta: { backgroundColor: AS.color.accent, borderRadius: 14, paddingVertical: 15, paddingHorizontal: 32, alignItems: 'center', marginTop: 26, alignSelf: 'stretch' },
  pwCtaTxt: { color: AS.color.accentInk, fontSize: 16, fontWeight: '700' },
  pwSignin: { alignItems: 'center', marginTop: 20 },
  pwSigninTxt: { color: AS.color.accent, fontSize: 15, fontWeight: '700' },
  pwSigninSub: { color: AS.color.ink3, fontSize: 12.5, textAlign: 'center', marginTop: 4, lineHeight: 17 },
  pwFoot: { color: AS.color.ink3, fontSize: 11.5, textAlign: 'center', marginTop: 30, lineHeight: 17 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  navChev: { color: AS.color.ink, fontSize: 24, lineHeight: 26, marginTop: -2 },
  navIcon: { color: AS.color.ink2, fontSize: 16 },
  navTk: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700' },
  scroll: { paddingHorizontal: 18, paddingBottom: 40 },
  co: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12 },
  av: { width: 46, height: 46, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 16 },
  coName: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 20, fontWeight: '600' },
  coMeta: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 12.5, marginTop: 2 },
  cat: { color: AS.color.ink3, fontSize: 10.5, fontWeight: '700', letterSpacing: 0.9, marginBottom: 14 },
  readBox: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.xl, padding: 15, marginBottom: 16 },
  readTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  pill: { borderRadius: AS.radius.pill, paddingHorizontal: 13, paddingVertical: 5 },
  pillTxt: { color: AS.color.accentInk, fontSize: 13, fontWeight: '800' },
  move: { fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700' },
  basis: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 13, lineHeight: 19 },
  hook: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 24, lineHeight: 31, fontWeight: '600', marginBottom: 18 },
  stats: { flexDirection: 'row', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, marginBottom: 22, overflow: 'hidden' },
  stat: { flex: 1, paddingVertical: 11, alignItems: 'center' },
  statBorder: { borderLeftColor: AS.color.line, borderLeftWidth: 1 },
  statL: { color: AS.color.ink3, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 4 },
  statV: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 14, fontWeight: '700' },
  secH: { color: AS.color.ink3, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 12, marginTop: 4 },
  p: { color: AS.color.ink, fontSize: 15.5, lineHeight: 25, marginBottom: 16 },
  pBold: { fontWeight: '700', fontFamily: AS.font.serif, fontSize: 16 },
  tableWrap: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.md, overflow: 'hidden', marginBottom: 16 },
  tableRow: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 12.5, lineHeight: 20 },
  tr: { flexDirection: 'row' },
  trHead: { backgroundColor: 'rgba(255,255,255,0.03)' },
  trBorder: { borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  td: { flex: 1, color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 12, lineHeight: 17, paddingVertical: 9, paddingHorizontal: 10, textAlign: 'right' },
  tdFirst: { flex: 1.4, textAlign: 'left', color: AS.color.ink },
  tdHead: { color: AS.color.ink3, fontWeight: '700', fontSize: 10.5 },
  receipt: { borderLeftColor: AS.color.accent, borderLeftWidth: 2, backgroundColor: 'rgba(31,180,122,0.08)', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 9, marginBottom: 14 },
  receiptLbl: { color: AS.color.accent, fontSize: 9.5, fontWeight: '700', letterSpacing: 0.6, marginBottom: 4 },
  receiptTxt: { color: AS.color.ink2, fontSize: 13, lineHeight: 19 },
  next: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, padding: 13, marginBottom: 22, marginTop: 6 },
  nextTag: { color: AS.color.accentInk, backgroundColor: AS.color.accent, fontSize: 9, fontWeight: '800', letterSpacing: 0.6, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, marginRight: 9, overflow: 'hidden', marginTop: 1 },
  nextTxt: { color: AS.color.ink, fontSize: 14, fontWeight: '600', lineHeight: 20, flex: 1 },
  fctx: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, padding: 15, marginBottom: 22 },
  fctxTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 9 },
  fctxL: { color: AS.color.ink2, fontSize: 13, fontWeight: '600' },
  fctxV: { color: AS.color.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  track: { height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden' },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, backgroundColor: AS.color.accent },
  fnote: { color: AS.color.ink3, fontSize: 11.5, marginTop: 9 },
  vote: { flexDirection: 'row', marginBottom: 8 },
  vb: { flex: 1, backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: 12, paddingVertical: 12, alignItems: 'center', marginRight: 9 },
  vbTxt: { color: AS.color.ink2, fontSize: 13, fontWeight: '700' },
  vnote: { color: AS.color.ink3, fontSize: 12, marginBottom: 22 },
  srcLink: { paddingVertical: 12, borderTopColor: AS.color.line2, borderTopWidth: 1 },
  srcLinkTxt: { color: AS.color.accent, fontSize: 13, fontWeight: '600' },
  disc: { color: AS.color.ink3, fontSize: 11.5, lineHeight: 17, marginTop: 4 },
});

export default FilingDetailScreenAS;
