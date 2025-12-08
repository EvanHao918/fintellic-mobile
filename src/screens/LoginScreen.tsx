// src/screens/LoginScreen.tsx
import React, { useState, useEffect, useMemo } from 'react';
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
} from 'react-native';
import { Text, Button } from 'react-native-elements';
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
import { useFadeAnimation, useTypewriterAnimation } from '../utils/animations';
import { BRAND_IMAGES, BRAND_NAME, BRAND_TAGLINES } from '../constants/brand';

const { colors, typography, spacing, borderRadius, shadows } = themeConfig;
const { width, height } = Dimensions.get('window');

type LoginScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Login'>;

// 🎨 Financial Chart Background Component
const FinancialChartBackground = () => {
  const line1Anim = useState(new Animated.Value(0))[0];
  const line2Anim = useState(new Animated.Value(0))[0];
  const line3Anim = useState(new Animated.Value(0))[0];

  useEffect(() => {
    // Three parallel animated lines with different speeds
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(line1Anim, {
            toValue: 1,
            duration: 8000,
            useNativeDriver: true,
          }),
          Animated.timing(line1Anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(line2Anim, {
            toValue: 1,
            duration: 10000,
            useNativeDriver: true,
          }),
          Animated.timing(line2Anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(line3Anim, {
            toValue: 1,
            duration: 12000,
            useNativeDriver: true,
          }),
          Animated.timing(line3Anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();
  }, []);

  const line1TranslateX = line1Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  const line2TranslateX = line2Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 0.8, width * 0.8],
  });

  const line3TranslateX = line3Anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-width * 1.2, width * 1.2],
  });

  return (
    <View style={styles.chartBackground}>
      {/* Line 1 - Top */}
      <Animated.View
        style={[
          styles.chartLine,
          {
            top: '20%',
            transform: [{ translateX: line1TranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.fintechGoldLight + '40', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chartLineGradient}
        />
      </Animated.View>

      {/* Line 2 - Middle */}
      <Animated.View
        style={[
          styles.chartLine,
          {
            top: '50%',
            transform: [{ translateX: line2TranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.fintechGoldDark + '30', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chartLineGradient}
        />
      </Animated.View>

      {/* Line 3 - Bottom */}
      <Animated.View
        style={[
          styles.chartLine,
          {
            top: '75%',
            transform: [{ translateX: line3TranslateX }],
          },
        ]}
      >
        <LinearGradient
          colors={['transparent', colors.fintechGoldLight + '20', 'transparent']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.chartLineGradient}
        />
      </Animated.View>
    </View>
  );
};

// Validation helper functions
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

// Simple Logo Component (no animation)
const SimpleLogo = () => (
  <View style={styles.logoContainer}>
    <Image
      source={BRAND_IMAGES.LOGO_FULL}
      style={styles.logoImage}
      resizeMode="contain"
    />
  </View>
);

// 🔐 Configure WebBrowser for Google Auth
WebBrowser.maybeCompleteAuthSession();

// Google OAuth Client ID
const GOOGLE_CLIENT_ID_IOS = '644244434871-9juntrmqun10tqfk5u5mcfga1h6ckifl.apps.googleusercontent.com';

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<LoginScreenNavigationProp>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  // Google Sign In hook
  const [googleRequest, googleResponse, googlePromptAsync] = Google.useAuthRequest({
    iosClientId: GOOGLE_CLIENT_ID_IOS,
    scopes: ['profile', 'email'],
  });
  
  // Form state
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
  
  // Animations
  const { fadeAnim } = useFadeAnimation(0, true);
  const formFadeAnim = useState(new Animated.Value(1))[0];
  const buttonScaleAnim = useState(new Animated.Value(1))[0];
  
  // Typewriter effect for main tagline
  const { displayedText: mainTaglineText } = useTypewriterAnimation(
    BRAND_TAGLINES.MAIN,
    100,
    800,
    true
  );
  
  // Rotating taglines carousel
  const rotatingTaglines = [
    "CEO resigned? You knew 3 minutes ago.",
    "Earnings made simple. Decisions made smart.",
    "Beat or miss? Know what really matters.",
    "Understand the IPO before everyone piles in."
  ];
  
  const [currentTaglineIndex, setCurrentTaglineIndex] = useState(0);
  const taglineOpacity = useState(new Animated.Value(1))[0];

  useEffect(() => {
    const interval = setInterval(() => {
      // Fade out
      Animated.timing(taglineOpacity, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        // Change text
        setCurrentTaglineIndex((prev) => (prev + 1) % rotatingTaglines.length);
        // Fade in
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 4000); // Change every 4 seconds

    return () => clearInterval(interval);
  }, []);

  // Check for saved email
  useEffect(() => {
    checkForSavedCredentials();
    checkAppleSignInAvailability();
  }, []);

  // Handle Google Sign In response
  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const { authentication } = googleResponse;
      if (authentication?.accessToken) {
        handleGoogleAuthSuccess(authentication.accessToken);
      }
    }
  }, [googleResponse]);

  const handleGoogleAuthSuccess = async (accessToken: string) => {
    try {
      // Fetch user info from Google
      const userInfoResponse = await fetch(
        'https://www.googleapis.com/userinfo/v2/me',
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const userInfo = await userInfoResponse.json();
      
      console.log('Google user info:', userInfo);
      
      // Dispatch Google sign in with the id_token or user info
      const result = await dispatch(googleSignIn({
        idToken: accessToken, // We'll use accessToken to get user info on backend
        accessToken: accessToken,
        user: {
          id: userInfo.id,
          email: userInfo.email,
          name: userInfo.name,
          picture: userInfo.picture,
        }
      })).unwrap();
      
      console.log('Google sign in result:', result);
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Failed to sign in with Google'
      );
    }
  };

  const checkForSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (savedEmail) {
        setEmail(savedEmail);
      }
    } catch (error) {
      console.log('Error checking saved credentials:', error);
    }
  };

  // Check Apple Sign In availability
  const checkAppleSignInAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    setIsAppleSignInAvailable(isAvailable);
  };

  // Email validation
  const validateEmail = (email: string) => validationHelpers.email(email, setEmailError);

  // Password validation
  const validatePassword = (password: string) => validationHelpers.password(password, isLoginMode, setPasswordError);

  // Username validation
  const validateUsername = (username: string) => validationHelpers.username(username, setUsernameError);

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => 
    validationHelpers.confirmPassword(password, confirmPassword, setConfirmPasswordError);

  // Handle form submission
  const handleSubmit = async () => {
    const validations = [validateEmail(email), validatePassword(password)];
    if (!isLoginMode) {
      validations.push(validateUsername(username), validateConfirmPassword(confirmPassword));
    }
    if (!validations.every(v => v)) return;

    // Button press animation
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
    // 允许用户直接跳转到重置页面，即使没有输入邮箱
    navigation.navigate('ResetPassword', {});
  };

  // ==================== Social Sign In Handlers ====================
  
  // Apple Sign In
  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      console.log('Apple credential:', credential);

      // Build full name from Apple's response (only available on first sign in)
      let fullName: string | undefined;
      if (credential.fullName) {
        const parts = [
          credential.fullName.givenName,
          credential.fullName.familyName,
        ].filter(Boolean);
        fullName = parts.length > 0 ? parts.join(' ') : undefined;
      }

      // Dispatch Apple Sign In
      await dispatch(appleSignIn({
        identityToken: credential.identityToken!,
        authorizationCode: credential.authorizationCode || undefined,
        fullName,
        givenName: credential.fullName?.givenName || undefined,
        familyName: credential.fullName?.familyName || undefined,
      })).unwrap();

      console.log('Apple Sign In successful');
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        // User cancelled, do nothing
        console.log('Apple Sign In cancelled');
      } else {
        console.error('Apple Sign In error:', error);
        Alert.alert(
          'Sign In Failed',
          error.message || 'Apple Sign In failed. Please try again.'
        );
      }
    }
  };

  // Google Sign In (placeholder - requires additional setup)
  const handleGoogleSignIn = async () => {
    try {
      if (!googleRequest) {
        Alert.alert('Error', 'Google Sign In is not available');
        return;
      }
      await googlePromptAsync();
    } catch (error: any) {
      console.error('Google sign in error:', error);
      Alert.alert(
        'Sign In Failed',
        error.message || 'Failed to initiate Google Sign In'
      );
    }
  };

  // ✅ NEW: Dynamic scroll content style based on mode
  const dynamicScrollContentStyle = useMemo(() => {
    // Use minHeight to ensure content always exceeds viewport
    // This forces the ScrollView to be scrollable
    return {
      ...styles.scrollContent,
      minHeight: height + 100, // Always taller than screen
    };
  }, [isLoginMode]);

  return (
    <View style={styles.container}>
      {/* Animated Financial Chart Background */}
      <FinancialChartBackground />

      {/* Main Gradient Overlay - Beige Gradient (Soft Luxury) */}
      <LinearGradient
        colors={['#FFF8DC', '#F5F5DC', '#F0E8D0', '#F5F5DC', '#FFF8DC']}
        style={styles.gradientContainer}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.keyboardView}
          >
            <ScrollView 
              contentContainerStyle={dynamicScrollContentStyle}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Animated Header */}
              <Animated.View 
                style={[
                  styles.headerContainer,
                  { opacity: fadeAnim }
                ]}
              >
                {/* Simple Logo */}
                <SimpleLogo />
                
                {/* Main Slogan - Typewriter Effect */}
                <View style={styles.sloganContainer}>
                  <Text style={styles.slogan}>
                    {mainTaglineText}
                    {mainTaglineText.length < BRAND_TAGLINES.MAIN.length && (
                      <Text style={styles.cursor}>|</Text>
                    )}
                  </Text>
                </View>
                
                {/* Rotating Sub Taglines - Fade In/Out Carousel */}
                <Animated.View style={[styles.subSloganContainer, { opacity: taglineOpacity }]}>
                  <Text style={styles.subSlogan}>
                    {rotatingTaglines[currentTaglineIndex]}
                  </Text>
                </Animated.View>
              </Animated.View>

              {/* Glass Form Container */}
              <Animated.View style={[styles.glassCard, { opacity: formFadeAnim }]}>
                {/* Username Input (Registration only) */}
                {!isLoginMode && (
                  <View style={styles.inputWrapper}>
                    <View style={styles.glassInputContainer}>
                      <Icon name="person" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Username"
                        placeholderTextColor={colors.textMuted}
                        value={username}
                        onChangeText={(text) => {
                          setUsername(text);
                          if (usernameError) validateUsername(text);
                        }}
                        onBlur={() => validateUsername(username)}
                        autoCapitalize="none"
                        style={styles.glassInput}
                      />
                    </View>
                    {usernameError ? (
                      <Text style={styles.errorText}>{usernameError}</Text>
                    ) : null}
                  </View>
                )}

                {/* Email Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.glassInputContainer}>
                    <Icon name="email" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Email"
                      placeholderTextColor={colors.textMuted}
                      value={email}
                      onChangeText={(text) => {
                        setEmail(text);
                        if (emailError) validateEmail(text);
                      }}
                      onBlur={() => validateEmail(email)}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      returnKeyType="next"
                      style={styles.glassInput}
                    />
                  </View>
                  {emailError ? (
                    <Text style={styles.errorText}>{emailError}</Text>
                  ) : null}
                </View>

                {/* Password Input */}
                <View style={styles.inputWrapper}>
                  <View style={styles.glassInputContainer}>
                    <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      placeholder="Password"
                      placeholderTextColor={colors.textMuted}
                      value={password}
                      onChangeText={(text) => {
                        setPassword(text);
                        if (passwordError) validatePassword(text);
                      }}
                      onBlur={() => validatePassword(password)}
                      secureTextEntry={!showPassword}
                      returnKeyType={isLoginMode ? "done" : "next"}
                      onSubmitEditing={isLoginMode ? handleSubmit : undefined}
                      style={styles.glassInput}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <Icon
                        name={showPassword ? 'visibility' : 'visibility-off'}
                        size={20}
                        color={colors.textMuted}
                      />
                    </TouchableOpacity>
                  </View>
                  {passwordError ? (
                    <Text style={styles.errorText}>{passwordError}</Text>
                  ) : null}
                </View>

                {/* Confirm Password (Registration only) */}
                {!isLoginMode && (
                  <View style={styles.inputWrapper}>
                    <View style={styles.glassInputContainer}>
                      <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        placeholder="Confirm Password"
                        placeholderTextColor={colors.textMuted}
                        value={confirmPassword}
                        onChangeText={(text) => {
                          setConfirmPassword(text);
                          if (confirmPasswordError) validateConfirmPassword(text);
                        }}
                        onBlur={() => validateConfirmPassword(confirmPassword)}
                        secureTextEntry={!showPassword}
                        returnKeyType="done"
                        onSubmitEditing={handleSubmit}
                        style={styles.glassInput}
                      />
                    </View>
                    {confirmPasswordError ? (
                      <Text style={styles.errorText}>{confirmPasswordError}</Text>
                    ) : null}
                  </View>
                )}

                {/* Forgot Password (Login only) */}
                {isLoginMode && (
                  <TouchableOpacity
                    onPress={handleForgotPassword}
                    style={styles.forgotContainer}
                  >
                    <Text style={styles.forgotText}>Forgot Password?</Text>
                  </TouchableOpacity>
                )}

                {/* Error Message */}
                {error && (
                  <View style={styles.errorContainer}>
                    <Icon name="error-outline" size={16} color={colors.error} />
                    <Text style={styles.errorMessageText}>{error}</Text>
                  </View>
                )}

                {/* Submit Button */}
                <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
                  <TouchableOpacity
                    onPress={handleSubmit}
                    disabled={isLoading}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={[colors.fintechGoldLight, colors.fintechGoldDark]}
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

                {/* Social Sign In Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>or continue with</Text>
                  <View style={styles.dividerLine} />
                </View>

                {/* Social Sign In Buttons */}
                <View style={styles.socialButtonsContainer}>
                  {/* Apple Sign In Button */}
                  {isAppleSignInAvailable && (
                    <TouchableOpacity
                      style={styles.socialButton}
                      onPress={handleAppleSignIn}
                      disabled={isLoading}
                      activeOpacity={0.8}
                    >
                      <View style={styles.socialButtonContent}>
                        <Icon name="apple" size={20} color="#000" style={styles.socialIcon} />
                        <Text style={styles.socialButtonText}>Apple</Text>
                      </View>
                    </TouchableOpacity>
                  )}

                  {/* Google Sign In Button */}
                  <TouchableOpacity
                    style={styles.socialButton}
                    onPress={handleGoogleSignIn}
                    disabled={isLoading}
                    activeOpacity={0.8}
                  >
                    <View style={styles.socialButtonContent}>
                      <Image
                        source={{ uri: 'https://www.google.com/favicon.ico' }}
                        style={styles.googleIcon}
                      />
                      <Text style={styles.socialButtonText}>Google</Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Switch Mode Link */}
                <View style={styles.switchContainer}>
                  <Text style={styles.switchText}>
                    {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
                    {' '}
                  </Text>
                  <TouchableOpacity onPress={switchMode} disabled={isLoading}>
                    <Text style={styles.switchLink}>
                      {isLoginMode ? 'Sign Up' : 'Sign In'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>

              {/* Footer */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>
                  By {isLoginMode ? 'signing in' : 'creating an account'}, you agree to our{' '}
                  <Text 
                    style={styles.linkText}
                    onPress={() => navigation.navigate('TermsOfService')}
                  >
                    Terms of Service
                  </Text>
                  {' and '}
                  <Text 
                    style={styles.linkText}
                    onPress={() => navigation.navigate('PrivacyPolicy')}
                  >
                    Privacy Policy
                  </Text>
                </Text>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5DC',
  },
  // 🎨 Chart Background Styles
  chartBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  chartLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
  },
  chartLineGradient: {
    flex: 1,
    height: '100%',
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
  // ✅ MODIFIED: Base style with consistent padding
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,      // ✅ NEW: Top padding
    paddingBottom: spacing.xxxl + spacing.xxl, // ✅ 64 + 48 = 112px bottom padding
    // minHeight will be applied dynamically to ensure scrollability
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.lg,      
    marginBottom: spacing.lg,   // ✅ INCREASED: from spacing.md (16) to spacing.lg (24) - more breathing room
  },
  // ⚡ Logo Animation Styles - REMOVED (using simple logo now)
  logoContainer: {
    width: 160,                  // ✅ REDUCED: from 200 to 160
    height: 160,                 // ✅ REDUCED: from 200 to 160
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,    // ✅ REDUCED: from spacing.lg (24) to spacing.sm (12)
  },
  logoImage: {
    width: 160,                  // ✅ REDUCED: from 200 to 160
    height: 160,                 // ✅ REDUCED: from 200 to 160
  },
  // 📝 Tagline Styles with Typewriter
  sloganContainer: {
    minHeight: 24,               // ✅ REDUCED: from 30 to 24
    marginBottom: spacing.xxs,   // ✅ REDUCED: from spacing.xs (8) to spacing.xxs (4)
  },
  slogan: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: '#8B4513',
    letterSpacing: 1,
    textTransform: 'uppercase',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'San Francisco' : 'Roboto',
    // Enhanced shadow for luxury feel
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subSloganContainer: {
    minHeight: 50,
    paddingHorizontal: spacing.md,
    justifyContent: 'center',
    marginBottom: spacing.sm,    // ✅ NEW: Add small bottom margin for spacing
  },
  subSlogan: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: '#5C4033',
    letterSpacing: 0.3,
    lineHeight: typography.fontSize.md * 1.4,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'SF Pro Display' : 'Roboto',
    // Subtle shadow for depth
    textShadowColor: 'rgba(0, 0, 0, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  cursor: {
    color: '#8B4513',
    fontWeight: typography.fontWeight.bold,
  },
  glassCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: borderRadius.xxl,
    borderWidth: 1.5,
    borderColor: 'rgba(139, 69, 19, 0.3)',
    padding: spacing.lg,
    marginBottom: spacing.md, // ✅ ADJUSTED: from spacing.sm (12) to spacing.md (16) - moderate increase
    ...shadows.xl,
  },
  inputWrapper: {
    marginBottom: spacing.md,
  },
  glassInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.glassBlur,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.glassWhiteBorder,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  inputIcon: {
    marginRight: spacing.xs,
  },
  glassInput: {
    flex: 1,
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    padding: 0,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.fintechGoldLight,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    padding: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    marginTop: spacing.xxs,
    marginLeft: spacing.xs,
  },
  errorMessageText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  submitButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    ...shadows.goldGlow,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  switchText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textMuted,
  },
  switchLink: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.fintechGoldLight,
  },
  // Social Sign In Styles
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(139, 69, 19, 0.3)',
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: '#8B4513',
    paddingHorizontal: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  socialButton: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(139, 69, 19, 0.3)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    ...shadows.md,
  },
  socialButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  googleIcon: {
    width: 18,
    height: 18,
    marginRight: spacing.sm,
  },
  socialButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#333333',
  },
  // ✅ MODIFIED: Enhanced footer style with moderate padding
  footer: {
    paddingTop: spacing.sm,      // ✅ ADJUSTED: from spacing.xs (8) to spacing.sm (12) - slight increase
    paddingBottom: spacing.xxl,  // Keep this for safe area
    paddingHorizontal: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * 2.0, // ✅ INCREASED: from 1.8 to 2.0 for better spacing
  },
  linkText: {
    color: colors.fintechGoldLight,
    fontWeight: typography.fontWeight.semibold,
  },
});