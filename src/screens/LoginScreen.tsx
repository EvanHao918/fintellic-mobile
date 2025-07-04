// src/screens/LoginScreen.tsx
import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppDispatch, RootState } from '../store';
import { login } from '../store/slices/authSlice';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius, commonStyles } = themeConfig;

export default function LoginScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

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
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return false;
    }
    setPasswordError('');
    return true;
  };

  // Handle login
  const handleLogin = async () => {
    const isEmailValid = validateEmail(email);
    const isPasswordValid = validatePassword(password);
    
    if (!isEmailValid || !isPasswordValid) {
      return;
    }

    try {
      await dispatch(login({ username: email, password })).unwrap();
    } catch (err) {
      // Error is handled by Redux
    }
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

    // TODO: Implement password reset API call
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
          {/* Logo and Title */}
          <View style={styles.headerContainer}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>F</Text>
            </View>
            <Text style={styles.title}>Fintellic</Text>
            <Text style={styles.subtitle}>
              AI-Powered Financial Intelligence
            </Text>
          </View>

          {/* Login Form */}
          <View style={styles.formContainer}>
            <Text style={styles.welcomeText}>Welcome back</Text>
            <Text style={styles.instructionText}>
              Sign in to access financial reports
            </Text>

            {/* Email Input */}
            <Input
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (emailError) validateEmail(text);
              }}
              onBlur={() => validateEmail(email)}
              autoCapitalize="none"
              keyboardType="email-address"
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
              returnKeyType="done"
              onSubmitEditing={handleLogin}
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

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={handleForgotPassword}
              style={styles.forgotContainer}
            >
              <Text style={styles.forgotText}>Forgot Password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Icon name="error-outline" size={16} color={colors.error} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title={isLoading ? 'Signing in...' : 'Sign In'}
              onPress={handleLogin}
              disabled={isLoading || !email || !password}
              loading={isLoading}
              buttonStyle={[
                styles.loginButton,
                (!email || !password) && styles.loginButtonDisabled
              ]}
              titleStyle={styles.loginButtonText}
            />

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>
                Don't have an account?{' '}
              </Text>
              <TouchableOpacity
                onPress={() => Alert.alert('Sign Up', 'Registration feature coming soon')}
              >
                <Text style={styles.signUpLink}>Sign Up</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>
              By signing in, you agree to our{' '}
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
    marginBottom: spacing.md,
  },
  logoText: {
    fontSize: 40,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  formContainer: {
    flex: 1,
    marginTop: spacing.lg,
  },
  welcomeText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
  },
  inputContainer: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 0,
  },
  inputError: {
    borderBottomColor: colors.error,
  },
  input: {
    fontSize: typography.fontSize.base,
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
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginLeft: spacing.xxs,
    flex: 1,
  },
  loginButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  loginButtonDisabled: {
    backgroundColor: colors.gray400,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  signUpText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  signUpLink: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    alignItems: 'center',
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  footerText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.fontSize.xs * typography.lineHeight.relaxed,
  },
  linkText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
});