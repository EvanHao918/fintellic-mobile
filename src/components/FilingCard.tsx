// src/components/FilingCard.tsx
// ENHANCED: Display AI-extracted keywords on filing cards
// ENHANCED: Use detected_at timestamp for precise timing display
// ENHANCED: Show specific datetime format instead of relative time
// 🔥 FIXED: Move stats display to top-right to avoid overlap with bearish button
// 🔥 FIXED: Left align voting module in footer

import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { Filing } from '../types';
import { VotingModule, StatsDisplay } from './interactions';
import { getDisplaySummary } from '../utils/textHelpers';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius, shadows, filingTypes, sentiments } = themeConfig;

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

          {/* Compact Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.companyRow}>
                <Text style={styles.ticker}>{filing.company_ticker}</Text>
                <View style={[styles.filingBadge, { backgroundColor: filingConfig.color }]}>
                  <Text style={styles.filingBadgeText}>{filingConfig.label}</Text>
                </View>
                {/* Add v2 indicator if using unified analysis */}
                {filing.analysis_version === 'v2' && (
                  <View style={styles.v2Badge}>
                    <Icon name="auto-awesome" size={12} color={colors.primary} />
                  </View>
                )}
                {/* ENHANCED: Add enhanced urgency indicator */}
                {getUrgencyIndicator()}
              </View>
              <View style={styles.companyInfoRow}>
                <Text style={styles.companyName} numberOfLines={1}>
                  {filing.company_name}
                </Text>
                {/* 添加指数标签 */}
                {(filing.company?.is_sp500 || filing.company?.is_nasdaq100) && (
                  <View style={styles.indexTagsContainer}>
                    {filing.company?.is_sp500 && (
                      <View style={[styles.indexTag, styles.sp500Tag]}>
                        <Text style={[styles.indexTagText, styles.sp500TagText]}>S&P 500</Text>
                      </View>
                    )}
                    {filing.company?.is_nasdaq100 && (
                      <View style={[styles.indexTag, styles.nasdaqTag]}>
                        <Text style={[styles.indexTagText, styles.nasdaqTagText]}>NASDAQ</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </View>
            <View style={styles.headerRight}>
              <Text style={[styles.date, getTimeIndicatorStyle()]}>{formatDate(filing)}</Text>
              {/* ENHANCED: Show detection age indicator if available */}
              {filing.detection_age_minutes !== null && filing.detection_age_minutes !== undefined && (
                <Text style={styles.detectionIndicator}>
                  {filing.detection_age_minutes < 60 ? `${filing.detection_age_minutes}m ago` : `${Math.floor(filing.detection_age_minutes / 60)}h ago`}
                </Text>
              )}
            </View>
          </View>

          {/* Main Content */}
          <View style={styles.content}>
            {/* Summary with event type */}
            <View style={styles.summarySection}>
              {eventType && filing.form_type === '8-K' && (
                <Text style={styles.eventLabel}>{eventType}: </Text>
              )}
              <Text style={styles.summaryText} numberOfLines={3}>
                {summaryText}
              </Text>
            </View>

            {/* ENHANCED: Keywords Section - 显示AI提取的关键词 */}
            {displayKeywords.length > 0 && (
              <View style={styles.keywordsRow}>
                <Icon 
                  name="local-offer" 
                  size={10}              // 更小的图标
                  color={colors.gray400} // 更淡的颜色
                  style={styles.keywordIcon}
                />
                {displayKeywords.map((keyword: string, index: number) => (
                  <View key={index} style={styles.keywordBadge}>
                    <Text style={styles.keywordText}>{keyword}</Text>
                  </View>
                ))}
                {filing.tags && filing.tags.length > 3 && (
                  <Text style={styles.moreKeywordsText}>+{filing.tags.length - 3}</Text>
                )}
              </View>
            )}

            {/* Key Info Row - 使用宽松存在的字段 */}
            {(filing.form_type === '10-Q' && filing.expectations_comparison) ||
             (filing.form_type === '10-K' && filing.fiscal_year) ||
             (filing.form_type === '8-K' && filing.items && filing.items.length > 0) ||
             filing.financial_highlights ||
             filing.guidance_update ||
             filing.future_outlook ||
             (filing.risk_factors && filing.risk_factors.length > 0) ? (
              <View style={styles.metricsRow}>
              {/* 财务类型特定信息 */}
              {filing.form_type === '10-Q' && filing.expectations_comparison && (
                <View style={styles.metricItem}>
                  <Icon name="assessment" size={12} color={colors.primary} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Beat/Miss</Text>
                </View>
              )}
              
              {filing.form_type === '10-K' && filing.fiscal_year && (
                <View style={styles.metricItem}>
                  <Icon name="event" size={12} color={colors.gray600} />
                  <Text style={styles.metricLabel} numberOfLines={1}>FY {filing.fiscal_year}</Text>
                </View>
              )}
              
              {filing.form_type === '8-K' && filing.items && filing.items.length > 0 && (
                <View style={styles.metricItem}>
                  <Icon name="announcement" size={12} color={colors.warning} />
                  <Text style={styles.metricLabel} numberOfLines={1}>{filing.items[0]}</Text>
                </View>
              )}
              
              {filing.financial_highlights && (
                <View style={styles.metricItem}>
                  <Icon name="attach-money" size={12} color={colors.success} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Financials</Text>
                </View>
              )}
              
              {(filing.guidance_update || filing.future_outlook) && (
                <View style={styles.metricItem}>
                  <Icon name="trending-up" size={12} color={colors.primary} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Guidance</Text>
                </View>
              )}
              
              {filing.risk_factors && filing.risk_factors.length > 0 && (
                <View style={styles.metricItem}>
                  <Icon name="warning" size={12} color={colors.error} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Risks</Text>
                </View>
              )}
            </View>
            ) : null}
          </View>

          {/* Compact Footer - 🔥 FIXED: Left align voting module */}
          <View style={styles.footer}>
            {/* 🔥 FIXED: Stats Display positioned in footer top-right */}
            <View style={styles.footerStatsContainer}>
              <StatsDisplay
                commentCount={filing.comment_count || 0}
                viewCount={filing.view_count || 0}
                onCommentPress={() => onPress(filing)}
                isProUser={isProUser}
                mode="compact"
              />
            </View>
            
            {/* 🔥 FIXED: Voting module now left-aligned */}
            <VotingModule
              filingId={filing.id}
              initialVoteCounts={filing.vote_counts}
              initialUserVote={filing.user_vote}
              mode="compact"
              style={styles.votingModule}
            />
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.sm,
    marginHorizontal: spacing.xs,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray100,
    ...shadows.sm,
    overflow: 'hidden',
  },
  
  // 🔥 NEW: Footer stats container positioned in top-right of footer
  footerStatsContainer: {
    position: 'absolute',
    top: spacing.xs, // 🔥 FIXED: Position inside footer, not above it
    right: spacing.sm,
    zIndex: 10,
    backgroundColor: 'rgba(248, 250, 252, 0.9)', // Match footer background better
    borderRadius: borderRadius.sm, // 🔥 FIXED: Use borderRadius.sm instead of xs
    paddingHorizontal: spacing.xs,
    paddingVertical: 1,
    borderWidth: 0.5,
    borderColor: colors.gray300,
  },
  
  // Header Styles - Compact
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
  ticker: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray900,
    marginRight: spacing.xs,
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
  
  companyInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
    fontStyle: 'italic',
    marginRight: spacing.xs,
  },
  
  // 指数标签样式
  indexTagsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indexTag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
    marginRight: 4,
  },
  sp500Tag: {
    backgroundColor: 'rgba(129, 140, 248, 0.85)',
  },
  nasdaqTag: {
    backgroundColor: 'rgba(16, 185, 129, 0.85)',
  },
  indexTagText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  sp500TagText: {
    color: '#1E1B4B',
  },
  nasdaqTagText: {
    color: '#14532D',
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
  
  // Content Styles - Dense
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,  // 减少底部边距
  },
  summarySection: {
    marginBottom: spacing.xs,     // 减少摘要下方的边距
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
    fontFamily: 'Times New Roman, serif',
  },
  
  // ENHANCED: Keywords Row - 更低调紧凑的样式
  keywordsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: -2,                // 负边距，更贴近上方内容
    marginBottom: 2,              // 极小的底部边距（从4减到2）
  },
  keywordIcon: {
    marginRight: 4,
    opacity: 0.6,                 // 图标更淡
  },
  keywordBadge: {
    backgroundColor: colors.gray100,  // 更淡的灰色背景
    borderColor: colors.gray200,      // 淡边框 
    borderWidth: 0.5,                 // 更细的边框 
    paddingHorizontal: 6,             // 更小的水平内边距
    paddingVertical: 1,               // 极小的垂直内边距
    borderRadius: 3,                  // 更小的圆角
    marginRight: 4,
  },
  keywordText: {
    fontSize: 10,                     // 更小的字体
    color: colors.gray600,            // 更淡的文字颜色
    fontWeight: typography.fontWeight.medium,  // 中等粗细的字体
    letterSpacing: 0.1,
    lineHeight: 12,                   // 更紧凑的行高
  },
  moreKeywordsText: {
    fontSize: 9,                      // 更小
    color: colors.gray400,            // 更淡
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