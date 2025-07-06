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
import { Filing, Comment, RootStackParamList } from '../types';
import apiClient from '../api/client';

// Route types
type FilingDetailScreenRouteProp = RouteProp<RootStackParamList, 'FilingDetail'>;
type FilingDetailScreenNavigationProp = StackNavigationProp<RootStackParamList, 'FilingDetail'>;

export default function FilingDetailScreen() {
  const navigation = useNavigation<FilingDetailScreenNavigationProp>();
  const route = useRoute<FilingDetailScreenRouteProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Get auth state from Redux
  const authState = useSelector((state: RootState) => state.auth);
  const user = authState?.user || null;
  const token = authState?.token || null;
  const isProUser = user?.is_pro || false;
  
  // Get filing ID from route params
  const { filingId } = route.params;
  
  // State
  const [filing, setFiling] = useState<Filing | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isVoting, setIsVoting] = useState(false);
  const [userVote, setUserVote] = useState<'bullish' | 'neutral' | 'bearish' | null>(null);

  // Load filing details and comments
  const loadFilingDetails = async () => {
    try {
      // Load filing details
      const filingResponse = await apiClient.get(`/filings/${filingId}`);
      const filingData = filingResponse.data;
      
      // Transform backend data to frontend format
      const transformedFiling: Filing = {
        id: String(filingData.id),
        company_id: filingData.company?.cik || filingData.cik || '',
        company_name: filingData.company?.name || '',
        company_ticker: filingData.company?.ticker || '',
        company: filingData.company,
        filing_type: filingData.form_type,
        filing_date: filingData.filing_date,
        accession_number: filingData.accession_number,
        filing_url: filingData.file_url || filingData.filing_url,
        processing_status: 'completed',
        ai_summary: filingData.ai_summary || filingData.one_liner?.replace('FEED_SUMMARY: ', ''),
        feed_summary: filingData.one_liner?.replace('FEED_SUMMARY: ', ''),
        management_tone: filingData.management_tone || filingData.sentiment,
        tags: filingData.key_tags || filingData.tags,
        vote_counts: filingData.vote_counts || { 
          bullish: filingData.bullish_votes || 0, 
          neutral: filingData.neutral_votes || 0, 
          bearish: filingData.bearish_votes || 0 
        },
        user_vote: filingData.user_vote,
        comment_count: filingData.comment_count || 0,
        created_at: filingData.created_at || filingData.filing_date,
        updated_at: filingData.updated_at || filingData.filing_date,
        event_type: filingData.event_type,
        // Map the backend fields correctly
        key_insights: filingData.key_quotes || filingData.key_insights,  // Backend uses key_quotes
        risk_factors: filingData.risk_factors,
        future_outlook: filingData.future_outlook,
        financial_highlights: filingData.financial_highlights,
      };
      
      // Debug logging - check all possible fields
      console.log('All filing data fields:', Object.keys(filingData));
      console.log('Full filing data:', filingData);
      
      setFiling(transformedFiling);
      setUserVote(filingData.user_vote);
      
      // Debug logging
      console.log('Filing data from API:', filingData);
      console.log('Transformed filing:', transformedFiling);
      console.log('Management tone:', transformedFiling.management_tone);
      console.log('Key insights:', transformedFiling.key_insights);
      console.log('Risk factors:', transformedFiling.risk_factors);
      
      // Load comments
      try {
        const commentsResponse = await apiClient.get(`/filings/${filingId}/comments`);
        setComments(commentsResponse.data || []);
      } catch (error) {
        console.log('No comments yet');
      }
      
    } catch (error) {
      console.error('Error loading filing details:', error);
      Alert.alert('Error', 'Failed to load filing details');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle voting
  const handleVote = async (sentiment: 'bullish' | 'neutral' | 'bearish') => {
    if (!token) {
      Alert.alert('Login Required', 'Please login to vote');
      return;
    }
    
    if (isVoting) return;
    
    try {
      setIsVoting(true);
      
      const response = await apiClient.post(`/filings/${filingId}/vote`, null, {
        params: { vote_type: sentiment }
      });
      
      // Update local state
      if (filing) {
        setFiling({
          ...filing,
          vote_counts: response.data.vote_counts,
          user_vote: response.data.user_vote
        });
      }
      setUserVote(response.data.user_vote);
      
    } catch (error: any) {
      console.error('Vote error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to submit vote');
    } finally {
      setIsVoting(false);
    }
  };

  // Handle comment submission
  const handleSubmitComment = async () => {
    if (!isProUser) {
      Alert.alert('Pro Feature', 'Comments are available for Pro members only');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setIsSubmittingComment(true);
      
      const response = await apiClient.post(`/filings/${filingId}/comments`, {
        content: newComment.trim()
      });
      
      // Add new comment to the list
      const newCommentData: Comment = {
        ...response.data,
        user_name: user?.full_name || 'Anonymous'
      };
      
      setComments([newCommentData, ...comments]);
      setNewComment('');
      
      // Update comment count
      if (filing) {
        setFiling({
          ...filing,
          comment_count: (filing.comment_count || 0) + 1
        });
      }
      
    } catch (error: any) {
      console.error('Comment error:', error);
      Alert.alert('Error', error.response?.data?.detail || 'Failed to post comment');
    } finally {
      setIsSubmittingComment(false);
    }
  };

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadFilingDetails();
    setIsRefreshing(false);
  };

  // Load data on mount
  useEffect(() => {
    loadFilingDetails();
    
    // Fix for web scrolling issue
    if (Platform.OS === 'web') {
      // Save original body overflow
      const originalOverflow = document.body.style.overflow;
      
      // Enable scrolling
      document.body.style.overflow = 'auto';
      
      // Cleanup: restore original overflow when component unmounts
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

  // Prepare sections for FlatList
  const sections = [
    { id: 'company', type: 'company' },
    { id: 'summary', type: 'summary' },
    filing.management_tone ? { id: 'tone', type: 'tone' } : null,
    filing.key_insights && filing.key_insights.length > 0 ? { id: 'insights', type: 'insights' } : null,
    filing.risk_factors && filing.risk_factors.length > 0 ? { id: 'risks', type: 'risks' } : null,
    { id: 'voting', type: 'voting' },
    { id: 'comments', type: 'comments' },
  ].filter((item): item is { id: string; type: string } => item !== null);
  
  // Debug logging
  console.log('Sections to render:', sections);
  console.log('Section types:', sections.map(s => s.type));

  // Render section based on type
  const renderSection = ({ item }: { item: any }) => {
    switch (item.type) {
      case 'company':
        return (
          <View style={styles.companySection}>
            <View style={styles.companyHeader}>
              <View>
                <Text style={styles.ticker}>{filing.company_ticker}</Text>
                <Text style={styles.companyName}>{filing.company_name}</Text>
              </View>
              <View style={[styles.filingBadge, getFilingTypeStyle(filing.filing_type)]}>
                <Text style={styles.filingBadgeText}>{filing.filing_type}</Text>
              </View>
            </View>
            <Text style={styles.filingDate}>{formatDate(filing.filing_date)}</Text>
            {filing.event_type && (
              <Text style={styles.eventType}>Event: {filing.event_type}</Text>
            )}
          </View>
        );

      case 'summary':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📝 AI Summary</Text>
            <Text style={styles.summaryText}>
              {filing.ai_summary || 'AI summary is being processed...'}
            </Text>
          </View>
        );

      case 'tone':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Management Tone Analysis</Text>
            <View style={styles.toneContainer}>
              <Text style={styles.toneEmoji}>
                {filing.management_tone === 'bullish' ? '🚀' : 
                 filing.management_tone === 'bearish' ? '😟' : '😐'}
              </Text>
              <View>
                <Text style={[styles.toneLabel, { color: getSentimentColor(filing.management_tone!) }]}>
                  {filing.management_tone!.charAt(0).toUpperCase() + filing.management_tone!.slice(1)}
                </Text>
                <Text style={styles.toneDescription}>
                  Based on language analysis of management discussion
                </Text>
              </View>
            </View>
          </View>
        );

      case 'insights':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>✨ Key Insights</Text>
            {filing.key_insights!.map((insight, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{insight}</Text>
              </View>
            ))}
          </View>
        );

      case 'risks':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>⚠️ Risk Factors</Text>
            {filing.risk_factors!.map((risk, index) => (
              <View key={index} style={styles.bulletItem}>
                <Text style={styles.bulletPoint}>•</Text>
                <Text style={styles.bulletText}>{risk}</Text>
              </View>
            ))}
          </View>
        );

      case 'voting':
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🗳️ Community Sentiment</Text>
            <Text style={styles.voteQuestion}>How do you see this filing?</Text>
            <View style={styles.voteButtons}>
              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'bullish' && styles.voteButtonActive
                ]}
                onPress={() => handleVote('bullish')}
                disabled={isVoting}
              >
                <Text style={styles.voteEmoji}>🚀</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'bullish' && styles.voteLabelActive
                ]}>Bullish</Text>
                <Text style={styles.voteCount}>{filing.vote_counts?.bullish || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'neutral' && styles.voteButtonActive
                ]}
                onPress={() => handleVote('neutral')}
                disabled={isVoting}
              >
                <Text style={styles.voteEmoji}>😐</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'neutral' && styles.voteLabelActive
                ]}>Neutral</Text>
                <Text style={styles.voteCount}>{filing.vote_counts?.neutral || 0}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.voteButton,
                  userVote === 'bearish' && styles.voteButtonActive
                ]}
                onPress={() => handleVote('bearish')}
                disabled={isVoting}
              >
                <Text style={styles.voteEmoji}>😟</Text>
                <Text style={[
                  styles.voteLabel,
                  userVote === 'bearish' && styles.voteLabelActive
                ]}>Bearish</Text>
                <Text style={styles.voteCount}>{filing.vote_counts?.bearish || 0}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );

      case 'comments':
        return (
          <View style={[styles.section, styles.lastSection]}>
            <Text style={styles.sectionTitle}>
              💬 Comments ({filing.comment_count || 0})
            </Text>
            
            {/* Comment Input */}
            {isProUser ? (
              <View style={styles.commentInputContainer}>
                <TextInput
                  style={styles.commentInput}
                  placeholder="Add a comment..."
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
                    <Text style={styles.submitButtonText}>Post</Text>
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
                <View key={comment.id} style={styles.commentItem}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>
                      {comment.user_name}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatDate(comment.created_at)}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.noComments}>
                No comments yet. {isProUser ? 'Be the first to comment!' : 'Upgrade to Pro to join the discussion.'}
              </Text>
            )}
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Filing Details</Text>
        <View style={styles.headerRight} />
      </View>

      {/* For web, use a scrollable container */}
      {Platform.OS === 'web' ? (
        <View style={styles.webScrollContainer}>
          <FlatList
            data={sections}
            renderItem={renderSection}
            keyExtractor={(item) => item.id}
            refreshControl={
              <RefreshControl 
                refreshing={isRefreshing} 
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            showsVerticalScrollIndicator={true}
            contentContainerStyle={styles.listContent}
            style={styles.flatList}
          />
        </View>
      ) : (
        <FlatList
          data={sections}
          renderItem={renderSection}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          style={styles.flatList}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'ios' ? 44 : 0, // Add safe area padding for iOS
  },
  webScrollContainer: {
    flex: 1,
    height: '100%',
    overflow: 'auto' as any,
    // Override the body overflow for this specific container
    ...(Platform.OS === 'web' && {
      maxHeight: '100%' as any, // Use percentage instead of calc
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
  
  // Header
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
    width: 40, // Placeholder for symmetry
  },
  
  // List content
  listContent: {
    paddingBottom: spacing.xl,
    flexGrow: 1, // Add this to ensure content can expand
  },
  
  // Company Section
  companySection: {
    backgroundColor: colors.white,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  companyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  ticker: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  filingBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  filingBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  filingDate: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  eventType: {
    fontSize: typography.fontSize.sm,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  
  // Section
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
  
  // AI Summary
  summaryText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  
  // Management Tone
  toneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  toneEmoji: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  toneLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  toneDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  
  // Bullet Lists
  bulletItem: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  bulletPoint: {
    fontSize: typography.fontSize.md,
    color: colors.primary,
    marginRight: spacing.sm,
  },
  bulletText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 22,
  },
  
  // Voting
  voteQuestion: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  voteButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  voteButton: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.backgroundSecondary,
    minWidth: 100,
  },
  voteButtonActive: {
    backgroundColor: colors.primary + '20',
    borderWidth: 2,
    borderColor: colors.primary,
  },
  voteEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  voteLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  voteLabelActive: {
    color: colors.primary,
    fontWeight: typography.fontWeight.semibold,
  },
  voteCount: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  
  // Comments
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
  
  commentItem: {
    backgroundColor: colors.backgroundSecondary,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  commentAuthor: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  commentDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
  },
  commentContent: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 20,
  },
  
  noComments: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});