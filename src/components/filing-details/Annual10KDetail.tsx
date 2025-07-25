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
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  fiscal_year?: string;
  period_end_date?: string;
  // 10-K specific fields - 全部改为字符串类型
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
  three_year_financials?: string;  // 改为string
  business_segments?: string;  // 改为string
  risk_summary?: string;  // 改为string
  growth_drivers?: string;
  management_outlook?: string;
  strategic_adjustments?: string;
  market_impact_10k?: string;
  financial_highlights?: any;
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
    
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="gavel" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Auditor Opinion</Text>
        </View>
        
        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.auditor_opinion}</Text>
        </View>
      </View>
    );
  };

  // 条目3: 三年财务关键指标卡 - 修正版
  const renderThreeYearFinancials = () => {
    if (!filing.three_year_financials) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>3-Year Financial Highlights</Text>
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.three_year_financials}</Text>
        </View>
      </View>
    );
  };

  // 条目4: 主营业务结构摘要 - 修正版
  const renderBusinessSegments = () => {
    if (!filing.business_segments) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Business Segments</Text>
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.business_segments}</Text>
        </View>
      </View>
    );
  };

  // 条目5: 风险因素摘要卡 - 修正版
  const renderRiskFactorsSummary = () => {
    if (!filing.risk_summary) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="warning" size={24} color={colors.error} />
          <Text style={styles.sectionTitle}>Risk Factors Summary</Text>
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.risk_summary}</Text>
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
          <Text style={styles.insightText}>{filing.growth_drivers}</Text>
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
          <Text style={styles.narrativeText}>{filing.management_outlook}</Text>
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
          <Text style={styles.narrativeText}>{filing.strategic_adjustments}</Text>
        </View>
      </View>
    );
  };

  // 条目9: GPT市场影响分析
  const renderMarketImpact = () => {
    if (!filing.market_impact_10k) return null;
  
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Market Impact Analysis</Text>
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>
  
        <View style={styles.insightCard}>
          <Text style={styles.insightText}>{filing.market_impact_10k}</Text>
        </View>
      </View>
    );
  };

  // 财务指标卡（保持原有的结构化数据）
  const renderFinancialMetrics = () => {
    if (!filing.financial_highlights) return null;

    const metrics = filing.financial_highlights;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="attach-money" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Financial Metrics</Text>
        </View>

        <View style={styles.metricsGrid}>
          {metrics.revenue && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Revenue</Text>
              <Text style={styles.metricValue}>{formatCurrency(metrics.revenue)}</Text>
            </View>
          )}
          {metrics.net_income && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Net Income</Text>
              <Text style={styles.metricValue}>{formatCurrency(metrics.net_income)}</Text>
            </View>
          )}
          {metrics.eps && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>EPS</Text>
              <Text style={styles.metricValue}>${metrics.eps.toFixed(2)}</Text>
            </View>
          )}
          {metrics.gross_margin && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Gross Margin</Text>
              <Text style={styles.metricValue}>{formatPercentage(metrics.gross_margin / 100)}</Text>
            </View>
          )}
          {metrics.operating_margin && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Operating Margin</Text>
              <Text style={styles.metricValue}>{formatPercentage(metrics.operating_margin / 100)}</Text>
            </View>
          )}
          {metrics.cash && (
            <View style={styles.metricCard}>
              <Text style={styles.metricLabel}>Cash & Equivalents</Text>
              <Text style={styles.metricValue}>{formatCurrency(metrics.cash)}</Text>
            </View>
          )}
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

      {/* All sections for 10-K */}
      {renderCompanyMetaCard()}
      {renderFinancialMetrics()}
      {renderAuditorOpinion()}
      {renderThreeYearFinancials()}
      {renderBusinessSegments()}
      {renderRiskFactorsSummary()}
      {renderGrowthDrivers()}
      {renderManagementOutlook()}
      {renderStrategicAdjustments()}
      {renderMarketImpact()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: colors.filing10K }]}
          onPress={() => filing.filing_url && Linking.openURL(filing.filing_url)}
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

  // Narrative Cards - 新增的文本显示样式
  narrativeCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  narrativeText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
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

  // Strategy Card
  strategyCard: {
    backgroundColor: colors.warning + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
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