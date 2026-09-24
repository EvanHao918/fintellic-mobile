// src/screens/SubscriptionScreenAS.tsx
// AllSight 2026 paywall — single monthly Pro plan via Apple IAP. Reuses IAPService (native-only).
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { AS } from '../theme/allsight';

interface Props { navigation?: any; }

const PERKS = [
  ['Uncapped reads', 'Decode every 8-K, all day — no daily limit.'],
  ['The whole market', 'Every operating US company, the moment it files.'],
  ['Follow & get alerted', 'Email the instant a company you follow files.'],
  ['Source-grounded', 'Every fact traces back to the exact filing line.'],
];

const SubscriptionScreenAS: React.FC<Props> = ({ navigation }) => {
  const user = useSelector((s: RootState) => s.auth.user);
  const isPro = String(user?.tier || '').toLowerCase() === 'pro';
  const [busy, setBusy] = useState(false);

  const notNative = Platform.OS === 'web';

  const onSubscribe = async () => {
    if (!user) { navigation && navigation.navigate('Auth'); return; }
    if (notNative) { Alert.alert('Open the app', 'Subscriptions are managed in the AllSight iOS app.'); return; }
    setBusy(true);
    try {
      const iap = require('../services/IAPService').default;
      const { SubscriptionType } = require('../types/subscription');
      const ok = await iap.purchaseSubscription(SubscriptionType.MONTHLY, String(user.id));
      if (ok) navigation && navigation.goBack();
    } catch (e: any) {
      Alert.alert('Purchase failed', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  const onRestore = async () => {
    if (notNative) { Alert.alert('Open the app', 'Restore is available in the AllSight iOS app.'); return; }
    setBusy(true);
    try {
      const iap = require('../services/IAPService').default;
      const ok = await iap.restorePurchases();
      Alert.alert(ok ? 'Restored' : 'Nothing to restore', ok ? 'Your Pro access is active.' : 'No previous purchase was found.');
      if (ok) navigation && navigation.goBack();
    } catch (e: any) {
      Alert.alert('Restore failed', e?.message || 'Please try again.');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.close} onPress={() => navigation && navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.badge}><Text style={styles.badgeTxt}>ALLSIGHT PRO</Text></View>
        <Text style={styles.h1}>Read the whole market.</Text>
        <Text style={styles.sub}>Every filing, decoded in plain English — no cap, no feature gates. Just the facts, faster.</Text>

        <View style={styles.perks}>
          {PERKS.map(([t, d]) => (
            <View key={t} style={styles.perk}>
              <Text style={styles.check}>✓</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.perkT}>{t}</Text>
                <Text style={styles.perkD}>{d}</Text>
              </View>
            </View>
          ))}
        </View>

        {isPro ? (
          <View style={styles.proBox}>
            <Text style={styles.proTxt}>You're on Pro. Thank you.</Text>
            <TouchableOpacity onPress={onRestore}><Text style={styles.link}>Manage / Restore</Text></TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.priceCard}>
              <View>
                <Text style={styles.plan}>Monthly</Text>
                <Text style={styles.planSub}>Cancel anytime</Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.price}>$19.99</Text>
                <Text style={styles.per}>/ month</Text>
              </View>
            </View>

            <TouchableOpacity style={[styles.cta, busy && { opacity: 0.5 }]} onPress={onSubscribe} disabled={busy} activeOpacity={0.9}>
              {busy ? <ActivityIndicator color={AS.color.accentInk} /> : <Text style={styles.ctaTxt}>Start AllSight Pro</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.restore} onPress={onRestore} disabled={busy}><Text style={styles.link}>Restore purchase</Text></TouchableOpacity>
          </>
        )}

        <Text style={styles.legal}>
          Billed through your Apple ID. Renews monthly until cancelled in Settings. AllSight decodes public SEC filings — it never gives buy or sell advice.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: AS.color.ink3, fontSize: 18 },
  scroll: { paddingHorizontal: 24, paddingTop: 56, paddingBottom: 40 },
  badge: { alignSelf: 'flex-start', backgroundColor: AS.color.accent, borderRadius: AS.radius.pill, paddingHorizontal: 12, paddingVertical: 5, marginBottom: 16 },
  badgeTxt: { color: AS.color.accentInk, fontSize: 11, fontWeight: '800', letterSpacing: 0.8 },
  h1: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 32, fontWeight: '600', lineHeight: 38 },
  sub: { color: AS.color.ink2, fontSize: 15, lineHeight: 22, marginTop: 12, marginBottom: 28 },
  perks: { marginBottom: 26 },
  perk: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 16 },
  check: { color: AS.color.accent, fontSize: 15, fontWeight: '900', width: 24, marginTop: 1 },
  perkT: { color: AS.color.ink, fontSize: 15.5, fontWeight: '600' },
  perkD: { color: AS.color.ink3, fontSize: 13, lineHeight: 18, marginTop: 2 },
  priceCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: AS.color.surface, borderColor: AS.color.accent, borderWidth: 1.5, borderRadius: AS.radius.lg, padding: 18, marginBottom: 16 },
  plan: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 20, fontWeight: '600' },
  planSub: { color: AS.color.ink3, fontSize: 12.5, marginTop: 3 },
  price: { color: AS.color.ink, fontFamily: AS.font.mono, fontSize: 26, fontWeight: '700' },
  per: { color: AS.color.ink3, fontSize: 12, marginTop: 2 },
  cta: { backgroundColor: AS.color.accent, borderRadius: 14, height: 54, alignItems: 'center', justifyContent: 'center' },
  ctaTxt: { color: AS.color.accentInk, fontSize: 16.5, fontWeight: '700' },
  restore: { alignItems: 'center', paddingVertical: 16 },
  link: { color: AS.color.accent, fontSize: 14, fontWeight: '600' },
  proBox: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: AS.radius.lg, padding: 20, alignItems: 'center' },
  proTxt: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 18, fontWeight: '600', marginBottom: 10 },
  legal: { color: AS.color.ink3, fontSize: 11.5, textAlign: 'center', marginTop: 22, lineHeight: 17 },
});

export default SubscriptionScreenAS;
