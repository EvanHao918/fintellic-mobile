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
  fiscal_quarter?: string;
  period_end_date?: string;
  // 10-Q specific fields
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

  // 条目1: 季报元信息卡 - 极简设计
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

  // 条目2: 财务快照 - 重点突出设计
  const renderFinancialSnapshot = () => {
    if (!filing.core_metrics || typeof filing.core_metrics !== 'string') {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="attach-money" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Financial Snapshot</Text>
          <View style={styles.keyBadge}>
            <Icon name="star" size={14} color={colors.warning} />
            <Text style={styles.keyBadgeText}>KEY</Text>
          </View>
        </View>

        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotText}>{filing.core_metrics}</Text>
        </View>
      </View>
    );
  };

  // 条目3: 核心业绩 & 预期对比卡
  const renderPerformanceVsExpectations = () => {
    if (!filing.expectations_comparison) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="analytics" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Performance vs. Expectations</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{filing.expectations_comparison}</Text>
        </View>
      </View>
    );
  };

  // 条目4: 成本结构与费用摘要
  const renderCostStructure = () => {
    if (!filing.cost_structure) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Cost Structure Analysis</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{filing.cost_structure}</Text>
        </View>
      </View>
    );
  };

  // 条目5: 是否更新业绩指引
  const renderGuidanceUpdate = () => {
    if (!filing.guidance_update) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="update" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Guidance Update</Text>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.contentText}>{filing.guidance_update}</Text>
        </View>
      </View>
    );
  };

  // 条目6: GPT增长/下滑驱动分析
  const renderGrowthDeclineAnalysis = () => {
    if (!filing.growth_decline_analysis) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="insights" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Growth/Decline Drivers</Text>
          <View style={styles.aiBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.aiContentCard}>
          <Text style={styles.aiContentText}>{filing.growth_decline_analysis}</Text>
        </View>
      </View>
    );
  };

  // 条目7: GPT管理层语气分析
  const renderManagementToneAnalysis = () => {
    if (!filing.management_tone_analysis) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="record-voice-over" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Management Tone Analysis</Text>
          <View style={styles.aiBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.aiContentCard}>
          <Text style={styles.aiContentText}>{filing.management_tone_analysis}</Text>
        </View>
      </View>
    );
  };

  // 条目8: GPT超预期/不及预期原因分析
  const renderBeatMissAnalysis = () => {
    if (!filing.beat_miss_analysis) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="psychology" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Beat/Miss Analysis</Text>
          <View style={styles.aiBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.aiContentCard}>
          <Text style={styles.aiContentText}>{filing.beat_miss_analysis}</Text>
        </View>
      </View>
    );
  };

  // 条目9: GPT市场影响分析
  const renderMarketImpact = () => {
    if (!filing.market_impact_10q) return null;
  
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="trending-up" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Market Impact Analysis</Text>
          <View style={styles.aiBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.aiBadgeText}>AI</Text>
          </View>
        </View>
  
        <View style={styles.aiContentCard}>
          <Text style={styles.aiContentText}>{filing.market_impact_10q}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 10-Q Header - 极简设计 */}
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

      {/* All sections */}
      <View style={styles.contentContainer}>
        {renderQuarterlyMetaCard()}
        {renderFinancialSnapshot()}
        {renderPerformanceVsExpectations()}
        {renderCostStructure()}
        {renderGuidanceUpdate()}
        {renderGrowthDeclineAnalysis()}
        {renderManagementToneAnalysis()}
        {renderBeatMissAnalysis()}
        {renderMarketImpact()}
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
    backgroundColor: colors.gray50, // 浅灰背景增加层次
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
  
  // Meta Card - 信息卡片 - 报纸风格
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
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'Roboto Slab',
      default: 'System',
    }),
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.gray600,
    marginTop: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
    fontStyle: 'italic',
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'Roboto Slab',
      default: 'System',
    }),
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

  // Section - 通用卡片样式
  section: {
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
    fontFamily: Platform.select({
      ios: 'Georgia',
      android: 'Roboto Slab', 
      default: 'System',
    }),
  },

  // 重点标记 - 添加flexDirection
  keyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  keyBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.5,
    marginLeft: spacing.xs,
  },

  // AI标记 - 使用主色调
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  aiBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.5,
  },

  // 财务快照卡片 - 重点内容特殊处理
  snapshotCard: {
    backgroundColor: colors.white,
    paddingTop: spacing.md,
  },
  snapshotText: {
    fontSize: typography.fontSize.md,
    color: colors.gray900,
    lineHeight: 30,
    fontWeight: typography.fontWeight.regular,
    letterSpacing: 0.3,
    // 首行缩进效果
    textAlign: 'justify' as 'justify',
  },

  // 普通内容卡片
  contentCard: {
    backgroundColor: colors.white,
    paddingTop: spacing.xs,
  },
  contentText: {
    fontSize: typography.fontSize.base,
    color: colors.gray800,
    lineHeight: 28,
    letterSpacing: 0.2,
    textAlign: 'justify' as 'justify',
  },

  // AI内容卡片 - 引用样式
  aiContentCard: {
    backgroundColor: colors.white,
    paddingLeft: spacing.md,
    marginTop: spacing.xs,
    borderLeftWidth: 2,
    borderLeftColor: colors.gray200,
  },
  aiContentText: {
    fontSize: typography.fontSize.base,
    color: colors.gray700,
    lineHeight: 28,
    letterSpacing: 0.2,
    fontStyle: 'italic',
  },

  // Footer - 优雅设计
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