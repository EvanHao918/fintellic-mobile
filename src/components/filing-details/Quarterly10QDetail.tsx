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
import { parseUnifiedAnalysis, hasUnifiedAnalysis, getDisplayAnalysis } from '../../utils/textHelpers';

interface FilingDetail {
  id: number;
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  fiscal_quarter?: string;
  period_end_date?: string;
  
  // Unified analysis fields
  unified_analysis?: string;
  analysis_version?: string;
  smart_markup_data?: any;
  analyst_expectations?: any;
  
  // Legacy 10-Q specific fields
  ai_summary?: string;
  core_metrics?: string;
  financial_highlights?: any;
  expectations_comparison?: string;
  cost_structure?: string;
  guidance_update?: string;
  growth_decline_analysis?: string;
  management_tone_analysis?: string;
  beat_miss_analysis?: string;
  market_impact_10q?: string;
  [key: string]: any;
}

interface Quarterly10QDetailProps {
  filing: FilingDetail;
}

const Quarterly10QDetail: React.FC<Quarterly10QDetailProps> = ({ filing }) => {
  const getQuarter = () => {
    if (filing.fiscal_quarter) return filing.fiscal_quarter;
    const date = new Date(filing.filing_date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  // 简化的季报元信息卡
  const renderQuarterlyMetaCard = () => (
    <View style={styles.metaCard}>
      <View style={styles.metaHeader}>
        <View style={styles.companyInfo}>
          <Text style={styles.ticker}>{filing.company_ticker}</Text>
          <Text style={styles.companyName}>{filing.company_name}</Text>
        </View>
        <View style={styles.filingBadge}>
          <Text style={styles.filingBadgeText}>10-Q</Text>
        </View>
      </View>
      
      <View style={styles.metaDetails}>
        <View style={styles.metaRow}>
          <Icon name="calendar-today" size={14} color={colors.gray500} />
          <Text style={styles.metaLabel}>Fiscal Quarter</Text>
          <Text style={styles.metaValue}>{getQuarter()}</Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="event" size={14} color={colors.gray500} />
          <Text style={styles.metaLabel}>Period End</Text>
          <Text style={styles.metaValue}>
            {filing.period_end_date ? new Date(filing.period_end_date).toLocaleDateString() : new Date(filing.filing_date).toLocaleDateString()}
          </Text>
        </View>
        
        <View style={styles.metaRow}>
          <Icon name="publish" size={14} color={colors.gray500} />
          <Text style={styles.metaLabel}>Filed</Text>
          <Text style={styles.metaValue}>{new Date(filing.filing_date).toLocaleDateString()}</Text>
        </View>
      </View>
    </View>
  );

  // 统一分析内容 - 核心部分
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Quarterly Results Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <Icon name="auto-awesome" size={14} color={colors.primary} />
              <Text style={styles.unifiedBadgeText}>AI</Text>
            </View>
          )}
        </View>

        <View style={styles.unifiedContent}>
          {isUnified ? (
            // 使用智能标记解析
            <View style={styles.analysisText}>
              {parseUnifiedAnalysis(content)}
            </View>
          ) : (
            // 降级到普通文本
            <Text style={styles.legacyText}>{content}</Text>
          )}
        </View>
      </View>
    );
  };

  // 分析师预期对比（如果有）
  const renderExpectationsComparison = () => {
    if (!filing.analyst_expectations || !hasUnifiedAnalysis(filing)) return null;

    const expectations = filing.analyst_expectations;

    return (
      <View style={styles.expectationsCard}>
        <View style={styles.expectationsHeader}>
          <Icon name="assessment" size={20} color={colors.primary} />
          <Text style={styles.expectationsTitle}>vs. Analyst Expectations</Text>
        </View>
        
        <View style={styles.expectationsGrid}>
          {expectations.revenue_estimate && (
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>Revenue Estimate</Text>
              <Text style={styles.expectationValue}>
                ${expectations.revenue_estimate.value}B
              </Text>
              <Text style={styles.expectationAnalysts}>
                ({expectations.revenue_estimate.analysts} analysts)
              </Text>
            </View>
          )}
          
          {expectations.eps_estimate && (
            <View style={styles.expectationItem}>
              <Text style={styles.expectationLabel}>EPS Estimate</Text>
              <Text style={styles.expectationValue}>
                ${expectations.eps_estimate.value}
              </Text>
              <Text style={styles.expectationAnalysts}>
                ({expectations.eps_estimate.analysts} analysts)
              </Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 仅在旧版本时显示的传统内容
  const renderLegacyContent = () => {
    if (hasUnifiedAnalysis(filing)) return null;

    return (
      <>
        {filing.expectations_comparison && (
          <View style={styles.legacySection}>
            <View style={styles.sectionHeader}>
              <Icon name="analytics" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Performance vs. Expectations</Text>
            </View>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{filing.expectations_comparison}</Text>
            </View>
          </View>
        )}

        {filing.guidance_update && (
          <View style={styles.legacySection}>
            <View style={styles.sectionHeader}>
              <Icon name="update" size={24} color={colors.primary} />
              <Text style={styles.sectionTitle}>Guidance Update</Text>
            </View>
            <View style={styles.contentCard}>
              <Text style={styles.contentText}>{filing.guidance_update}</Text>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 10-Q Header - 简约设计 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="insert-chart" size={28} color={colors.white} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>Quarterly Report</Text>
            <Text style={styles.headerSubtitle}>{getQuarter()} Financial Results</Text>
          </View>
        </View>
      </View>

      {/* 简化后的内容结构 */}
      <View style={styles.contentContainer}>
        {renderQuarterlyMetaCard()}
        {renderUnifiedAnalysis()}
        {renderExpectationsComparison()}
        {renderLegacyContent()}
      </View>

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secButton}
          onPress={() => filing.filing_url && Linking.openURL(filing.filing_url)}
        >
          <Text style={styles.secButtonText}>View Original SEC Filing</Text>
          <Icon name="launch" size={16} color={colors.gray700} />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.gray50,
  },
  
  // Header - 简约设计
  header: {
    backgroundColor: colors.filing10Q,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    marginTop: 2,
  },
  
  // Content Container
  contentContainer: {
    paddingVertical: spacing.md,
  },
  
  // Meta Card - 信息卡片
  metaCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 3,
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
    paddingBottom: spacing.md,
    borderBottomWidth: 3,
    borderBottomColor: colors.gray900,
  },
  companyInfo: {
    flex: 1,
  },
  ticker: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.gray900,
    letterSpacing: -1,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.gray600,
    marginTop: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
    fontStyle: 'italic',
  },
  filingBadge: {
    backgroundColor: colors.filing10Q,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  filingBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    letterSpacing: 0.5,
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
    color: colors.gray500,
    marginLeft: spacing.sm,
    flex: 1,
    fontWeight: typography.fontWeight.regular,
  },
  metaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.gray900,
  },

  // Unified Analysis Section
  unifiedSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.03,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: colors.gray900,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.gray900,
    marginLeft: spacing.sm,
    flex: 1,
    letterSpacing: -0.5,
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unifiedBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.5,
  },
  unifiedContent: {
    paddingTop: spacing.sm,
  },
  analysisText: {
    // Container for parsed unified analysis
  },
  legacyText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },

  // Expectations Card
  expectationsCard: {
    backgroundColor: colors.primary + '05',
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  expectationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  expectationsTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  expectationsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
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
    fontWeight: typography.fontWeight.bold,
    color: colors.primary,
  },
  expectationAnalysts: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Legacy sections
  legacySection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg + spacing.xs,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
  },
  contentCard: {
    backgroundColor: colors.white,
    paddingTop: spacing.xs,
  },
  contentText: {
    fontSize: typography.fontSize.base,
    color: colors.gray800,
    lineHeight: 28,
    letterSpacing: 0.2,
  },

  // Footer
  footer: {
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    backgroundColor: colors.white,
  },
  secButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    borderWidth: 2,
    borderColor: colors.gray900,
  },
  secButtonText: {
    color: colors.gray900,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
    letterSpacing: 0.3,
  },
});

export default Quarterly10QDetail;