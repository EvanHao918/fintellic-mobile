import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Comment } from '../types';
import { colors, typography, spacing, borderRadius } from '../theme';
import { voteOnComment, updateComment, deleteComment } from '../api/filings';
import { formatDistanceToNow } from '../utils/dateHelpers';

interface CommentItemProps {
  comment: Comment;
  currentUserId?: string;
  onReply: (comment: Comment) => void;
  onUpdate?: (updatedComment: Comment) => void;
  onDelete?: (commentId: string) => void;
}

export const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUserId,
  onReply,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isVoting, setIsVoting] = useState(false);
  const [localComment, setLocalComment] = useState(comment);

  const isOwnComment = currentUserId === comment.user_id;
  const timeAgo = formatDistanceToNow(comment.created_at);

  // Handle voting - 修复版本
  const handleVote = async (voteType: 'upvote' | 'downvote') => {
    if (isVoting) return;

    setIsVoting(true);
    try {
      // 获取当前投票状态
      const currentVote = typeof localComment.user_vote === 'number' 
        ? localComment.user_vote 
        : localComment.user_vote === 'up' ? 1 
        : localComment.user_vote === 'down' ? -1 
        : 0;
      
      // 判断是否要取消投票
      const isRemovingVote = 
        (voteType === 'upvote' && currentVote === 1) ||
        (voteType === 'downvote' && currentVote === -1);
      
      // 决定新的投票类型
      let apiVoteType: 'up' | 'down' | 'none';
      if (isRemovingVote) {
        apiVoteType = 'none';  // 取消投票
      } else {
        apiVoteType = voteType === 'upvote' ? 'up' : 'down';
      }
      
      const response = await voteOnComment(comment.id, apiVoteType);
      
      // 更新本地状态
      setLocalComment(prev => ({
        ...prev,
        upvotes: response.upvotes || 0,
        downvotes: response.downvotes || 0,
        net_votes: response.net_votes || 0,
        user_vote: response.user_vote,
      }));
    } catch (error) {
      console.error('Failed to vote on comment:', error);
      Alert.alert('Error', 'Failed to vote on comment');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle edit
  const handleEdit = async () => {
    if (!editContent.trim()) {
      Alert.alert('Error', 'Comment cannot be empty');
      return;
    }

    try {
      const updatedComment = await updateComment(comment.id, editContent);
      setLocalComment(updatedComment);
      setIsEditing(false);
      onUpdate?.(updatedComment);
    } catch (error) {
      console.error('Failed to update comment:', error);
      Alert.alert('Error', 'Failed to update comment');
    }
  };

  // Handle delete
  const handleDelete = () => {
    Alert.alert(
      'Delete Comment',
      'Are you sure you want to delete this comment?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteComment(comment.id);
              onDelete?.(comment.id);
            } catch (error) {
              console.error('Failed to delete comment:', error);
              Alert.alert('Error', 'Failed to delete comment');
            }
          },
        },
      ]
    );
  };

  // Convert user_vote to number for comparison
  const userVoteNum = typeof localComment.user_vote === 'number' 
    ? localComment.user_vote 
    : localComment.user_vote === 'up' ? 1 
    : localComment.user_vote === 'down' ? -1 
    : 0;

  return (
    <View style={styles.container}>
      {/* Reply indicator */}
      {localComment.reply_to && (
        <View style={styles.replyIndicator}>
          <Icon name="reply" size={14} color={colors.textSecondary} />
          <Text style={styles.replyText}>
            Replying to @{localComment.reply_to.username}
          </Text>
          <Text style={styles.replyPreview} numberOfLines={1}>
            "{localComment.reply_to.content_preview}"
          </Text>
        </View>
      )}

      {/* Comment header */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {localComment.username.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <View style={styles.usernameRow}>
              <Text style={styles.username}>{localComment.username}</Text>
              {localComment.user_tier === 'pro' && (
                <View style={styles.proBadge}>
                  <Text style={styles.proBadgeText}>PRO</Text>
                </View>
              )}
            </View>
            <Text style={styles.timestamp}>{timeAgo}</Text>
          </View>
        </View>

        {/* Actions menu for own comments */}
        {isOwnComment && localComment.is_editable && (
          <View style={styles.actions}>
            <TouchableOpacity
              onPress={() => setIsEditing(!isEditing)}
              style={styles.actionButton}
            >
              <Icon name="edit" size={16} color={colors.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.actionButton}
            >
              <Icon name="delete" size={16} color={colors.error} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Comment content */}
      {isEditing ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editContent}
            onChangeText={setEditContent}
            multiline
            autoFocus
          />
          <View style={styles.editActions}>
            <TouchableOpacity
              onPress={() => {
                setIsEditing(false);
                setEditContent(comment.content);
              }}
              style={[styles.editButton, styles.cancelButton]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handleEdit}
              style={[styles.editButton, styles.saveButton]}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <Text style={styles.content}>{localComment.content}</Text>
      )}

      {/* Comment footer with voting */}
      <View style={styles.footer}>
        <View style={styles.voteContainer}>
          <TouchableOpacity
            onPress={() => handleVote('upvote')}
            style={[
              styles.voteButton,
              userVoteNum === 1 && styles.voteButtonActive,
            ]}
            disabled={isVoting}
          >
            <Icon
              name="thumb-up"
              size={16}
              color={
                userVoteNum === 1 ? colors.primary : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.voteCount,
                userVoteNum === 1 && styles.voteCountActive,
              ]}
            >
              {localComment.upvotes || 0}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => handleVote('downvote')}
            style={[
              styles.voteButton,
              userVoteNum === -1 && styles.voteButtonActive,
            ]}
            disabled={isVoting}
          >
            <Icon
              name="thumb-down"
              size={16}
              color={
                userVoteNum === -1 ? colors.error : colors.textSecondary
              }
            />
            <Text
              style={[
                styles.voteCount,
                userVoteNum === -1 && styles.voteCountError,
              ]}
            >
              {localComment.downvotes || 0}
            </Text>
          </TouchableOpacity>

          {/* Net score */}
          <View style={styles.netScore}>
            <Text style={[
              styles.netScoreText,
              (localComment.net_votes || 0) > 0 && styles.netScorePositive,
              (localComment.net_votes || 0) < 0 && styles.netScoreNegative,
            ]}>
              {(localComment.net_votes || 0) > 0 ? '+' : ''}{localComment.net_votes || 0}
            </Text>
          </View>
        </View>

        {/* Reply button */}
        <TouchableOpacity
          onPress={() => onReply(localComment)}
          style={styles.replyButton}
        >
          <Icon name="reply" size={16} color={colors.textSecondary} />
          <Text style={styles.replyButtonText}>Reply</Text>
        </TouchableOpacity>
      </View>

      {isVoting && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.white,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    paddingLeft: spacing.md,
  },
  replyText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  replyPreview: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontStyle: 'italic',
    marginLeft: spacing.xs,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  avatarText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semibold,
  },
  usernameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  username: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  proBadge: {
    backgroundColor: colors.warning,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  proBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  timestamp: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  content: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  editContainer: {
    marginBottom: spacing.sm,
  },
  editInput: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.sm,
    padding: spacing.sm,
    fontSize: typography.fontSize.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  editActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: spacing.sm,
  },
  editButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  cancelButton: {
    backgroundColor: colors.backgroundSecondary,
  },
  cancelButtonText: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  saveButton: {
    backgroundColor: colors.primary,
  },
  saveButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  voteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    borderRadius: borderRadius.sm,
  },
  voteButtonActive: {
    backgroundColor: colors.backgroundSecondary,
  },
  voteCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  voteCountActive: {
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  voteCountError: {
    color: colors.error,
    fontFamily: typography.fontFamily.medium,
  },
  netScore: {
    marginLeft: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.backgroundSecondary,
  },
  netScoreText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  netScorePositive: {
    color: colors.success,
  },
  netScoreNegative: {
    color: colors.error,
  },
  replyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  replyButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});