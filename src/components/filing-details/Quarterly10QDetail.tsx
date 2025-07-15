import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface FilingDetail {
  id: number;
  filing_type?: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  file_url: string;
  fiscal_quarter?: string;
  period_end_date?: string;
  // 10-Q specific fields
  core_metrics?: {
    revenue: number;
    net_income: number;
    eps: number;
    operating_margin: number;
  };
  expectations_comparison?: {
    revenue: { expected: number; actual: number; beat: boolean };
    eps: { expected: number; actual: number; beat: boolean };
    guidance: { previous: string; updated: string; raised: boolean };
  };
  cost_structure?: {
    cogs: { amount: number; percentage: number; yoy_change: number };
    rd: { amount: number; percentage: number; yoy_change: number };
    sga: { amount: number; percentage: number; yoy_change: number };
    total_opex: { amount: number; percentage: number; yoy_change: number };
  };
  guidance_update?: {
    updated: boolean;
    revenue_guidance: string;
    eps_guidance: string;
    key_assumptions: string[];
  };
  // GPT generated insights
  growth_decline_analysis?: string;
  management_tone_analysis?: string;
  beat_miss_analysis?: string;
  [key: string]: any;
}

interface Quarterly10QDetailProps {
  filing: FilingDetail;
}

const Quarterly10QDetail: React.FC<Quarterly10QDetailProps> = ({ filing }) => {
  // Format helper functions
  const formatCurrency = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value);
  };

  const formatPercentage = (value: number | undefined) => {
    if (!value && value !== 0) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatChange = (value: number | undefined) => {
    if (!value && value !== 0) return { text: 'N/A', color: colors.textSecondary };
    const isPositive = value > 0;
    return {
      text: `${isPositive ? '+' : ''}${(value * 100).toFixed(1)}%`,
      color: isPositive ? colors.success : colors.error,
    };
  };

  const getQuarter = () => {
    if (filing.fiscal_quarter) return filing.fiscal_quarter;
    const date = new Date(filing.filing_date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  // 条目1: 季报元信息卡
  const renderQuarterlyMetaCard = () => (
    <View style={styles.metaCard}>
      <View style={styles.metaHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.ticker}>{filing.company_ticker}</Text>
          <Text style={styles.companyName}>{filing.company_name}</Text>
        </View>
        <View style={[styles.filingBadge, { backgroundColor: colors.filing10Q }]}>
          <Text style={styles.filingBadgeText}>10-Q</Text>
        </View>
      </View>
      
      <View style={styles.metaDetails}>
        <View style={styles.metaRow}>
          <Icon name="calendar-today" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Fiscal Quarter:</Text>
          <Text style={styles.metaValue}>{getQuarter()}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="event" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Period End:</Text>
          <Text style={styles.metaValue}>
            {filing.period_end_date ? new Date(filing.period_end_date).toLocaleDateString() : new Date(filing.filing_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="publish" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Filed:</Text>
          <Text style={styles.metaValue}>{new Date(filing.filing_date).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );

  // 条目2: 核心业绩 & 预期对比卡（重点功能）
  const renderPerformanceVsExpectations = () => {
    const expectations = filing.expectations_comparison || {
      revenue: { expected: 13200, actual: 13650, beat: true },
      eps: { expected: 1.82, actual: 1.93, beat: true },
      guidance: { previous: 'Mid-single digit growth', updated: 'High-single digit growth', raised: true },
    };

    const getBeatMissIcon = (beat: boolean) => ({
      icon: beat ? 'thumb-up' : 'thumb-down',
      color: beat ? colors.success : colors.error,
      text: beat ? 'BEAT' : 'MISS',
    });

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Performance vs. Expectations</Text>
          <View style={styles.highlightBadge}>
            <Icon name="star" size={14} color={colors.warning} />
            <Text style={styles.highlightBadgeText}>KEY</Text>
          </View>
        </View>

        {/* Revenue vs Expectations */}
        <View style={styles.expectationCard}>
          <View style={styles.expectationHeader}>
            <Text style={styles.expectationTitle}>Revenue</Text>
            <View style={[styles.beatMissBadge, { backgroundColor: getBeatMissIcon(expectations.revenue.beat).color + '20' }]}>
              <Icon name={getBeatMissIcon(expectations.revenue.beat).icon} size={16} color={getBeatMissIcon(expectations.revenue.beat).color} />
              <Text style={[styles.beatMissText, { color: getBeatMissIcon(expectations.revenue.beat).color }]}>
                {getBeatMissIcon(expectations.revenue.beat).text}
              </Text>
            </View>
          </View>
          
          <View style={styles.expectationMetrics}>
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>Expected</Text>
              <Text style={styles.expectationValue}>{formatCurrency(expectations.revenue.expected * 1000000)}</Text>
            </View>
            <Icon name="arrow-forward" size={20} color={colors.textSecondary} />
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>Actual</Text>
              <Text style={[styles.expectationValue, styles.actualValue]}>
                {formatCurrency(expectations.revenue.actual * 1000000)}
              </Text>
            </View>
          </View>
          
          <View style={styles.expectationDiff}>
            <Text style={styles.expectationDiffText}>
              Difference: {formatCurrency((expectations.revenue.actual - expectations.revenue.expected) * 1000000)} 
              ({((expectations.revenue.actual / expectations.revenue.expected - 1) * 100).toFixed(1)}%)
            </Text>
          </View>
        </View>

        {/* EPS vs Expectations */}
        <View style={styles.expectationCard}>
          <View style={styles.expectationHeader}>
            <Text style={styles.expectationTitle}>Earnings Per Share</Text>
            <View style={[styles.beatMissBadge, { backgroundColor: getBeatMissIcon(expectations.eps.beat).color + '20' }]}>
              <Icon name={getBeatMissIcon(expectations.eps.beat).icon} size={16} color={getBeatMissIcon(expectations.eps.beat).color} />
              <Text style={[styles.beatMissText, { color: getBeatMissIcon(expectations.eps.beat).color }]}>
                {getBeatMissIcon(expectations.eps.beat).text}
              </Text>
            </View>
          </View>
          
          <View style={styles.expectationMetrics}>
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>Expected</Text>
              <Text style={styles.expectationValue}>${expectations.eps.expected.toFixed(2)}</Text>
            </View>
            <Icon name="arrow-forward" size={20} color={colors.textSecondary} />
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>Actual</Text>
              <Text style={[styles.expectationValue, styles.actualValue]}>${expectations.eps.actual.toFixed(2)}</Text>
            </View>
          </View>
          
          <View style={styles.expectationDiff}>
            <Text style={styles.expectationDiffText}>
              Difference: ${(expectations.eps.actual - expectations.eps.expected).toFixed(2)} 
              ({((expectations.eps.actual / expectations.eps.expected - 1) * 100).toFixed(1)}%)
            </Text>
          </View>
        </View>

        {/* Guidance Update */}
        {expectations.guidance && (
          <View style={[styles.guidanceCard, { borderColor: expectations.guidance.raised ? colors.success : colors.warning }]}>
            <Icon 
              name={expectations.guidance.raised ? 'trending-up' : 'trending-flat'} 
              size={24} 
              color={expectations.guidance.raised ? colors.success : colors.warning} 
            />
            <View style={styles.guidanceContent}>
              <Text style={styles.guidanceTitle}>Guidance {expectations.guidance.raised ? 'Raised' : 'Maintained'}</Text>
              <Text style={styles.guidanceText}>
                {expectations.guidance.previous} → {expectations.guidance.updated}
              </Text>
            </View>
          </View>
        )}
      </View>
    );
  };

  // 条目3: 成本结构与费用摘要
  const renderCostStructure = () => {
    const costs = filing.cost_structure || {
      cogs: { amount: 8200, percentage: 0.60, yoy_change: 0.02 },
      rd: { amount: 2050, percentage: 0.15, yoy_change: 0.18 },
      sga: { amount: 2460, percentage: 0.18, yoy_change: -0.05 },
      total_opex: { amount: 4510, percentage: 0.33, yoy_change: 0.06 },
    };

    const costCategories: Array<{
      key: keyof typeof costs;
      label: string;
      icon: string;
    }> = [
      { key: 'cogs', label: 'Cost of Goods Sold', icon: 'inventory' },
      { key: 'rd', label: 'R&D Expenses', icon: 'science' },
      { key: 'sga', label: 'SG&A Expenses', icon: 'business-center' },
      { key: 'total_opex', label: 'Total OpEx', icon: 'account-balance-wallet' },
    ];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Cost Structure Analysis</Text>
        </View>

        {costCategories.map((category) => {
          const cost = costs[category.key];
          const changeColor = cost.yoy_change > 0 ? colors.error : colors.success;
          
          return (
            <View key={category.key} style={styles.costItem}>
              <View style={styles.costHeader}>
                <View style={styles.costInfo}>
                  <Icon name={category.icon} size={20} color={colors.textSecondary} />
                  <Text style={styles.costLabel}>{category.label}</Text>
                </View>
                <Text style={styles.costAmount}>{formatCurrency(cost.amount * 1000000)}</Text>
              </View>
              
              <View style={styles.costMetrics}>
                <View style={styles.costMetric}>
                  <Text style={styles.costMetricLabel}>% of Revenue</Text>
                  <Text style={styles.costMetricValue}>{formatPercentage(cost.percentage)}</Text>
                </View>
                <View style={styles.costMetric}>
                  <Text style={styles.costMetricLabel}>YoY Change</Text>
                  <Text style={[styles.costMetricValue, { color: changeColor }]}>
                    {formatChange(cost.yoy_change).text}
                  </Text>
                </View>
              </View>
              
              <View style={styles.costBar}>
                <View style={[styles.costBarFill, { width: `${cost.percentage * 100}%` }]} />
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  // 条目4: 是否更新业绩指引
  const renderGuidanceUpdate = () => {
    const guidance = filing.guidance_update || {
      updated: true,
      revenue_guidance: '$54-56B (previously $52-54B)',
      eps_guidance: '$7.80-8.20 (previously $7.20-7.60)',
      key_assumptions: [
        'Continued strong demand in cloud services',
        'Stabilizing supply chain conditions',
        'Favorable foreign exchange impact',
      ],
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="update" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Guidance Update</Text>
          {guidance.updated && (
            <View style={styles.updatedBadge}>
              <Text style={styles.updatedBadgeText}>UPDATED</Text>
            </View>
          )}
        </View>

        {guidance.updated ? (
          <>
            <View style={styles.guidanceUpdateCard}>
              <Icon name="trending-up" size={28} color={colors.success} />
              <View style={styles.guidanceUpdateContent}>
                <Text style={styles.guidanceUpdateTitle}>Full Year Guidance Raised</Text>
                
                <View style={styles.guidanceUpdateItem}>
                  <Text style={styles.guidanceUpdateLabel}>Revenue:</Text>
                  <Text style={styles.guidanceUpdateValue}>{guidance.revenue_guidance}</Text>
                </View>
                
                <View style={styles.guidanceUpdateItem}>
                  <Text style={styles.guidanceUpdateLabel}>EPS:</Text>
                  <Text style={styles.guidanceUpdateValue}>{guidance.eps_guidance}</Text>
                </View>
              </View>
            </View>

            <View style={styles.assumptionsCard}>
              <Text style={styles.assumptionsTitle}>Key Assumptions:</Text>
              {guidance.key_assumptions.map((assumption, index) => (
                <View key={index} style={styles.assumptionItem}>
                  <Icon name="check-circle" size={16} color={colors.success} />
                  <Text style={styles.assumptionText}>{assumption}</Text>
                </View>
              ))}
            </View>
          </>
        ) : (
          <View style={styles.noUpdateCard}>
            <Icon name="info" size={24} color={colors.textSecondary} />
            <Text style={styles.noUpdateText}>
              Management maintained previous full-year guidance
            </Text>
          </View>
        )}
      </View>
    );
  };

  // 条目5: GPT增长/下滑驱动分析
  const renderGrowthDeclineAnalysis = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="insights" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Growth/Decline Drivers</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.analysisCard}>
          <Text style={styles.analysisText}>
            {filing.growth_decline_analysis || "Revenue growth of 12% YoY was primarily driven by strong cloud services adoption (+28%) and enterprise software renewals (+15%). This was partially offset by declining hardware sales (-8%) due to supply chain constraints. International markets, particularly Asia-Pacific, contributed significantly with 22% growth, while domestic growth remained steady at 9%."}
          </Text>
          
          <View style={styles.driverHighlights}>
            <View style={styles.driverItem}>
              <Icon name="trending-up" size={16} color={colors.success} />
              <Text style={styles.driverText}>Cloud Services: +28% YoY</Text>
            </View>
            <View style={styles.driverItem}>
              <Icon name="trending-up" size={16} color={colors.success} />
              <Text style={styles.driverText}>International: +22% YoY</Text>
            </View>
            <View style={styles.driverItem}>
              <Icon name="trending-down" size={16} color={colors.error} />
              <Text style={styles.driverText}>Hardware: -8% YoY</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // 条目6: GPT管理层语气分析
  const renderManagementToneAnalysis = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="record-voice-over" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Management Tone Analysis</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.toneCard}>
          <View style={styles.toneIndicator}>
            <Icon name="sentiment-satisfied" size={32} color={colors.success} />
            <Text style={styles.toneLabel}>Confident & Optimistic</Text>
          </View>
          
          <Text style={styles.toneAnalysis}>
            {filing.management_tone_analysis || "Management's tone is notably more confident compared to last quarter, with increased use of growth-oriented language (+35% frequency). Key phrases like 'accelerating momentum', 'strong pipeline', and 'market leadership' appear prominently. The cautious tone around macroeconomic headwinds has softened, suggesting improved visibility into future quarters."}
          </Text>
          
          <View style={styles.toneMetrics}>
            <View style={styles.toneMetric}>
              <Text style={styles.toneMetricLabel}>Positive Language</Text>
              <Text style={styles.toneMetricValue}>72%</Text>
            </View>
            <View style={styles.toneMetric}>
              <Text style={styles.toneMetricLabel}>Forward-Looking</Text>
              <Text style={styles.toneMetricValue}>High</Text>
            </View>
            <View style={styles.toneMetric}>
              <Text style={styles.toneMetricLabel}>Confidence Level</Text>
              <Text style={styles.toneMetricValue}>8/10</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  // 条目7: GPT超预期/不及预期原因分析
  const renderBeatMissAnalysis = () => {
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="psychology" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Beat/Miss Analysis</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.beatAnalysisCard}>
          <View style={styles.beatHeader}>
            <Icon name="celebration" size={24} color={colors.success} />
            <Text style={styles.beatTitle}>Earnings Beat Analysis</Text>
          </View>
          
          <Text style={styles.beatAnalysisText}>
            {filing.beat_miss_analysis || "The company exceeded expectations on both revenue and EPS due to three primary factors: (1) Better-than-expected cloud services adoption drove an additional $450M in high-margin revenue, (2) Operational efficiency initiatives reduced costs by $200M, improving margins by 180bps, and (3) Share buybacks reduced share count by 2.3%, boosting EPS by $0.08. The beat was broad-based across all geographic regions."}
          </Text>
          
          <View style={styles.beatFactors}>
            <Text style={styles.beatFactorsTitle}>Key Contributing Factors:</Text>
            
            <View style={styles.beatFactor}>
              <View style={styles.beatFactorNumber}>
                <Text style={styles.beatFactorNumberText}>1</Text>
              </View>
              <View style={styles.beatFactorContent}>
                <Text style={styles.beatFactorTitle}>Cloud Outperformance</Text>
                <Text style={styles.beatFactorText}>+$450M incremental revenue</Text>
              </View>
            </View>
            
            <View style={styles.beatFactor}>
              <View style={styles.beatFactorNumber}>
                <Text style={styles.beatFactorNumberText}>2</Text>
              </View>
              <View style={styles.beatFactorContent}>
                <Text style={styles.beatFactorTitle}>Cost Optimization</Text>
                <Text style={styles.beatFactorText}>180bps margin improvement</Text>
              </View>
            </View>
            
            <View style={styles.beatFactor}>
              <View style={styles.beatFactorNumber}>
                <Text style={styles.beatFactorNumberText}>3</Text>
              </View>
              <View style={styles.beatFactorContent}>
                <Text style={styles.beatFactorTitle}>Share Buybacks</Text>
                <Text style={styles.beatFactorText}>+$0.08 EPS contribution</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 10-Q Header */}
      <View style={[styles.header, { backgroundColor: colors.filing10Q }]}>
        <View style={styles.headerIcon}>
          <Icon name="insert-chart" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Quarterly Report (10-Q)</Text>
        <Text style={styles.headerSubtitle}>
          {getQuarter()} Financial Results
        </Text>
      </View>

      {/* All 7 sections for 10-Q */}
      {renderQuarterlyMetaCard()}
      {renderPerformanceVsExpectations()}
      {renderCostStructure()}
      {renderGuidanceUpdate()}
      {renderGrowthDeclineAnalysis()}
      {renderManagementToneAnalysis()}
      {renderBeatMissAnalysis()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: colors.filing10Q }]}
          onPress={() => filing.file_url && Linking.openURL(filing.file_url)}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Full 10-Q Filing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    textAlign: 'center',
  },
  
  // Meta Card
  metaCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metaHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  companyInfo: {
    flex: 1,
  },
  ticker: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  filingBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  metaDetails: {
    gap: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metaLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  metaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },

  // Section
  section: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  highlightBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  highlightBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.bold,
  },
  gptBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  gptBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },

  // Expectation Cards
  expectationCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  expectationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expectationTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  beatMissBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  beatMissText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    marginLeft: spacing.xs,
  },
  expectationMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginBottom: spacing.sm,
  },
  expectationItem: {
    alignItems: 'center',
  },
  expectationLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  expectationValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  actualValue: {
    fontWeight: typography.fontWeight.bold,
  },
  expectationDiff: {
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  expectationDiffText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Guidance Card
  guidanceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
  },
  guidanceContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  guidanceTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  guidanceText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Cost Structure
  costItem: {
    marginBottom: spacing.lg,
  },
  costHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  costInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  costLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  costAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  costMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  costMetric: {
    flex: 1,
  },
  costMetricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  costMetricValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  costBar: {
    height: 6,
    backgroundColor: colors.background,
    borderRadius: 3,
    overflow: 'hidden',
  },
  costBarFill: {
    height: '100%',
    backgroundColor: colors.primary + '60',
    borderRadius: 3,
  },

  // Guidance Update
  updatedBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  updatedBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  guidanceUpdateCard: {
    flexDirection: 'row',
    backgroundColor: colors.success + '10',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  guidanceUpdateContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  guidanceUpdateTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  guidanceUpdateItem: {
    flexDirection: 'row',
    marginBottom: spacing.xs,
  },
  guidanceUpdateLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginRight: spacing.sm,
  },
  guidanceUpdateValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    flex: 1,
  },
  assumptionsCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  assumptionsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  assumptionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  assumptionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  noUpdateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  noUpdateText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    flex: 1,
  },

  // Analysis Cards
  analysisCard: {
    backgroundColor: colors.primary + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  analysisText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  driverHighlights: {
    gap: spacing.sm,
  },
  driverItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  driverText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },

  // Tone Analysis
  toneCard: {
    backgroundColor: colors.success + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  toneIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  toneLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.success,
    marginLeft: spacing.md,
  },
  toneAnalysis: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  toneMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  toneMetric: {
    alignItems: 'center',
  },
  toneMetricLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  toneMetricValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // Beat Analysis
  beatAnalysisCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  beatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  beatTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.md,
  },
  beatAnalysisText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  beatFactors: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
  },
  beatFactorsTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  beatFactor: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  beatFactorNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  beatFactorNumberText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  beatFactorContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  beatFactorTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  beatFactorText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Footer
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  secButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  secButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
});

export default Quarterly10QDetail;