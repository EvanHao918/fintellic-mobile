// src/screens/FeedScreenAS.tsx
// AllSight 2026 feed — live whole-market stream, threaded by ET day + trading session
// with collapsible sticky headers (mirrors the web renderThread). Reuses filingsSlice.
import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, SectionList, ActivityIndicator, RefreshControl,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { fetchFilings } from '../store/slices/filingsSlice';
import { Filing } from '../types';
import apiClient from '../api/client';
import FilingCardAS from '../components/FilingCardAS';
import MoversDrawerAS from '../components/MoversDrawerAS';
import BrandMark from '../components/BrandMark';
import { AS } from '../theme/allsight';

const CATEGORIES = ['All', 'Earnings', 'Acquisition', 'Guidance', 'Exec change', 'Debt', 'Buyback'];

// ---- ET day + session bucketing (matches web _etSession / renderThread) ----
const SESSION_META: Record<string, { label: string; dot: string }> = {
  pre: { label: 'Pre-market', dot: '#8B5CF6' },
  market: { label: 'Market hours', dot: AS.color.accent },
  after: { label: 'After-hours', dot: AS.color.gold },
  closed: { label: 'Off-hours', dot: AS.color.ink3 },
};

function etInfo(ts?: string | null) {
  const d = ts ? new Date(ts) : null;
  if (!d || isNaN(d.getTime())) return null;
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/New_York', weekday: 'short', month: 'short', day: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: false,
    }).formatToParts(d);
    const g = (t: string) => parts.find((p) => p.type === t)?.value || '';
    const weekday = g('weekday'), month = g('month'), day = g('day'), year = g('year');
    const mins = (parseInt(g('hour'), 10) % 24) * 60 + parseInt(g('minute'), 10);
    const weekend = weekday === 'Sat' || weekday === 'Sun';
    let session = 'closed';
    if (!weekend) {
      if (mins >= 570 && mins < 960) session = 'market';
      else if (mins >= 240 && mins < 570) session = 'pre';
      else if (mins >= 960 && mins < 1200) session = 'after';
    }
    return { dateKey: `${year}-${month}-${day}`, weekday, month, day, session, t: d.getTime() };
  } catch {
    return null;
  }
}

function dayLabel(info: NonNullable<ReturnType<typeof etInfo>>, todayKey: string, yestKey: string) {
  if (info.dateKey === todayKey) return 'Today';
  if (info.dateKey === yestKey) return 'Yesterday';
  return `${info.weekday}, ${info.month} ${info.day}`;
}

interface Section { key: string; day: string; session: string; count: number; data: Filing[]; }

interface Props { navigation?: any; }

const FeedScreenAS: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { filings, isLoading, isRefreshing, hasMore, currentPage } = useSelector((s: RootState) => s.filings);
  const [cat, setCat] = useState('All');
  const [stats, setStats] = useState<{ week_count?: number; total_count?: number } | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const loadStats = useCallback(() => {
    apiClient.get('/filings/stats').then((s: any) => setStats(s)).catch(() => {});
  }, []);

  useEffect(() => {
    dispatch(fetchFilings({ page: 1, isRefresh: true }));
    loadStats();
  }, [dispatch, loadStats]);

  const onRefresh = useCallback(() => {
    dispatch(fetchFilings({ page: 1, isRefresh: true }));
    loadStats();
  }, [dispatch, loadStats]);

  const onEndReached = useCallback(() => {
    if (hasMore && !isLoading && !isRefreshing) {
      dispatch(fetchFilings({ page: currentPage + 1, isRefresh: false }));
    }
  }, [dispatch, hasMore, isLoading, isRefreshing, currentPage]);

  // Build day/session sections (newest first). Collapsed sections render header-only.
  const sections: Section[] = useMemo(() => {
    const now = etInfo(new Date().toISOString());
    const todayKey = now?.dateKey || '';
    const yestKey = etInfo(new Date(Date.now() - 864e5).toISOString())?.dateKey || '';
    const order: string[] = [];
    const map: Record<string, Section> = {};
    for (const f of filings) {
      const info = etInfo(f.detected_at || f.filing_date);
      if (!info) continue;
      const key = `${info.dateKey}|${info.session}`;
      if (!map[key]) {
        map[key] = { key, day: dayLabel(info, todayKey, yestKey), session: info.session, count: 0, data: [] };
        order.push(key);
      }
      map[key].count += 1;
      map[key].data.push(f);
    }
    return order.map((k) => ({ ...map[k], data: collapsed.has(k) ? [] : map[k].data }));
  }, [filings, collapsed]);

  const toggle = (key: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const header = (
    <View>
      <View style={styles.navrow}>
        <View style={{ marginRight: 9 }}><BrandMark size={26} /></View>
        <Text style={styles.wm}>AllSight</Text>
        <View style={{ flex: 1 }} />
        <View style={styles.liveDot} />
        <Text style={styles.live}>LIVE</Text>
      </View>
      <Text style={styles.title}>Live events</Text>
      <Text style={styles.sub}>
        {stats?.week_count != null && <Text style={styles.subB}>{stats.week_count.toLocaleString()} </Text>}
        {stats?.week_count != null ? 'this week · ' : ''}
        {stats?.total_count != null && <Text style={styles.subB}>{stats.total_count.toLocaleString()} </Text>}
        {stats?.total_count != null ? 'decoded in total · ' : ''}
        whole US market
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chips} contentContainerStyle={{ paddingRight: 20 }}>
        {CATEGORIES.map((c) => (
          <TouchableOpacity key={c} onPress={() => setCat(c)} style={[styles.chip, cat === c && styles.chipOn]}>
            <Text style={[styles.chipTxt, cat === c && styles.chipTxtOn]}>{c}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={(f) => String(f.id)}
        renderItem={({ item }) => <FilingCardAS filing={item} onPress={() => navigation && navigation.navigate('FilingDetail', { filingId: item.id })} />}
        renderSectionHeader={({ section }) => {
          const s = section as unknown as Section;
          const meta = SESSION_META[s.session] || SESSION_META.closed;
          const isCollapsed = collapsed.has(s.key);
          const col = AS.avatar[Math.max(0, sections.findIndex((x) => x.key === s.key)) % AS.avatar.length];
          return (
            <TouchableOpacity activeOpacity={0.7} onPress={() => toggle(s.key)} style={styles.secHead}>
              <View style={[styles.secBar, { backgroundColor: col }]} />
              <Text style={[styles.chev, isCollapsed && { transform: [{ rotate: '-90deg' }] }]}>▾</Text>
              <Text style={[styles.secDay, { color: col }]}>{s.day.toUpperCase()}</Text>
              <Text style={styles.secSep}>·</Text>
              <Text style={styles.secSess}>{meta.label}</Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.secCount}>{s.count}</Text>
            </TouchableOpacity>
          );
        }}
        ListHeaderComponent={header}
        stickySectionHeadersEnabled
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.6}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={AS.color.accent} />}
        ListFooterComponent={isLoading && !isRefreshing ? <ActivityIndicator color={AS.color.accent} style={{ marginVertical: 20 }} /> : null}
      />
      <MoversDrawerAS navigation={navigation} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  navrow: { flexDirection: 'row', alignItems: 'center', paddingTop: 8, marginBottom: 2 },
  mk: { width: 26, height: 26, borderRadius: 8, backgroundColor: AS.color.accent, alignItems: 'center', justifyContent: 'center', marginRight: 9 },
  mkTxt: { color: '#fff', fontSize: 15, fontWeight: '800' },
  wm: { color: AS.color.ink, fontWeight: '700', fontSize: 17 },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: AS.color.accent, marginRight: 5 },
  live: { color: AS.color.accent, fontSize: 10, fontWeight: '700', letterSpacing: 1.4 },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 31, fontWeight: '600', letterSpacing: 0.2, marginTop: 8 },
  sub: { color: AS.color.ink3, fontSize: 12.5, marginTop: 4, marginBottom: 14 },
  subB: { color: AS.color.ink2, fontWeight: '700' },
  chips: { marginBottom: 6 },
  chip: { borderColor: AS.color.line, borderWidth: 1, backgroundColor: AS.color.surface, borderRadius: AS.radius.pill, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  chipOn: { backgroundColor: AS.color.accent, borderColor: AS.color.accent },
  chipTxt: { color: AS.color.ink2, fontSize: 13, fontWeight: '600' },
  chipTxtOn: { color: AS.color.accentInk, fontWeight: '700' },
  // section (thread) header
  secHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: AS.color.bg, paddingVertical: 11, paddingRight: 2 },
  chev: { color: AS.color.ink3, fontSize: 12, width: 16 },
  secDot: { width: 7, height: 7, borderRadius: 4, marginRight: 8 },
  secBar: { width: 3.5, height: 15, borderRadius: 2, marginRight: 10 },
  secDay: { color: AS.color.ink3, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  secSep: { color: AS.color.ink3, fontSize: 11.5, marginHorizontal: 6 },
  secSess: { color: AS.color.ink2, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.3 },
  secCount: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11, fontWeight: '600', backgroundColor: AS.color.surface, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2, overflow: 'hidden' },
});

export default FeedScreenAS;
