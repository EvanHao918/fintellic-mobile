import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';

type RootStackParamList = {
  Subscription: undefined;
  Home: undefined;
};

type NavigationProp = StackNavigationProp<RootStackParamList>;

interface UpgradePromptModalProps {
  visible: boolean;
  onClose: () => void;
  viewsToday?: number;
  dailyLimit?: number;
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export default function UpgradePromptModal({
  visible,
  onClose,
  viewsToday = 2,
  dailyLimit = 2,
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
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* 关闭按钮 */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={28} color={colors.text} />
          </TouchableOpacity>

          <ScrollView 
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Header Section - Emphasize Speed Advantage */}
            <View style={styles.headerSection}>
              <View style={styles.iconContainer}>
                <Icon name="flash-on" size={50} color={colors.primary} />
              </View>
              <Text style={styles.title}>Daily Limit Reached</Text>
              <Text style={styles.subtitle}>
                You've accessed {viewsToday} of {dailyLimit} reports today
              </Text>
            </View>

            {/* Core Value Proposition - Unified Features */}
            <View style={styles.valueSection}>
              <Text style={styles.sectionTitle}>Why HermeSpeed</Text>
              
              <View style={styles.valueItem}>
                <View style={styles.valueIconWrapper}>
                  <Icon name="speed" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Real-Time Intelligence System</Text>
                  <Text style={styles.valueDescription}>
                    Advanced monitoring of S&P 500 & NASDAQ 100 filings with industry-leading capture velocity
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIconWrapper}>
                  <Icon name="psychology" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Professional AI Analysis</Text>
                  <Text style={styles.valueDescription}>
                    Finance-trained neural networks deliver objective, institutional-grade insights
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIconWrapper}>
                  <Icon name="analytics" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>300 Pages in 5 Minutes</Text>
                  <Text style={styles.valueDescription}>
                    Intelligent extraction with direct source document links for deep-dive analysis
                  </Text>
                </View>
              </View>

              <View style={styles.valueItem}>
                <View style={styles.valueIconWrapper}>
                  <Icon name="notifications-active" size={24} color={colors.primary} />
                </View>
                <View style={styles.valueContent}>
                  <Text style={styles.valueTitle}>Instant Push Alerts</Text>
                  <Text style={styles.valueDescription}>
                    Real-time notifications for your watchlist companies, never miss a filing
                  </Text>
                </View>
              </View>
            </View>

            {/* Simple Access Explanation */}
            <View style={styles.limitSection}>
              <Text style={styles.limitTitle}>Access Plans</Text>
              <View style={styles.planComparison}>
                <View style={styles.planItem}>
                  <Text style={styles.planLabel}>Free Trial</Text>
                  <Text style={styles.planValue}>2 Daily</Text>
                </View>
                <View style={styles.divider} />
                <View style={styles.planItem}>
                  <Text style={styles.planLabel}>Pro Access</Text>
                  <Text style={styles.planValuePro}>Unlimited</Text>
                </View>
              </View>
            </View>

            {/* Pricing Section */}
            <View style={styles.priceSection}>
              <Text style={styles.priceLabel}>LIMITED TIME OFFER</Text>
              <View style={styles.priceRow}>
                <Text style={styles.currentPrice}>$19.99</Text>
                <Text style={styles.priceUnit}>/month</Text>
              </View>
            </View>

            {/* Action Buttons */}
            <TouchableOpacity style={styles.upgradeButton} onPress={handleUpgrade}>
              <Icon name="rocket-launch" size={20} color={colors.white} />
              <Text style={styles.upgradeButtonText}>Upgrade to Pro</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.laterButton} onPress={onClose}>
              <Text style={styles.laterButtonText}>Maybe Later</Text>
            </TouchableOpacity>

            {/* Footer Note */}
            <Text style={styles.footerNote}>
              Limit resets daily at midnight EST
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  modalContent: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,
    width: '100%',
    maxWidth: 420,
    maxHeight: screenHeight * 0.85,
    ...shadows.lg,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.xl + 20,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    padding: spacing.xs,
    zIndex: 10,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerSection: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  valueSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  valueItem: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  valueIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  valueContent: {
    flex: 1,
  },
  valueTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  valueDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  limitSection: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  limitTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  planComparison: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  planItem: {
    alignItems: 'center',
    flex: 1,
  },
  planLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xxs,
  },
  planValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  planValuePro: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  divider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  priceSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  priceLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xs,
  },
  currentPrice: {
    fontSize: 36,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  priceUnit: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: spacing.xs,
  },
  priceNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },
  laterButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  laterButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.md,
  },
  footerNote: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary + '80',
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});