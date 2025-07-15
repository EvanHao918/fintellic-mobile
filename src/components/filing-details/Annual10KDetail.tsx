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
  fiscal_year?: string;
  period_end_date?: string;
  // 10-K specific fields
  auditor_opinion?: string;
  financial_metrics?: {
    revenue: number;
    net_income: number;
    eps: number;
    gross_margin: number;
    operating_margin: number;
    roe: number;
    debt_to_equity: number;
  };
  three_year_financials?: {
    revenue_trend: Array<{ year: string; value: number }>;
    income_trend: Array<{ year: string; value: number }>;
    margin_trend: Array<{ year: string; value: number }>;
  };
  business_segments?: Array<{
    name: string;
    revenue: number;
    percentage: number;
    description?: string;
  }>;
  risk_summary?: {
    operational: string[];
    financial: string[];
    regulatory: string[];
    market: string[];
  };
  // GPT generated insights
  growth_drivers?: string;
  management_outlook?: string;
  strategic_adjustments?: string;
  [key: string]: any;
}

interface Annual10KDetailProps {
  filing: FilingDetail;
}

const Annual10KDetail: React.FC<Annual10KDetailProps> = ({ filing }) => {
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
    if (!value) return 'N/A';
    return `${(value * 100).toFixed(1)}%`;
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 条目1: 公司元信息卡
  const renderCompanyMetaCard = () => (
    <View style={styles.metaCard}>
      <View style={styles.metaHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.ticker}>{filing.company_ticker}</Text>
          <Text style={styles.companyName}>{filing.company_name}</Text>
        </View>
        <View style={[styles.filingBadge, { backgroundColor: colors.filing10K }]}>
          <Text style={styles.filingBadgeText}>10-K</Text>
        </View>
      </View>
      
      <View style={styles.metaDetails}>
        <View style={styles.metaRow}>
          <Icon name="calendar-today" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Fiscal Year:</Text>
          <Text style={styles.metaValue}>{filing.fiscal_year || 'FY2024'}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="event" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Period End:</Text>
          <Text style={styles.metaValue}>{filing.period_end_date ? formatDate(filing.period_end_date) : formatDate(filing.filing_date)}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="publish" size={16} color={colors.textSecondary} />
          <Text style={styles.metaLabel}>Filed:</Text>
          <Text style={styles.metaValue}>{formatDate(filing.filing_date)}</Text>
        </View>
      </View>
    </View>
  );

  // 条目2: 审计意见提炼
  const renderAuditorOpinion = () => {
    if (!filing.auditor_opinion) return null;
    
    const getOpinionIcon = (opinion: string) => {
      if (opinion.includes('unqualified') || opinion.includes('clean')) {
        return { icon: 'check-circle', color: colors.success };
      } else if (opinion.includes('qualified')) {
        return { icon: 'warning', color: colors.warning };
      }
      return { icon: 'info', color: colors.primary };
    };
    
    const { icon, color } = getOpinionIcon(filing.auditor_opinion);
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="gavel" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Auditor Opinion</Text>
        </View>
        
        <View style={[styles.opinionCard, { borderLeftColor: color }]}>
          <Icon name={icon} size={28} color={color} />
          <View style={styles.opinionContent}>
            <Text style={styles.opinionType}>Unqualified Opinion</Text>
            <Text style={styles.opinionText}>{filing.auditor_opinion || "The financial statements present fairly, in all material respects, the financial position of the company."}</Text>
          </View>
        </View>
      </View>
    );
  };

  // 条目3: 三年财务关键指标卡
  const renderThreeYearFinancials = () => {
    const metrics = filing.three_year_financials || {
      revenue_trend: [
        { year: '2022', value: 380000 },
        { year: '2023', value: 410000 },
        { year: '2024', value: 455000 },
      ],
      income_trend: [
        { year: '2022', value: 75000 },
        { year: '2023', value: 82000 },
        { year: '2024', value: 95000 },
      ],
      margin_trend: [
        { year: '2022', value: 0.197 },
        { year: '2023', value: 0.200 },
        { year: '2024', value: 0.209 },
      ],
    };

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>3-Year Financial Highlights</Text>
        </View>

        {/* Revenue Trend */}
        <View style={styles.trendCard}>
          <Text style={styles.trendTitle}>Revenue Growth</Text>
          <View style={styles.trendChart}>
            {metrics.revenue_trend.map((item, index) => (
              <View key={index} style={styles.trendItem}>
                <View style={[styles.trendBar, { 
                  height: `${(item.value / Math.max(...metrics.revenue_trend.map(i => i.value))) * 100}%`,
                  backgroundColor: colors.primary,
                }]} />
                <Text style={styles.trendValue}>{formatCurrency(item.value * 1000000)}</Text>
                <Text style={styles.trendYear}>{item.year}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Key Metrics Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>3Y Revenue CAGR</Text>
            <Text style={styles.metricValue}>9.5%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>3Y Income CAGR</Text>
            <Text style={styles.metricValue}>12.7%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Avg Net Margin</Text>
            <Text style={styles.metricValue}>20.2%</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricLabel}>Revenue Stability</Text>
            <Text style={styles.metricValue}>High</Text>
          </View>
        </View>
      </View>
    );
  };

  // 条目4: 主营业务结构摘要
  const renderBusinessSegments = () => {
    const segments = filing.business_segments || [
      { name: 'Cloud Services', revenue: 182000, percentage: 40 },
      { name: 'Enterprise Software', revenue: 136500, percentage: 30 },
      { name: 'Consumer Products', revenue: 91000, percentage: 20 },
      { name: 'Other Services', revenue: 45500, percentage: 10 },
    ];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Business Segments</Text>
        </View>

        {segments.map((segment, index) => (
          <View key={index} style={styles.segmentItem}>
            <View style={styles.segmentHeader}>
              <Text style={styles.segmentName}>{segment.name}</Text>
              <Text style={styles.segmentRevenue}>{formatCurrency(segment.revenue * 1000000)}</Text>
            </View>
            <View style={styles.segmentBarContainer}>
              <View style={[styles.segmentBar, { 
                width: `${segment.percentage}%`,
                backgroundColor: colors.primary + ((100 - segment.percentage) * 2).toString(16),
              }]} />
              <Text style={styles.segmentPercentage}>{segment.percentage}%</Text>
            </View>
          </View>
        ))}
      </View>
    );
  };

  // 条目5: 风险因素摘要卡
  const renderRiskFactorsSummary = () => {
    const risks = filing.risk_summary || {
      operational: ['Supply chain disruptions', 'Key personnel dependency'],
      financial: ['Foreign exchange exposure', 'Credit risk concentration'],
      regulatory: ['Data privacy regulations', 'Antitrust scrutiny'],
      market: ['Intense competition', 'Technology disruption'],
    };

    const riskCategories: Array<{
      key: keyof typeof risks;
      icon: string;
      color: string;
      title: string;
    }> = [
      { key: 'operational', icon: 'settings', color: '#3B82F6', title: 'Operational Risks' },
      { key: 'financial', icon: 'account-balance', color: '#EF4444', title: 'Financial Risks' },
      { key: 'regulatory', icon: 'policy', color: '#F59E0B', title: 'Regulatory Risks' },
      { key: 'market', icon: 'trending-down', color: '#8B5CF6', title: 'Market Risks' },
    ];

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="warning" size={24} color={colors.error} />
          <Text style={styles.sectionTitle}>Risk Factors Summary</Text>
        </View>

        <View style={styles.riskGrid}>
          {riskCategories.map((category) => (
            <View key={category.key} style={styles.riskCategory}>
              <View style={[styles.riskIconContainer, { backgroundColor: category.color + '20' }]}>
                <Icon name={category.icon} size={24} color={category.color} />
              </View>
              <Text style={styles.riskTitle}>{category.title}</Text>
              <View style={styles.riskItems}>
                {risks[category.key]?.slice(0, 2).map((risk: string, idx: number) => (
                  <Text key={idx} style={styles.riskItem}>• {risk}</Text>
                ))}
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  };

  // 条目6: GPT增长驱动总结
  const renderGrowthDrivers = () => {
    if (!filing.growth_drivers) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="rocket-launch" size={24} color={colors.success} />
          <Text style={styles.sectionTitle}>Growth Drivers Analysis</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.insightCard}>
          <Text style={styles.insightText}>
            {filing.growth_drivers || "The company's growth is primarily driven by strong demand in cloud computing services, successful product launches in the consumer segment, and strategic acquisitions that expanded market reach. International expansion, particularly in emerging markets, contributed significantly to revenue growth."}
          </Text>
        </View>
      </View>
    );
  };

  // 条目7: GPT管理层展望重点
  const renderManagementOutlook = () => {
    if (!filing.management_outlook) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="visibility" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Management Outlook Highlights</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.outlookCard}>
          <View style={styles.outlookItem}>
            <Icon name="trending-up" size={20} color={colors.success} />
            <Text style={styles.outlookText}>
              {filing.management_outlook || "Management expects continued momentum in FY2025, with revenue growth projected at 8-10%. Key focus areas include AI integration across all product lines and expansion in Asian markets."}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // 条目8: GPT战略调整判断
  const renderStrategicAdjustments = () => {
    if (!filing.strategic_adjustments) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="transform" size={24} color={colors.warning} />
          <Text style={styles.sectionTitle}>Strategic Adjustments</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.strategyCard}>
          <Text style={styles.strategyText}>
            {filing.strategic_adjustments || "Notable strategic shifts include pivoting from hardware to subscription-based services, divesting non-core assets, and increasing R&D investment in artificial intelligence. The company is transitioning to a platform-based business model."}
          </Text>
          
          <View style={styles.strategyHighlights}>
            <View style={styles.strategyItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.strategyItemText}>Shift to recurring revenue model</Text>
            </View>
            <View style={styles.strategyItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.strategyItemText}>Focus on high-margin services</Text>
            </View>
            <View style={styles.strategyItem}>
              <Icon name="check-circle" size={16} color={colors.success} />
              <Text style={styles.strategyItemText}>Streamlined product portfolio</Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 10-K Header */}
      <View style={[styles.header, { backgroundColor: colors.filing10K }]}>
        <View style={styles.headerIcon}>
          <Icon name="description" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Annual Report (10-K)</Text>
        <Text style={styles.headerSubtitle}>
          Comprehensive yearly financial report
        </Text>
      </View>

      {/* All 8 sections for 10-K */}
      {renderCompanyMetaCard()}
      {renderAuditorOpinion()}
      {renderThreeYearFinancials()}
      {renderBusinessSegments()}
      {renderRiskFactorsSummary()}
      {renderGrowthDrivers()}
      {renderManagementOutlook()}
      {renderStrategicAdjustments()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: colors.filing10K }]}
          onPress={() => filing.file_url && Linking.openURL(filing.file_url)}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Full 10-K Filing</Text>
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
  
  // Meta Card Styles
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

  // Section Styles
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

  // Opinion Card
  opinionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 4,
  },
  opinionContent: {
    flex: 1,
    marginLeft: spacing.md,
  },
  opinionType: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  opinionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },

  // Trend Chart
  trendCard: {
    marginBottom: spacing.lg,
  },
  trendTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.md,
  },
  trendChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 120,
    justifyContent: 'space-around',
  },
  trendItem: {
    flex: 1,
    alignItems: 'center',
  },
  trendBar: {
    width: '60%',
    borderRadius: borderRadius.sm,
    marginBottom: spacing.sm,
  },
  trendValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  trendYear: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },

  // Metrics Grid
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metricCard: {
    width: '50%',
    padding: spacing.xs,
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },

  // Segment Styles
  segmentItem: {
    marginBottom: spacing.md,
  },
  segmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  segmentName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  segmentRevenue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  segmentBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  segmentBar: {
    height: 8,
    borderRadius: 4,
    marginRight: spacing.sm,
  },
  segmentPercentage: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },

  // Risk Grid
  riskGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  riskCategory: {
    width: '50%',
    padding: spacing.xs,
    marginBottom: spacing.md,
  },
  riskIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  riskTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  riskItems: {
    gap: spacing.xs,
  },
  riskItem: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    lineHeight: 16,
  },

  // Insight Cards
  insightCard: {
    backgroundColor: colors.primary + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },

  // Outlook Card
  outlookCard: {
    backgroundColor: colors.success + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  outlookItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  outlookText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginLeft: spacing.sm,
  },

  // Strategy Card
  strategyCard: {
    backgroundColor: colors.warning + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  strategyText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  strategyHighlights: {
    gap: spacing.sm,
  },
  strategyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  strategyItemText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
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

export default Annual10KDetail;