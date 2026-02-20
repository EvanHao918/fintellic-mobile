import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { hasUnifiedAnalysis, getDisplayAnalysis, smartPaginateText } from '../../utils/textHelpers';
import CompanyInfoCard from './CompanyInfoCard';
import PaginatedAnalysis from './PaginatedAnalysis';
import { Filing } from '../../types';

// 详情页专用配图 - 随机显示3个之一
const FILING_COVER_IMAGES = [
  require('../../assets/images/detail_cover_1.png'),
  require('../../assets/images/detail_cover_2.png'),
  require('../../assets/images/detail_cover_3.png'),
];

// 根据 filingId 生成稳定的随机索引（同一个 filing 每次显示同一张图）
const getRandomCoverImage = (filingId?: string | number) => {
  if (filingId) {
    const hash = String(filingId).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return FILING_COVER_IMAGES[hash % FILING_COVER_IMAGES.length];
  }
  return FILING_COVER_IMAGES[Math.floor(Math.random() * FILING_COVER_IMAGES.length)];
};

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

    const textPages = smartPaginateText(content, 2000);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Annual Report Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <Icon name="auto-awesome" size={14} color={colors.primary} />
            </View>
          )}
        </View>

        <PaginatedAnalysis pages={textPages} />
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 配图区域 */}
      <View style={styles.coverImageContainer}>
        <Image
          source={getRandomCoverImage(filing.id)}
          style={styles.coverImage}
          resizeMode="cover"
        />
      </View>

      {/* 报告标题区域 */}
      <View style={styles.reportTitleSection}>
        <View style={styles.filingDateBadge}>
          <Text style={styles.filingDateText}>{formatFilingTime()}</Text>
        </View>
        <Text style={styles.reportTitle}>Annual Report</Text>
        <Text style={styles.reportSubtitle}>
          Fiscal Year {filing.fiscal_year || new Date(filing.filing_date).getFullYear()}
        </Text>
      </View>

      {/* 公司信息卡片 */}
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
          <Text style={styles.secButtonText}>View Full 10-K Filing</Text>
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
  
  // 配图区域 - 有外边距和圆角
  coverImageContainer: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    backgroundColor: colors.gray100,
  },
  coverImage: {
    width: '100%',
    height: 200,
  },
  
  // 报告标题区域
  reportTitleSection: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  filingDateBadge: {
    backgroundColor: colors.gray200,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: spacing.xs,
  },
  filingDateText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  reportTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginBottom: spacing.xxs,
  },
  reportSubtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  
  // Content Container
  contentContainer: {
    paddingVertical: spacing.md,
  },

  // Unified Analysis Section - 橙色标题
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
    color: colors.primary,
    flex: 1,
    letterSpacing: -0.5,
    fontFamily: typography.fontFamily.serif,
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '15',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
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
    fontFamily: typography.fontFamily.serif,
  },
});

export default Annual10KDetail;