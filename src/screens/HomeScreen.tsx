// src/screens/HomeScreen.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Animated,
} from 'react-native';
import { Text } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FilingCard } from '../components';
import { Filing } from '../types';
import themeConfig from '../theme';
import { useFadeAnimation, staggerAnimation, animations } from '../utils/animations';

const { colors, typography, spacing, commonStyles } = themeConfig;

// Mock data for demonstration
const mockFilings: Filing[] = [
  {
    id: '1',
    company_id: '1',
    company_name: 'Apple Inc.',
    company_ticker: 'AAPL',
    filing_type: '10-K',
    filing_date: new Date().toISOString(),
    accession_number: '0000320193-24-000001',
    filing_url: '#',
    processing_status: 'completed',
    ai_summary: 'Apple reported record revenue of $383.3B for fiscal 2023, driven by strong iPhone sales and growing services revenue. The company maintained its industry-leading margins despite global supply chain challenges.',
    management_tone: 'bullish',
    key_insights: [
      'Services revenue grew 15% YoY to all-time high',
      'iPhone revenue up 7% despite challenging market',
      'Returned over $90B to shareholders'
    ],
    financial_highlights: {
      revenue: 383285000000,
      net_income: 96995000000,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    company_id: '2',
    company_name: 'Microsoft Corporation',
    company_ticker: 'MSFT',
    filing_type: '10-Q',
    filing_date: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
    accession_number: '0000789019-24-000002',
    filing_url: '#',
    processing_status: 'completed',
    ai_summary: 'Microsoft Q1 results show 12% revenue growth to $56.5B, with Azure cloud services growing 29%. AI initiatives are showing strong early momentum with enterprise customers.',
    management_tone: 'bullish',
    key_insights: [
      'Cloud revenue exceeded $30B for the quarter',
      'AI services adoption accelerating across enterprise',
    ],
    financial_highlights: {
      revenue: 56517000000,
      net_income: 22291000000,
    },
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    company_id: '3',
    company_name: 'Tesla Inc.',
    company_ticker: 'TSLA',
    filing_type: '8-K',
    filing_date: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
    accession_number: '0001318605-24-000003',
    filing_url: '#',
    processing_status: 'completed',
    ai_summary: 'Tesla announced a new Gigafactory in Mexico with $5B investment. Production expected to begin in 2025 with initial capacity of 1M vehicles annually.',
    management_tone: 'neutral',
    key_insights: [
      'New factory to focus on next-gen vehicle platform',
      'Expected to create 10,000+ jobs',
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = React.useState(false);
  const { fadeAnim } = useFadeAnimation(0, true);
  
  // Animation refs for cards
  const cardAnimations = React.useRef(
    mockFilings.map(() => new Animated.Value(0))
  ).current;

  React.useEffect(() => {
    // Animate cards in with stagger effect
    const fadeInAnimations = cardAnimations.map((anim) =>
      animations.fadeIn(anim)
    );
    staggerAnimation(fadeInAnimations, 100).start();
  }, []);

  const handleRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate refresh
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  }, []);

  const handleFilingPress = (filing: Filing) => {
    console.log('Filing pressed:', filing.id);
    // Navigation will be implemented later
  };

  const handleVote = (filingId: string, voteType: 'bullish' | 'neutral' | 'bearish') => {
    console.log('Vote:', filingId, voteType);
    // Vote API call will be implemented later
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Latest Filings</Text>
          <Text style={styles.headerSubtitle}>
            Real-time SEC filings with AI insights
          </Text>
        </View>

        {/* Filings List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {mockFilings.map((filing, index) => (
            <Animated.View
              key={filing.id}
              style={{ opacity: cardAnimations[index] }}
            >
              <FilingCard
                filing={filing}
                onPress={handleFilingPress}
                onVote={handleVote}
              />
            </Animated.View>
          ))}
        </ScrollView>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xxs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
});