import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store';
import { updateUser } from '../store/slices/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import apiClient from '../api/client';

const { height: screenHeight, width: screenWidth } = Dimensions.get('window');

type PlanType = 'monthly' | 'yearly';

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  const isProUser = user?.tier === 'pro';

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

    setIsLoading(true);
    try {
      const response = await apiClient.post('/users/me/upgrade-mock', {
        plan: selectedPlan,
      });
      
      if (response && response.user) {
        dispatch(updateUser(response.user));
      } else {
        const userResponse = await apiClient.get('/users/me');
        dispatch(updateUser(userResponse));
      }
      
      navigation.goBack();
    } catch (error: any) {
      console.error('Upgrade error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const webStyles = Platform.select({
    web: {
      maxHeight: screenHeight - 100,
      overflowY: 'auto' as any,
    },
    default: {},
  });

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
        <Text style={styles.headerTitle}>Upgrade to Pro</Text>
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
        </View>

        {/* Current Status */}
        {isProUser ? (
          <View style={styles.currentPlanBanner}>
            <Icon name="star" type="material" size={24} color={colors.warning} />
            <View style={styles.currentPlanText}>
              <Text style={styles.currentPlanTitle}>You're a Pro Member!</Text>
              <Text style={styles.currentPlanSubtitle}>
                Unlimited access until {user?.subscription_expires_at 
                  ? new Date(user.subscription_expires_at).toLocaleDateString()
                  : 'subscription renews'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.trialBanner}>
            <Icon name="info" type="material" size={20} color={colors.primary} />
            <Text style={styles.trialText}>
              {user?.daily_view_count || 0} of 2 daily reports used
            </Text>
          </View>
        )}

        {/* Plan Toggle */}
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
                <Text style={styles.saveBadgeText}>Save 17%</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Pricing Display */}
        <View style={styles.pricingContainer}>
          <Text style={styles.priceAmount}>
            ${selectedPlan === 'monthly' ? '39' : '399'}
          </Text>
          <Text style={styles.pricePeriod}>
            {selectedPlan === 'monthly' ? 'per month' : 'per year'}
          </Text>
          {selectedPlan === 'yearly' && (
            <Text style={styles.monthlyEquivalent}>
              Only $33.25/month
            </Text>
          )}
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

        {/* Upgrade CTA */}
        {!isProUser && (
          <View style={styles.upgradeSection}>
            <TouchableOpacity
              style={styles.upgradeButton}
              onPress={handleUpgrade}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Icon name="rocket-launch" type="material" size={20} color="white" />
                  <Text style={styles.upgradeButtonText}>
                    Start Pro Access
                  </Text>
                </>
              )}
            </TouchableOpacity>
            
            <Text style={styles.guaranteeText}>
              7-day money back guarantee • Cancel anytime
            </Text>
          </View>
        )}

        {/* Trust Indicators */}
        <View style={styles.trustSection}>
          <Text style={styles.trustTitle}>Trusted by Thousands</Text>
          <View style={styles.trustStats}>
            <View style={styles.trustStat}>
              <Text style={styles.trustNumber}>10,000+</Text>
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
});