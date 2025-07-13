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
import { getFilingById, voteOnFiling, getFilingComments, postComment } from '../api/filings';
import { AdaptiveChart } from '../components/charts';
import { VisualData } from '../types';
import UpgradePromptModal from '../components/UpgradePromptModal';

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
  const isProUser = user?.tier === 'pro';
  console.log('FilingDetailScreen - User object:', user);
  console.log('FilingDetailScreen - isProUser:', isProUser);
  console.log('FilingDetailScreen - user?.tier:', user?.tier);
  
  
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<{ views_today: number; daily_limit: number } | null>(null);
  const [error403, setError403] = useState(false);

  // Load filing details and comments
  const loadFilingDetails = async () => {
    try {
      setError403(false);
      
      // Load filing details using the API function
      const filingData = await getFilingById(filingId);
      setFiling(filingData);
      // Fix: ensure user_vote is never undefined
      setUserVote(filingData.user_vote || null);
      
      // Load comments
      try {
        const commentsData = await getFilingComments(filingId);
        setComments(commentsData);
      } catch (error) {
        console.log('No comments yet');
      }
      
    } catch (error: any) {
      console.error('Error loading filing details:', error);
      
      // Check if it's a daily limit error
      if (error.isLimitError) {
        setError403(true);
        setLimitInfo(error.limitInfo);
        setShowUpgradeModal(true);
      } else {
        Alert.alert('Error', 'Failed to load filing details');
      }
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
      
      const response = await voteOnFiling(filingId, sentiment);
      
      // Update local state
      if (filing) {
        setFiling({
          ...filing,
          vote_counts: response.vote_counts,
          user_vote: response.user_vote
        });
      }
      setUserVote(response.user_vote);
      
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
      
      const newCommentData = await postComment(filingId, newComment.trim());
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

  // Generate visualization data based on filing type and real financial data
  const generateVisualsForFiling = (filing: Filing): VisualData[] => {
    const visuals: VisualData[] = [];
    
    // Check if we have financial highlights data from backend
    const financialData = filing.financial_highlights;
    
    // For 10-K and 10-Q, show financial trends
    if ((filing.filing_type === '10-K' || filing.filing_type === '10-Q') && financialData) {
      
      // Revenue trend - use real data if available
      if (financialData.revenue_trend && financialData.revenue_trend.length > 0) {
        visuals.push({
          id: 'revenue-trend',
          type: 'trend',
          title: '📈 Revenue Trend',
          subtitle: 'Historical Performance',
          data: financialData.revenue_trend.map((item: any) => ({
            label: item.label || item.period,
            value: item.value
          })),
          metadata: {
            format: 'currency',
            unit: financialData.revenue_trend[0]?.unit || 'B',
            decimals: 1,
          },
        });
      }
      
      // Key metrics - use real data if available
      if (financialData.key_metrics && financialData.key_metrics.length > 0) {
        visuals.push({
          id: 'key-metrics',
          type: 'metrics',
          title: '💰 Key Financial Metrics',
          data: financialData.key_metrics.map((metric: any) => ({
            label: metric.label,
            value: `$${metric.value}${metric.unit || 'B'}`,
            change: metric.change ? {
              value: metric.change,
              direction: metric.direction || (metric.change > 0 ? 'up' : 'down')
            } : undefined
          })),
        });
      }
      
      // Segment breakdown - use real data if available
      if (financialData.segment_breakdown && financialData.segment_breakdown.length > 0) {
        visuals.push({
          id: 'segment-breakdown',
          type: 'comparison',
          title: '📊 Revenue by Segment',
          data: financialData.segment_breakdown.map((segment: any) => ({
            category: segment.category,
            value: segment.value
          })),
          metadata: {
            format: 'currency',
            unit: financialData.segment_breakdown[0]?.unit || 'B',
            decimals: 1,
          },
        });
      }
    }
    
    // For S-1 filings, show IPO-specific metrics if available
    if (filing.filing_type === 'S-1' && financialData) {
      if (financialData.revenue_trend && financialData.revenue_trend.length > 0) {
        visuals.push({
          id: 'ipo-revenue-history',
          type: 'trend',
          title: '📈 Revenue History',
          subtitle: 'Pre-IPO Performance',
          data: financialData.revenue_trend.map((item: any) => ({
            label: item.label || item.period,
            value: item.value
          })),
          metadata: {
            format: 'currency',
            unit: financialData.revenue_trend[0]?.unit || 'M',
            decimals: 1,
          },
        });
      }
      
      if (financialData.valuation_metrics && financialData.valuation_metrics.length > 0) {
        visuals.push({
          id: 'ipo-valuation',
          type: 'metrics',
          title: '💎 IPO Valuation Metrics',
          data: financialData.valuation_metrics.map((metric: any) => ({
            label: metric.label,
            value: metric.unit === '$/share' 
              ? `${metric.value} ${metric.unit}`
              : `$${metric.value}${metric.unit || 'B'}`
          })),
        });
      }
    }
    
    // For 8-K filings, show event-specific metrics if available
    if (filing.filing_type === '8-K' && financialData && financialData.key_metrics) {
      visuals.push({
        id: 'event-metrics',
        type: 'metrics',
        title: '📊 Event Impact Metrics',
        data: financialData.key_metrics.map((metric: any) => ({
          label: metric.label,
          value: metric.unit === '%' 
            ? `${metric.value}${metric.unit}`
            : `$${metric.value}${metric.unit || 'M'}`
        })),
      });
    }
    
    // If no real data is available, return empty array (no mock data)
    return visuals;
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

  // Handle 403 error - show upgrade prompt instead of "Filing not found"
  if (error403 && !filing) {
    return (
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Daily Limit Reached</Text>
          <View style={styles.headerRight} />
        </View>

        <View style={styles.limitReachedContainer}>
          <Icon name="lock" size={80} color={colors.primary} style={styles.limitIcon} />
          
          <Text style={styles.limitTitle}>Daily Limit Reached</Text>
          <Text style={styles.limitText}>
            You've reached your daily limit of {limitInfo?.daily_limit || 3} free reports.
          </Text>
          <Text style={styles.limitSubtext}>
            Upgrade to Pro for unlimited access to all financial reports, advanced features, and exclusive insights.
          </Text>
          
          <TouchableOpacity 
            style={styles.limitUpgradeButton}
            onPress={() => navigation.navigate('Subscription')}
          >
            <Text style={styles.limitUpgradeButtonText}>Upgrade to Pro</Text>
            <Icon name="arrow-forward" size={20} color={colors.white} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.limitBackButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.limitBackButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
        
        {/* Also show the modal */}
        <UpgradePromptModal
          visible={showUpgradeModal}
          onClose={() => {
            setShowUpgradeModal(false);
            navigation.goBack();
          }}
          viewsToday={limitInfo?.views_today}
          dailyLimit={limitInfo?.daily_limit}
        />
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
    filing.view_limit_info && !filing.view_limit_info.is_pro ? { id: 'viewLimit', type: 'viewLimit' } : null,
    { id: 'summary', type: 'summary' },
    filing.management_tone ? { id: 'tone', type: 'tone' } : null,
    filing.key_insights && filing.key_insights.length > 0 ? { id: 'insights', type: 'insights' } : null,
    filing.risk_factors && filing.risk_factors.length > 0 ? { id: 'risks', type: 'risks' } : null,
    { id: 'visuals', type: 'visuals' }, // Add financial visualizations
    { id: 'voting', type: 'voting' },
    { id: 'comments', type: 'comments' },
  ].filter((item): item is { id: string; type: string } => item !== null);

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

      case 'viewLimit':
        if (!filing.view_limit_info) return null;
        
        const remainingViews = filing.view_limit_info.views_remaining;
        const isLastView = remainingViews === 0;
        const isSecondToLast = remainingViews === 1;
        
        return (
          <View style={[styles.viewLimitBanner, isLastView && styles.viewLimitBannerUrgent]}>
            <View style={styles.viewLimitContent}>
              <View style={styles.viewLimitIconContainer}>
                <Icon 
                  name={isLastView ? "warning" : "visibility"} 
                  size={24} 
                  color={isLastView ? colors.error : colors.primary} 
                />
              </View>
              <View style={styles.viewLimitTextContainer}>
                <Text style={[styles.viewLimitTitle, isLastView && styles.viewLimitTitleUrgent]}>
                  {isLastView 
                    ? "Daily Limit Reached" 
                    : `${remainingViews} Free ${remainingViews === 1 ? 'View' : 'Views'} Remaining Today`}
                </Text>
                <Text style={styles.viewLimitSubtitle}>
                  {isLastView 
                    ? "Upgrade to Pro for unlimited access to all filings" 
                    : isSecondToLast
                    ? "This is your second to last free view today"
                    : "Free users can view 3 filings per day"}
                </Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.upgradeButton, isLastView && styles.upgradeButtonUrgent]}
              onPress={() => navigation.navigate('Subscription')}
            >
              <Text style={styles.upgradeButtonText}>
                {isLastView ? "Upgrade Now" : "Go Pro"}
              </Text>
              <Icon name="arrow-forward" size={16} color={colors.white} />
            </TouchableOpacity>
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

      case 'visuals':
        const visuals = generateVisualsForFiling(filing);
        if (visuals.length === 0) return null;
        
        return (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📊 Financial Overview</Text>
            {visuals.map((visual) => (
              <AdaptiveChart key={visual.id} visual={visual} />
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
                    {comment.user_name || 'Anonymous'}
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

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        visible={showUpgradeModal}
        onClose={() => {
          setShowUpgradeModal(false);
          navigation.goBack(); // Go back when modal is closed
        }}
        viewsToday={limitInfo?.views_today}
        dailyLimit={limitInfo?.daily_limit}
      />
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
  
  // Daily Limit Reached Screen
  limitReachedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  limitIcon: {
    marginBottom: spacing.xl,
  },
  limitTitle: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  limitText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  limitSubtext: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  limitUpgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  limitUpgradeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.sm,
  },
  limitBackButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  limitBackButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
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

  // View Limit Banner
  viewLimitBanner: {
    backgroundColor: colors.primary + '10',
    marginHorizontal: spacing.md,
    marginVertical: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  viewLimitBannerUrgent: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
  },
  viewLimitContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  viewLimitIconContainer: {
    marginRight: spacing.md,
  },
  viewLimitTextContainer: {
    flex: 1,
  },
  viewLimitTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  viewLimitTitleUrgent: {
    color: colors.error,
  },
  viewLimitSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
  },
  upgradeButtonUrgent: {
    backgroundColor: colors.error,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginRight: spacing.xs,
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