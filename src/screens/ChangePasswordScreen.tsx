import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiClient from '../api/client';
import { ChangePasswordRequest, ChangePasswordResponse } from '../types';

type ChangePasswordScreenNavigationProp = StackNavigationProp<any, 'ChangePassword'>;

export default function ChangePasswordScreen() {
  const navigation = useNavigation<ChangePasswordScreenNavigationProp>();
  
  // Form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Validation state
  const [currentPasswordError, setCurrentPasswordError] = useState('');
  const [newPasswordError, setNewPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');

  // Validation functions
  const validateCurrentPassword = (password: string) => {
    if (!password.trim()) {
      setCurrentPasswordError('Current password is required');
      return false;
    }
    setCurrentPasswordError('');
    return true;
  };

  const validateNewPassword = (password: string) => {
    if (!password) {
      setNewPasswordError('New password is required');
      return false;
    }
    if (password.length < 8) {
      setNewPasswordError('Password must be at least 8 characters');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      setNewPasswordError('Password must contain uppercase, lowercase, and number');
      return false;
    }
    if (password === currentPassword) {
      setNewPasswordError('New password must be different from current password');
      return false;
    }
    setNewPasswordError('');
    return true;
  };

  const validateConfirmPassword = (confirmPass: string) => {
    if (!confirmPass) {
      setConfirmPasswordError('Please confirm your new password');
      return false;
    }
    if (confirmPass !== newPassword) {
      setConfirmPasswordError('Passwords do not match');
      return false;
    }
    setConfirmPasswordError('');
    return true;
  };

  // Get password strength indicator
  const getPasswordStrength = (password: string) => {
    if (!password) return { level: 0, text: '' };
    
    let score = 0;
    if (password.length >= 8) score++;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z\d]/.test(password)) score++;
    
    if (score < 2) return { level: 1, text: 'Weak', color: colors.error };
    if (score < 4) return { level: 2, text: 'Fair', color: colors.warning };
    return { level: 3, text: 'Strong', color: colors.success };
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate all fields
    const validations = [
      validateCurrentPassword(currentPassword),
      validateNewPassword(newPassword),
      validateConfirmPassword(confirmPassword),
    ];
    
    if (!validations.every(v => v)) {
      return;
    }

    try {
      setLoading(true);
      
      const requestData: ChangePasswordRequest = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      const response = await apiClient.put<ChangePasswordResponse>(
        '/users/me/password',
        requestData
      );

      // Success
      Alert.alert(
        'Password Changed',
        'Your password has been updated successfully.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );

    } catch (error: any) {
      console.error('Password change error:', error);
      
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.response?.status === 400) {
        errorMessage = error.response.data?.detail || 'Current password is incorrect';
      } else if (error.response?.status === 422) {
        errorMessage = 'Password format is invalid';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Check if form is valid
  const isFormValid = () => {
    return (
      currentPassword.trim() &&
      newPassword &&
      confirmPassword &&
      !currentPasswordError &&
      !newPasswordError &&
      !confirmPasswordError &&
      newPassword === confirmPassword
    );
  };

  const passwordStrength = getPasswordStrength(newPassword);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoid}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Icon name="arrow-back" type="material" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Change Password</Text>
            <View style={styles.backButton} />
          </View>

          {/* Content */}
          <View style={styles.content}>
            {/* Instructions */}
            <View style={styles.instructions}>
              <Text style={styles.instructionText}>
                Enter your current password and choose a new secure password.
              </Text>
              <Text style={styles.requirementText}>
                Password must be at least 8 characters with uppercase, lowercase, and numbers.
              </Text>
            </View>

            {/* Current Password */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Current Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, currentPasswordError && styles.inputError]}
                  value={currentPassword}
                  onChangeText={(text) => {
                    setCurrentPassword(text);
                    if (currentPasswordError) validateCurrentPassword(text);
                  }}
                  onBlur={() => validateCurrentPassword(currentPassword)}
                  placeholder="Enter current password"
                  secureTextEntry={!showCurrentPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowCurrentPassword(!showCurrentPassword)}
                >
                  <Icon
                    name={showCurrentPassword ? 'visibility-off' : 'visibility'}
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {currentPasswordError ? (
                <Text style={styles.errorText}>{currentPasswordError}</Text>
              ) : null}
            </View>

            {/* New Password */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, newPasswordError && styles.inputError]}
                  value={newPassword}
                  onChangeText={(text) => {
                    setNewPassword(text);
                    if (newPasswordError) validateNewPassword(text);
                    if (confirmPassword) validateConfirmPassword(confirmPassword);
                  }}
                  onBlur={() => validateNewPassword(newPassword)}
                  placeholder="Enter new password"
                  secureTextEntry={!showNewPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Icon
                    name={showNewPassword ? 'visibility-off' : 'visibility'}
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              
              {/* Password Strength Indicator */}
              {newPassword && !newPasswordError && (
                <View style={styles.strengthContainer}>
                  <View style={styles.strengthBar}>
                    <View
                      style={[
                        styles.strengthFill,
                        {
                          width: `${(passwordStrength.level / 3) * 100}%`,
                          backgroundColor: passwordStrength.color,
                        },
                      ]}
                    />
                  </View>
                  <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                    {passwordStrength.text}
                  </Text>
                </View>
              )}
              
              {newPasswordError ? (
                <Text style={styles.errorText}>{newPasswordError}</Text>
              ) : null}
            </View>

            {/* Confirm Password */}
            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Confirm New Password</Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, confirmPasswordError && styles.inputError]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) validateConfirmPassword(text);
                  }}
                  onBlur={() => validateConfirmPassword(confirmPassword)}
                  placeholder="Confirm new password"
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Icon
                    name={showConfirmPassword ? 'visibility-off' : 'visibility'}
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitButton,
                (!isFormValid() || loading) && styles.submitButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color={colors.white} size="small" />
              ) : (
                <Text style={styles.submitButtonText}>Change Password</Text>
              )}
            </TouchableOpacity>

            {/* Security Note */}
            <View style={styles.securityNote}>
              <Icon name="info" type="material" size={16} color={colors.textSecondary} />
              <Text style={styles.securityNoteText}>
                You may need to sign in again on other devices after changing your password.
              </Text>
            </View>
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
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xl,
  },
  instructions: {
    marginBottom: spacing.xxl,
  },
  instructionText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.sm,
  },
  requirementText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  inputSection: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
  },
  textInput: {
    flex: 1,
    height: 48,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: spacing.sm,
  },
  inputError: {
    borderColor: colors.error,
  },
  eyeButton: {
    padding: spacing.xs,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: spacing.xs,
  },
  strengthContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  strengthBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.gray200,
    borderRadius: 2,
    marginRight: spacing.sm,
  },
  strengthFill: {
    height: '100%',
    borderRadius: 2,
  },
  strengthText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
  submitButtonDisabled: {
    backgroundColor: colors.gray300,
  },
  submitButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.primaryLight + '20',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xl,
  },
  securityNoteText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginLeft: spacing.sm,
  },
});