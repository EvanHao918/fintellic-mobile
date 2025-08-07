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
import CompanyInfoCard from './CompanyInfoCard';
import { Filing } from '../../types';

interface Quarterly10QDetailProps {
  filing: Filing;
}

const Quarterly10QDetail: React.FC<Quarterly10QDetailProps> = ({ filing }) => {
  const getQuarter = () => {
    // 优先使用filing中的fiscal_quarter
    if (filing.fiscal_quarter) return filing.fiscal_quarter;
    
    // 如果没有，则根据filing_date计算
    const date = new Date(filing.filing_date);
    const month = date.getMonth();
    const quarter = Math.floor(month / 3) + 1;
    return `Q${quarter} ${date.getFullYear()}`;
  };

  // 统一分析内容 - 唯一的内容区域（包含所有信息：分析、预期对比、指引更新等）
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
            // 使用智能标记解析 - 所有内容都在这里
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

      {/* 新增：公司信息卡片 */}
      <View style={styles.contentContainer}>
        <CompanyInfoCard 
          company={filing.company}
          filingType={filing.form_type}
          filingDate={filing.filing_date}
          accessionNumber={filing.accession_number}
        />
        
        {renderUnifiedAnalysis()}
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
    fontFamily: 'Times New Roman, serif',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    marginTop: 2,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Content Container
  contentContainer: {
    paddingVertical: spacing.md,
  },

  // Unified Analysis Section - 唯一的内容区域
  unifiedSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
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
    marginLeft: spacing.xxs,
    fontWeight: typography.fontWeight.medium,
    letterSpacing: 0.5,
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
    fontFamily: 'Times New Roman, serif',
  },
});

export default Quarterly10QDetail;