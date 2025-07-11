// src/components/UpgradePromptModal.tsx
import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  viewsToday?: number;
  dailyLimit?: number;
}

type NavigationProp = StackNavigationProp<RootStackParamList>;

export default function UpgradePromptModal({
  visible,
  onClose,
  viewsToday = 3,
  dailyLimit = 3,
}: UpgradePromptModalProps) {
  const navigation = useNavigation<NavigationProp>();

  const handleUpgrade = () => {
    onClose();
    navigation.navigate('Subscription');
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <Icon name="lock" size={48} color={colors.primary} />
          </View>

          {/* Title */}
          <Text style={styles.title}>Daily Limit Reached</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>
            You've viewed {viewsToday} of {dailyLimit} free filings today
          </Text>

          {/* Benefits list */}
          <View style={styles.benefitsContainer}>
            <Text style={styles.benefitsTitle}>Upgrade to Pro and get:</Text>
            
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Unlimited filing access</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Post and read comments</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Advanced financial insights</Text>
            </View>
            
            <View style={styles.benefitItem}>
              <Icon name="check-circle" size={20} color={colors.success} />
              <Text style={styles.benefitText}>Priority AI analysis</Text>
            </View>
          </View>

          {/* CTA buttons */}
          <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
            <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            <Icon name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.laterButton} onPress={onClose}>
            <Text style={styles.laterButtonText}>Maybe Later</Text>
          </TouchableOpacity>

          {/* Bottom text */}
          <Text style={styles.resetText}>
            Your free views reset daily at midnight
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  container: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    width: '100%',
    maxWidth: 400,
    alignItems: 'center',
    ...shadows.lg,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  benefitsContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  benefitsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    width: '100%',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
  },
  laterButton: {
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  laterButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  resetText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});