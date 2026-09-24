// src/components/MoversDrawerAS.tsx
// AllSight 2026 — right-edge "Biggest movers" drawer. Hidden handle on the right; tap or pull to open.
// Data: /filings/movers → {gainers, losers}. Move is since-filed (retrospective, never a prediction).
import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder, Dimensions, ScrollView, ActivityIndicator,
} from 'react-native';
import apiClient from '../api/client';
import { AS } from '../theme/allsight';

interface Mover { id: number; ticker: string; name?: string; pct: number; }
interface Props { navigation?: any; }

const { width: SCREENW } = Dimensions.get('window');
const W = Math.min(320, SCREENW * 0.84);

const MoversDrawerAS: React.FC<Props> = ({ navigation }) => {
  const tx = useRef(new Animated.Value(W)).current; // W = closed (off-screen right)
  const [open, setOpen] = useState(false);
  const [gainers, setGainers] = useState<Mover[]>([]);
  const [losers, setLosers] = useState<Mover[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(() => {
    if (loaded || loading) return;
    setLoading(true);
    apiClient.get('/filings/movers?limit=8')
      .then((d: any) => { setGainers(d?.gainers || []); setLosers(d?.losers || []); setLoaded(true); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [loaded, loading]);

  const animateTo = useCallback((to: number) => {
    Animated.spring(tx, { toValue: to, useNativeDriver: true, bounciness: 2, speed: 16 }).start();
    setOpen(to === 0);
  }, [tx]);

  const openDrawer = useCallback(() => { load(); animateTo(0); }, [load, animateTo]);
  const closeDrawer = useCallback(() => animateTo(W), [animateTo]);

  // Pull the edge handle leftward to open
  const handlePan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderGrant: () => load(),
    onPanResponderMove: (_e, g) => { const v = Math.max(0, Math.min(W, W + g.dx)); tx.setValue(v); },
    onPanResponderRelease: (_e, g) => { (g.dx < -W * 0.3 || g.vx < -0.4) ? animateTo(0) : animateTo(W); },
  })).current;

  // Drag the panel rightward to close
  const panelPan = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => g.dx > 8 && g.dx > Math.abs(g.dy),
    onPanResponderMove: (_e, g) => { if (g.dx > 0) tx.setValue(Math.min(W, g.dx)); },
    onPanResponderRelease: (_e, g) => { (g.dx > W * 0.3 || g.vx > 0.4) ? animateTo(W) : animateTo(0); },
  })).current;

  const scrimOpacity = tx.interpolate({ inputRange: [0, W], outputRange: [0.55, 0], extrapolate: 'clamp' });

  const goto = (m: Mover) => { closeDrawer(); if (navigation) navigation.navigate('FilingDetail', { filingId: m.id }); };

  const Row = ({ m }: { m: Mover }) => {
    const up = m.pct >= 0;
    return (
      <TouchableOpacity style={styles.row} activeOpacity={0.7} onPress={() => goto(m)}>
        <Text style={styles.tk}>{m.ticker}</Text>
        <View style={styles.nmWrap}><Text style={styles.nm} numberOfLines={1}>{m.name || m.ticker}</Text></View>
        <Text style={[styles.pct, { color: up ? AS.color.bull : AS.color.bear }]}>{up ? '▲' : '▼'}{Math.abs(m.pct).toFixed(1)}%</Text>
      </TouchableOpacity>
    );
  };

  return (
    <>
      {/* Scrim (only interactive when open) */}
      <Animated.View pointerEvents={open ? 'auto' : 'none'} style={[styles.scrim, { opacity: scrimOpacity }]}>
        <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
      </Animated.View>

      {/* Edge handle — always visible, pinned right-center */}
      {!open && (
        <View style={styles.handleWrap} {...handlePan.panHandlers}>
          <TouchableOpacity activeOpacity={0.8} onPress={openDrawer} style={styles.handle}>
            <Text style={styles.handleChev}>‹</Text>
            <Text style={styles.handleTxt}>MOVERS</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Panel */}
      <Animated.View style={[styles.panel, { transform: [{ translateX: tx }] }]} {...panelPan.panHandlers}>
        <View style={styles.grab} />
        <View style={styles.head}>
          <Text style={styles.title}>Biggest movers</Text>
          <TouchableOpacity onPress={closeDrawer} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}><Text style={styles.close}>✕</Text></TouchableOpacity>
        </View>
        <Text style={styles.sub}>Stock's move since each 8-K filed — retrospective, never a prediction.</Text>

        {loading && !loaded ? (
          <View style={styles.center}><ActivityIndicator color={AS.color.accent} /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
            <Text style={[styles.grp, { color: AS.color.bull }]}>▲ GAINERS</Text>
            {gainers.length ? gainers.map((m) => <Row key={'g' + m.id} m={m} />) : <Text style={styles.empty}>No gainers in the window.</Text>}
            <Text style={[styles.grp, { color: AS.color.bear, marginTop: 18 }]}>▼ DECLINERS</Text>
            {losers.length ? losers.map((m) => <Row key={'l' + m.id} m={m} />) : <Text style={styles.empty}>No decliners in the window.</Text>}
          </ScrollView>
        )}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  scrim: { position: 'absolute', top: 0, bottom: 0, left: 0, right: 0, backgroundColor: '#000', zIndex: 40 },
  handleWrap: { position: 'absolute', right: 0, top: '42%', zIndex: 45 },
  handle: {
    backgroundColor: AS.color.surface2, borderColor: AS.color.line, borderWidth: 1, borderRightWidth: 0,
    borderTopLeftRadius: 12, borderBottomLeftRadius: 12, paddingVertical: 12, paddingLeft: 8, paddingRight: 6, alignItems: 'center',
  },
  handleChev: { color: AS.color.accent, fontSize: 18, fontWeight: '900', lineHeight: 18, marginBottom: 4 },
  handleTxt: { color: AS.color.ink2, fontSize: 9, fontWeight: '800', letterSpacing: 1, width: 12, textAlign: 'center' },
  panel: {
    position: 'absolute', top: 0, bottom: 0, right: 0, width: W, backgroundColor: AS.color.surface,
    borderLeftColor: AS.color.line, borderLeftWidth: 1, zIndex: 50, paddingTop: 56, paddingHorizontal: 16,
  },
  grab: { position: 'absolute', left: 6, top: '48%', width: 4, height: 44, borderRadius: 2, backgroundColor: AS.color.line },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 21, fontWeight: '600' },
  close: { color: AS.color.ink3, fontSize: 17 },
  sub: { color: AS.color.ink3, fontSize: 12, lineHeight: 17, marginTop: 4, marginBottom: 14 },
  center: { paddingTop: 60, alignItems: 'center' },
  grp: { fontSize: 11, fontWeight: '800', letterSpacing: 0.8, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomColor: AS.color.line2, borderBottomWidth: 1 },
  tk: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700', width: 58 },
  nmWrap: { flex: 1, minWidth: 0, marginRight: 8 },
  nm: { color: AS.color.ink3, fontSize: 12 },
  pct: { fontFamily: AS.font.mono, fontSize: 13, fontWeight: '700', width: 62, textAlign: 'right', flexShrink: 0 },
  empty: { color: AS.color.ink3, fontSize: 12, paddingVertical: 8 },
});

export default MoversDrawerAS;
