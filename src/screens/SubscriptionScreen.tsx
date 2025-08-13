import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
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
  fetchEarlyBirdStatus,
  mockUpgradeToPro,
} from '../store/slices/subscriptionSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { subscriptionHelpers } from '../api/subscription';
import { SubscriptionType } from '../types/subscription';
import { isProUser as checkIsProUser, isEarlyBirdUser } from '../types';
import apiClient from '../api/client';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

type PlanType = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const user = useSelector((state: RootState) => state.auth.user);
  const { 
    pricingInfo,
    currentSubscription,
    earlyBirdStatus,
    isLoading: subscriptionLoading,
  } = useSelector((state: RootState) => state.subscription);
  
  // Local state
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // Derived state - 使用辅助函数
  const isProUser = checkIsProUser(user);
  
  // 🔥 关键修复：正确判断早鸟状态
  // 用户是早鸟的条件：
  // 1. user.is_early_bird 为 true
  // 2. user.pricing_tier === 'EARLY_BIRD'
  // 3. user.user_sequence_number <= 10000
  // 4. pricingInfo?.is_early_bird 为 true
  // 5. earlyBirdStatus?.is_available 为 true（还有早鸟名额）
  const isEarlyBird = user?.is_early_bird === true || 
                      user?.pricing_tier === 'EARLY_BIRD' ||
                      (user?.user_sequence_number && user.user_sequence_number <= 10000) ||
                      pricingInfo?.is_early_bird === true;
  
  // 🔥 关键修复：使用正确的价格
  // 早鸟用户：$39/$280.80，标准用户：$49/$352.80
  const monthlyPrice = isEarlyBird ? 39 : 49;
  const yearlyPrice = isEarlyBird ? 280.80 : 352.80;
  const yearlySavings = subscriptionHelpers.calculateYearlySavingsPercentage(monthlyPrice, yearlyPrice);

  // Load subscription data on mount
  useEffect(() => {
    dispatch(fetchEarlyBirdStatus());
    if (user) {
      dispatch(fetchPricingInfo());
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user]);

  // Core Platform Features - All users get these capabilities
  const platformFeatures = [
    {
      icon: 'speed',
      title: 'Real-Time Monitoring Engine',
      description: 'Advanced surveillance system tracking S&P 500 & NASDAQ 100 filings with unmatched capture velocity',
      highlight: 'Under 60 seconds from filing to analysis',
    },
    {
      icon: 'auto-awesome',
      title: 'Institutional-Grade AI',
      description: 'Finance-specialized neural networks trained on millions of reports, delivering objective market intelligence',
      highlight: 'Zero emotional bias, pure data-driven insights',
    },
    {
      icon: 'summarize',
      title: 'Intelligent Compression',
      description: 'Transform 300-page documents into 5-minute structured insights without losing critical information',
      highlight: 'Smart extraction with source document linking',
    },
    {
      icon: 'link',
      title: 'Direct Source Access',
      description: 'Every analysis maintains direct links to original SEC filings for seamless deep-dive verification',
      highlight: 'One-click access to primary documents',
    },
    {
      icon: 'notifications-active',
      title: 'Instant Push Notifications',
      description: 'Real-time alerts for your watchlist companies, delivered faster than traditional news outlets',
      highlight: 'Be first, not last',
    },
    {
      icon: 'calendar-today',
      title: 'Earnings Calendar Intelligence',
      description: 'Track upcoming releases with BMO/AMC timing precision for strategic positioning',
      highlight: 'Never miss a critical filing',
    },
    {
      icon: 'trending-up',
      title: 'Community Sentiment Analysis',
      description: 'Real-time market sentiment tracking from verified investors and professionals',
      highlight: 'Understand market psychology instantly',
    },
    {
      icon: 'bookmark',
      title: 'IPO Discovery System',
      description: 'S-1 filing monitoring to identify emerging opportunities before mainstream coverage',
      highlight: 'Find tomorrow\'s leaders today',
    },
  ];

  const handleUpgrade = async () => {
    if (isProUser) return;

    Alert.alert(
      'Confirm Upgrade',
      `Upgrade to Pro (${selectedPlan === 'monthly' ? 'Monthly' : 'Annual'}) for ${
        selectedPlan === 'monthly' 
          ? subscriptionHelpers.formatPrice(monthlyPrice)
          : subscriptionHelpers.formatPrice(yearlyPrice)
      }?${isEarlyBird ? '\n\n🎉 Your early bird price will be locked forever!' : ''}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Upgrade',
          onPress: async () => {
            setIsUpgrading(true);
            try {
              // 使用 Redux action 进行 mock 升级
              await dispatch(mockUpgradeToPro(selectedPlan));
              
              // 刷新用户信息
              await dispatch(refreshUserInfo());
              
              Alert.alert(
                'Success!',
                `You are now a Pro member! ${isEarlyBird ? '🎉 Early bird price locked in forever!' : ''}`,
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              console.error('Upgrade error:', error);
              Alert.alert('Error', 'Failed to upgrade. Please try again.');
            } finally {
              setIsUpgrading(false);
            }
          },
        },
      ]
    );
  };

  const webStyles = Platform.select({
    web: {
      maxHeight: screenHeight - 100,
      overflowY: 'auto' as any,
    },
    default: {},
  });

  // 格式化到期时间
  const formatExpiryDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" type="material" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isProUser ? 'Manage Subscription' : 'Upgrade to Pro'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView 
        style={[styles.scrollView, webStyles]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.heroIconContainer}>
            <Icon name="flash-on" type="material" size={60} color={colors.primary} />
          </View>
          <Text style={styles.heroTitle}>HermeSpeed Pro</Text>
          <Text style={styles.heroSubtitle}>Where Information Begins</Text>
          <Text style={styles.heroDescription}>
            Professional-grade financial intelligence system delivering institutional insights to individual investors
          </Text>
          
          {/* 🔥 修复：正确显示早鸟状态 */}
          {!isProUser && isEarlyBird && (
            <View style={styles.earlyBirdBadge}>
              <Icon name="local-offer" type="material" size={16} color={colors.warning} />
              <Text style={styles.earlyBirdText}>
                {user?.user_sequence_number 
                  ? `🎉 Early bird #${user.user_sequence_number} - Save $10/month forever!`
                  : `🐦 Early bird pricing: Save $10/month forever!`
                }
              </Text>
            </View>
          )}
          
          {/* 显示剩余早鸟名额（如果不是早鸟用户） */}
          {!isProUser && !isEarlyBird && earlyBirdStatus && earlyBirdStatus.slots_remaining > 0 && (
            <View style={styles.earlyBirdBadge}>
              <Icon name="local-offer" type="material" size={16} color={colors.warning} />
              <Text style={styles.earlyBirdText}>
                {earlyBirdStatus.slots_remaining < 100 
                  ? `🔥 Only ${earlyBirdStatus.slots_remaining} early bird spots left!`
                  : `Early bird pricing available: ${earlyBirdStatus.slots_remaining} spots remaining`
                }
              </Text>
            </View>
          )}
        </View>

        {/* Current Status */}
        {isProUser && currentSubscription ? (
          <View style={styles.currentPlanBanner}>
            <Icon name="star" type="material" size={24} color={colors.warning} />
            <View style={styles.currentPlanText}>
              <Text style={styles.currentPlanTitle}>You're a Pro Member!</Text>
              <Text style={styles.currentPlanSubtitle}>
                {currentSubscription.subscription_type === SubscriptionType.MONTHLY ? 'Monthly' : 'Annual'} plan
                {currentSubscription.expires_at 
                  ? ` • Renews ${formatExpiryDate(currentSubscription.expires_at)}`
                  : ''}
              </Text>
              {isEarlyBird && (
                <Text style={styles.earlyBirdLocked}>
                  🎉 Early bird price locked: ${currentSubscription.current_price}/
                  {currentSubscription.subscription_type === SubscriptionType.MONTHLY ? 'mo' : 'yr'}
                </Text>
              )}
            </View>
          </View>
        ) : null}
        
        {/* 🔥 关键修复：删除错误的计数显示，或者显示正确的信息 */}
        {/* 选项1：完全删除（推荐） */}
        {/* 选项2：如果要保留，显示正确的信息 */}
        {!isProUser && (
          <View style={styles.trialBanner}>
            <Icon name="info" type="material" size={20} color={colors.primary} />
            <Text style={styles.trialText}>
              Free users get 2 reports daily • Upgrade for unlimited access
            </Text>
          </View>
        )}

        {/* Plan Toggle - Only show if not Pro */}
        {!isProUser && (
          <>
            <View style={styles.planToggle}>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'monthly' && styles.planOptionActive,
                ]}
                onPress={() => setSelectedPlan('monthly')}
              >
                <Text
                  style={[
                    styles.planOptionText,
                    selectedPlan === 'monthly' && styles.planOptionTextActive,
                  ]}
                >
                  Monthly
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.planOption,
                  selectedPlan === 'yearly' && styles.planOptionActive,
                ]}
                onPress={() => setSelectedPlan('yearly')}
              >
                <Text
                  style={[
                    styles.planOptionText,
                    selectedPlan === 'yearly' && styles.planOptionTextActive,
                  ]}
                >
                  Annual
                </Text>
                {selectedPlan === 'yearly' && (
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>Save {yearlySavings}%</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Pricing Display - 🔥 现在显示正确的价格 */}
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
              {isEarlyBird && (
                <View style={styles.earlyBirdPriceBadge}>
                  <Icon name="local-offer" type="material" size={14} color={colors.warning} />
                  <Text style={styles.earlyBirdPriceText}>
                    Early bird price - locked forever!
                  </Text>
                </View>
              )}
              {!isEarlyBird && (
                <Text style={styles.standardPriceNote}>
                  Standard pricing
                </Text>
              )}
            </View>

            {/* Payment Options Section */}
            <View style={styles.paymentOptionsSection}>
              <Text style={styles.paymentOptionsTitle}>Choose Payment Method</Text>
              
              {/* Apple Pay Option */}
              {Platform.OS === 'ios' && (
                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Apple Pay integration will be available in Phase 3');
                  }}
                >
                  <View style={styles.paymentOptionContent}>
                    <Icon name="apple" type="font-awesome" size={24} color={colors.text} />
                    <View style={styles.paymentOptionText}>
                      <Text style={styles.paymentOptionTitle}>Apple Pay</Text>
                      <Text style={styles.paymentOptionSubtitle}>Quick and secure</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" type="material" size={24} color={colors.gray400} />
                </TouchableOpacity>
              )}

              {/* Google Pay Option */}
              {Platform.OS === 'android' && (
                <TouchableOpacity 
                  style={styles.paymentOption}
                  onPress={() => {
                    Alert.alert('Coming Soon', 'Google Pay integration will be available in Phase 3');
                  }}
                >
                  <View style={styles.paymentOptionContent}>
                    <Icon name="google" type="font-awesome" size={24} color={colors.text} />
                    <View style={styles.paymentOptionText}>
                      <Text style={styles.paymentOptionTitle}>Google Pay</Text>
                      <Text style={styles.paymentOptionSubtitle}>Fast checkout</Text>
                    </View>
                  </View>
                  <Icon name="chevron-right" type="material" size={24} color={colors.gray400} />
                </TouchableOpacity>
              )}

              {/* Credit Card Option */}
              <TouchableOpacity 
                style={styles.paymentOption}
                onPress={() => {
                  Alert.alert('Coming Soon', 'Credit card payment will be available in Phase 3');
                }}
              >
                <View style={styles.paymentOptionContent}>
                  <Icon name="credit-card" type="material" size={24} color={colors.text} />
                  <View style={styles.paymentOptionText}>
                    <Text style={styles.paymentOptionTitle}>Credit Card</Text>
                    <Text style={styles.paymentOptionSubtitle}>Visa, Mastercard, Amex</Text>
                  </View>
                </View>
                <Icon name="chevron-right" type="material" size={24} color={colors.gray400} />
              </TouchableOpacity>

              {/* Development Mock Option */}
              <TouchableOpacity 
                style={[styles.paymentOption, styles.mockPaymentOption]}
                onPress={handleUpgrade}
              >
                <View style={styles.paymentOptionContent}>
                  <Icon name="code" type="material" size={24} color={colors.primary} />
                  <View style={styles.paymentOptionText}>
                    <Text style={[styles.paymentOptionTitle, { color: colors.primary }]}>
                      Mock Upgrade (Dev Only)
                    </Text>
                    <Text style={styles.paymentOptionSubtitle}>Test subscription without payment</Text>
                  </View>
                </View>
                <Icon name="chevron-right" type="material" size={24} color={colors.primary} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Platform Features Section */}
        <View style={styles.featuresSection}>
          <Text style={styles.featuresTitle}>The HermeSpeed Advantage</Text>
          <Text style={styles.featuresSubtitle}>
            All features. No tiers. Just pure financial intelligence.
          </Text>
          
          {platformFeatures.map((feature, index) => (
            <View key={index} style={styles.featureCard}>
              <View style={styles.featureIconWrapper}>
                <Icon 
                  name={feature.icon} 
                  type="material" 
                  size={28} 
                  color={colors.primary} 
                />
              </View>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDescription}>{feature.description}</Text>
                <View style={styles.featureHighlight}>
                  <Icon name="check-circle" type="material" size={16} color={colors.success} />
                  <Text style={styles.featureHighlightText}>{feature.highlight}</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Simple Access Model */}
        <View style={styles.accessModel}>
          <Text style={styles.accessTitle}>Simple & Transparent</Text>
          <View style={styles.accessRow}>
            <View style={styles.accessItem}>
              <Icon name="lock-open" type="material" size={24} color={colors.success} />
              <Text style={styles.accessLabel}>Free Trial</Text>
              <Text style={styles.accessValue}>2 reports daily</Text>
            </View>
            <View style={styles.accessDivider} />
            <View style={styles.accessItem}>
              <Icon name="all-inclusive" type="material" size={24} color={colors.primary} />
              <Text style={styles.accessLabel}>Pro Access</Text>
              <Text style={styles.accessValue}>Unlimited everything</Text>
            </View>
          </View>
        </View>

        {/* Upgrade CTA - Only show if not Pro */}
        {!isProUser && (
          <View style={styles.upgradeSection}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              disabled={isUpgrading || subscriptionLoading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="rocket-launch" type="material" size={20} color="white" />
                  <Text style={styles.upgradeButtonText}>
                    Start Pro Access - ${selectedPlan === 'monthly' ? monthlyPrice : yearlyPrice.toFixed(2)}
                    {selectedPlan === 'yearly' ? '/year' : '/month'}
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.guaranteeText}>
              7-day money back guarantee • Cancel anytime
            </Text>
            
            {/* Development notice */}
            <Text style={styles.devNotice}>
              ⚠️ Development Mode: This is a mock upgrade for testing
            </Text>
          </View>
        )}

        {/* Manage Subscription - Only show if Pro */}
        {isProUser && currentSubscription && (
          <View style={styles.manageSection}>
            <TouchableOpacity style={styles.manageButton}>
              <Icon name="settings" type="material" size={20} color={colors.primary} />
              <Text style={styles.manageButtonText}>Manage Subscription</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel Subscription</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Trusted by Thousands</Text>
          <View style={styles.trustStats}>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>
                {earlyBirdStatus ? `${10000 - earlyBirdStatus.slots_remaining}+` : '10,000+'}
              </Text>
              <Text style={styles.trustLabel}>Active Users</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>&lt; 60s</Text>
              <Text style={styles.trustLabel}>Filing to Alert</Text>
            </View>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>200+</Text>
              <Text style={styles.trustLabel}>Companies Tracked</Text>
            </View>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing.xxxl }} />
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
  backButton: {
    width: 40,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xxxl,
  },
  heroSection: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.white,
  },
  heroIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.sm,
  },
  heroDescription: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  earlyBirdBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    marginTop: spacing.md,
  },
  earlyBirdText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  currentPlanBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  currentPlanText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  currentPlanTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  currentPlanSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white,
    opacity: 0.9,
  },
  earlyBirdLocked: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginTop: spacing.xxs,
  },
  trialBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    margin: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  trialText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
    fontWeight: typography.fontWeight.medium,
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
  earlyBirdPriceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginTop: spacing.sm,
  },
  earlyBirdPriceText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  standardPriceNote: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  accessModel: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
    ...shadows.sm,
  },
  accessTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  accessRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  accessItem: {
    alignItems: 'center',
    flex: 1,
  },
  accessLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  accessValue: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  accessDivider: {
    width: 1,
    height: 60,
    backgroundColor: colors.border,
    marginHorizontal: spacing.md,
  },
  featuresSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.lg,
  },
  featuresTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  featuresSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  featureIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary + '10',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  featureDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: spacing.xs,
  },
  featureHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureHighlightText: {
    fontSize: typography.fontSize.xs,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  upgradeSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadows.md,
  },
  upgradeButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    marginLeft: spacing.sm,
  },
  guaranteeText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  devNotice: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    textAlign: 'center',
    marginTop: spacing.sm,
    fontStyle: 'italic',
  },
  manageSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
  },
  manageButton: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    marginBottom: spacing.md,
  },
  manageButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textDecorationLine: 'underline',
  },
  trustSection: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
  },
  trustTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  trustStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  trustStat: {
    alignItems: 'center',
  },
  trustNumber: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
    marginBottom: spacing.xxs,
  },
  trustLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  // Payment Options Styles
  paymentOptionsSection: {
    paddingHorizontal: spacing.md,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
  },
  paymentOptionsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
    ...shadows.sm,
  },
  mockPaymentOption: {
    borderWidth: 2,
    borderColor: colors.primary + '30',
    backgroundColor: colors.primary + '05',
  },
  paymentOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  paymentOptionText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  paymentOptionTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  paymentOptionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});