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
  Linking,
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
} from '../store/slices/subscriptionSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { SubscriptionType } from '../types/subscription';
import { iapService } from '../services/IAPService';

const showAlert = (title: string, message: string, buttons?: any[]) => {
  if (Platform.OS === 'web') {
    if (buttons && buttons.length > 1) {
      const result = (globalThis as any).confirm(`${title}\n\n${message}`);
      const confirmButton = buttons.find(b => b.text !== 'Cancel');
      const cancelButton = buttons.find(b => b.text === 'Cancel');
      
      if (result && confirmButton?.onPress) {
        confirmButton.onPress();
      } else if (!result && cancelButton?.onPress) {
        cancelButton.onPress();
      }
    } else {
      (globalThis as any).alert(`${title}\n\n${message}`);
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
  
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const isProUser = user?.tier === 'PRO' || currentSubscription?.is_active;

  // 设置购买成功回调 - 在验证完成后刷新用户信息
  useEffect(() => {
    iapService.setOnPurchaseSuccess(async () => {
      console.log('Purchase success callback - refreshing user info...');
      try {
        await dispatch(refreshUserInfo()).unwrap();
        await dispatch(fetchCurrentSubscription()).unwrap();
        console.log('User info refreshed after purchase');
      } catch (error) {
        console.error('Failed to refresh user info:', error);
      }
    });
  }, [dispatch]);
  const isDiscounted = pricingInfo?.is_discounted || pricingInfo?.is_early_bird || false;
  const currentPrice = isDiscounted ? 19.99 : 29.99;
  const originalPrice = 29.99;

  useEffect(() => {
    if (user) {
      dispatch(fetchPricingInfo());
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user]);

  const handleUpgrade = async () => {
    if (isProUser) {
      showAlert('Already Pro', 'You already have an active Pro subscription.');
      return;
    }

    if (isUpgrading) return;

    const confirmUpgrade = async () => {
      setIsUpgrading(true);
      
      try {
        const initialized = await iapService.initialize();
        if (!initialized) {
          throw new Error('Unable to connect to App Store. Please try again.');
        }
        
        const success = await iapService.purchaseSubscription(
          SubscriptionType.MONTHLY, 
          user?.id?.toString() || ''
        );
        
        if (success) {
          await dispatch(refreshUserInfo()).unwrap();
          await dispatch(fetchCurrentSubscription()).unwrap();
          
          showAlert(
            'Welcome to AllSight Pro!', 
            'Your subscription is now active. Enjoy unlimited access to all SEC filings.', 
            [{ text: 'Get Started', onPress: () => navigation.goBack() }]
          );
        }
      } catch (error: any) {
        console.error('Purchase error:', error);
        showAlert('Purchase Failed', error?.message || 'Unable to complete purchase. Please try again.');
      } finally {
        setIsUpgrading(false);
      }
    };

    showAlert(
      'Confirm Purchase',
      `Subscribe to AllSight Pro for $${currentPrice.toFixed(2)}/month?\n\nThis will be charged to your Apple ID account.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Subscribe', onPress: confirmUpgrade },
      ]
    );
  };

  if (isLoading && !pricingInfo) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-back" type="material" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Upgrade to Pro</Text>
          <View style={styles.headerSpacer} />
        </View>

        {/* Hero Section */}
        <View style={styles.heroSection}>
          <Text style={styles.heroTitle}>Know First. Act Fast.</Text>
          <Text style={styles.heroSubtitle}>
            Get AI-powered SEC analysis in under 2 minutes—before the market reacts.
          </Text>
        </View>

        {/* Impossible Triangle */}
        <View style={styles.triangleSection}>
          <Text style={styles.triangleSectionTitle}>The Impossible Triangle, Solved.</Text>
          
          {/* Triangle Visualization */}
          <View style={styles.triangleContainer}>
            {/* Triangle Lines - Using simple positioned Views */}
            <View style={styles.triangleLineLeft} />
            <View style={styles.triangleLineRight} />
            <View style={styles.triangleLineBottom} />
            
            {/* Top Vertex - Fast */}
            <View style={[styles.vertex, styles.vertexTop]}>
              <Text style={styles.vertexLabel}>Fast</Text>
            </View>
            
            {/* Bottom Left Vertex - Cheap */}
            <View style={[styles.vertex, styles.vertexBottomLeft]}>
              <Text style={styles.vertexLabel}>Cheap</Text>
            </View>
            
            {/* Bottom Right Vertex - Value */}
            <View style={[styles.vertex, styles.vertexBottomRight]}>
              <Text style={styles.vertexLabel}>Value</Text>
            </View>
          </View>
          
          <Text style={styles.triangleDescription}>
            Traditional investing: pick two.{'\n'}
            <Text style={styles.triangleDescriptionBold}>With AllSight AI: get all three.</Text>
          </Text>
        </View>

        {/* AllSight vs Traditional Media Comparison Table */}
        <View style={styles.comparisonTableContainer}>
          <Text style={styles.comparisonTableTitle}>AllSight vs Traditional Media</Text>
          
          <View style={styles.comparisonTable}>
            {/* Header Row */}
            <View style={[styles.tableRow, styles.tableHeaderRow]}>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.dimensionCell]}>Dimension</Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.traditionalCell]}>Traditional Media</Text>
              <Text style={[styles.tableCell, styles.tableHeaderCell, styles.allsightCell]}>AllSight</Text>
            </View>
            
            {/* Data Rows */}
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Speed</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Hours to days</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Under 2 minutes</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Coverage</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Selective picks</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ 600+ companies</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Analysis</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Brief summaries</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Deep AI insights</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Volume</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ 5-10 stories/day</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ 30-40 reports/day</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Verification</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Trust the writer</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Source-cited</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Access</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Paywalls</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Level playing field</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Community</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Read-only</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Vote & discuss</Text>
            </View>
            
            <View style={styles.tableRow}>
              <Text style={[styles.tableCell, styles.labelCell]}>Bias</Text>
              <Text style={[styles.tableCell, styles.traditionalValueCell]}>❌ Editorial spin</Text>
              <Text style={[styles.tableCell, styles.allsightValueCell]}>✅ Data only</Text>
            </View>
          </View>
          
          <Text style={styles.comparisonFooter}>
            Your edge in the market: Speed × Depth × Scale
          </Text>
        </View>

        {/* Product Benefits */}
        <View style={styles.benefitsSection}>
          <BenefitItem 
            icon="flash"
            iconType="ionicon"
            title="Instant Intelligence"
            description="AI analysis within 2 minutes of SEC publication—before headlines break"
          />
          <BenefitItem 
            icon="check-circle"
            iconType="feather"
            title="Verified Insights"
            description="Every metric linked directly to source pages—no fluff, just facts"
          />
          <BenefitItem 
            icon="target"
            iconType="feather"
            title="Market Timing"
            description="Get actionable insights 15-45 minutes ahead of mainstream coverage"
          />
          <BenefitItem 
            icon="file-text"
            iconType="feather"
            title="Complete Coverage"
            description="10-Q, 10-K, 8-K, S-1 across 600+ S&P 500 and NASDAQ 100 companies"
          />
          <BenefitItem 
            icon="users"
            iconType="feather"
            title="Your AI Analyst"
            description="Professional-grade financial analysis on demand—like having a research team in your pocket"
          />
        </View>

        {/* Pricing Card */}
        <View style={styles.pricingCard}>
          {isDiscounted && (
            <View style={styles.limitedTimeBadge}>
              <Text style={styles.limitedTimeText}>LIMITED TIME</Text>
            </View>
          )}
          
          <View style={styles.priceContainer}>
            {isDiscounted && (
              <Text style={styles.originalPrice}>${originalPrice.toFixed(2)}</Text>
            )}
            <Text style={styles.currentPrice}>${currentPrice.toFixed(2)}</Text>
            <Text style={styles.priceUnit}>/month</Text>
          </View>

          {isDiscounted && (
            <Text style={styles.savingsText}>
              Save ${(originalPrice - currentPrice).toFixed(2)}/month • Limited-time promotional price
            </Text>
          )}

          {/* CTA Button */}
          {!isProUser ? (
            <TouchableOpacity 
              style={[styles.ctaButton, isUpgrading && styles.ctaButtonDisabled]}
              onPress={handleUpgrade}
              disabled={isUpgrading}
            >
              {isUpgrading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.ctaButtonText}>Subscribe to Pro</Text>
                  <Icon name="arrow-right" type="feather" size={20} color="#FFFFFF" />
                </>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.activeSection}>
              <View style={styles.activeBadge}>
                <Icon name="check-circle" type="feather" size={24} color={colors.success} />
                <Text style={styles.activeText}>Pro Active</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.manageButton}
                onPress={() => {
                  const url = Platform.select({
                    ios: 'https://apps.apple.com/account/subscriptions',
                    default: 'https://apps.apple.com/account/subscriptions'
                  });
                  Linking.openURL(url).catch(err => 
                    showAlert('Error', 'Unable to open App Store settings')
                  );
                }}
              >
                <Text style={styles.manageButtonText}>
                  Manage Subscription in App Store
                </Text>
                <Icon name="external-link" type="feather" size={16} color={colors.primary} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Fine Print */}
        <View style={styles.finePrint}>
          <Text style={styles.finePrintText}>
            • Subscription automatically renews unless cancelled
          </Text>
          <Text style={styles.finePrintText}>
            • Cancel anytime in App Store settings
          </Text>
          <Text style={styles.finePrintText}>
            • No refunds for partial billing periods
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// Benefit Item Component
interface BenefitItemProps {
  icon: string;
  iconType: string;
  title: string;
  description: string;
}

const BenefitItem: React.FC<BenefitItemProps> = ({ icon, iconType, title, description }) => (
  <View style={styles.benefitItem}>
    <View style={styles.benefitIconContainer}>
      <Icon name={icon} type={iconType} size={24} color={colors.primary} />
    </View>
    <View style={styles.benefitContent}>
      <Text style={styles.benefitTitle}>{title}</Text>
      <Text style={styles.benefitDescription}>{description}</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  
  // Hero Section
  heroSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  
  // Triangle Section
  triangleSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    backgroundColor: `${colors.primary}08`,
    marginHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.xl,
  },
  triangleSectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  triangleContainer: {
    width: 260,
    height: 220,
    position: 'relative',
    marginBottom: spacing.lg,
  },
  
  // Triangle Lines - Using positioned rectangles with rotation
  triangleLineLeft: {
    position: 'absolute',
    top: 78,
    left: 72,
    width: 155,
    height: 3,
    backgroundColor: colors.primary,
    transform: [{ rotate: '60deg' }],
    zIndex: 1,
  },
  triangleLineRight: {
    position: 'absolute',
    top: 78,
    right: 72,
    width: 155,
    height: 3,
    backgroundColor: colors.primary,
    transform: [{ rotate: '-60deg' }],
    zIndex: 1,
  },
  triangleLineBottom: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    width: 160,
    height: 3,
    backgroundColor: colors.primary,
    zIndex: 1,
  },
  
  // Vertices
  vertex: {
    position: 'absolute',
    backgroundColor: colors.primary,
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.md,
    zIndex: 2,
  },
  vertexTop: {
    top: 0,
    left: 90,
  },
  vertexBottomLeft: {
    bottom: 0,
    left: 10,
  },
  vertexBottomRight: {
    bottom: 0,
    right: 10,
  },
  vertexLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  triangleDescription: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  triangleDescriptionBold: {
    fontWeight: '600',
    color: colors.primary,
  },
  
  // Comparison Table (3-column layout like image)
  comparisonTableContainer: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  comparisonTableTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  comparisonTable: {
    backgroundColor: '#FFFFFF',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tableHeaderRow: {
    backgroundColor: '#F8F9FA',
  },
  tableCell: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    justifyContent: 'center',
  },
  tableHeaderCell: {
    paddingVertical: spacing.md,
  },
  dimensionCell: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  traditionalCell: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.textSecondary,
    textAlign: 'center',
  },
  allsightCell: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  labelCell: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  traditionalValueCell: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  allsightValueCell: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  comparisonFooter: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.primary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  
  // Benefits Section
  benefitsSection: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  benefitItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  benefitIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  benefitContent: {
    flex: 1,
    justifyContent: 'center',
  },
  benefitTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 4,
  },
  benefitDescription: {
    fontSize: 14,
    color: colors.textSecondary,
    lineHeight: 20,
  },
  
  // Pricing Card
  pricingCard: {
    marginHorizontal: spacing.lg,
    padding: spacing.xl,
    backgroundColor: '#FFFFFF',  // 使用纯白色作为卡片背景
    borderRadius: borderRadius.lg,
    ...shadows.md,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  limitedTimeBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.error,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  limitedTimeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  originalPrice: {
    fontSize: 24,
    color: colors.textSecondary,
    textDecorationLine: 'line-through',
    marginRight: spacing.sm,
  },
  currentPrice: {
    fontSize: 48,
    fontWeight: '700',
    color: colors.text,
  },
  priceUnit: {
    fontSize: 18,
    color: colors.textSecondary,
    marginLeft: 4,
    marginTop: 16,
  },
  savingsText: {
    fontSize: 14,
    color: colors.success,
    textAlign: 'center',
    marginBottom: spacing.lg,
    fontWeight: '600',
  },
  
  // CTA Button
  ctaButton: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: spacing.sm,
  },
  
  // Active Subscription
  activeSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${colors.success}15`,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  activeText: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.success,
    marginLeft: spacing.sm,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: borderRadius.md,
    backgroundColor: '#FFFFFF',
    ...shadows.sm,
  },
  manageButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.primary,
    marginRight: spacing.xs,
  },
  
  // Fine Print
  finePrint: {
    marginTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  finePrintText: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
});