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
  fiscal_year?: string;
  period_end_date?: string;
  
  // Unified analysis fields
  unified_analysis?: string;
  analysis_version?: string;
  smart_markup_data?: any;
  
  // Legacy fields
  ai_summary?: string;
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
  three_year_financials?: string;
  business_segments?: string;
  risk_summary?: string;
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
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // 简化的元信息卡
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

  // 统一分析内容 - 唯一的内容区域
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Annual Report Analysis</Text>
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
            // 降级到普通文本 - 为了向后兼容
            <Text style={styles.legacyText}>{content}</Text>
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

      {/* 极简的内容结构 - 只有三个部分 */}
      {renderCompanyMetaCard()}
      {renderUnifiedAnalysis()}

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
    fontFamily: 'Times New Roman, serif',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    textAlign: 'center',
    fontFamily: 'Times New Roman, serif',
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
    fontFamily: 'Times New Roman, serif',
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontFamily: 'Times New Roman, serif',
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
    fontFamily: 'Times New Roman, serif',
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
    fontFamily: 'Times New Roman, serif',
  },
  metaValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    fontFamily: 'Times New Roman, serif',
  },

  // Unified Analysis Section - 唯一的内容区域
  unifiedSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.md,
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
    marginBottom: spacing.lg,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
    fontFamily: 'Times New Roman, serif',
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
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.medium,
    fontFamily: 'Times New Roman, serif',
  },
  unifiedContent: {
    paddingTop: spacing.sm,
  },
  analysisText: {
    // Container for parsed unified analysis
    // 实际样式在 textHelpers.ts 中定义
  },
  legacyText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    fontFamily: 'Times New Roman, serif',
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
    fontFamily: 'Times New Roman, serif',
  },
});

export default Annual10KDetail;