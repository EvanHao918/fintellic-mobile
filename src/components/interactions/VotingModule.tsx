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

// 问题文本部分（支持加粗）
interface QuestionPart {
  text: string;
  bold?: boolean;
}

// 投票选项配置接口
interface VotingOption {
  type: 'bullish' | 'neutral' | 'bearish';
  label: string;
  emoji: string;
}

// 投票配置接口
interface VotingConfig {
  question: QuestionPart[];  // 支持富文本
  options: VotingOption[];
}

// 根据文件类型获取定制化配置
const getVotingConfig = (formType: string): VotingConfig => {
  switch (formType) {
    case '10-Q':
      return {
        question: [
          { text: 'Market reaction', bold: true },
          { text: ' to this quarter?' }
        ],
        options: [
          { type: 'bullish', label: 'Bullish', emoji: '🚀' },
          { type: 'neutral', label: 'Neutral', emoji: '🤷' },
          { type: 'bearish', label: 'Bearish', emoji: '📉' }
        ]
      };
    case '10-K':
      return {
        question: [
          { text: 'Will this annual drive ' },
          { text: 'momentum', bold: true },
          { text: '?' }
        ],
        options: [
          { type: 'bullish', label: 'Yes', emoji: '🚀' },
          { type: 'neutral', label: 'Maybe', emoji: '🤷' },
          { type: 'bearish', label: 'No', emoji: '📉' }
        ]
      };
    case '8-K':
      return {
        question: [
          { text: 'Will this ' },
          { text: 'event', bold: true },
          { text: ' move the ' },
          { text: 'stock', bold: true },
          { text: '?' }
        ],
        options: [
          { type: 'bullish', label: 'Bullish', emoji: '🚀' },
          { type: 'neutral', label: 'Neutral', emoji: '🤷' },
          { type: 'bearish', label: 'Bearish', emoji: '📉' }
        ]
      };
    case 'S-1':
      return {
        question: [
          { text: 'Will this be ' },
          { text: 'Next ' },
          { text: 'unicorn', bold: true },
          { text: '?' }
        ],
        options: [
          { type: 'bullish', label: 'Bullish', emoji: '🚀' },
          { type: 'neutral', label: 'Neutral', emoji: '🤷' },
          { type: 'bearish', label: 'Bearish', emoji: '📉' }
        ]
      };
    default:
      return {
        question: [
          { text: 'How will the ' },
          { text: 'market react', bold: true },
          { text: ' to this filing?' }
        ],
        options: [
          { type: 'bullish', label: 'Bullish', emoji: '🚀' },
          { type: 'neutral', label: 'Neutral', emoji: '🤷' },
          { type: 'bearish', label: 'Bearish', emoji: '📉' }
        ]
      };
  }
};

interface VotingModuleProps {
  filingId: number;
  formType: string;  // 新增：文件类型
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
  formType,
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

  // 获取定制化配置
  const votingConfig = getVotingConfig(formType);

  // 构建投票选项（结合配置和数据）
  const voteOptions = votingConfig.options.map(option => ({
    type: option.type,
    emoji: option.emoji,
    label: option.label,
    color: option.type === 'bullish' ? colors.bullish : 
           option.type === 'neutral' ? colors.neutral : colors.bearish,
    count: voteCounts[option.type],
  }));

  return (
    <View style={[styles.container, mode === 'full' && styles.containerFull, style]}>
      {/* 使用定制化问题文本（支持富文本） */}
      <View style={styles.promptContainer}>
        <Text style={[styles.promptText, mode === 'full' && styles.promptTextFull]}>
          {votingConfig.question.map((part, index) => (
            <Text 
              key={index} 
              style={part.bold ? styles.promptTextBold : undefined}
            >
              {part.text}
            </Text>
          ))}
        </Text>
      </View>
      
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
                styles.voteLabel,
                mode === 'full' && styles.voteLabelFull,
                isSelected && { color: option.color }
              ]}>
                {option.label}
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
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  containerFull: {
    alignItems: 'stretch',
  },
  promptContainer: {
    marginBottom: spacing.xs,
  },
  promptText: {
    fontSize: 14,  // 🔥 增大到 18px
    color: colors.textSecondary,
    lineHeight: 18 * 1.4,
  },
  promptTextFull: {
    fontSize: 18,  // 🔥 full 模式也用 18px
    lineHeight: 18 * 1.4,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  promptTextBold: {
    fontWeight: '700',  // 🔥 加粗字重
    color: colors.text,  // 🔥 加粗部分用主文字颜色
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
  // 🔥 新增：投票标签样式
  voteLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.gray700,
    fontWeight: '500',
  },
  voteLabelFull: {
    fontSize: typography.fontSize.sm,
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