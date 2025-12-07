// src/screens/LoginScreen.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
  Image,
} from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as LocalAuthentication from 'expo-local-authentication';
import * as AppleAuthentication from 'expo-apple-authentication';
import { AppDispatch, RootState } from '../store';
import { login, register, appleSignIn, googleSignIn } from '../store/slices/authSlice';
import themeConfig from '../theme';
import { STORAGE_KEYS } from '../utils/constants';
import { useNavigation } from '@react-navigation/native';

const { colors, typography, spacing, borderRadius } = themeConfig;

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  // Form state
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Biometric state
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricType, setBiometricType] = useState<string>('');
  
  // Apple Sign In state
  const [isAppleSignInAvailable, setIsAppleSignInAvailable] = useState(false);
  
  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Animation
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Check for biometric availability and saved credentials
  useEffect(() => {
    checkBiometricAvailability();
    checkForSavedCredentials();
    checkAppleSignInAvailability();
  }, []);

  // Check Apple Sign In availability
  const checkAppleSignInAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    setIsAppleSignInAvailable(isAvailable);
  };

  const checkBiometricAvailability = async () => {
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (hasHardware && isEnrolled) {
        setBiometricAvailable(true);
        const authTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (authTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (authTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }
    } catch (error) {
      console.log('Error checking biometric availability:', error);
    }
  };

  const checkForSavedCredentials = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem(STORAGE_KEYS.REMEMBER_ME);
      if (savedEmail) {
        setEmail(savedEmail);
        // Check if biometric is enabled for this user
        const biometricEnabled = await AsyncStorage.getItem(`${STORAGE_KEYS.BIOMETRIC_ENABLED}_${savedEmail}`);
        if (biometricEnabled === 'true' && biometricAvailable) {
          // Auto-prompt for biometric login
          setTimeout(() => {
            handleBiometricLogin();
          }, 500);
        }
      }
    } catch (error) {
      console.log('Error checking saved credentials:', error);
    }
  };

  // Email validation
  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError('Email is required');
      return false;
    }
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email');
      return false;
    }
    setEmailError('');
    return true;
  };

  // Password validation
  const validatePassword = (password: string) => {
    if (!password) {
      setPasswordError('Password is required');
      return false;
    }
    if (!isLoginMode) {
      if (password.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return false;
      }
      if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
        setPasswordError('Password must contain uppercase, lowercase, and number');
        return false;
      }
    } else if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Username validation
  const validateUsername = (username: string) => {
    if (!username.trim()) {
      setUsernameError('Username is required');
      return false;
    }
    if (username.length < 3) {
      setUsernameError('Username must be at least 3 characters');
      return false;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setUsernameError('Username can only contain letters, numbers, and underscores');
      return false;
    }
    setUsernameError('');
    return true;
  };

  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Handle form submission
  const handleSubmit = async () => {
    const validations = [validateEmail(email), validatePassword(password)];
    
    if (!isLoginMode) {
      validations.push(validateUsername(username));
      validations.push(validateConfirmPassword(confirmPassword));
    }
    
    if (!validations.every(v => v)) {
      return;
    }

    try {
      if (isLoginMode) {
        await dispatch(login({ email: email.toLowerCase().trim(), password })).unwrap();
        // Save email for remember me
        await AsyncStorage.setItem(STORAGE_KEYS.REMEMBER_ME, email);
      } else {
        await dispatch(register({ 
          email: email.toLowerCase().trim(), 
          password, 
          username: username.trim() 
        })).unwrap();
        
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Welcome to HermeSpeed!',
          [{ text: 'OK' }]
        );
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

  // Handle biometric login
  const handleBiometricLogin = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: `Sign in with ${biometricType}`,
        cancelLabel: 'Cancel',
        fallbackLabel: 'Use Passcode',
        disableDeviceFallback: false,
      });

      if (result.success) {
        // TODO: Implement biometric login with stored credentials
        Alert.alert(
          'Biometric Login',
          'Biometric login will be fully implemented soon!',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Biometric authentication error:', error);
    }
  };

  // Switch between login and register
  const switchMode = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsLoginMode(!isLoginMode);
      setEmailError('');
      setPasswordError('');
      setConfirmPasswordError('');
      setUsernameError('');
      
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }).start();
    });
  };

  // Handle forgot password
  const handleForgotPassword = () => {
    if (!email) {
      Alert.alert(
        'Email Required',
        'Please enter your email address first.',
        [{ text: 'OK' }]
      );
    } else {
      // Navigate to reset password screen
      (navigation as any).navigate('ResetPassword', { email });
    }
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
    Alert.alert(
      'Coming Soon',
      'Google Sign In will be available soon!'
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Icon name="flash-on" size={40} color={colors.white} />
            </View>
            <Text style={styles.title}>HermeSpeed</Text>
            <Text style={styles.subtitle}>
              {isLoginMode ? 'Welcome back!' : 'Create your account'}
            </Text>
          </View>

          {/* Form */}
          <Animated.View style={[styles.formContainer, { opacity: fadeAnim }]}>
            {/* Username Input (Registration only) */}
            {!isLoginMode && (
              <Input
                placeholder="Username"
                value={username}
                onChangeText={(text) => {
                  setUsername(text);
                  if (usernameError) validateUsername(text);
                }}
                onBlur={() => validateUsername(username)}
                autoCapitalize="none"
                leftIcon={
                  <Icon
                    name="person"
                    size={20}
                    color={colors.textSecondary}
                  />
                }
                errorMessage={usernameError}
                inputContainerStyle={[
                  styles.inputContainer,
                  usernameError ? styles.inputError : null,
                ]}
                inputStyle={styles.input}
              />
            )}

            {/* Email Input */}
            <Input
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              onBlur={() => validateEmail(email)}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
              leftIcon={
                <Icon
                  name="email"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              errorMessage={emailError}
              inputContainerStyle={[
                styles.inputContainer,
                emailError ? styles.inputError : null,
              ]}
              inputStyle={styles.input}
            />

            {/* Password Input */}
            <Input
              placeholder="Password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                if (passwordError) validatePassword(text);
              }}
              onBlur={() => validatePassword(password)}
              secureTextEntry={!showPassword}
              returnKeyType={isLoginMode ? "done" : "next"}
              onSubmitEditing={isLoginMode ? handleSubmit : undefined}
              leftIcon={
                <Icon
                  name="lock"
                  size={20}
                  color={colors.textSecondary}
                />
              }
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon
                    name={showPassword ? 'visibility' : 'visibility-off'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              }
              errorMessage={passwordError}
              inputContainerStyle={[
                styles.inputContainer,
                passwordError ? styles.inputError : null,
              ]}
              inputStyle={styles.input}
            />

            {/* Confirm Password (Registration only) */}
            {!isLoginMode && (
              <Input
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (confirmPasswordError) validateConfirmPassword(text);
                }}
                onBlur={() => validateConfirmPassword(confirmPassword)}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
                leftIcon={
                  <Icon
                    name="lock"
                    size={20}
                    color={colors.textSecondary}
                  />
                }
                errorMessage={confirmPasswordError}
                inputContainerStyle={[
                  styles.inputContainer,
                  confirmPasswordError ? styles.inputError : null,
                ]}
                inputStyle={styles.input}
              />
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

            {/* Biometric Login (Login mode only) */}
            {isLoginMode && biometricAvailable && email && (
              <TouchableOpacity
                style={styles.biometricButton}
                onPress={handleBiometricLogin}
              >
                <Icon
                  name={biometricType === 'Face ID' ? 'face' : 'fingerprint'}
                  size={24}
                  color={colors.primary}
                />
                <Text style={styles.biometricText}>
                  Sign in with {biometricType}
                </Text>
              </TouchableOpacity>
            )}

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Submit Button */}
            <Button
              title={isLoading ? (isLoginMode ? 'Signing in...' : 'Creating account...') : (isLoginMode ? 'Sign In' : 'Create Account')}
              onPress={handleSubmit}
              disabled={isLoading}
              loading={isLoading}
              buttonStyle={[
                styles.submitButton,
                isLoading && styles.submitButtonDisabled
              ]}
              titleStyle={styles.submitButtonText}
            />

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
                style={[styles.socialButton, styles.googleButton]}
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
              <Text style={styles.linkText}>Terms of Service</Text>
              {' and '}
              <Text style={styles.linkText}>Privacy Policy</Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  headerContainer: {
    alignItems: 'center',
    marginTop: spacing.xxxl,
    marginBottom: spacing.xxl,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    borderBottomColor: colors.border,
  },
  inputError: {
    borderBottomColor: colors.error,
  },
  input: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  forgotContainer: {
    alignSelf: 'flex-end',
    marginTop: -spacing.sm,
    marginBottom: spacing.lg,
  },
  forgotText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
  },
  biometricText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.errorLight,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.error,
    marginLeft: spacing.xs,
    flex: 1,
  },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginBottom: spacing.lg,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  switchText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  switchLink: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
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
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    paddingHorizontal: spacing.md,
    fontWeight: typography.fontWeight.medium,
  },
  socialButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  socialButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  googleButton: {
    // Additional styles for Google button if needed
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
  footer: {
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  footerText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  linkText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});