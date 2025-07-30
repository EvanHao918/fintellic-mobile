// src/components/interactions/VotingModule.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useSelector } from 'react-redux';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { VoteType } from '../../types';
import { useFilingVote } from '../../hooks/useFilingVote';
import { RootState } from '../../store';

interface VotingModuleProps {
  filingId: number;
  initialVoteCounts?: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  initialUserVote?: VoteType | null;
  mode?: 'compact' | 'full';
  style?: ViewStyle;
  disabled?: boolean;
}

export const VotingModule: React.FC<VotingModuleProps> = ({
  filingId,
  initialVoteCounts = { bullish: 0, neutral: 0, bearish: 0 },
  initialUserVote = null,
  mode = 'compact',
  style,
  disabled = false,
}) => {
  // 本地状态管理投票数据
  const [voteCounts, setVoteCounts] = useState(initialVoteCounts);
  const [userVote, setUserVote] = useState<VoteType | null>(initialUserVote);
  const [isVoting, setIsVoting] = useState(false);
  
  // 使用投票 hook
  const { handleVote } = useFilingVote();
  
  // 从 Redux 获取最新的投票数据（如果存在）
  const filingFromStore = useSelector((state: RootState) => 
    state.filings.filings.find(f => f.id === filingId)
  );
  
  // 监听 Redux 变化，更新本地状态
  useEffect(() => {
    if (filingFromStore?.vote_counts) {
      setVoteCounts(filingFromStore.vote_counts);
    }
    if (filingFromStore?.user_vote !== undefined) {
      setUserVote(filingFromStore.user_vote || null);
    }
  }, [filingFromStore?.vote_counts, filingFromStore?.user_vote]);
  
  // 处理投票
  const onVote = async (voteType: 'bullish' | 'neutral' | 'bearish') => {
    if (disabled || isVoting) return;
    
    try {
      setIsVoting(true);
      const response = await handleVote(filingId, voteType);
      
      // 立即更新本地状态
      if (response) {
        setVoteCounts(response.vote_counts);
        setUserVote(response.user_vote);
      }
    } catch (error) {
      console.error('Vote failed:', error);
    } finally {
      setIsVoting(false);
    }
  };
  
  // 计算总投票数
  const totalVotes = voteCounts.bullish + voteCounts.neutral + voteCounts.bearish;
  
  // 计算百分比
  const getVotePercentage = (count: number) => {
    if (totalVotes === 0) return 0;
    return Math.round((count / totalVotes) * 100);
  };

  // 投票选项配置
  const voteOptions = [
    {
      type: 'bullish' as const,
      emoji: '😊',
      color: colors.bullish,
      count: voteCounts.bullish,
    },
    {
      type: 'neutral' as const,
      emoji: '😐',
      color: colors.neutral,
      count: voteCounts.neutral,
    },
    {
      type: 'bearish' as const,
      emoji: '😔',
      color: colors.bearish,
      count: voteCounts.bearish,
    },
  ];

  return (
    <View style={[styles.container, mode === 'full' && styles.containerFull, style]}>
      {mode === 'full' && totalVotes > 0 && (
        <Text style={styles.totalVotes}>{totalVotes} votes</Text>
      )}
      
      <View style={[styles.voteButtons, mode === 'full' && styles.voteButtonsFull]}>
        {voteOptions.map((option) => {
          const isSelected = userVote === option.type;
          const percentage = getVotePercentage(option.count);
          
          return (
            <TouchableOpacity
              key={option.type}
              style={[
                styles.voteButton,
                mode === 'full' && styles.voteButtonFull,
                isSelected && styles.voteButtonActive,
                isSelected && { borderColor: option.color },
                (disabled || isVoting) && styles.voteButtonDisabled,
              ]}
              onPress={() => onVote(option.type)}
              disabled={disabled || isVoting}
            >
              <Text style={[styles.voteEmoji, mode === 'full' && styles.voteEmojiFull]}>
                {option.emoji}
              </Text>
              <Text style={[
                styles.voteCount,
                mode === 'full' && styles.voteCountFull,
                isSelected && { color: option.color }
              ]}>
                {option.count}
              </Text>
              {totalVotes > 0 && (
                <Text style={[
                  styles.votePercentage,
                  mode === 'full' && styles.votePercentageFull,
                  isSelected && { color: option.color }
                ]}>
                  {percentage}%
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFull: {
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  totalVotes: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  voteButtons: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  voteButtonsFull: {
    justifyContent: 'space-around',
    gap: spacing.sm,
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xs,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
    gap: 4,
  },
  voteButtonFull: {
    flex: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    justifyContent: 'center',
  },
  voteButtonActive: {
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1.5,
  },
  voteButtonDisabled: {
    opacity: 0.6,
  },
  voteEmoji: {
    fontSize: 16,
  },
  voteEmojiFull: {
    fontSize: 20,
  },
  voteCount: {
    fontSize: typography.fontSize.xs,
    color: colors.gray700,
    fontWeight: '500',
  },
  voteCountFull: {
    fontSize: typography.fontSize.base,
  },
  votePercentage: {
    fontSize: 10,
    color: colors.textSecondary,
  },
  votePercentageFull: {
    fontSize: typography.fontSize.xs,
  },
});