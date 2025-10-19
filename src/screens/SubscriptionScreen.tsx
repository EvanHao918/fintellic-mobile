import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store';
import { refreshUserInfo } from '../store/slices/authSlice';
import { 
  fetchPricingInfo,
  fetchCurrentSubscription,
  cancelSubscription,
} from '../store/slices/subscriptionSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { SubscriptionType } from '../types/subscription';
import { iapService } from '../services/IAPService';

type PlanType = 'monthly' | 'yearly';

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = window.confirm(`${title}\n\n${message}`);
      const confirmButton = buttons.find(b => b.text !== 'Cancel');
      const cancelButton = buttons.find(b => b.text === 'Cancel');
      
      if (result && confirmButton?.onPress) {
        confirmButton.onPress();
      } else if (!result && cancelButton?.onPress) {
        cancelButton.onPress();
      }
    } else {
      window.alert(`${title}\n\n${message}`);
    }
  } else {
    Alert.alert(title, message, buttons);
  }
};

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  const user = useSelector((state: RootState) => state.auth.user);
  const { 
    pricingInfo,
    currentSubscription,
    isLoading,
  } = useSelector((state: RootState) => state.subscription);
  
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  
  const isProUser = user?.tier === 'PRO' || currentSubscription?.is_active;
  const isDiscountedUser = pricingInfo?.is_early_bird || false;
  const monthlyPrice = pricingInfo?.monthly_price || 49;
  const yearlyPrice = pricingInfo?.yearly_price || 352.80;
  const yearlySavings = pricingInfo?.yearly_savings_percentage || 40;

  useEffect(() => {
    if (user) {
      dispatch(fetchPricingInfo());
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user]);

  // 真实购买处理
  const handleUpgrade = async () => {
    if (isProUser) {
      showAlert('Already Pro', 'You already have an active Pro subscription.');
      return;
    }

    if (isUpgrading) return;

    const confirmUpgrade = async () => {
      setIsUpgrading(true);
      
      try {
        // 初始化IAP服务
        const initialized = await iapService.initialize();
        if (!initialized) {
          throw new Error('Unable to connect to store. Please try again.');
        }
        
        // 发起真实购买
        const subscriptionType = selectedPlan === 'monthly' ? SubscriptionType.MONTHLY : SubscriptionType.YEARLY;
        const success = await iapService.purchaseSubscription(subscriptionType, user?.id?.toString() || '');
        
        if (success) {
          // 购买成功后刷新用户信息
          await dispatch(refreshUserInfo()).unwrap();
          await dispatch(fetchCurrentSubscription()).unwrap();
          
          showAlert('Welcome to Pro!', 'Your subscription is now active. Enjoy unlimited access!', [
            {
              text: 'Get Started',
              onPress: () => navigation.goBack(),
            },
          ]);
        }
      } catch (error: any) {
        console.error('Real purchase error:', error);
        showAlert('Purchase Failed', error?.message || 'Unable to complete purchase. Please try again.');
      } finally {
        setIsUpgrading(false);
      }
    };

    showAlert(
      'Confirm Purchase',
      `Purchase ${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'} Pro for ${
        selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice.toFixed(2)
      }?\n\nThis will be charged to your ${Platform.OS === 'ios' ? 'Apple ID' : 'Google Play'} account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Purchase', onPress: confirmUpgrade },
      ]
    );
  };

  const handleCancel = async () => {
    if (!isProUser) return;
    if (isCancelling) return;

    const confirmCancel = async () => {
      setIsCancelling(true);
      
      try {
        await dispatch(cancelSubscription({ 
          reason: 'User requested cancellation',
          cancel_immediately: false 
        })).unwrap();
        
        await dispatch(refreshUserInfo()).unwrap();
        await dispatch(fetchCurrentSubscription()).unwrap();
        
        showAlert('Subscription Cancelled', 'You will continue to have access until the end of your billing period.');
      } catch (error: any) {
        showAlert('Error', error?.message || 'Failed to cancel subscription.');
      } finally {
        setIsCancelling(false);
      }
    };

    showAlert(
      'Cancel Subscription',
      'Are you sure you want to cancel? You will still have access until the end of your current billing period.',
      [
        { text: 'Keep Subscription', style: 'cancel' },
        { text: 'Cancel Subscription', onPress: confirmCancel }
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" type="material" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isProUser ? 'Manage Subscription' : 'Upgrade to Pro'}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Icon name="flash-on" type="material" size={60} color={colors.primary} />
          <Text style={styles.heroTitle}>HermeSpeed Pro</Text>
          <Text style={styles.heroSubtitle}>Professional Financial Intelligence</Text>
          
          {!isProUser && isDiscountedUser && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountText}>Special Offer: ${monthlyPrice}/month locked forever!</Text>
            </View>
          )}
        </View>

        {/* Current Status */}
        {isProUser && (
          <View style={styles.statusBanner}>
            <Icon name="star" type="material" size={24} color={colors.warning} />
            <Text style={styles.statusText}>You're a Pro Member!</Text>
          </View>
        )}

        {/* Plan Selection - Only for non-Pro users */}
        {!isProUser && (
          <>
            <View style={styles.planToggle}>
              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'monthly' && styles.planOptionActive]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text style={[styles.planOptionText, selectedPlan === 'monthly' && styles.planOptionTextActive]}>
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.planOption, selectedPlan === 'yearly' && styles.planOptionActive]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <Text style={[styles.planOptionText, selectedPlan === 'yearly' && styles.planOptionTextActive]}>
                  Annual
                </Text>
                {selectedPlan === 'yearly' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Save {yearlySavings}%</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Pricing */}
            <View style={styles.pricingContainer}>
              <Text style={styles.priceAmount}>
                ${selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice.toFixed(2)}
              </Text>
              <Text style={styles.pricePeriod}>
                {selectedPlan === 'monthly' ? 'per month' : 'per year'}
              </Text>
              {selectedPlan === 'yearly' && (
                <Text style={styles.monthlyEquivalent}>
                  Only ${(yearlyPrice / 12).toFixed(2)}/month
                </Text>
              )}
            </View>

            {/* Upgrade Button */}
            <TouchableOpacity
              style={[styles.upgradeButton, isUpgrading && styles.upgradeButtonDisabled]}
              onPress={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text style={styles.upgradeButtonText}>
                  Start Pro Access - ${selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice.toFixed(2)}
                </Text>
              )}
            </TouchableOpacity>
          </>
        )}

        {/* Features */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>Pro Features</Text>
          {[
            'Unlimited daily reports',
            'Real-time filing alerts', 
            'AI-powered analysis',
            'Priority support'
          ].map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <Icon name="check-circle" type="material" size={20} color={colors.success} />
              <Text style={styles.featureText}>{feature}</Text>
            </View>
          ))}
        </View>

        {/* Subscription Management - Only for Pro users */}
        {isProUser && (
          <View style={styles.manageSection}>
            <Text style={styles.manageSectionTitle}>Subscription Details</Text>
            <View style={styles.subscriptionDetails}>
              <Text style={styles.detailText}>
                Plan: {currentSubscription?.subscription_type === SubscriptionType.MONTHLY ? 'Monthly' : 'Annual'} Pro
              </Text>
              <Text style={styles.detailText}>
                Price: ${currentSubscription?.current_price || monthlyPrice}/
                {currentSubscription?.subscription_type === SubscriptionType.MONTHLY ? 'month' : 'year'}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.cancelButton, isCancelling && styles.cancelButtonDisabled]}
              onPress={handleCancel}
              disabled={isCancelling}
            >
              {isCancelling ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
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
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
  },
  heroTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.md,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  discountBadge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  discountText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  statusText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.md,
  },
  planToggle: {
    flexDirection: 'row',
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    padding: spacing.xs,
  },
  planOption: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  planOptionActive: {
    backgroundColor: colors.white,
    ...shadows.sm,
  },
  planOptionText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  planOptionTextActive: {
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
  },
  saveBadge: {
    position: 'absolute',
    top: -8,
    right: 10,
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  saveBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  pricingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  priceAmount: {
    fontSize: 48,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  pricePeriod: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  monthlyEquivalent: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginTop: spacing.xs,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.lg,
    ...shadows.md,
  },
  upgradeButtonDisabled: {
    opacity: 0.6,
  },
  upgradeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  featuresSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  featuresTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  manageSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  manageSectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  subscriptionDetails: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  detailText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  cancelButton: {
    backgroundColor: colors.error,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.sm,
  },
  cancelButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  cancelButtonDisabled: {
    opacity: 0.5,
  },
});