// src/screens/AccountScreenAS.tsx
// AllSight 2026 account / "You" — profile, plan, subscription, sign out. Reuses authSlice.
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { AS, avatarColor, avatarLetters } from '../theme/allsight';

interface Props { navigation?: any; }

const AccountScreenAS: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((s: RootState) => s.auth);
  const isPro = String(user?.tier || '').toLowerCase() === 'pro';

  if (!isAuthenticated || !user) {
    return (
      <SafeAreaView style={styles.root} edges={['top']}>
        <View style={styles.empty}>
          <Text style={styles.title}>You</Text>
          <Text style={styles.emptyBig}>Sign in to AllSight</Text>
          <Text style={styles.emptyDim}>Save your reads, follow companies, and get filing alerts on your phone.</Text>
          <TouchableOpacity style={styles.cta} onPress={() => navigation && navigation.navigate('Auth')}>
            <Text style={styles.ctaTxt}>Sign in</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const name = user.full_name || (user.email ? user.email.split('@')[0] : 'You');

  const onLogout = () => {
    Alert.alert('Sign out?', 'You can sign back in anytime.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => dispatch(logout()) },
    ]);
  };

  const Row = ({ label, value, onPress, danger }: { label: string; value?: string; onPress?: () => void; danger?: boolean }) => (
    <TouchableOpacity disabled={!onPress} activeOpacity={0.7} onPress={onPress} style={styles.row}>
      <Text style={[styles.rowL, danger && { color: AS.color.bear }]}>{label}</Text>
      <View style={{ flex: 1 }} />
      {!!value && <Text style={styles.rowV}>{value}</Text>}
      {!!onPress && !danger && <Text style={styles.chev}>›</Text>}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>You</Text>

        <View style={styles.hero}>
          <View style={[styles.av, { backgroundColor: avatarColor(name) }]}><Text style={styles.avTxt}>{avatarLetters(undefined, name)}</Text></View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            <Text style={styles.email} numberOfLines={1}>{user.email}</Text>
          </View>
          <View style={[styles.plan, isPro && styles.planPro]}>
            <Text style={[styles.planTxt, isPro && styles.planTxtPro]}>{isPro ? 'PRO' : 'FREE'}</Text>
          </View>
        </View>

        {!isPro && (
          <TouchableOpacity style={styles.upsell} activeOpacity={0.85} onPress={() => navigation && navigation.navigate('Subscription')}>
            <Text style={styles.upsellH}>Go unlimited</Text>
            <Text style={styles.upsellS}>Read the whole market, uncapped — $19.99/mo. Same everything, no feature gates.</Text>
            <View style={styles.upsellBtn}><Text style={styles.upsellBtnTxt}>See plans</Text></View>
          </TouchableOpacity>
        )}

        <Text style={styles.secH}>ACCOUNT</Text>
        <View style={styles.card}>
          {isPro
            ? <Row label="Subscription" value="Manage" onPress={() => navigation && navigation.navigate('Subscription')} />
            : <Row label="Upgrade to Pro" onPress={() => navigation && navigation.navigate('Subscription')} />}
          <View style={styles.sep} />
          <Row label="Following" onPress={() => navigation && navigation.navigate('Watchlist')} />
          {user.user_sequence_number != null && (<><View style={styles.sep} /><Row label="Member" value={'#' + user.user_sequence_number} /></>)}
        </View>

        <Text style={styles.secH}>SUPPORT</Text>
        <View style={styles.card}>
          <Row label="Privacy policy" onPress={() => {}} />
          <View style={styles.sep} />
          <Row label="Terms of service" onPress={() => {}} />
        </View>

        <View style={[styles.card, { marginTop: 16 }]}>
          <Row label="Sign out" onPress={onLogout} danger />
        </View>
        <Text style={styles.foot}>AllSight decodes SEC filings into plain-English stock news. Never a buy or sell call.</Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  scroll: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 90 },
  title: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 28, fontWeight: '600', marginBottom: 16 },
  hero: { flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
  av: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginRight: 13 },
  avTxt: { color: '#fff', fontWeight: '800', fontSize: 18 },
  name: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 20, fontWeight: '600' },
  email: { color: AS.color.ink3, fontSize: 13, marginTop: 2 },
  plan: { borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.pill, paddingHorizontal: 11, paddingVertical: 4, marginLeft: 8 },
  planPro: { backgroundColor: AS.color.accent, borderColor: AS.color.accent },
  planTxt: { color: AS.color.ink2, fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planTxtPro: { color: AS.color.accentInk },
  upsell: { backgroundColor: AS.color.accent, borderRadius: AS.radius.xl, padding: 16, marginBottom: 22 },
  upsellH: { color: AS.color.accentInk, fontFamily: AS.font.serif, fontSize: 19, fontWeight: '700' },
  upsellS: { color: '#043321', fontSize: 13, lineHeight: 18, marginTop: 5, opacity: 0.85 },
  upsellBtn: { backgroundColor: '#052a1c', borderRadius: 10, paddingVertical: 9, alignItems: 'center', marginTop: 12 },
  upsellBtnTxt: { color: '#eafff5', fontSize: 14, fontWeight: '700' },
  secH: { color: AS.color.ink3, fontSize: 11.5, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8, marginTop: 4 },
  card: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 15, paddingVertical: 14 },
  rowL: { color: AS.color.ink, fontSize: 15, fontWeight: '500' },
  rowV: { color: AS.color.ink3, fontSize: 14, marginRight: 6 },
  chev: { color: AS.color.ink3, fontSize: 20 },
  sep: { height: 1, backgroundColor: AS.color.line2, marginLeft: 15 },
  foot: { color: AS.color.ink3, fontSize: 11.5, lineHeight: 17, marginTop: 22, textAlign: 'center' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 30, paddingBottom: 60 },
  emptyBig: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 22, fontWeight: '600', textAlign: 'center', marginTop: 16 },
  emptyDim: { color: AS.color.ink3, fontSize: 14, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  cta: { backgroundColor: AS.color.accent, borderRadius: 14, paddingHorizontal: 28, paddingVertical: 13, marginTop: 22 },
  ctaTxt: { color: AS.color.accentInk, fontSize: 15, fontWeight: '700' },
});

export default AccountScreenAS;
