// src/screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import apiClient from '../api/client';
import themeConfig from '../theme';
import { RootStackParamList } from '../types';

const { colors, typography, spacing, borderRadius } = themeConfig;

type ResetPasswordScreenNavigationProp = StackNavigationProp<RootStackParamList, 'ResetPassword'>;
type ResetPasswordScreenRouteProp = RouteProp<RootStackParamList, 'ResetPassword'>;

export default function ResetPasswordScreen() {
  const navigation = useNavigation<ResetPasswordScreenNavigationProp>();
  const route = useRoute<ResetPasswordScreenRouteProp>();
  
  // Mode: 'request' (请求重置) 或 'confirm' (确认重置)
  const [mode, setMode] = useState<'request' | 'confirm'>('request');
  const [token, setToken] = useState('');
  
  // Form state
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Error state
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  
  // 从路由参数获取token（深度链接）
  useEffect(() => {
    if (route.params?.token) {
      setToken(route.params.token);
      setMode('confirm');
    }
  }, [route.params]);
  
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
    if (password.length < 8) {
      setPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setPasswordError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    setPasswordError('');
    return true;
  };
  
  // Confirm password validation
  const validateConfirmPassword = (confirmPassword: string) => {
    if (!confirmPassword) {
      setConfirmPasswordError('Please confirm your password');
      return false;
    }
    if (newPassword !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };
  
  // 请求重置邮件
  const handleRequestReset = async () => {
    if (!validateEmail(email)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await apiClient.post('/auth/password/reset-request', { 
        email: email.toLowerCase().trim() 
      });
      
      Alert.alert(
        'Email Sent',
        'If your email exists in our system, you will receive a password reset link shortly. Please check your inbox and spam folder.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to send reset email';
      Alert.alert('Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // 确认重置密码
  const handleConfirmReset = async () => {
    const validations = [
      validatePassword(newPassword),
      validateConfirmPassword(confirmPassword)
    ];
    
    if (!validations.every(v => v)) {
      return;
    }
    
    setIsLoading(true);
    try {
      await apiClient.post('/auth/password/reset-confirm', {
        token,
        new_password: newPassword
      });
      
      Alert.alert(
        'Password Reset Successful',
        'Your password has been reset successfully! You can now log in with your new password.',
        [
          {
            text: 'OK',
            onPress: () => navigation.navigate('Login')
          }
        ]
      );
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || 'Failed to reset password';
      
      // Handle specific error cases
      if (errorMessage.includes('expired')) {
        Alert.alert(
          'Link Expired',
          'This password reset link has expired. Please request a new one.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Request New Link', 
              onPress: () => {
                setMode('request');
                setToken('');
              }
            }
          ]
        );
      } else if (errorMessage.includes('invalid')) {
        Alert.alert(
          'Invalid Link',
          'This password reset link is invalid. Please request a new one.',
          [
            { text: 'Cancel', style: 'cancel' },
            { 
              text: 'Request New Link', 
              onPress: () => {
                setMode('request');
                setToken('');
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
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
            <View style={styles.iconContainer}>
              <Icon name="lock-reset" size={40} color={colors.primary} />
            </View>
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              {mode === 'request' 
                ? 'Enter your email to receive a password reset link'
                : 'Enter your new password'}
            </Text>
          </View>
          
          {/* Form */}
          <View style={styles.formContainer}>
            {mode === 'request' ? (
              // 请求重置模式
              <>
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
                  returnKeyType="done"
                  onSubmitEditing={handleRequestReset}
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
                
                <Button
                  title={isLoading ? 'Sending...' : 'Send Reset Link'}
                  onPress={handleRequestReset}
                  loading={isLoading}
                  disabled={isLoading}
                  buttonStyle={styles.submitButton}
                  titleStyle={styles.submitButtonText}
                />
                
                <View style={styles.infoContainer}>
                  <Icon name="info-outline" size={16} color={colors.textSecondary} />
                  <Text style={styles.infoText}>
                    We'll send you an email with instructions to reset your password.
                  </Text>
                </View>
              </>
            ) : (
              // 确认重置模式
              <>
                <Input
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (passwordError) validatePassword(text);
                  }}
                  onBlur={() => validatePassword(newPassword)}
                  secureTextEntry={!showPassword}
                  returnKeyType="next"
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
                  onSubmitEditing={handleConfirmReset}
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
                
                <View style={styles.requirementsContainer}>
                  <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                  <View style={styles.requirement}>
                    <Icon 
                      name="check-circle" 
                      size={16} 
                      color={newPassword.length >= 8 ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.requirementText}>At least 8 characters</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Icon 
                      name="check-circle" 
                      size={16} 
                      color={/[A-Z]/.test(newPassword) ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.requirementText}>One uppercase letter</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Icon 
                      name="check-circle" 
                      size={16} 
                      color={/[a-z]/.test(newPassword) ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.requirementText}>One lowercase letter</Text>
                  </View>
                  <View style={styles.requirement}>
                    <Icon 
                      name="check-circle" 
                      size={16} 
                      color={/\d/.test(newPassword) ? colors.success : colors.textSecondary} 
                    />
                    <Text style={styles.requirementText}>One number</Text>
                  </View>
                </View>
                
                <Button
                  title={isLoading ? 'Resetting...' : 'Reset Password'}
                  onPress={handleConfirmReset}
                  loading={isLoading}
                  disabled={isLoading}
                  buttonStyle={styles.submitButton}
                  titleStyle={styles.submitButtonText}
                />
              </>
            )}
            
            {/* Back to Login */}
            <TouchableOpacity 
              onPress={() => navigation.navigate('Login')}
              style={styles.backButton}
              disabled={isLoading}
            >
              <Icon name="arrow-back" size={16} color={colors.primary} />
              <Text style={styles.backText}>Back to Login</Text>
            </TouchableOpacity>
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.xl,
    backgroundColor: colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
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
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.lg,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
    lineHeight: 20,
  },
  requirementsContainer: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  requirementsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  requirement: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
  },
  backText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
});