// src/screens/AuthScreenAS.tsx
// AllSight 2026 sign-in sheet — Apple + Google + email OTP. Reuses authSlice thunks verbatim.
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, Platform,
  KeyboardAvoidingView, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import { AppDispatch, RootState } from '../store';
import { appleSignIn, googleSignIn, requestOtp, verifyOtp } from '../store/slices/authSlice';
import BrandMark from '../components/BrandMark';
import { AS } from '../theme/allsight';

const GOOGLE_CLIENT_ID_IOS = '64424434871-9juntrmqun10tqfk5u5mcfga1h6ckifl.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB = '64424434871-193fhc64bq7a9t6o6prtedgi0n381ma2.apps.googleusercontent.com';

interface Props { navigation?: any; }

const AuthScreenAS: React.FC<Props> = ({ navigation }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated, isLoading } = useSelector((s: RootState) => s.auth);
  const [appleAvail, setAppleAvail] = useState(false);

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const timer = useRef<any>(null);

  // Close the sheet once auth lands
  useEffect(() => { if (isAuthenticated && navigation) navigation.goBack(); }, [isAuthenticated]);

  useEffect(() => {
    if (Platform.OS === 'ios') AppleAuthentication.isAvailableAsync().then(setAppleAvail).catch(() => {});
  }, []);

  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    webClientId: GOOGLE_CLIENT_ID_WEB,
    scopes: ['profile', 'email'],
  });

  useEffect(() => {
    if (googleResponse?.type === 'success' && googleResponse.authentication) {
      dispatch(googleSignIn({ accessToken: googleResponse.authentication.accessToken }))
        .unwrap().catch((e: any) => Alert.alert('Sign in failed', e?.message || 'Google sign in failed'));
    } else if (googleResponse?.type === 'error') {
      Alert.alert('Sign in failed', googleResponse.error?.message || 'Google sign in failed');
    }
  }, [googleResponse]);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const startCooldown = (secs: number) => {
    setCooldown(secs);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setCooldown((c) => { if (c <= 1) { clearInterval(timer.current); return 0; } return c - 1; }), 1000);
  };

  const onApple = async () => {
    try {
      const cred = await AppleAuthentication.signInAsync({
        requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL],
      });
      let fullName: string | undefined;
      if (cred.fullName) {
        const parts = [cred.fullName.givenName, cred.fullName.familyName].filter(Boolean);
        fullName = parts.length ? parts.join(' ') : undefined;
      }
      await dispatch(appleSignIn({
        identityToken: cred.identityToken!,
        authorizationCode: cred.authorizationCode || undefined,
        fullName,
        givenName: cred.fullName?.givenName || undefined,
        familyName: cred.fullName?.familyName || undefined,
      })).unwrap();
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') Alert.alert('Sign in failed', e?.message || 'Apple sign in failed');
    }
  };

  const emailValid = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim());

  const onSendCode = async () => {
    if (!emailValid) { Alert.alert('Check your email', 'Enter a valid email address.'); return; }
    setBusy(true);
    try {
      const r: any = await dispatch(requestOtp(email)).unwrap();
      setStep('code');
      startCooldown(r?.resend_in || 30);
    } catch (e: any) {
      Alert.alert('Could not send code', e?.message || 'Try again in a moment.');
    } finally { setBusy(false); }
  };

  const onVerify = async () => {
    if (code.trim().length < 6) { Alert.alert('Enter the code', 'The code is 6 digits.'); return; }
    setBusy(true);
    try {
      await dispatch(verifyOtp({ email, code })).unwrap();
      // success closes the sheet via the isAuthenticated effect
    } catch (e: any) {
      Alert.alert('That didn’t work', e?.message || 'Check the code and try again.');
    } finally { setBusy(false); }
  };

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <TouchableOpacity style={styles.close} onPress={() => navigation && navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
        <Text style={styles.closeTxt}>✕</Text>
      </TouchableOpacity>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          {/* Radar mark */}
          <View style={styles.radar}>
            <View style={[styles.ring, styles.ring1]} />
            <View style={[styles.ring, styles.ring2]} />
            <View style={[styles.ring, styles.ring3]} />
            <BrandMark size={34} />
          </View>

          <Text style={styles.h1}>Know it before the move plays out.</Text>
          <Text style={styles.sub}>Sign in to follow companies and get a ping the moment they file.</Text>

          {step === 'email' ? (
            <>
              {appleAvail && (
                <TouchableOpacity style={[styles.social, styles.apple]} onPress={onApple} activeOpacity={0.85}>
                  <Text style={styles.appleTxt}></Text>
                  <Text style={[styles.socialTxt, { color: '#000' }]}>Continue with Apple</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={[styles.social, styles.google]} onPress={() => googlePromptAsync()} disabled={!googleRequest} activeOpacity={0.85}>
                <Text style={[styles.socialTxt, { color: AS.color.ink }]}>Continue with Google</Text>
              </TouchableOpacity>

              <View style={styles.orRow}><View style={styles.orLine} /><Text style={styles.orTxt}>or</Text><View style={styles.orLine} /></View>

              <Text style={styles.label}>EMAIL</Text>
              <TextInput
                value={email} onChangeText={setEmail}
                placeholder="you@email.com" placeholderTextColor={AS.color.ink3}
                style={styles.input} keyboardType="email-address" autoCapitalize="none"
                autoCorrect={false} autoComplete="email" returnKeyType="go" onSubmitEditing={onSendCode}
              />
              <TouchableOpacity style={[styles.primary, (!emailValid || busy) && styles.primaryOff]} onPress={onSendCode} disabled={!emailValid || busy}>
                {busy ? <ActivityIndicator color={AS.color.accentInk} /> : <Text style={styles.primaryTxt}>Email me a sign-in code</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>6-DIGIT CODE</Text>
              <Text style={styles.sentTo}>Sent to {email}</Text>
              <TextInput
                value={code} onChangeText={(t) => setCode(t.replace(/[^0-9]/g, '').slice(0, 6))}
                placeholder="••••••" placeholderTextColor={AS.color.ink3}
                style={[styles.input, styles.codeInput]} keyboardType="number-pad"
                autoFocus returnKeyType="go" onSubmitEditing={onVerify} maxLength={6}
              />
              <TouchableOpacity style={[styles.primary, (code.length < 6 || busy) && styles.primaryOff]} onPress={onVerify} disabled={code.length < 6 || busy}>
                {busy ? <ActivityIndicator color={AS.color.accentInk} /> : <Text style={styles.primaryTxt}>Verify &amp; sign in</Text>}
              </TouchableOpacity>
              <View style={styles.resendRow}>
                <TouchableOpacity disabled={cooldown > 0} onPress={onSendCode}>
                  <Text style={[styles.link, cooldown > 0 && { color: AS.color.ink3 }]}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</Text>
                </TouchableOpacity>
                <Text style={styles.dot}>·</Text>
                <TouchableOpacity onPress={() => { setStep('email'); setCode(''); }}><Text style={styles.link}>Change email</Text></TouchableOpacity>
              </View>
            </>
          )}

          <Text style={styles.legal}>By continuing you agree to our Terms and Privacy Policy. No spam — only the companies you follow.</Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: AS.color.bg },
  close: { position: 'absolute', top: 54, right: 20, zIndex: 10, width: 34, height: 34, alignItems: 'center', justifyContent: 'center' },
  closeTxt: { color: AS.color.ink3, fontSize: 18 },
  scroll: { paddingHorizontal: 26, paddingTop: 40, paddingBottom: 40, flexGrow: 1, justifyContent: 'center' },
  radar: { width: 120, height: 120, alignItems: 'center', justifyContent: 'center', alignSelf: 'center', marginBottom: 26 },
  ring: { position: 'absolute', borderRadius: 999, borderColor: AS.color.line, borderWidth: 1 },
  ring1: { width: 120, height: 120, opacity: 0.35 },
  ring2: { width: 84, height: 84, opacity: 0.5 },
  ring3: { width: 50, height: 50, borderColor: AS.color.accent, opacity: 0.6 },
  core: { width: 30, height: 30, borderRadius: 999, backgroundColor: AS.color.accent, alignItems: 'center', justifyContent: 'center' },
  coreTxt: { color: AS.color.accentInk, fontSize: 18, fontWeight: '900', marginTop: -1 },
  h1: { color: AS.color.ink, fontFamily: AS.font.serif, fontSize: 26, fontWeight: '600', textAlign: 'center', lineHeight: 32 },
  sub: { color: AS.color.ink3, fontSize: 14, textAlign: 'center', marginTop: 10, marginBottom: 28, lineHeight: 20 },
  social: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', height: 50, borderRadius: 13, marginBottom: 11 },
  apple: { backgroundColor: '#fff' },
  appleTxt: { fontSize: 17, marginRight: 7, color: '#000' },
  google: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1 },
  socialTxt: { fontSize: 15.5, fontWeight: '600' },
  orRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 18 },
  orLine: { flex: 1, height: 1, backgroundColor: AS.color.line },
  orTxt: { color: AS.color.ink3, fontSize: 12, marginHorizontal: 12 },
  label: { color: AS.color.ink3, fontSize: 11, fontWeight: '700', letterSpacing: 0.6, marginBottom: 8 },
  sentTo: { color: AS.color.ink2, fontSize: 13, marginBottom: 10, marginTop: -2 },
  input: { backgroundColor: AS.color.surface, borderColor: AS.color.line, borderWidth: 1, borderRadius: 13, paddingHorizontal: 15, height: 50, color: AS.color.ink, fontSize: 16 },
  codeInput: { fontFamily: AS.font.mono, fontSize: 24, letterSpacing: 8, textAlign: 'center' },
  primary: { backgroundColor: AS.color.accent, borderRadius: 13, height: 50, alignItems: 'center', justifyContent: 'center', marginTop: 14 },
  primaryOff: { opacity: 0.4 },
  primaryTxt: { color: AS.color.accentInk, fontSize: 15.5, fontWeight: '700' },
  resendRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 18 },
  link: { color: AS.color.accent, fontSize: 13.5, fontWeight: '600' },
  dot: { color: AS.color.ink3, marginHorizontal: 10 },
  legal: { color: AS.color.ink3, fontSize: 11.5, textAlign: 'center', marginTop: 28, lineHeight: 17 },
});

export default AuthScreenAS;
