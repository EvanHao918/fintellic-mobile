// src/screens/CompanyScreenAS.tsx
// AllSight 2026 company page — /companies/{ticker}/page + /metrics/{ticker}. Event history reuses FilingCardAS.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';
import { Filing } from '../types';
import FilingCardAS from '../components/FilingCardAS';
import CompanyFundamentalsAS from '../components/CompanyFundamentalsAS';
import TickerLogo from '../components/TickerLogo';
import { AS } from '../theme/allsight';

interface Props {
  ticker?: string;
  navigation?: any;
  route?: { params?: { ticker?: string } };
}

function fmtBig(n?: number | null): string {
  if (n == null || isNaN(n)) return '—';
  const a = Math.abs(n);
  if (a >= 1e12) return '$' + (n / 1e12).toFixed(1) + 'T';
  if (a >= 1e9) return '$' + (n / 1e9).toFixed(1) + 'B';
  if (a >= 1e6) return '$' + (n / 1e6).toFixed(0) + 'M';
  return '$' + n.toLocaleString();
}

function ago(ts?: string | null): string {
  if (!ts) return '—';
  const d = new Date(ts); if (isNaN(d.getTime())) return '—';
  const s = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (s < 3600) return Math.round(s / 60) + 'm ago';
  if (s < 86400) return Math.round(s / 3600) + 'h ago';
  return Math.round(s / 86400) + 'd ago';
}

const CompanyScreenAS: React.FC<Props> = ({ ticker, navigation, route }) => {
  const tk = (ticker ?? route?.params?.ticker ?? '').toUpperCase();
  const [company, setCompany] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [filings, setFilings] = useState<Filing[]>([]);
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiClient.get(`/companies/${tk}/page`)
      .then((d: any) => {
        if (!alive) return;
        setCompany(d.company || null);
        setStats(d.stats || null);
        setFilings(Array.isArray(d.filings) ? d.filings : []);
      })
      .catch(() => {})
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tk]);

  const name = company?.name || tk;
  const sub = [tk ? '$' + tk : '', company?.exchange, company?.industry || company?.sector].filter(Boolean).join(' · ');
  const mktcap = stats?.market_cap ?? (company?.market_cap != null ? company.market_cap * 1e6 : null);

  const openDetail = useCallback((f: Filing) => {
    if (navigation) navigation.navigate('FilingDetail', { filingId: f.id });
  }, [navigation]);

  const metricCells = [
    { l: 'Price', v: stats?.price != null ? '$' + Number(stats.price).toFixed(2) : '—', c: undefined as string | undefined },
    { l: 'Today', v: stats?.change_pct != null ? (stats.change_pct >= 0 ? '▲' : '▼') + Math.abs(stats.change_pct).toFixed(1) + '%' : '—', c: stats?.change_pct != null ? (stats.change_pct >= 0 ? AS.color.bull : AS.color.bear) : undefined },
    { l: 'Mkt cap', v: fmtBig(mktcap), c: undefined },
    { l: '8-K events', v: company?.total_filings != null ? String(company.total_filings) : String(filings.length), c: undefined },
  ];

  const header = (
    <View>
      <View style={styles.hero}>
        <TickerLogo ticker={tk} name={name} style={styles.av} textStyle={styles.avTxt} />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={styles.name} numberOfLines={2}>{name}</Text>
          <Text style={styles.sub}>{sub}</Text>
        </View>
        <TouchableOpacity onPress={() => setFollowing((v) => !v)} style={[styles.follow, following && styles.followOn]}>
          <Text style={[styles.followTxt, following && styles.followTxtOn]}>{following ? '✓ Following' : '+ Follow'}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.metrics}>
        {metricCells.map((m, i) => (
          <View key={i} style={[styles.metric, i > 0 && styles.metricBorder]}>
            <Text style={styles.metricL}>{m.l}</Text>
            <Text style={[styles.metricV, m.c ? { color: m.c } : null]}>{m.v}</Text>
          </View>
        ))}
      </View>

      <CompanyFundamentalsAS ticker={tk} />

      <Text style={styles.secH}>RECENT EVENTS</Text>
    </View>
  );

  if (loading) {
    return <SafeAreaView style={styles.center}><ActivityIndicator color={AS.color.accent} /></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.nav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => navigation && navigation.goBack()}><Text style={styles.navChev}>‹</Text></TouchableOpacity>
        <Text style={styles.navTk}>{tk ? '$' + tk : ''}</Text>
      </View>
      <FlatList
        data={filings}
        keyExtractor={(f) => String(f.id)}
        renderItem={({ item }) => (
          <FilingCardAS
            filing={{ ...item, company_ticker: item.company_ticker || tk, company_name: item.company_name || name }}
            onPress={() => openDetail(item)}
          />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.dim}>No decoded events yet.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  center: { flex: 1, backgroundColor: AS.color.bg, alignItems: 'center', justifyContent: 'center' },
  dim: { color: AS.color.ink3, fontSize: 13, textAlign: 'center', marginTop: 20 },
  nav: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  navBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  navChev: { color: AS.color.ink, fontSize: 24, lineHeight: 26, marginTop: -2 },
  navTk: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingBottom: 40 },
  hero: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 16 },
  av: { width: 52, height: 52, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 22, fontWeight: '600', lineHeight: 27 },
  sub: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 12, marginTop: 3 },
  follow: { borderColor: AS.color.accent, borderWidth: 1, borderRadius: AS.radius.pill, paddingHorizontal: 14, paddingVertical: 8, marginLeft: 10 },
  followOn: { backgroundColor: AS.color.accent },
  followTxt: { color: AS.color.accent, fontSize: 12.5, fontWeight: '700' },
  followTxtOn: { color: AS.color.accentInk },
  metrics: { flexDirection: 'row', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, marginBottom: 14, overflow: 'hidden' },
  metric: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  metricBorder: { borderLeftColor: AS.color.line, borderLeftWidth: 1 },
  metricL: { color: AS.color.ink3, fontSize: 9.5, textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 5 },
  metricV: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 14, fontWeight: '700' },
  fund: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, padding: 15, marginBottom: 20 },
  fundRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  fundL: { color: AS.color.ink2, fontSize: 13, fontWeight: '600' },
  fundDim: { color: AS.color.ink3, fontWeight: '400' },
  fundScore: { color: AS.color.accent, fontFamily: AS.font.mono, fontSize: 17, fontWeight: '800' },
  fundVerdict: { color: AS.color.gold, fontSize: 11, fontWeight: '800', letterSpacing: 0.4 },
  track: { height: 8, borderRadius: 5, backgroundColor: 'rgba(255,255,255,0.09)', overflow: 'hidden', marginTop: 9 },
  fill: { position: 'absolute', left: 0, top: 0, bottom: 0, borderRadius: 5, backgroundColor: AS.color.accent },
  secH: { color: AS.color.ink3, fontSize: 12, fontWeight: '700', letterSpacing: 0.6, marginBottom: 12, marginTop: 2 },
});

export default CompanyScreenAS;
