// src/screens/WatchlistScreenAS.tsx
// AllSight 2026 watchlist / following — /watchlist (auth). Follow = email alerts on new filings.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import apiClient from '../api/client';
import { AS } from '../theme/allsight';
import TickerLogo from '../components/TickerLogo';

interface Watched { ticker: string; name?: string; sector?: string; industry?: string; last_filing?: { filing_date?: string; sentiment?: string } | null; }
interface Props { navigation?: any; }

const WatchlistScreenAS: React.FC<Props> = ({ navigation }) => {
  const isAuthed = useSelector((s: RootState) => s.auth?.isAuthenticated);
  const [rows, setRows] = useState<Watched[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthed) { setLoading(false); return; }
    let alive = true;
    setLoading(true);
    apiClient.get('/watchlist/')
      .then((d: any) => { if (alive) setRows(Array.isArray(d) ? d : (d?.data || [])); })
      .catch(() => { if (alive) setRows([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [isAuthed]);

  const openCompany = useCallback((tk: string) => { if (navigation) navigation.navigate('Company', { ticker: tk }); }, [navigation]);

  const header = (
    <View>
      <Text style={styles.title}>Following</Text>
      <Text style={styles.sub}>Companies you follow — we ping your phone the moment they file.</Text>
    </View>
  );

  if (loading) return <SafeAreaView style={styles.center}><ActivityIndicator color={AS.color.accent} /></SafeAreaView>;

  if (!isAuthed) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.pad}>{header}</View>
        <View style={styles.empty}>
          <Text style={styles.emptyBig}>Sign in to follow companies</Text>
          <Text style={styles.emptyDim}>Following a company pings your phone the instant it files — so you never miss what moves it.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => navigation && navigation.navigate('Auth')}>
            <Text style={styles.ctaTxt}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <FlatList
        data={rows}
        keyExtractor={(r) => r.ticker}
        ListHeaderComponent={<View style={styles.pad}>{header}</View>}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openCompany(item.ticker)}>
            <TickerLogo ticker={item.ticker} name={item.name} style={styles.av} textStyle={styles.avTxt} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.nm} numberOfLines={1}>{item.name || item.ticker}</Text>
              <Text style={styles.meta}>${item.ticker}{item.industry ? ' · ' + item.industry : (item.sector ? ' · ' + item.sector : '')}</Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={<Text style={styles.dim}>You're not following anyone yet. Tap the star on any company to follow.</Text>}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  center: { flex: 1, backgroundColor: AS.color.bg, alignItems: 'center', justifyContent: 'center' },
  pad: { paddingHorizontal: 2 },
  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 90 },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 28, fontWeight: '600' },
  sub: { color: AS.color.ink3, fontSize: 13, marginTop: 4, marginBottom: 14 },
  dim: { color: AS.color.ink3, fontSize: 13, textAlign: 'center', marginTop: 24, paddingHorizontal: 20, lineHeight: 19 },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.md, padding: 13, marginBottom: 9 },
  av: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 14 },
  nm: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 16, fontWeight: '600' },
  meta: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11.5, marginTop: 2 },
  chev: { color: AS.color.ink3, fontSize: 22, marginLeft: 6 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 60 },
  emptyBig: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 22, fontWeight: '600', textAlign: 'center' },
  emptyDim: { color: AS.color.ink3, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  cta: { backgroundColor: AS.color.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 22 },
  ctaTxt: { color: AS.color.accentInk, fontSize: 15, fontWeight: '700' },
});

export default WatchlistScreenAS;
