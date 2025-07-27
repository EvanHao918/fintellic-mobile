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
  ActivityIndicator,
} from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Google from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import * as LocalAuthentication from 'expo-local-authentication';
import { AppDispatch, RootState } from '../store';
import { login, register } from '../store/slices/authSlice';
import themeConfig from '../theme';
import { STORAGE_KEYS } from '../utils/constants';

const { colors, typography, spacing, borderRadius, commonStyles } = themeConfig;

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
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
  
  // Social auth state
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const [socialLoading, setSocialLoading] = useState(false);
  
  // Google Auth - 替换为你自己的 Client IDs
  const [request, response, promptAsync] = Google.useAuthRequest({
    clientId: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    iosClientId: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
  });
  
  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Animation
  const fadeAnim = useState(new Animated.Value(1))[0];

  // Check for biometric and Apple auth availability
  useEffect(() => {
    checkBiometricAvailability();
    checkAppleAuthAvailability();
    checkForSavedCredentials();
  }, []);

  // Handle Google response
  useEffect(() => {
    if (response?.type === 'success') {
      handleGoogleSignIn(response.authentication);
    }
  }, [response]);

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

  const checkAppleAuthAvailability = async () => {
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    setAppleAuthAvailable(isAvailable);
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
          'Your account has been created. Welcome to Fintellic!',
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

  // Handle Apple Sign In
  const handleAppleSignIn = async () => {
    try {
      setSocialLoading(true);
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      // TODO: Send credential to your backend
      console.log('Apple Sign In Success:', credential);
      
      // For now, show a message
      Alert.alert(
        'Apple Sign In',
        'Apple Sign In will be fully implemented soon!',
        [{ text: 'OK' }]
      );

    } catch (e: any) {
      setSocialLoading(false);
      if (e.code !== 'ERR_CANCELED') {
        Alert.alert('Apple Sign In Failed', e.message);
      }
    } finally {
      setSocialLoading(false);
    }
  };

  // Handle Google Sign In
  const handleGoogleSignIn = async (authentication: any) => {
    try {
      setSocialLoading(true);
      
      // TODO: Send authentication token to your backend
      console.log('Google Sign In Success:', authentication);
      
      // For now, show a message
      Alert.alert(
        'Google Sign In',
        'Google Sign In will be fully implemented soon!',
        [{ text: 'OK' }]
      );

    } catch (error) {
      Alert.alert('Google Sign In Failed', 'Unable to sign in with Google');
    } finally {
      setSocialLoading(false);
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
      return;
    }
    
    if (!validateEmail(email)) {
      return;
    }

    Alert.alert(
      'Password Reset',
      `Instructions have been sent to ${email}`,
      [{ text: 'OK' }]
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
              <Icon name="analytics" size={40} color={colors.white} />
            </View>
            <Text style={styles.title}>Fintellic</Text>
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
              disabled={isLoading || socialLoading}
              loading={isLoading}
              buttonStyle={[
                styles.submitButton,
                (isLoading || socialLoading) && styles.submitButtonDisabled
              ]}
              titleStyle={styles.submitButtonText}
            />

            {/* Divider */}
            {isLoginMode && (
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>OR</Text>
                <View style={styles.divider} />
              </View>
            )}

            {/* Social Login Buttons (Login mode only) */}
            {isLoginMode && (
              <View style={styles.socialContainer}>
                {/* Apple Sign In */}
                {Platform.OS === 'ios' && appleAuthAvailable && (
                  <TouchableOpacity
                    style={[styles.socialButton, styles.appleButton]}
                    onPress={handleAppleSignIn}
                    disabled={isLoading || socialLoading}
                  >
                    <Text style={styles.appleIcon}>🍎</Text>
                    <Text style={[styles.socialButtonText, styles.appleButtonText]}>
                      Continue with Apple
                    </Text>
                    {socialLoading && (
                      <ActivityIndicator 
                        size="small" 
                        color={colors.white} 
                        style={styles.socialLoader}
                      />
                    )}
                  </TouchableOpacity>
                )}

                {/* Google Sign In */}
                <TouchableOpacity
                  style={[styles.socialButton, styles.googleButton]}
                  onPress={() => promptAsync()}
                  disabled={!request || isLoading || socialLoading}
                >
                  <View style={styles.googleIconContainer}>
                    <Text style={styles.googleIcon}>G</Text>
                  </View>
                  <Text style={styles.socialButtonText}>
                    Continue with Google
                  </Text>
                  {socialLoading && (
                    <ActivityIndicator 
                      size="small" 
                      color={colors.primary} 
                      style={styles.socialLoader}
                    />
                  )}
                </TouchableOpacity>
              </View>
            )}

            {/* Switch Mode Link */}
            <View style={styles.switchContainer}>
              <Text style={styles.switchText}>
                {isLoginMode ? "Don't have an account?" : 'Already have an account?'}
                {' '}
              </Text>
              <TouchableOpacity onPress={switchMode} disabled={isLoading || socialLoading}>
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
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  socialContainer: {
    marginBottom: spacing.xl,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    position: 'relative',
  },
  appleButton: {
    backgroundColor: colors.black,
    borderColor: colors.black,
  },
  googleButton: {
    backgroundColor: colors.white,
    borderColor: colors.border,
  },
  socialIcon: {
    marginRight: spacing.sm,
  },
  appleIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  googleIconContainer: {
    width: 20,
    height: 20,
    marginRight: spacing.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  googleIcon: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4285F4',
  },
  socialButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  appleButtonText: {
    color: colors.white,
  },
  socialLoader: {
    position: 'absolute',
    right: spacing.md,
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