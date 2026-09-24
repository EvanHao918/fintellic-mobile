// src/screens/CompaniesSearchScreenAS.tsx
// AllSight 2026 Companies tab — type-ahead search over /companies/search → Company page.
import React, { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TextInput, FlatList, TouchableOpacity, ActivityIndicator, Keyboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';
import { AS } from '../theme/allsight';
import TickerLogo from '../components/TickerLogo';

interface Row { ticker: string; name?: string; industry?: string; }
interface Props { navigation?: any; }

const POPULAR = ['AAPL', 'NVDA', 'TSLA', 'MSFT', 'AMZN', 'META', 'GOOGL', 'AMD'];

const CompaniesSearchScreenAS: React.FC<Props> = ({ navigation }) => {
  const [q, setQ] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const timer = useRef<any>(null);

  const runSearch = useCallback((text: string) => {
    setQ(text);
    if (timer.current) clearTimeout(timer.current);
    if (!text.trim()) { setRows([]); setLoading(false); return; }
    setLoading(true);
    timer.current = setTimeout(() => {
      apiClient.get(`/companies/search?q=${encodeURIComponent(text.trim())}`)
        .then((d: any) => setRows(Array.isArray(d?.data) ? d.data : []))
        .catch(() => setRows([]))
        .finally(() => setLoading(false));
    }, 180);
  }, []);

  const open = (tk: string) => { Keyboard.dismiss(); if (navigation) navigation.navigate('Company', { ticker: tk }); };

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>Companies</Text>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            value={q}
            onChangeText={runSearch}
            placeholder="Search company or ticker"
            placeholderTextColor={AS.color.ink3}
            style={styles.input}
            autoCapitalize="characters"
            autoCorrect={false}
            returnKeyType="search"
          />
          {loading && <ActivityIndicator color={AS.color.ink3} style={{ marginLeft: 6 }} />}
        </View>
      </View>

      {q.trim() === '' ? (
        <View style={styles.popWrap}>
          <Text style={styles.popH}>POPULAR</Text>
          <View style={styles.popGrid}>
            {POPULAR.map((tk) => (
              <TouchableOpacity key={tk} style={styles.popChip} onPress={() => open(tk)}>
                <Text style={styles.popTxt}>{tk}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(r, i) => r.ticker + i}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => open(item.ticker)}>
              <TickerLogo ticker={item.ticker} name={item.name} style={styles.av} textStyle={styles.avTxt} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.nm} numberOfLines={1}>{item.name || item.ticker}</Text>
                <Text style={styles.meta}>${item.ticker}{item.industry ? ' · ' + item.industry : ''}</Text>
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={!loading ? <Text style={styles.dim}>No matches.</Text> : null}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  head: { paddingHorizontal: 18, paddingTop: 12 },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 28, fontWeight: '600', marginBottom: 12 },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, height: 46 },
  searchIcon: { color: AS.color.ink3, fontSize: 18, marginRight: 8 },
  input: { flex: 1, color: AS.color.ink, fontSize: 15.5 },
  popWrap: { paddingHorizontal: 18, paddingTop: 20 },
  popH: { color: AS.color.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 12 },
  popGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  popChip: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.pill, paddingHorizontal: 15, paddingVertical: 9, marginRight: 9, marginBottom: 9 },
  popTxt: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 90 },
  dim: { color: AS.color.ink3, fontSize: 13, textAlign: 'center', marginTop: 24 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 6, borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  av: { width: 38, height: 38, borderRadius: 11, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 13.5 },
  nm: { color: AS.color.ink, fontSize: 15, fontWeight: '600' },
  meta: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11.5, marginTop: 2 },
});

export default CompaniesSearchScreenAS;
