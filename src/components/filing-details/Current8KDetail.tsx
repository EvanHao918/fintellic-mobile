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

interface Current8KDetailProps {
  filing: Filing;
}

const Current8KDetail: React.FC<Current8KDetailProps> = ({ filing }) => {
  const redColor = '#EF4444'; // 8-K signature color

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // 统一分析内容 - 唯一的内容区域
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Icon name="flash-on" size={24} color={redColor} />
          <Text style={styles.sectionTitle}>Event Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <Icon name="auto-awesome" size={14} color={redColor} />
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
      {/* 8-K Header */}
      <View style={[styles.header, { backgroundColor: redColor }]}>
        <View style={styles.headerIcon}>
          <Icon name="flash-on" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Current Report (8-K)</Text>
        <Text style={styles.headerSubtitle}>Material Event Disclosure</Text>
        <View style={styles.urgencyBadge}>
          <Icon name="schedule" size={16} color={colors.white} />
          <Text style={styles.urgencyText}>
            Filed {getRelativeTime(filing.filing_date)}
          </Text>
        </View>
        {filing.item_type && (
          <View style={styles.itemBadge}>
            <Text style={styles.itemText}>Item {filing.item_type}</Text>
          </View>
        )}
      </View>

      {/* 新增：公司信息卡片 */}
      <CompanyInfoCard 
        company={filing.company}
        filingType={filing.form_type}
        filingDate={filing.filing_date}
        accessionNumber={filing.accession_number}
      />
      
      {renderUnifiedAnalysis()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: redColor }]}
          onPress={() => filing.filing_url && Linking.openURL(filing.filing_url)}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Original SEC Filing</Text>
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
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  urgencyText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    fontFamily: 'Times New Roman, serif',
  },
  itemBadge: {
    backgroundColor: colors.white + '30',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
    marginTop: spacing.xs,
  },
  itemText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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
    marginBottom: spacing.md,
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
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unifiedBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
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

export default Current8KDetail;