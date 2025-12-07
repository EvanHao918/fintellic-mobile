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

interface IPOS1DetailProps {
  filing: Filing;
}

const IPOS1Detail: React.FC<IPOS1DetailProps> = ({ filing }) => {
  const openSECFiling = () => {
    if (filing.filing_url) {
      Linking.openURL(filing.filing_url);
    }
  };

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

  // 统一分析内容 - 唯一的内容区域
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    // 🆕 使用智能分页
    const textPages = smartPaginateText(content, 2000);

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

        {/* 🆕 使用分页组件 */}
        <PaginatedAnalysis pages={textPages} />
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
              <Text style={styles.filingTime}>Filed {formatFilingTime()}</Text>
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
    fontFamily: typography.fontFamily.serif,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.white + '90',
    marginBottom: spacing.xs,
    fontFamily: typography.fontFamily.serif,
  },
  filingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filingTime: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '80',
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Content Container
  contentContainer: {
    paddingVertical: spacing.md,
  },

  // Unified Analysis Section（现在包含分页）
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
    fontFamily: typography.fontFamily.serif,
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
    fontFamily: typography.fontFamily.serif,
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
    fontFamily: typography.fontFamily.serif,
  },
});

export default IPOS1Detail;