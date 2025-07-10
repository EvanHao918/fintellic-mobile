import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
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

const { height: screenHeight } = Dimensions.get('window');

type PlanType = 'monthly' | 'yearly';

interface PlanFeature {
  text: string;
  included: boolean;
}

export default function SubscriptionScreen() {
  const navigation = useNavigation();
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const [selectedPlan, setSelectedPlan] = useState<PlanType>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  
  const isProUser = user?.is_pro || user?.tier === 'pro';

  // Plan features comparison
  const freeFeatures: PlanFeature[] = [
    { text: '3 reports per day', included: true },
    { text: 'Basic AI summaries', included: true },
    { text: 'View S&P 500 filings', included: true },
    { text: 'Community sentiment', included: true },
    { text: 'Unlimited report access', included: false },
    { text: 'Advanced analytics', included: false },
    { text: 'Priority notifications', included: false },
    { text: 'Export to PDF', included: false },
    { text: 'Ad-free experience', included: false },
    { text: 'Pro community access', included: false },
  ];

  const proFeatures: PlanFeature[] = [
    { text: 'Unlimited report access', included: true },
    { text: 'Advanced AI analytics', included: true },
    { text: 'Real-time notifications', included: true },
    { text: 'Export reports to PDF', included: true },
    { text: 'Ad-free experience', included: true },
    { text: 'Pro community access', included: true },
    { text: 'Priority support', included: true },
    { text: 'Early access to features', included: true },
    { text: 'Custom watchlist (unlimited)', included: true },
    { text: 'Historical data access', included: true },
  ];

  // Handle upgrade
  const handleUpgrade = async () => {
    if (isProUser) {
      Alert.alert('Already Pro', 'You already have an active Pro subscription!');
      return;
    }

    Alert.alert(
      'Confirm Upgrade',
      `Upgrade to Fintellic Pro (${selectedPlan === 'monthly' ? '$39.9/month' : '$399/year'})?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Upgrade',
          onPress: async () => {
            setIsLoading(true);
            try {
              // Mock upgrade API call
              const response = await apiClient.post('/users/me/upgrade-mock', {
                plan: selectedPlan,
              });
              
              // Update user state
              dispatch(updateUser(response.data.user));
              
              Alert.alert(
                'Success!',
                'Welcome to Fintellic Pro! Enjoy unlimited access to all features.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.response?.data?.detail || 'Failed to upgrade. Please try again.'
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Render feature item
  const renderFeature = (feature: PlanFeature, index: number) => (
    <View key={index} style={styles.featureItem}>
      <Icon
        name={feature.included ? 'check-circle' : 'cancel'}
        type="material"
        size={20}
        color={feature.included ? colors.success : colors.gray400}
      />
      <Text
        style={[
          styles.featureText,
          !feature.included && styles.featureTextDisabled,
        ]}
      >
        {feature.text}
      </Text>
    </View>
  );

  // Expo Web specific styles
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
        <Text style={styles.headerTitle}>Subscription Plans</Text>
        <View style={styles.backButton} />
      </View>

      {/* Scrollable Content */}
      <ScrollView 
        style={[styles.scrollView, webStyles]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        {/* Current Status */}
        {isProUser ? (
          <View style={styles.currentPlanBanner}>
            <Icon name="star" type="material" size={24} color={colors.warning} />
            <View style={styles.currentPlanText}>
              <Text style={styles.currentPlanTitle}>You're a Pro Member!</Text>
              <Text style={styles.currentPlanSubtitle}>
                Expires: {user?.subscription_expires_at 
                  ? new Date(user.subscription_expires_at).toLocaleDateString()
                  : 'Never'}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.limitWarning}>
            <Icon name="info" type="material" size={20} color={colors.primary} />
            <Text style={styles.limitText}>
              You've used {user?.daily_reports_count || 0} of 3 daily reports
            </Text>
          </View>
        )}

        {/* Plan Selection */}
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
              Yearly
            </Text>
            {selectedPlan === 'yearly' && (
              <View style={styles.saveBadge}>
                <Text style={styles.saveBadgeText}>Save 17%</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Pricing */}
        <View style={styles.pricingContainer}>
          <Text style={styles.priceAmount}>
            ${selectedPlan === 'monthly' ? '39.9' : '399'}
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

        {/* Features Comparison */}
        <View style={styles.featuresContainer}>
          {/* Free Plan */}
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Free</Text>
              <Text style={styles.planPrice}>$0</Text>
            </View>
            <View style={styles.featuresList}>
              {freeFeatures.map((feature, index) => renderFeature(feature, index))}
            </View>
          </View>

          {/* Pro Plan */}
          <View style={[styles.planCard, styles.planCardPro]}>
            <View style={styles.proBadge}>
              <Text style={styles.proBadgeText}>RECOMMENDED</Text>
            </View>
            <View style={styles.planHeader}>
              <Text style={styles.planName}>Pro</Text>
              <Text style={styles.planPrice}>
                ${selectedPlan === 'monthly' ? '39.9/mo' : '399/yr'}
              </Text>
            </View>
            <View style={styles.featuresList}>
              {proFeatures.map((feature, index) => renderFeature(feature, index))}
            </View>
          </View>
        </View>

        {/* Upgrade Button */}
        {!isProUser && (
          <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <>
                <Text style={styles.upgradeButtonText}>
                  Upgrade to Pro
                </Text>
                <Icon
                  name="arrow-forward"
                  type="material"
                  size={20}
                  color="white"
                  style={{ marginLeft: spacing.xs }}
                />
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Cancel Anytime */}
        <Text style={styles.cancelText}>
          Cancel anytime. No questions asked.
        </Text>

        {/* Testimonials */}
        <View style={styles.testimonialsContainer}>
          <Text style={styles.testimonialsTitle}>What Pro Users Say</Text>
          
          <View style={styles.testimonial}>
            <View style={styles.testimonialHeader}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    type="material"
                    size={16}
                    color={colors.warning}
                  />
                ))}
              </View>
              <Text style={styles.testimonialAuthor}>Sarah K.</Text>
            </View>
            <Text style={styles.testimonialText}>
              "The unlimited access is game-changing. I can research any company without worrying about limits."
            </Text>
          </View>

          <View style={styles.testimonial}>
            <View style={styles.testimonialHeader}>
              <View style={styles.stars}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Icon
                    key={star}
                    name="star"
                    type="material"
                    size={16}
                    color={colors.warning}
                  />
                ))}
              </View>
              <Text style={styles.testimonialAuthor}>Michael R.</Text>
            </View>
            <Text style={styles.testimonialText}>
              "The real-time notifications help me stay ahead of the market. Worth every penny!"
            </Text>
          </View>
        </View>

        {/* FAQ */}
        <View style={styles.faqContainer}>
          <Text style={styles.faqTitle}>Frequently Asked Questions</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Can I cancel anytime?</Text>
            <Text style={styles.faqAnswer}>
              Yes! You can cancel your subscription anytime from your profile settings.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>What happens to my data if I cancel?</Text>
            <Text style={styles.faqAnswer}>
              Your data remains accessible. You'll revert to the free plan with its limitations.
            </Text>
          </View>

          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Do you offer refunds?</Text>
            <Text style={styles.faqAnswer}>
              We offer a 7-day money-back guarantee if you're not satisfied.
            </Text>
          </View>
        </View>

        {/* Bottom padding */}
        <View style={{ height: spacing.xxxl * 2 }} />
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
    flexGrow: 1,
    paddingBottom: 50,
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
    opacity: 0.8,
  },
  limitWarning: {
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
  limitText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
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
  featuresContainer: {
    paddingHorizontal: spacing.md,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  planCardPro: {
    borderColor: colors.primary,
    borderWidth: 2,
    position: 'relative',
    marginTop: spacing.md,
  },
  proBadge: {
    position: 'absolute',
    top: -12,
    alignSelf: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  planHeader: {
    alignItems: 'center',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  planName: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  planPrice: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  featuresList: {
    gap: spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.xs,
    flex: 1,
  },
  featureTextDisabled: {
    color: colors.gray400,
    textDecorationLine: 'line-through',
  },
  upgradeButton: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
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
  },
  cancelText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  testimonialsContainer: {
    marginTop: spacing.xxl,
    paddingHorizontal: spacing.md,
  },
  testimonialsTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  testimonial: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
    ...shadows.sm,
  },
  testimonialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  stars: {
    flexDirection: 'row',
  },
  testimonialAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
  testimonialText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
  },
  faqContainer: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  faqTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  faqItem: {
    marginBottom: spacing.md,
  },
  faqQuestion: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  faqAnswer: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});