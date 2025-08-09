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

interface IPOS1DetailProps {
  filing: Filing;
}

const IPOS1Detail: React.FC<IPOS1DetailProps> = ({ filing }) => {
  const openSECFiling = () => {
    if (filing.filing_url) {
      Linking.openURL(filing.filing_url);
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Filed ${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `Filed ${diffDays} days ago`;
    } else {
      return `Filed on ${date.toLocaleDateString()}`;
    }
  };

  // 统一分析内容 - 唯一的内容区域
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Icon name="rocket-launch" size={24} color={colors.filingS1} />
          <Text style={styles.sectionTitle}>IPO Registration Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <Icon name="auto-awesome" size={14} color={colors.filingS1} />
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

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* S-1 Header - 紫色主题 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerIcon}>
            <Icon name="rocket-launch" size={32} color={colors.white} />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>IPO Registration</Text>
            <Text style={styles.headerSubtitle}>Form S-1 Statement</Text>
            <View style={styles.filingTimeContainer}>
              <Icon name="schedule" size={16} color={colors.white + '80'} />
              <Text style={styles.filingTime}>{formatDate(filing.filing_date)}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content Container with Company Info Card */}
      <View style={styles.contentContainer}>
        {/* CompanyInfoCard会自动检测S-1并显示Pre-IPO徽章 */}
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
          onPress={openSECFiling}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Full S-1 Filing</Text>
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
  
  // Header - S-1紫色主题
  header: {
    backgroundColor: colors.filingS1,
    paddingTop: spacing.xxl,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xxs,
    letterSpacing: 0.3,
    fontFamily: 'Times New Roman, serif',
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.white + '90',
    marginBottom: spacing.xs,
    fontFamily: 'Times New Roman, serif',
  },
  filingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filingTime: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '80',
    marginLeft: spacing.xs,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Content Container
  contentContainer: {
    paddingVertical: spacing.md,
  },

  // Unified Analysis Section
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
    backgroundColor: colors.filingS1 + '10',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unifiedBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.filingS1,
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
    backgroundColor: colors.filingS1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: colors.filingS1,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  secButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
    letterSpacing: 0.3,
    fontFamily: 'Times New Roman, serif',
  },
});

export default IPOS1Detail;