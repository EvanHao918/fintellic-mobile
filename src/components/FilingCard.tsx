// src/components/FilingCard.tsx
import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Text, Icon } from 'react-native-elements';
import { Filing } from '../types';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius, shadows, filingTypes, sentiments } = themeConfig;

interface FilingCardProps {
  filing: Filing;
  onPress: (filing: Filing) => void;
  onVote?: (filingId: number, voteType: 'bullish' | 'neutral' | 'bearish') => void;
  voteCounts?: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  userVote?: 'bullish' | 'neutral' | 'bearish' | null;
  isProUser?: boolean;
}

export default function FilingCard({ 
  filing, 
  onPress, 
  onVote, 
  voteCounts = { bullish: 0, neutral: 0, bearish: 0 },
  userVote = null,
  isProUser = false 
}: FilingCardProps) {
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

  // Extract important tags
  const tags = filing.key_tags?.slice(0, 3) || [];

  // 获取显示的摘要文本
  const summaryText = filing.one_liner || filing.ai_summary || filing.feed_summary || 'Processing summary...';

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

  // 使用从 API 返回的 vote_counts
  const displayVoteCounts = filing.vote_counts || voteCounts;

  // 计算总投票数
  const totalVotes = displayVoteCounts.bullish + displayVoteCounts.neutral + displayVoteCounts.bearish;
  
  // 计算百分比
  const getVotePercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  // 从filing中提取关键信息作为指标展示
  const hasFinancials = filing.financial_highlights && 
    (filing.financial_highlights.revenue || filing.financial_highlights.eps || filing.financial_highlights.net_income);
  
  const hasGuidance = filing.guidance_update || filing.future_outlook;
  
  const hasRiskFactors = filing.risk_factors && filing.risk_factors.length > 0;
  
  // 检查是否有期望对比（季报特有）
  const hasExpectations = filing.expectations_comparison || filing.beat_miss_analysis;

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
              </View>
              <Text style={styles.companyName} numberOfLines={1}>
                {filing.company_name}
              </Text>
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

            {/* Key Info Row - 使用实际存在的字段 */}
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
              
              {hasFinancials && (
                <View style={styles.metricItem}>
                  <Icon name="attach-money" size={12} color={colors.success} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Financials</Text>
                </View>
              )}
              
              {hasGuidance && (
                <View style={styles.metricItem}>
                  <Icon name="trending-up" size={12} color={colors.primary} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Guidance</Text>
                </View>
              )}
              
              {hasRiskFactors && (
                <View style={styles.metricItem}>
                  <Icon name="warning" size={12} color={colors.error} />
                  <Text style={styles.metricLabel} numberOfLines={1}>Risks</Text>
                </View>
              )}
            </View>

            {/* Tags */}
            {tags.length > 0 && (
              <View style={styles.tagsRow}>
                {tags.map((tag: string, index: number) => (
                  <View key={index} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
                {filing.key_tags && filing.key_tags.length > 3 && (
                  <Text style={styles.moreTagsText}>+{filing.key_tags.length - 3} more</Text>
                )}
              </View>
            )}
          </View>

          {/* Compact Footer */}
          <View style={styles.footer}>
            {/* Voting Section */}
            <View style={styles.voteSection}>
              <View style={styles.voteButtons}>
                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    userVote === 'bullish' && styles.voteButtonActive,
                    userVote === 'bullish' && { borderColor: colors.bullish }
                  ]}
                  onPress={() => onVote?.(filing.id, 'bullish')}
                >
                  <Text style={styles.voteEmoji}>😊</Text>
                  <Text style={[styles.voteCount, userVote === 'bullish' && { color: colors.bullish }]}>
                    {displayVoteCounts.bullish}
                  </Text>
                  {totalVotes > 0 && (
                    <Text style={[styles.votePercentage, userVote === 'bullish' && { color: colors.bullish }]}>
                      {getVotePercentage(displayVoteCounts.bullish)}%
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    userVote === 'neutral' && styles.voteButtonActive,
                    userVote === 'neutral' && { borderColor: colors.neutral }
                  ]}
                  onPress={() => onVote?.(filing.id, 'neutral')}
                >
                  <Text style={styles.voteEmoji}>😐</Text>
                  <Text style={[styles.voteCount, userVote === 'neutral' && { color: colors.neutral }]}>
                    {displayVoteCounts.neutral}
                  </Text>
                  {totalVotes > 0 && (
                    <Text style={[styles.votePercentage, userVote === 'neutral' && { color: colors.neutral }]}>
                      {getVotePercentage(displayVoteCounts.neutral)}%
                    </Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.voteButton,
                    userVote === 'bearish' && styles.voteButtonActive,
                    userVote === 'bearish' && { borderColor: colors.bearish }
                  ]}
                  onPress={() => onVote?.(filing.id, 'bearish')}
                >
                  <Text style={styles.voteEmoji}>😟</Text>
                  <Text style={[styles.voteCount, userVote === 'bearish' && { color: colors.bearish }]}>
                    {displayVoteCounts.bearish}
                  </Text>
                  {totalVotes > 0 && (
                    <Text style={[styles.votePercentage, userVote === 'bearish' && { color: colors.bearish }]}>
                      {getVotePercentage(displayVoteCounts.bearish)}%
                    </Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Comments and Stats */}
              <View style={styles.statsRow}>
                <TouchableOpacity style={styles.statItem} onPress={() => onPress(filing)}>
                  <Icon name="chat-bubble-outline" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{filing.comment_count || 0}</Text>
                </TouchableOpacity>
                
                <View style={styles.statItem}>
                  <Icon name="visibility" size={14} color={colors.textSecondary} />
                  <Text style={styles.statText}>{filing.view_count || totalVotes || 0}</Text>
                </View>

                {!isProUser && (
                  <View style={styles.proIndicator}>
                    <Icon name="lock" size={12} color={colors.warning} />
                    <Text style={styles.proText}>PRO</Text>
                  </View>
                )}
              </View>
            </View>
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
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.gray600,
    fontWeight: typography.fontWeight.medium,
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
    paddingVertical: spacing.xs,
  },
  summarySection: {
    marginBottom: spacing.sm,
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
  },
  
  // Metrics Row - 始终显示，但内容根据财报类型动态变化
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
  
  // Tags - Compact
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xxs,
    marginBottom: spacing.xxs,
  },
  tagText: {
    fontSize: 10,
    color: colors.primary,
    fontWeight: typography.fontWeight.medium,
  },
  moreTagsText: {
    fontSize: 10,
    color: colors.gray500,
    fontStyle: 'italic',
    marginLeft: spacing.xxs,
  },
  
  // Footer - Compact
  footer: {
    backgroundColor: colors.gray50,
    borderTopWidth: 1,
    borderTopColor: colors.gray100,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  voteSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteButtons: {
    flexDirection: 'row',
    flex: 1,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    marginRight: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  voteButtonActive: {
    backgroundColor: colors.primary + '08',
    borderWidth: 1.5,
  },
  voteEmoji: {
    fontSize: 14,
    marginRight: 4,
  },
  voteCount: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray700,
    marginRight: 2,
  },
  votePercentage: {
    fontSize: 10,
    color: colors.gray500,
  },
  
  // Stats Row
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginLeft: 4,
  },
  proIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  proText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 2,
  },
});