// src/screens/CalendarScreenAS.tsx
// AllSight 2026 earnings calendar — /filings/calendar?days=N (public). Grouped by date.
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, SectionList, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../api/client';
import { AS } from '../theme/allsight';

interface EarningsEvent { date: string; symbol: string; name?: string; eps_estimated?: number | null; time?: string; }
interface Props { navigation?: any; }

const RANGES = [{ d: 7, l: '7D' }, { d: 14, l: '14D' }, { d: 30, l: '30D' }];

function dayHeading(date: string): string {
  const d = new Date(date + 'T12:00:00');
  if (isNaN(d.getTime())) return date;
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}
function timeLabel(t?: string): string {
  const v = (t || '').toLowerCase();
  if (v === 'bmo') return 'Before open';
  if (v === 'amc') return 'After close';
  return 'TBD';
}

const CalendarScreenAS: React.FC<Props> = ({ navigation }) => {
  const [days, setDays] = useState(14);
  const [events, setEvents] = useState<EarningsEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    apiClient.get(`/filings/calendar?days=${days}`)
      .then((d: any) => { if (alive) setEvents(Array.isArray(d?.events) ? d.events : []); })
      .catch(() => { if (alive) setEvents([]); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [days]);

  const sections = React.useMemo(() => {
    const map: Record<string, EarningsEvent[]> = {};
    const order: string[] = [];
    for (const e of events) {
      if (!map[e.date]) { map[e.date] = []; order.push(e.date); }
      map[e.date].push(e);
    }
    order.sort();
    return order.map((date) => ({ key: date, title: dayHeading(date), count: map[date].length, data: map[date] }));
  }, [events]);

  const openCompany = useCallback((sym: string) => {
    if (navigation) navigation.navigate('Company', { ticker: sym });
  }, [navigation]);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <View style={styles.head}>
        <Text style={styles.title}>Earnings</Text>
        <View style={styles.ranges}>
          {RANGES.map((r) => (
            <TouchableOpacity key={r.d} onPress={() => setDays(r.d)} style={[styles.range, days === r.d && styles.rangeOn]}>
              <Text style={[styles.rangeTxt, days === r.d && styles.rangeTxtOn]}>{r.l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={AS.color.accent} /></View>
      ) : (
        <SectionList
          sections={sections as any}
          keyExtractor={(e, i) => (e as EarningsEvent).symbol + i}
          renderSectionHeader={({ section }) => {
            const s = section as any;
            return (
              <View style={styles.secHead}>
                <Text style={styles.secDay}>{s.title.toUpperCase()}</Text>
                <Text style={styles.secCount}>{s.count}</Text>
              </View>
            );
          }}
          renderItem={({ item }) => {
            const e = item as EarningsEvent;
            return (
              <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => openCompany(e.symbol)}>
                <Text style={styles.tk}>{e.symbol}</Text>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={styles.nm} numberOfLines={1}>{e.name || e.symbol}</Text>
                  {e.eps_estimated != null && <Text style={styles.eps}>EPS est. {Number(e.eps_estimated).toFixed(2)}</Text>}
                </View>
                <Text style={styles.time}>{timeLabel(e.time)}</Text>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<Text style={styles.dim}>No confirmed earnings in this window.</Text>}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  dim: { color: AS.color.ink3, fontSize: 13, textAlign: 'center', marginTop: 30 },
  head: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 28, fontWeight: '600' },
  ranges: { flexDirection: 'row' },
  range: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: AS.radius.pill, marginLeft: 6, borderColor: AS.color.line, borderWidth: 1 },
  rangeOn: { backgroundColor: AS.color.accent, borderColor: AS.color.accent },
  rangeTxt: { color: AS.color.ink2, fontFamily: AS.font.mono, fontSize: 12, fontWeight: '700' },
  rangeTxtOn: { color: AS.color.accentInk },
  listContent: { paddingHorizontal: 16, paddingBottom: 90 },
  secHead: { flexDirection: 'row', alignItems: 'center', backgroundColor: AS.color.bg, paddingVertical: 10 },
  secDay: { color: AS.color.ink3, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6 },
  secCount: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11, marginLeft: 8, backgroundColor: AS.color.surface, borderRadius: 6, paddingHorizontal: 7, paddingVertical: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.md, padding: 13, marginBottom: 8 },
  tk: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 13.5, fontWeight: '700', width: 66 },
  nm: { color: AS.color.ink2, fontSize: 13.5, fontWeight: '500' },
  eps: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11.5, marginTop: 2 },
  time: { color: AS.color.ink3, fontSize: 11.5, fontWeight: '600', marginLeft: 8 },
});

export default CalendarScreenAS;
