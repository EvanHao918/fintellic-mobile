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
  // 10-Q specific fields - 全部改为字符串类型
  core_metrics?: string;  // ← 添加这个字段！
  financial_highlights?: any;  // 保留兼容性
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

  // 条目2: 财务快照 - 新的第一展示条目（替代原来的 Financial Metrics）
  const renderFinancialSnapshot = () => {
    // 修复：检查 core_metrics 而不是 financial_highlights
    if (!filing.core_metrics || typeof filing.core_metrics !== 'string') {
      return null;
    }

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="attach-money" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>财务快照</Text>
          <View style={styles.snapshotBadge}>
            <Icon name="flash-on" size={14} color={colors.primary} />
            <Text style={styles.snapshotBadgeText}>SNAPSHOT</Text>
          </View>
        </View>

        <View style={styles.snapshotCard}>
          <Text style={styles.snapshotText}>{filing.core_metrics}</Text>
        </View>
      </View>
    );
  };

  // 条目3: 核心业绩 & 预期对比卡（文本显示）
  const renderPerformanceVsExpectations = () => {
    if (!filing.expectations_comparison) return null;

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

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.expectations_comparison}</Text>
        </View>
      </View>
    );
  };

  // 条目4: 成本结构与费用摘要（文本显示）
  const renderCostStructure = () => {
    if (!filing.cost_structure) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="pie-chart" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Cost Structure Analysis</Text>
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.cost_structure}</Text>
        </View>
      </View>
    );
  };

  // 条目5: 是否更新业绩指引（文本显示）
  const renderGuidanceUpdate = () => {
    if (!filing.guidance_update) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="update" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Guidance Update</Text>
        </View>

        <View style={styles.narrativeCard}>
          <Text style={styles.narrativeText}>{filing.guidance_update}</Text>
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
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.analysisCard}>
          <Text style={styles.analysisText}>{filing.growth_decline_analysis}</Text>
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
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.toneCard}>
          <Text style={styles.narrativeText}>{filing.management_tone_analysis}</Text>
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
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>

        <View style={styles.beatAnalysisCard}>
          <Text style={styles.narrativeText}>{filing.beat_miss_analysis}</Text>
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
          <View style={styles.gptBadge}>
            <Icon name="auto-awesome" size={14} color={colors.primary} />
            <Text style={styles.gptBadgeText}>AI</Text>
          </View>
        </View>
  
        <View style={styles.beatAnalysisCard}>
          <Text style={styles.narrativeText}>{filing.market_impact_10q}</Text>
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

      {/* All sections for 10-Q - 财务快照作为第一个展示条目 */}
      {renderQuarterlyMetaCard()}
      {renderFinancialSnapshot()}  {/* 新的第一展示条目 - 现在能正常显示了！ */}
      {renderPerformanceVsExpectations()}
      {renderCostStructure()}
      {renderGuidanceUpdate()}
      {renderGrowthDeclineAnalysis()}
      {renderManagementToneAnalysis()}
      {renderBeatMissAnalysis()}
      {renderMarketImpact()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: colors.filing10Q }]}
          onPress={() => filing.filing_url && Linking.openURL(filing.filing_url)}
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

  // 财务快照样式 - 新增
  snapshotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  snapshotBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    marginLeft: spacing.xs,
    fontWeight: typography.fontWeight.bold,
  },
  snapshotCard: {
    backgroundColor: colors.primary + '05',
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  snapshotText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 26,
    fontWeight: typography.fontWeight.medium,
  },

  // Narrative Cards - 文本显示样式
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
  },

  // Tone Analysis
  toneCard: {
    backgroundColor: colors.success + '05',
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },

  // Beat Analysis
  beatAnalysisCard: {
    backgroundColor: colors.background,
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

export default Quarterly10QDetail;