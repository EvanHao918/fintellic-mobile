// src/components/FilingCardAS.tsx
// AllSight 2026 feed card — dark, brand-green, matches the web/app redesign.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Filing } from '../types';
import { AS, polarityColor } from '../theme/allsight';
import TickerLogo from './TickerLogo';

interface Props {
  filing: Filing;
  onPress?: () => void;
}

// "▲x.x% since filed" — retrospective since-filed move (never a prediction).
function moveNode(f: Filing) {
  const react = f.event_return_pct;
  if (f.event_reacted && react != null && Math.abs(react) >= 0.05) {
    const up = react >= 0;
    return (
      <Text style={[styles.move, { color: up ? AS.color.bull : AS.color.bear }]}>
        {(up ? '▲' : '▼') + Math.abs(react).toFixed(1) + '% since filed'}
      </Text>
    );
  }
  const day = f.today_change_pct;
  if (day != null && Math.abs(day) >= 0.05) {
    const up = day >= 0;
    return (
      <Text style={[styles.move, { color: up ? AS.color.bull : AS.color.bear }]}>
        {(up ? '▲' : '▼') + Math.abs(day).toFixed(1) + '%'}
      </Text>
    );
  }
  return null;
}

const FilingCardAS: React.FC<Props> = ({ filing, onPress }) => {
  const ticker = filing.company_ticker || filing.company?.ticker || '';
  const name = filing.company_name || filing.company?.name || ticker || 'Company';
  const exchange = filing.company?.exchange || filing.company?.industry || '';
  const category = filing.event_type || (filing.event_items && filing.event_items.length ? 'Item ' + filing.event_items[0] : filing.form_type);
  const hook = (filing.card_summary || filing.seo_hook || filing.one_liner || filing.feed_summary || '').trim();
  const read = (filing.read_label || filing.ai_sentiment || '').trim();
  const readColor = polarityColor(filing.polarity, filing.ai_sentiment);
  const tags = (filing.key_tags && filing.key_tags.length ? filing.key_tags : filing.tags) || [];

  return (
    <TouchableOpacity activeOpacity={0.8} onPress={onPress} style={styles.card}>
      <View style={styles.crow}>
        <TickerLogo ticker={ticker} name={name} style={styles.av} textStyle={styles.avTxt} />
        <View style={styles.cmeta}>
          <Text style={styles.cname} numberOfLines={1}>{name}</Text>
          <Text style={styles.ctk}>{ticker ? '$' + ticker : ''}{exchange ? ' · ' + exchange : ''}</Text>
        </View>
        {!!category && (
          <Text style={styles.cat} numberOfLines={1}>{String(category).toUpperCase()}</Text>
        )}
      </View>

      {!!hook && <Text style={styles.hook}>{hook}</Text>}

      <View style={styles.readRow}>
        {!!read && (
          <View style={[styles.pill, { backgroundColor: readColor }]}>
            <Text style={styles.pillTxt}>{read}</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        {moveNode(filing)}
      </View>

      {tags.length > 0 && (
        <View style={styles.tags}>
          {tags.slice(0, 4).map((t, i) => (
            <View key={i} style={styles.tag}><Text style={styles.tagTxt}>{t}</Text></View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: AS.color.surface,
    borderColor: AS.color.line,
    borderWidth: 1,
    borderRadius: AS.radius.xl,
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 16,
    marginBottom: 13,
  },
  crow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 12 },
  av: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 14.5 },
  cmeta: { flex: 1, minWidth: 0 },
  cname: { color: AS.color.ink, fontFamily: AS.font.serif, fontWeight: '600', fontSize: 17, letterSpacing: 0.1 },
  ctk: { color: AS.color.ink3, fontFamily: AS.font.mono, fontSize: 11.5, marginTop: 2 },
  cat: { color: AS.color.ink3, fontSize: 10, fontWeight: '700', letterSpacing: 0.9, marginLeft: 10, marginTop: 3 },
  hook: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 19.5, lineHeight: 26, fontWeight: '600', marginBottom: 14 },
  readRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  pill: { borderRadius: AS.radius.pill, paddingHorizontal: 11, paddingVertical: 4 },
  pillTxt: { color: AS.color.accentInk, fontSize: 12, fontWeight: '700' },
  move: { fontFamily: AS.font.mono, fontSize: 12.5, fontWeight: '700' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 10 },
  tag: { backgroundColor: AS.color.tagBg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, marginRight: 6, marginBottom: 6 },
  tagTxt: { color: AS.color.tag, fontSize: 11.5, fontWeight: '600' },
});

export default FilingCardAS;
