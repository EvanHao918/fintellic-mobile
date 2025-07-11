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
  onVote?: (filingId: string, voteType: 'bullish' | 'neutral' | 'bearish') => void;
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
  
  // Get filing type configuration
  const filingConfig = filingTypes[filing.filing_type] || {
    color: colors.gray500,
    label: filing.filing_type,
  };
  
  // Get sentiment configuration with emoji mapping
  const getSentimentEmoji = (tone: string) => {
    switch (tone) {
      case 'bullish':
        return '😊';
      case 'bearish':
        return '😟';
      case 'neutral':
      default:
        return '😐';
    }
  };
  
  const sentimentConfig = filing.management_tone 
    ? {
        ...sentiments[filing.management_tone],
        emoji: getSentimentEmoji(filing.management_tone)
      }
    : {
        ...sentiments.neutral,
        emoji: getSentimentEmoji('neutral')
      };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) {
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      return diffInMinutes === 0 ? 'Just now' : `${diffInMinutes}m ago`;
    } else if (diffInHours < 24) {
      return `${diffInHours} hours ago`;
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
  const eventType = filing.filing_type === '8-K' && filing.event_type 
    ? filing.event_type 
    : null;

  // Extract important tags
  const tags = filing.key_insights?.slice(0, 3);

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
          {/* Header Section */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View style={styles.companyInfo}>
                <Text style={styles.ticker}>{filing.company_ticker}</Text>
                <Text style={styles.dot}> · </Text>
                <Text style={styles.companyName}>{filing.company_name}</Text>
              </View>
              <View style={[styles.filingBadge, { backgroundColor: filingConfig.color }]}>
                <Text style={styles.filingBadgeText}>{filingConfig.label}</Text>
              </View>
            </View>
            
            <View style={styles.headerBottom}>
              <Text style={styles.indices}>S&P 500 · NASDAQ 100</Text>
              <Text style={styles.date}>{formatDate(filing.filing_date)}</Text>
              {eventType && filing.filing_type === '8-K' && (
                <>
                  <Text style={styles.dot}> · </Text>
                  <Text style={styles.eventType}>{eventType}</Text>
                </>
              )}
            </View>
          </View>

          {/* Main Content Section */}
          <View style={styles.content}>
            {/* AI Summary */}
            <View style={styles.summarySection}>
              <Text style={styles.summaryIcon}>📝</Text>
              <Text style={styles.summaryText} numberOfLines={2}>
                {filing.ai_summary || 'Processing summary...'}
              </Text>
            </View>

            {/* Management Tone */}
            {filing.management_tone && (
              <View style={styles.toneSection}>
                <Text style={styles.toneEmoji}>{getSentimentEmoji(filing.management_tone)}</Text>
                <Text style={styles.toneLabel}>Management Tone: </Text>
                <Text style={[styles.toneValue, { color: sentimentConfig.color }]}>
                  {sentimentConfig.label}
                </Text>
              </View>
            )}

            {/* Tags */}
            {tags && tags.length > 0 && (
              <View style={styles.tagsSection}>
                <Text style={styles.tagIcon}>🏷️</Text>
                <View style={styles.tagsList}>
                  {tags.map((tag, index) => (
                    <Text key={index} style={styles.tag}>{tag}</Text>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* Footer Section - Voting */}
          <View style={styles.footer}>
            <Text style={styles.voteQuestion}>How do you see it?</Text>
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'bullish' && styles.voteButtonActive
                ]}
                onPress={() => onVote?.(filing.id, 'bullish')}
              >
                <Text style={styles.voteEmoji}>😊</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'bullish' && styles.voteLabelActive
                ]}>Bullish</Text>
                <Text style={styles.voteCount}>{voteCounts.bullish || '?'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'neutral' && styles.voteButtonActive
                ]}
                onPress={() => onVote?.(filing.id, 'neutral')}
              >
                <Text style={styles.voteEmoji}>😐</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'neutral' && styles.voteLabelActive
                ]}>Neutral</Text>
                <Text style={styles.voteCount}>{voteCounts.neutral || '?'}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'bearish' && styles.voteButtonActive
                ]}
                onPress={() => onVote?.(filing.id, 'bearish')}
              >
                <Text style={styles.voteEmoji}>😟</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'bearish' && styles.voteLabelActive
                ]}>Bearish</Text>
                <Text style={styles.voteCount}>{voteCounts.bearish || '?'}</Text>
              </TouchableOpacity>
            </View>

            {/* Comments Section */}
            <TouchableOpacity 
              style={styles.commentsSection}
              onPress={() => onPress(filing)}
            >
              <View style={styles.commentsLeft}>
                <Icon name="chat-bubble-outline" size={16} color={colors.textSecondary} />
                <Text style={styles.commentsCount}>45 comments</Text>
                {!isProUser && <Text style={styles.membersOnly}> · Members only</Text>}
              </View>
              {!isProUser && (
                <Icon name="lock" size={14} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    ...shadows.md,
    overflow: 'hidden',
  },
  
  // Header Styles
  header: {
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  ticker: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  dot: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    flex: 1,
  },
  filingBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  filingBadgeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  headerBottom: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indices: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  date: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  eventType: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  
  // Content Styles
  content: {
    padding: spacing.md,
  },
  summarySection: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  summaryIcon: {
    fontSize: typography.fontSize.md,
    marginRight: spacing.xs,
  },
  summaryText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  toneSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  toneEmoji: {
    fontSize: typography.fontSize.md,
    marginRight: spacing.xs,
  },
  toneLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  toneValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  tagsSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  tagIcon: {
    fontSize: typography.fontSize.md,
    marginRight: spacing.xs,
  },
  tagsList: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginRight: spacing.sm,
    marginBottom: spacing.xs,
  },
  
  // Footer Styles
  footer: {
    padding: spacing.md,
    paddingTop: 0,
  },
  voteQuestion: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  voteButton: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  voteButtonActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary,
  },
  voteEmoji: {
    fontSize: typography.fontSize.xl,
    marginBottom: spacing.xs,
  },
  voteLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  voteLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  voteCount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  
  // Comments Section
  commentsSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  commentsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  membersOnly: {
    fontSize: typography.fontSize.sm,
    color: colors.gray400,
  },
});