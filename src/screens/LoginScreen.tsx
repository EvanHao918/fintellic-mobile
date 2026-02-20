// src/screens/LoginScreen.tsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  TextInput,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Text } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import { AppDispatch, RootState } from '../store';
import { login, register, appleSignIn, googleSignIn } from '../store/slices/authSlice';
import themeConfig from '../theme';
import { STORAGE_KEYS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { BRAND_IMAGES, BRAND_NAME, BRAND_TAGLINES, ONBOARDING_SLIDES } from '../constants/brand';
import SingularService from '../services/SingularService';

const { colors, typography, spacing, borderRadius, shadows } = themeConfig;
const { width } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// 🔐 Configure WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client IDs  
const GOOGLE_CLIENT_ID_IOS = '64424434871-9juntrmqun10tqfk5u5mcfga1h6ckifl.apps.googleusercontent.com';
const GOOGLE_CLIENT_ID_WEB = '64424434871-193fhc64bq7a9t6o6prtedgi0n381ma2.apps.googleusercontent.com';

// Helper function to interpolate colors
const interpolateColor = (color1: string, color2: string, factor: number): string => {
  const hex = (c: string) => parseInt(c, 16);
  const r1 = hex(color1.slice(1, 3)), g1 = hex(color1.slice(3, 5)), b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3)), g2 = hex(color2.slice(3, 5)), b2 = hex(color2.slice(5, 7));
  const r = Math.round(r1 + (r2 - r1) * factor);
  const g = Math.round(g1 + (g2 - g1) * factor);
  const b = Math.round(b1 + (b2 - b1) * factor);
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

// Validation helper functions (unchanged from original)
const validationHelpers = {
  email: (email: string, setError: (msg: string) => void) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email');
      return false;
    }
    setError('');
    return true;
  },
  
  password: (password: string, isLogin: boolean, setError: (msg: string) => void) => {
    if (!password) {
      setError('Password is required');
      return false;
    }
    if (!isLogin) {
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return false;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setError('Password must contain uppercase, lowercase, and number');
        return false;
      }
    } else if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    setError('');
    return true;
  },
  
  username: (username: string, setError: (msg: string) => void) => {
    if (!username.trim()) {
      setError('Username is required');
      return false;
    }
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setError('');
    return true;
  },
  
  confirmPassword: (password: string, confirmPassword: string, setError: (msg: string) => void) => {
    if (!confirmPassword) {
      setError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    setError('');
    return true;
  },
};

// Carousel slide width (full screen width for paging)
const SLIDE_WIDTH = width;

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  // ==================== Carousel State ====================
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [scrollX, setScrollX] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoPlayRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Google Sign In hook
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    webClientId: GOOGLE_CLIENT_ID_WEB,
    scopes: ['profile', 'email'],
  });
  
  // Handle Google Sign In response
  useEffect(() => {
    if (googleRequest) {
      console.log('🔍 Google Auth Debug - Redirect URI:', googleRequest.redirectUri);
    }
  }, [googleRequest]);
  
  useEffect(() => {
    if (googleResponse) {
      console.log('🔍 Google Response type:', googleResponse.type);
      if (googleResponse.type === 'success' && googleResponse.authentication) {
        console.log('✅ Google auth success!');
        handleGoogleAuthSuccess(googleResponse.authentication.accessToken);
      } else if (googleResponse.type === 'error') {
        console.log('❌ Google auth error:', googleResponse.error);
        Alert.alert('Sign In Failed', googleResponse.error?.message || 'Google sign in failed');
      }
    }
  }, [googleResponse]);

  const handleGoogleAuthSuccess = async (accessToken: string) => {
    try {
      console.log('📤 Sending Google token to backend...');
      const result = await dispatch(googleSignIn({ accessToken })).unwrap();
      
      // Track Signup event if this is a new user
      if (result.is_new_user) {
        SingularService.trackSignup('google');
      }
      
      console.log('✅ Google sign in complete:', result);
    } catch (error: any) {
      console.error('❌ Google sign in error:', error);
      Alert.alert('Sign In Failed', error.message || 'Failed to sign in with Google');
    }
  };
  
  // ==================== Form State (unchanged from original) ====================
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Apple Sign In state
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  
  // Animation
  const buttonScaleAnim = useRef(new Animated.Value(1)).current;
  const formFadeAnim = useRef(new Animated.Value(1)).current;

  // ==================== Auto-play carousel ====================
  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [currentSlideIndex]);

  const startAutoPlay = () => {
    stopAutoPlay();
    autoPlayRef.current = setTimeout(() => {
      const nextIndex = (currentSlideIndex + 1) % ONBOARDING_SLIDES.length;
      scrollViewRef.current?.scrollTo({ x: nextIndex * SLIDE_WIDTH, animated: true });
      setCurrentSlideIndex(nextIndex);
    }, 4000);
  };

  const stopAutoPlay = () => {
    if (autoPlayRef.current) {
      clearTimeout(autoPlayRef.current);
      autoPlayRef.current = null;
    }
  };

  const onScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffsetX / SLIDE_WIDTH);
    if (newIndex !== currentSlideIndex && newIndex >= 0 && newIndex < ONBOARDING_SLIDES.length) {
      setCurrentSlideIndex(newIndex);
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    setScrollX(contentOffsetX);
  };

  // Calculate interpolated gradient colors based on scroll position
  const getInterpolatedGradientColors = (): readonly [string, string, string] => {
    const currentIndex = Math.floor(scrollX / SLIDE_WIDTH);
    const nextIndex = Math.min(currentIndex + 1, ONBOARDING_SLIDES.length - 1);
    const progress = (scrollX % SLIDE_WIDTH) / SLIDE_WIDTH;

    if (currentIndex < 0 || currentIndex >= ONBOARDING_SLIDES.length) {
      return ONBOARDING_SLIDES[0].gradientColors;
    }

    const currentColors = ONBOARDING_SLIDES[currentIndex].gradientColors;
    const nextColors = ONBOARDING_SLIDES[nextIndex].gradientColors;

    return [
      interpolateColor(currentColors[0], nextColors[0], progress),
      interpolateColor(currentColors[1], nextColors[1], progress),
      interpolateColor(currentColors[2], nextColors[2], progress),
    ] as const;
  };

  // Check for saved credentials & Apple availability
  useEffect(() => {
    checkForSavedCredentials();
    checkAppleSignInAvailability();
  }, []);

  const checkForSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (savedEmail) setEmail(savedEmail);
    } catch (error) {
      console.log('Error checking saved credentials:', error);
    }
  };

  const checkAppleSignInAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    setIsAppleSignInAvailable(isAvailable);
  };

  // ==================== Validation (unchanged) ====================
  const validateEmail = (email: string) => validationHelpers.email(email, setEmailError);
  const validatePassword = (password: string) => validationHelpers.password(password, isLoginMode, setPasswordError);
  const validateUsername = (username: string) => validationHelpers.username(username, setUsernameError);
  const validateConfirmPassword = (confirmPassword: string) => 
    validationHelpers.confirmPassword(password, confirmPassword, setConfirmPasswordError);

  // ==================== Form Submit (unchanged) ====================
  const handleSubmit = async () => {
    const validations = [validateEmail(email), validatePassword(password)];
    if (!isLoginMode) {
      validations.push(validateUsername(username), validateConfirmPassword(confirmPassword));
    }
    if (!validations.every(v => v)) return;

    Animated.sequence([
      Animated.timing(buttonScaleAnim, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(buttonScaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    try {
      if (isLoginMode) {
        await dispatch(login({ email: email.toLowerCase().trim(), password })).unwrap();
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, email);
      } else {
        await dispatch(register({ 
          email: email.toLowerCase().trim(), 
          password, 
          username: username.trim() 
        })).unwrap();
        
        // Track Signup event
        SingularService.trackSignup('email');
        
        Alert.alert('Registration Successful', `Your account has been created. Welcome to ${BRAND_NAME}!`);
      }
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.detail || 'An error occurred';
      if (!isLoginMode && errorMessage.includes('already exists')) {
        Alert.alert(
          'Registration Failed',
          'This email is already registered. Please try logging in instead.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Login', onPress: () => setIsLoginMode(true) }
          ]
        );
      }
    }
  };

  // Switch between login and register
  const switchMode = () => {
    Animated.timing(formFadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(() => {
      setIsLoginMode(!isLoginMode);
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setUsernameError('');
      Animated.timing(formFadeAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    });
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    navigation.navigate('ResetPassword', {});
  };

  // ==================== Social Sign In Handlers (unchanged) ====================
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      let fullName: string | undefined;
      if (credential.fullName) {
        const parts = [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean);
        fullName = parts.length > 0 ? parts.join(' ') : undefined;
      }

      const result = await dispatch(appleSignIn({
        identityToken: credential.identityToken!,
        authorizationCode: credential.authorizationCode || undefined,
        fullName,
        givenName: credential.fullName?.givenName || undefined,
        familyName: credential.fullName?.familyName || undefined,
      })).unwrap();

      // Track Signup event if this is a new user
      if (result.is_new_user) {
        SingularService.trackSignup('apple');
      }

      console.log('Apple Sign In successful');
    } catch (error: any) {
      if (error.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Sign In Failed', error.message || 'Apple Sign In failed. Please try again.');
      }
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      if (!googleRequest) {
        Alert.alert('Error', 'Google Sign In is not available');
        return;
      }
      await googlePromptAsync();
    } catch (error: any) {
      Alert.alert('Sign In Failed', error.message || 'Failed to initiate Google Sign In');
    }
  };

  // Get image source for slide
  const getImageSource = (imageKey: string) => {
    switch (imageKey) {
      case 'ONBOARDING_STAR':
        return BRAND_IMAGES.ONBOARDING_STAR;
      case 'ONBOARDING_CHECKLIST':
        return BRAND_IMAGES.ONBOARDING_CHECKLIST;
      case 'ONBOARDING_ARROW':
        return BRAND_IMAGES.ONBOARDING_ARROW;
      default:
        return BRAND_IMAGES.ONBOARDING_STAR;
    }
  };

  // Get interpolated gradient colors for smooth transition
  const currentGradientColors = getInterpolatedGradientColors();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FFFFFF', currentGradientColors[1], currentGradientColors[2]]}
        style={styles.gradientContainer}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        locations={[0, 0.5, 0.75, 1]}
      >
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
            {/* ==================== TOP: Logo ==================== */}
            <View style={styles.logoContainer}>
              <Image
                source={BRAND_IMAGES.ONBOARDING_LOGO}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* ==================== CAROUSEL: Horizontal ScrollView ==================== */}
            <View style={styles.carouselContainer}>
              <ScrollView
                ref={scrollViewRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={onScrollEnd}
                onScroll={onScroll}
                scrollEventThrottle={16}
                decelerationRate="fast"
              >
                {ONBOARDING_SLIDES.map((slide) => (
                  <View key={slide.id} style={styles.slide}>
                    <Image
                      source={getImageSource(slide.image)}
                      style={styles.slideIcon}
                      resizeMode="contain"
                    />
                    <Text style={styles.slideTitle}>{slide.title}</Text>
                    <Text style={styles.slideTitleBold}>{slide.titleBold}</Text>
                    <Text style={styles.slideSubtitle}>{slide.subtitle}</Text>
                  </View>
                ))}
              </ScrollView>

              {/* Pagination Dots */}
              <View style={styles.paginationContainer}>
                {ONBOARDING_SLIDES.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentSlideIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* ==================== BOTTOM: Login Form Card ==================== */}
            <Animated.View style={[styles.formCard, { opacity: formFadeAnim }]}>
              {/* Username Input (Registration only) */}
              {!isLoginMode && (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Icon name="person" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Username"
                      placeholderTextColor={colors.textSecondary}
                      value={username}
                      onChangeText={(text) => {
                        setUsername(text);
                        if (usernameError) validateUsername(text);
                      }}
                      onBlur={() => validateUsername(username)}
                      autoCapitalize="none"
                      style={styles.textInput}
                    />
                  </View>
                  {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
                </View>
              )}

              {/* Email Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                  <Icon name="email" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Email"
                    placeholderTextColor={colors.textSecondary}
                    value={email}
                    onChangeText={(text) => {
                      setEmail(text);
                      if (emailError) validateEmail(text);
                    }}
                    onBlur={() => validateEmail(email)}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.textInput}
                  />
                </View>
                {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              </View>

              {/* Password Input */}
              <View style={styles.inputWrapper}>
                <View style={styles.inputContainer}>
                  <Icon name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                  <TextInput
                    placeholder="Password"
                    placeholderTextColor={colors.textSecondary}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      if (passwordError) validatePassword(text);
                    }}
                    onBlur={() => validatePassword(password)}
                    secureTextEntry={!showPassword}
                    style={styles.textInput}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Icon name={showPassword ? 'visibility' : 'visibility-off'} size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
              </View>

              {/* Confirm Password (Registration only) */}
              {!isLoginMode && (
                <View style={styles.inputWrapper}>
                  <View style={styles.inputContainer}>
                    <Icon name="lock" size={20} color={colors.textSecondary} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Confirm Password"
                      placeholderTextColor={colors.textSecondary}
                      value={confirmPassword}
                      onChangeText={(text) => {
                        setConfirmPassword(text);
                        if (confirmPasswordError) validateConfirmPassword(text);
                      }}
                      onBlur={() => validateConfirmPassword(confirmPassword)}
                      secureTextEntry={!showPassword}
                      style={styles.textInput}
                    />
                  </View>
                  {confirmPasswordError ? <Text style={styles.errorText}>{confirmPasswordError}</Text> : null}
                </View>
              )}

              {/* Forgot Password (Login only) */}
              {isLoginMode && (
                <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotContainer}>
                  <Text style={styles.forgotText}>Forgot Password?</Text>
                </TouchableOpacity>
              )}

              {/* Error Message */}
              {error && (
                <View style={styles.errorMessageContainer}>
                  <Icon name="error-outline" size={16} color={colors.error} />
                  <Text style={styles.errorMessageText}>{error}</Text>
                </View>
              )}

              {/* Submit Button */}
              <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                <TouchableOpacity onPress={handleSubmit} disabled={isLoading} activeOpacity={0.9}>
                  <LinearGradient
                    colors={[colors.primaryLight, colors.primary]}
                    style={styles.submitButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.submitButtonText}>
                      {isLoading 
                        ? (isLoginMode ? 'Signing in...' : 'Creating account...') 
                        : (isLoginMode ? 'Sign In' : 'Create Account')
                      }
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </Animated.View>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or continue with</Text>
                <View style={styles.dividerLine} />
              </View>

              {/* Social Buttons */}
              <View style={styles.socialButtonsRow}>
                {isAppleSignInAvailable && (
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleAppleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <Icon name="apple" size={20} color="#000" />
                    <Text style={styles.socialButtonText}>Apple</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.socialButton}
                  onPress={handleGoogleSignIn}
                  disabled={isLoading}
                  activeOpacity={0.8}
                >
                  <Image
                    source={{ uri: 'https://www.google.com/favicon.ico' }}
                    style={styles.socialIconImage}
                  />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
              </View>

              {/* Switch Mode */}
              <View style={styles.switchContainer}>
                <Text style={styles.switchText}>
                  {isLoginMode ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <TouchableOpacity onPress={switchMode} disabled={isLoading}>
                  <Text style={styles.switchLink}>
                    {isLoginMode ? 'Sign Up' : 'Sign In'}
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
            </ScrollView>

          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// ==================== STYLES ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientContainer: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },

  // ==================== LOGO ====================
  logoContainer: {
    alignItems: 'center',
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  brandName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
    letterSpacing: 3,
  },
  brandTagline: {
    fontSize: typography.fontSize.sm,
    color: '#555',
    letterSpacing: 0.5,
  },

  // ==================== CAROUSEL ====================
  carouselContainer: {
    height: 320,
  },
  slide: {
    width: SLIDE_WIDTH,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  slideIcon: {
    width: 140,
    height: 140,
    marginBottom: spacing.md,
  },
  slideTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.regular,
    color: '#000',
    textAlign: 'center',
    fontFamily: 'Futura',
  },
  slideTitleBold: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#000',
    textAlign: 'center',
    marginBottom: spacing.xs,
    fontFamily: 'Futura',
  },
  slideSubtitle: {
    fontSize: typography.fontSize.base,
    color: '#555',
    textAlign: 'center',
    lineHeight: typography.fontSize.base * 1.4,
    paddingHorizontal: spacing.md,
  },

  // Pagination
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  paginationDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ccc',
    marginHorizontal: 3,
  },
  paginationDotActive: {
    backgroundColor: '#000',
  },

  // ==================== FORM CARD ====================
  formCard: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: 0,
  },
  inputWrapper: {
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    ...shadows.sm,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    paddingVertical: 2,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginTop: spacing.xxs,
    marginLeft: spacing.xs,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.xs,
  },
  forgotText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  errorMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  errorMessageText: {
    fontSize: typography.fontSize.xs,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  submitButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.xs + 2,
    marginBottom: spacing.xs,
  },
  submitButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
    textAlign: 'center',
  },

  // Divider
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
  },
  dividerText: {
    fontSize: typography.fontSize.xs,
    color: '#555',
    paddingHorizontal: spacing.xs,
  },

  // Social Buttons
  socialButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.xs,
  },
  socialButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
    ...shadows.sm,
  },
  socialIconImage: {
    width: 16,
    height: 16,
  },
  socialButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#333',
  },

  // Switch Mode
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  switchText: {
    fontSize: typography.fontSize.xs,
    color: '#444',
  },
  switchLink: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },

});