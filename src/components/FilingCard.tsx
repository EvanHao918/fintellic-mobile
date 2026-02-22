// src/components/FilingCard.tsx
// ENHANCED: Display AI-extracted keywords on filing cards
// ENHANCED: Use detected_at timestamp for precise timing display
// ENHANCED: Show specific datetime format instead of relative time
// 🔥 FIXED: Move stats display to top-right to avoid overlap with bearish button
// 🔥 FIXED: Left align voting module in footer
// 🎯 FIXED: Remove numberOfLines limit on title to allow full display
// 🛠️ FIXED: TypeScript type errors for optional properties
// 🎨 MODIFIED: Reduced marginHorizontal from spacing.md (16px) to spacing.xs (8px) for wider cards
// 🎨 NEW: Added cover image based on filing type

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Image,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { Filing } from '../types';
import { VotingModule, StatsDisplay } from './interactions';
import { getDisplaySummary } from '../utils/textHelpers';
import ShareService from '../services/ShareService';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius, shadows, filingTypes, sentiments } = themeConfig;

// 配图映射：根据 filing 类型显示对应图片
// 每种类型可以有1-2张图：_1.png (主图，必须) 和 _2.png (副图，可选)
// 使用filing ID的伪随机，确保同一filing始终显示相同的图（不会每次刷新都变）
const FILING_COVER_IMAGES: { [key: string]: { primary: any; secondary?: any } } = {
  '10-K': {
    primary: require('../assets/images/card_10k_1.png'),
    secondary: require('../assets/images/card_10k_2.png'),  // 如果没有副图可以注释掉
  },
  '10-Q': {
    primary: require('../assets/images/card_10q_1.png'),
    secondary: require('../assets/images/card_10q_2.png'),
  },
  '8-K': {
    primary: require('../assets/images/card_8k_1.png'),
    secondary: require('../assets/images/card_8k_2.png'),
  },
  'S-1': {
    primary: require('../assets/images/card_s1_1.png'),
    secondary: require('../assets/images/card_s1_2.png'),
  },
};

// 伪随机选择图片：基于filing ID决定显示主图还是副图（约20%显示副图）
// 同一个filing每次都显示相同的图片，不会因为刷新而改变
const getFilingCoverImage = (filingType: string, filingId: number) => {
  const images = FILING_COVER_IMAGES[filingType];
  if (!images || !images.primary) return null;
  
  // 如果没有副图，直接返回主图
  if (!images.secondary) return images.primary;
  
  // 使用filing ID的模运算实现伪随机：每5个filing中约1个显示副图
  const useSecondary = (filingId % 5) === 0;  // ID能被5整除时显示副图（20%概率）
  return useSecondary ? images.secondary : images.primary;
};

interface FilingCardProps {
  filing: Filing;
  onPress: (filing: Filing) => void;
  isProUser?: boolean;
}

export default function FilingCard({ 
  filing, 
  onPress, 
  isProUser = false 
}: FilingCardProps) {
  // ENHANCED: 添加详细的调试日志，包含时间戳信息
  console.log(`Filing ${filing.id} 数据:`, {
    id: filing.id,
    ticker: filing.company_ticker,
    tags: filing.tags,
    view_count: filing.view_count,
    comment_count: filing.comment_count,
    vote_counts: filing.vote_counts,
    analysis_version: filing.analysis_version,
    has_unified_feed_summary: !!filing.unified_feed_summary,
    // ENHANCED: Log comprehensive timing information
    filing_date: filing.filing_date,
    detected_at: filing.detected_at,
    display_time: filing.display_time,
    detection_age_minutes: filing.detection_age_minutes,
    detection_age_hours: filing.detection_age_hours,
    is_recently_detected: filing.is_recently_detected,
  });

  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  
  // Get filing type configuration with enhanced labels
  const getFilingTypeConfig = (formType: string) => {
    const baseConfig = filingTypes[formType as keyof typeof filingTypes] || {
      color: colors.gray500,
      label: formType,
    };
    
    // Enhanced labels for better understanding
    const enhancedLabels: { [key: string]: string } = {
      '10-K': '10-K Annual',
      '10-Q': '10-Q Quarterly',
      '8-K': '8-K Current',
      'S-1': 'S-1 IPO',
    };
    
    return {
      ...baseConfig,
      label: enhancedLabels[formType] || baseConfig.label,
    };
  };
  
  const filingConfig = getFilingTypeConfig(filing.form_type);

  // ENHANCED: Format date to show specific datetime instead of relative time
  const formatDate = (filing: Filing) => {
    // Use detected_at first, then filing_date as fallback
    const dateToFormat = filing.detected_at || filing.display_time || filing.filing_date;
    
    if (!dateToFormat) return '';
    
    const date = new Date(dateToFormat);
    
    // Format as: "2025-08-22 17:26" (YYYY-MM-DD HH:mm) in user's local timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };

  // ENHANCED: Get urgency indicator based on timing and filing type
  const getUrgencyIndicator = () => {
    // Check if filing is very recent (within 30 minutes for 8-K/S-1, 60 minutes for others)
    const isVeryRecent = filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined && 
      ((filing.form_type === '8-K' || filing.form_type === 'S-1') ? filing.detection_age_minutes < 30 : filing.detection_age_minutes < 60);
    
    const isRecent = filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined && filing.detection_age_minutes < 120;
    
    if (isVeryRecent && (filing.form_type === '8-K' || filing.form_type === 'S-1')) {
      return (
        <View style={[styles.urgencyIndicator, styles.urgentIndicator]}>
          <Icon name="flash-on" size={10} color={colors.error} />
          <Text style={[styles.urgencyText, styles.urgentText]}>URGENT</Text>
        </View>
      );
    } else if (isRecent) {
      return (
        <View style={[styles.urgencyIndicator, styles.recentIndicator]}>
          <Icon name="fiber-new" size={10} color={colors.warning} />
          <Text style={[styles.urgencyText, styles.recentText]}>NEW</Text>
        </View>
      );
    }
    
    return null;
  };

  // ENHANCED: Get time indicator styling based on recency
  const getTimeIndicatorStyle = () => {
    if (filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined) {
      if (filing.detection_age_minutes < 60) {
        return styles.recentTimeText;
      } else if (filing.detection_age_minutes < 240) { // 4 hours
        return styles.moderateTimeText;
      }
    }
    return styles.normalTimeText;
  };

  // Extract event type for 8-K filings
  const eventType = filing.form_type === '8-K' && filing.item_type 
    ? filing.item_type 
    : null;

  // 使用 tags 字段（后端返回的字段名）
  const displayKeywords = filing.tags?.slice(0, 3) || [];

  // 获取显示的摘要文本 - 使用新的优先逻辑
  const summaryText = getDisplaySummary(filing) || 'Processing summary...';

  // 🎨 NEW: 拆分标题和副标题（第一个真正的句号前为大标题，之后为小标题）
  const getHeadlineAndSubtext = (text: string) => {
    // 使用正则匹配真正的句号：句号后面跟着空格和大写字母，或者句号在末尾
    // 排除小数点（数字.数字）的情况
    const sentenceEndRegex = /\.(?=\s+[A-Z])|\.$/;
    const match = text.match(sentenceEndRegex);
    
    if (match && match.index !== undefined && match.index > 0) {
      const periodIndex = match.index;
      return {
        headline: text.substring(0, periodIndex + 1),
        subtext: text.substring(periodIndex + 1).trim(),
      };
    }
    // 如果没有找到合适的句号，全部作为标题
    return {
      headline: text,
      subtext: '',
    };
  };

  const { headline, subtext } = getHeadlineAndSubtext(summaryText);

  // Handle press animations
  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
      speed: 50,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      speed: 50,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={[styles.container, { transform: [{ scale: scaleAnim }] }]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => onPress(filing)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <View style={styles.card}>

          {/* Cover Image - 根据 filing 类型显示对应配图（伪随机主副图） */}
          {FILING_COVER_IMAGES[filing.form_type] && (
            <View style={styles.coverImageContainer}>
              <Image
                source={getFilingCoverImage(filing.form_type, filing.id)}
                style={styles.coverImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Company Info Section - 新布局 */}
          <View style={styles.companyInfoSection}>
            {/* 第一行：Ticker + 报告类型标签（左）| 时间戳（右） */}
            <View style={styles.companyFirstRow}>
              <View style={styles.tickerWithBadge}>
                <Text style={styles.ticker}>{filing.company_ticker}</Text>
                <View style={[styles.filingBadgeOutline, { backgroundColor: filingConfig.color }]}>
                  <Text style={styles.filingBadgeOutlineText}>{filingConfig.label}</Text>
                </View>
              </View>
              <Text style={styles.timestampText}>{formatDate(filing)}</Text>
            </View>
            
            {/* 第二行：公司全名 + 指数标签 + 分享按钮 */}
            <View style={styles.companySecondRow}>
              <View style={styles.companyNameWithBadges}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {filing.company_name}
                </Text>
                {filing.company?.is_sp500 && (
                  <View style={styles.indexBadgeOutline}>
                    <Text style={styles.indexBadgeOutlineText}>S&P 500</Text>
                  </View>
                )}
                {filing.company?.is_nasdaq100 && (
                  <View style={[styles.indexBadgeOutline, styles.nasdaqBadgeOutline]}>
                    <Text style={[styles.indexBadgeOutlineText, styles.nasdaqBadgeOutlineText]}>NASDAQ</Text>
                  </View>
                )}
              </View>
              <TouchableOpacity 
                style={styles.shareButton}
                onPress={(e) => {
                  e.stopPropagation();
                  ShareService.trackShareIntent(filing, 'card');
                  ShareService.shareFiling(filing);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="share" type="material" size={20} color="#10B981" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Main Content - Headline + Subtext */}
          <View style={styles.content}>
            {/* 大标题 */}
            <Text style={styles.headline}>{headline}</Text>
            
            {/* 小标题/摘要 */}
            {subtext ? (
              <Text style={styles.subtext}>{subtext}</Text>
            ) : null}

            {/* Keywords + Date Row */}
            <View style={styles.metaRow}>
              {displayKeywords.length > 0 && (
                <View style={styles.keywordsRow}>
                  {displayKeywords.map((keyword: string, index: number) => (
                    <View key={index} style={styles.keywordBadge}>
                      <Text style={styles.keywordText}>{keyword}</Text>
                    </View>
                  ))}
                  {filing.tags && filing.tags.length > 3 && (
                    <Text style={styles.moreKeywordsText}>
                      +{filing.tags.length - 3} more
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {/* Footer with voting & stats */}
          <View style={styles.footer}>
            {/* Stats display in top-right */}
            <View style={styles.footerStatsContainer}>
              <StatsDisplay 
                viewCount={filing.view_count || 0}
                commentCount={filing.comment_count || 0}
                mode="compact"
              />
            </View>
            
            {/* Voting module */}
            <View style={styles.votingModule}>
              <VotingModule
                filingId={filing.id}
                formType={filing.form_type}
                initialUserVote={filing.user_vote || null}
                initialVoteCounts={{
                  bullish: filing.vote_counts?.bullish || 0,
                  neutral: filing.vote_counts?.neutral || 0,
                  bearish: filing.vote_counts?.bearish || 0,
                }}
              />
            </View>
          </View>

        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // 🎨 MODIFIED: Reduced horizontal margin from spacing.md (16px) to spacing.xs (8px)
  container: {
    marginHorizontal: spacing.xs,  // Changed from spacing.md to spacing.xs (16px → 8px)
    marginBottom: spacing.sm,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.xl,  // 更大的圆角
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.gray200,
    ...shadows.md,
  },
  
  // Cover Image Styles
  coverImageContainer: {
    width: '100%',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
  },
  coverImage: {
    width: '100%',
    height: 180,
    borderRadius: borderRadius.lg,
  },
  
  // Company Info Section - 新布局
  companyInfoSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,
  },
  companyFirstRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xxs,
  },
  tickerWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  companySecondRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  companyNameWithBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
    flex: 1,
  },
  shareButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
  companyLeftSection: {
    flex: 1,
    marginRight: spacing.sm,
  },
  badgesSection: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: spacing.xxs,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  
  // Filing Badge - 实心颜色样式（保留原有辨识度）
  filingBadgeOutline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  filingBadgeOutlineText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  
  // Timestamp - 无背景框，右对齐
  timestampText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.gray500,
  },
  
  // Index Badge - 实心颜色样式（保留原有辨识度）
  indexBadgeOutline: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
    backgroundColor: 'rgba(129, 140, 248, 0.9)',  // S&P 500 紫色
  },
  indexBadgeOutlineText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    color: '#1E1B4B',
  },
  nasdaqBadgeOutline: {
    backgroundColor: 'rgba(16, 185, 129, 0.9)',  // NASDAQ 绿色
  },
  nasdaqBadgeOutlineText: {
    color: '#14532D',
  },
  
  // Ticker & Company Name
  ticker: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray500,
    fontWeight: typography.fontWeight.regular,
    fontStyle: 'italic',
  },
  
  // Footer stats positioning
  footerStatsContainer: {
    position: 'absolute',
    top: spacing.xs,
    right: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.9)',
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: colors.gray300,
  },
  
  // 保留旧样式以防其他地方使用
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    backgroundColor: colors.gray50,
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing.xs,
  },
  companyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
    flexWrap: 'wrap',
  },
  filingBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  filingBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  v2Badge: {
    backgroundColor: colors.primary + '20',
    padding: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  
  // ENHANCED: Urgency indicator styles with different levels
  urgencyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  urgentIndicator: {
    backgroundColor: colors.error + '20',
  },
  recentIndicator: {
    backgroundColor: colors.warning + '20',
  },
  urgencyText: {
    fontSize: 8,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 2,
    letterSpacing: 0.5,
  },
  urgentText: {
    color: colors.error,
  },
  recentText: {
    color: colors.warning,
  },
  
  headerRight: {
    alignItems: 'flex-end',
  },
  date: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
  },
  
  // ENHANCED: Time indicator styles based on recency
  recentTimeText: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  moderateTimeText: {
    color: colors.warning,
    fontWeight: typography.fontWeight.medium,
  },
  normalTimeText: {
    color: colors.gray500,
  },
  
  // ENHANCED: Detection indicator
  detectionIndicator: {
    fontSize: 8,
    color: colors.gray400,
    marginTop: 1,
    fontStyle: 'italic',
  },
  
  // Content Styles
  content: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xxs,  // 从 xs 减小
    paddingBottom: spacing.xs,  // 从 sm 减小
  },
  
  // Headline - 大标题
  headline: {
    fontSize: typography.fontSize.base,  // 从 lg 减小到 base
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    lineHeight: typography.fontSize.base * 1.35,
    marginBottom: spacing.xs,
    fontFamily: 'Times New Roman',
  },
  
  // Subtext - 小标题/摘要
  subtext: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.gray600,
    lineHeight: typography.fontSize.sm * 1.5,
    marginBottom: spacing.sm,
    fontFamily: 'Times New Roman',
  },
  
  // Meta Row - Keywords + Date
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  
  // 保留旧样式
  summarySection: {
    marginBottom: spacing.xs,
  },
  eventLabel: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.primary,
  },
  summaryText: {
    fontSize: typography.fontSize.base,
    color: colors.gray800,
    lineHeight: typography.fontSize.base * 1.5,
    fontFamily: typography.fontFamily.serif,
    // numberOfLines property removed to allow full text display
    // Card height will now adapt to content length
  },
  
  // ENHANCED: Keywords Row - 更低调紧凑的样式
  keywordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  keywordIcon: {
    marginRight: 4,
    opacity: 0.6,
  },
  keywordBadge: {
    backgroundColor: colors.gray100,
    borderColor: colors.gray300,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.md,
  },
  keywordText: {
    fontSize: 11,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
  },
  moreKeywordsText: {
    fontSize: 11,
    color: colors.gray400,
    fontStyle: 'italic',
    marginLeft: 2,
  },
  
  // Metrics Row
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
    marginBottom: spacing.xs,
    paddingVertical: spacing.xxs,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  metricLabel: {
    fontSize: 11,
    color: colors.gray600,
    marginLeft: 4,
    fontWeight: typography.fontWeight.medium,
  },
  
  // Footer - 🔥 FIXED: Left align voting module
  footer: {
    position: 'relative', // Enable absolute positioning for stats
    backgroundColor: colors.gray50,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: 'flex-start', // 🔥 FIXED: Left align voting module
    alignItems: 'flex-start',     // 🔥 FIXED: Left align voting module
  },
  votingModule: {
    // 🔥 FIXED: Voting module will now be left-aligned
  },
});