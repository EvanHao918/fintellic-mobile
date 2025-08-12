import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  TextInput,
  Platform,
  Alert,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import { Filing, Comment, RootStackParamList, VisualData } from '../types';
import { getFilingById, getFilingComments, addComment } from '../api/filings';
import { AdaptiveChart } from '../components/charts';
import { CommentItem, VotingModule } from '../components';
import UpgradePromptModal from '../components/UpgradePromptModal';
import { getFilingDetailComponent } from '../components/filing-details';
import { useAddToHistory } from '../hooks/useHistory';

// Route types
type FilingDetailScreenRouteProp = RouteProp<RootStackParamList, 'FilingDetail'>;
type FilingDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FilingDetail'>;

// Add feature flag
const ENABLE_DIFFERENTIATED_DISPLAY = true;

export default function FilingDetailScreen() {
  const navigation = useNavigation<FilingDetailScreenNavigationProp>();
  const route = useRoute<FilingDetailScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get auth state from Redux
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState?.user || null;
  const token = authState?.token || null;
  const isProUser = user?.tier === 'pro';
  
  // Get filing ID from route params
  const { filingId } = route.params;
  
  // State
  const [filing, setFiling] = useState<Filing | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ views_today: number; daily_limit: number } | null>(null);
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);

  // Use the history hook to automatically add to history when filing is loaded
  useAddToHistory(filing);

  // Load filing details and comments
  const loadFilingDetails = async () => {
    try {
      // Load filing details using the API function
      const filingData = await getFilingById(filingId.toString());
      setFiling(filingData);
      
      // Load comments
      try {
        const commentsData = await getFilingComments(filingId.toString());
        setComments(commentsData.items || []);
      } catch (error) {
        console.log('No comments yet');
      }
      
    } catch (error: any) {
      console.error('Error loading filing details:', error);
      
      // 🔥 关键修改：处理限制错误，显示弹窗而不是导航
      if (error.isLimitError) {
        setLimitInfo(error.limitInfo);
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', 'Failed to load filing details');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reply
  const handleReply = (comment: Comment) => {
    setReplyingTo(comment);
    // Focus on comment input with @mention
    setNewComment(`@${comment.username} `);
  };

  const handleCancelReply = () => {
    setReplyingTo(null);
    setNewComment('');
  };

  // Handle comment submission with reply support
  const handleSubmitComment = async () => {
    if (!isProUser) {
      Alert.alert('Pro Feature', 'Comments are available for Pro members only');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      
      // Remove @mention from comment if replying
      let commentContent = newComment.trim();
      if (replyingTo) {
        // Remove the @username prefix if it exists
        const mentionPattern = new RegExp(`^@${replyingTo.username}\\s+`);
        commentContent = commentContent.replace(mentionPattern, '');
      }
      
      const newCommentData = await addComment(
        filingId.toString(), 
        commentContent,
        replyingTo ? replyingTo.id : undefined
      );
      
      setComments([newCommentData, ...comments]);
      setNewComment('');
      setReplyingTo(null);
      
    } catch (error: any) {
      console.error('Comment error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle comment update
  const handleCommentUpdate = (updatedComment: Comment) => {
    setComments(prevComments => 
      prevComments.map(c => c.id === updatedComment.id ? updatedComment : c)
    );
  };

  // Handle comment delete
  const handleCommentDelete = (commentId: string) => {
    setComments(prevComments => prevComments.filter(c => c.id !== commentId));
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFilingDetails();
    setIsRefreshing(false);
  };

  // 🔥 新增：处理弹窗关闭
  const handleUpgradeModalClose = () => {
    setShowUpgradeModal(false);
    // 返回上一页
    navigation.goBack();
  };

  // Render differentiated filing content based on filing type
  const renderDifferentiatedContent = () => {
    if (!filing) return null;
    
    const FilingComponent = getFilingDetailComponent(filing.form_type);
    return <FilingComponent filing={filing} />;
  };

  // Load data on mount
  useEffect(() => {
    loadFilingDetails();
    
    // Fix for web scrolling issue
    if (Platform.OS === 'web') {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'auto';
      
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [filingId]);

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  // Get filing type style
  const getFilingTypeStyle = (type: string) => {
    switch (type) {
      case '10-K':
        return { backgroundColor: colors.filing10K };
      case '10-Q':
        return { backgroundColor: colors.filing10Q };
      case '8-K':
        return { backgroundColor: colors.filing8K };
      case 'S-1':
        return { backgroundColor: colors.filingS1 };
      default:
        return { backgroundColor: colors.primary };
    }
  };

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'bullish':
        return colors.bullish;
      case 'bearish':
        return colors.bearish;
      default:
        return colors.neutral;
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // 🔥 关键修改：如果没有filing且显示弹窗，不显示空白页面
  if (!filing && showUpgradeModal) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filing Details</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Loading placeholder while modal shows */}
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
        
        {/* 升级弹窗 */}
        <UpgradePromptModal
          visible={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          viewsToday={limitInfo?.views_today}
          dailyLimit={limitInfo?.daily_limit}
        />
      </SafeAreaView>
    );
  }

  if (!filing) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Filing not found</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.linkText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Use differentiated display if enabled
  if (ENABLE_DIFFERENTIATED_DISPLAY && filing) {
    return (
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Filing Details</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Differentiated Content */}
        <ScrollView 
          style={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
        >
          {renderDifferentiatedContent()}
          
          {/* Keep voting and comments sections */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗳️ Community Sentiment</Text>
            
            <VotingModule
              filingId={filingId}
              initialVoteCounts={filing.vote_counts || { bullish: 0, neutral: 0, bearish: 0 }}
              initialUserVote={filing.user_vote || null}
              mode="full"
            />
          </View>

          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>
              💬 Comments ({comments.length})
            </Text>
            
            {/* Reply indicator */}
            {replyingTo && (
              <View style={styles.replyIndicator}>
                <Icon name="reply" size={16} color={colors.primary} />
                <Text style={styles.replyingToText}>
                  Replying to @{replyingTo.username}
                </Text>
                <TouchableOpacity onPress={handleCancelReply}>
                  <Icon name="close" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Comment Input */}
            {isProUser ? (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder={replyingTo ? "Write your reply..." : "Add a comment..."}
                  placeholderTextColor={colors.textSecondary}
                  value={newComment}
                  onChangeText={setNewComment}
                  multiline
                  maxLength={500}
                />
                <TouchableOpacity
                  style={[
                    styles.submitButton,
                    (!newComment.trim() || isSubmittingComment) && styles.submitButtonDisabled
                  ]}
                  onPress={handleSubmitComment}
                  disabled={!newComment.trim() || isSubmittingComment}
                >
                  {isSubmittingComment ? (
                    <ActivityIndicator size="small" color={colors.white} />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {replyingTo ? 'Reply' : 'Post'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.proPrompt}>
                <Icon name="lock" size={20} color={colors.primary} />
                <Text style={styles.proPromptText}>
                  Comments are available for Pro members only
                </Text>
              </TouchableOpacity>
            )}

            {/* Comments List */}
            {comments.length > 0 ? (
              comments.map((comment) => (
                <CommentItem
                  key={comment.id}
                  comment={comment}
                  currentUserId={user?.id?.toString()}
                  onReply={handleReply}
                  onUpdate={handleCommentUpdate}
                  onDelete={handleCommentDelete}
                />
              ))
            ) : (
              <Text style={styles.noComments}>
                No comments yet. {isProUser ? 'Be the first to comment!' : 'Upgrade to Pro to join the discussion.'}
              </Text>
            )}
          </View>
        </ScrollView>

        {/* 🔥 升级弹窗始终可能显示 */}
        <UpgradePromptModal
          visible={showUpgradeModal}
          onClose={handleUpgradeModalClose}
          viewsToday={limitInfo?.views_today}
          dailyLimit={limitInfo?.daily_limit}
        />
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing.xl,
  },
  webScrollContainer: {
    flex: 1,
    height: '100%',
    overflow: 'auto' as any,
    ...(Platform.OS === 'web' && {
      maxHeight: '100%' as any,
    }),
  },
  flatList: {
    flex: 1,
    ...(Platform.OS === 'web' && {
      height: '100%',
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
    paddingTop: Platform.OS === 'ios' ? 44 : 0,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginBottom: spacing.md,
  },
  linkText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backButton: {
    padding: spacing.xs,
  },
  headerTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  headerRight: {
    width: 40,
  },
  section: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  lastSection: {
    marginBottom: spacing.xxxl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  replyIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  replyingToText: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginLeft: spacing.sm,
    flex: 1,
  },
  commentInputContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  commentInput: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  proPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  proPromptText: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginLeft: spacing.sm,
  },
  noComments: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});