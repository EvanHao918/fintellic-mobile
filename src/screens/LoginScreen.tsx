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
  Animated,
} from 'react-native';
import { Text, Input, Button } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppDispatch, RootState } from '../store';
import { login, register } from '../store/slices/authSlice';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius, commonStyles } = themeConfig;

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
  
  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  
  // Animation
  const fadeAnim = useState(new Animated.Value(1))[0];

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
      // Stricter validation for registration
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

  // Username validation (registration only)
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

  // Switch between login and register
  const switchMode = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start(() => {
      setIsLoginMode(!isLoginMode);
      // Clear errors when switching
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

  // Handle submit
  const handleSubmit = async () => {
    // Validate all fields
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
      } else {
        await dispatch(register({ 
          email: email.toLowerCase().trim(), 
          password, 
          username: username.trim() 
        })).unwrap();
        
        // Show success message
        Alert.alert(
          'Registration Successful',
          'Your account has been created. Welcome to Fintellic!',
          [{ text: 'OK' }]
        );
      }
    } catch (err: any) {
      // Error is handled by Redux, but we can show additional alerts for specific cases
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
              returnKeyType={isLoginMode ? "next" : "next"}
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