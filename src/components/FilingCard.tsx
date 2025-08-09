// src/components/FilingCard.tsx
// ENHANCED: Display AI-extracted keywords on filing cards

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
  // 添加调试日志
  console.log(`Filing ${filing.id} 数据:`, {
    id: filing.id,
    ticker: filing.company_ticker,
    tags: filing.tags,  // 查看tags内容
    view_count: filing.view_count,
    comment_count: filing.comment_count,
    vote_counts: filing.vote_counts,
    analysis_version: filing.analysis_version,
    has_unified_feed_summary: !!filing.unified_feed_summary
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

  // Format date
  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
      });
    }
  };

  // Extract event type for 8-K filings
  const eventType = filing.form_type === '8-K' && filing.item_type 
    ? filing.item_type 
    : null;

  // 使用 tags 字段（后端返回的字段名）
  const displayKeywords = filing.tags?.slice(0, 3) || [];

  // 获取显示的摘要文本 - 使用新的优先级逻辑
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
              <Text style={styles.date}>{formatDate(filing.filing_date)}</Text>
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

            {/* Key Info Row - 使用实际存在的字段 */}
            {(filing.form_type === '10-Q' && filing.expectations_comparison) ||
             (filing.form_type === '10-K' && filing.fiscal_year) ||
             (filing.form_type === '8-K' && filing.items && filing.items.length > 0) ||
             filing.financial_highlights ||
             filing.guidance_update ||
             filing.future_outlook ||
             (filing.risk_factors && filing.risk_factors.length > 0) ? (
              <View style={styles.metricsRow}>
              {/* 财报类型特定信息 */}
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

          {/* Compact Footer */}
          <View style={styles.footer}>
            {/* 使用新的独立 VotingModule - 提示文字会自动显示 */}
            <VotingModule
              filingId={filing.id}
              initialVoteCounts={filing.vote_counts}
              initialUserVote={filing.user_vote}
              mode="compact"
              style={styles.votingModule}
            />
            
            {/* 使用 StatsDisplay 组件 */}
            <StatsDisplay
              commentCount={filing.comment_count || 0}
              viewCount={filing.view_count || 0}
              onCommentPress={() => onPress(filing)}
              isProUser={isProUser}
              mode="compact"
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
  },
  filingBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  v2Badge: {
    marginLeft: spacing.xs,
    backgroundColor: colors.primary + '20',
    padding: 2,
    borderRadius: borderRadius.sm,
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
    color: colors.gray500,
  },
  
  // Content Styles - Dense
  content: {
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxs,  // 减少底部内边距
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
  
  // ENHANCED: Keywords Row - 更低调、紧凑的样式
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
    fontWeight: typography.fontWeight.medium,  // 不那么粗的字体
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
  
  // Footer - Compact
  footer: {
    backgroundColor: colors.gray50,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  votingModule: {
    flex: 1,
  },
});