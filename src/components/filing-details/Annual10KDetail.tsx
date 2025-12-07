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
import { hasUnifiedAnalysis, getDisplayAnalysis, smartPaginateText } from '../../utils/textHelpers';
import CompanyInfoCard from './CompanyInfoCard';
import PaginatedAnalysis from './PaginatedAnalysis';
import { Filing } from '../../types';

interface Annual10KDetailProps {
  filing: Filing;
}

const Annual10KDetail: React.FC<Annual10KDetailProps> = ({ filing }) => {
  // Format filing time - use precise datetime format consistent with FilingCard
  const formatFilingTime = () => {
    // Priority: detected_at > display_time > filing_date (same as FilingCard)
    const dateToFormat = filing.detected_at || filing.display_time || filing.filing_date;
    
    if (!dateToFormat) return '';
    
    const date = new Date(dateToFormat);
    
    // Format as: "2025-12-02 17:21" (YYYY-MM-DD HH:mm)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // 统一分析内容 - 唯一的内容区域（使用分页）
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    // 🆕 使用智能分页
    const textPages = smartPaginateText(content, 2000);

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

        {/* 🆕 使用分页组件 */}
        <PaginatedAnalysis pages={textPages} />
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
        <View style={styles.periodBadge}>
          <Icon name="calendar-today" size={16} color={colors.white} />
          <Text style={styles.periodText}>
            Fiscal Year {filing.fiscal_year || new Date(filing.filing_date).getFullYear()}
          </Text>
        </View>
        <View style={styles.filedBadge}>
          <Icon name="schedule" size={16} color={colors.white} />
          <Text style={styles.filedText}>
            Filed {formatFilingTime()}
          </Text>
        </View>
      </View>

      {/* 新增：公司信息卡片 */}
      <CompanyInfoCard 
        company={filing.company}
        filingType={filing.form_type}
        filingDate={filing.filing_date}
        accessionNumber={filing.accession_number}
      />

      {/* AI分析内容（分页） */}
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
    fontFamily: typography.fontFamily.serif,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    textAlign: 'center',
    fontFamily: typography.fontFamily.serif,
  },
  periodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginTop: spacing.md,
  },
  periodText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily.serif,
  },
  filedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginTop: spacing.xs,
  },
  filedText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily.serif,
  },

  // Unified Analysis Section - 唯一的内容区域（现在包含分页）
  unifiedSection: {
    backgroundColor: colors.background,
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
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
    fontFamily: typography.fontFamily.serif,
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
    fontFamily: typography.fontFamily.serif,
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
    fontFamily: typography.fontFamily.serif,
  },
});

export default Annual10KDetail;