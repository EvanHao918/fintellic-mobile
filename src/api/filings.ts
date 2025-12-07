// src/api/filings.ts
// ENHANCED: Handle detected_at timestamps for precise timing display
import apiClient from './client';
import { 
  Filing, 
  VoteType, 
  Comment, 
  CommentVoteResponse,
  CommentListResponse 
} from '../types';
import { cleanAISummary, cleanTags, getDisplaySummary } from '../utils/textHelpers';

// Helper function to clean filing data
// ENHANCED: Process detected_at and display_time fields with proper validation
const cleanFilingData = (filing: any): Filing => {
  // ENHANCED: Debug timing information processing
  console.log(`Processing filing ${filing.id} timing:`, {
    filing_date: filing.filing_date,
    detected_at: filing.detected_at,
    display_time: filing.display_time,
    created_at: filing.created_at
  });

  return {
    ...filing,
    id: String(filing.id),
    
    // 从嵌套的 company 对象中提取字段
    company_name: filing.company?.name || filing.company_name || '',
    company_ticker: filing.company?.ticker || filing.company_ticker || '',
    company_cik: filing.company?.cik || filing.company_cik || '',
    
    // Unified analysis fields
    unified_analysis: filing.unified_analysis,
    unified_feed_summary: filing.unified_feed_summary,
    analysis_version: filing.analysis_version,
    smart_markup_data: filing.smart_markup_data,
    analyst_expectations: filing.analyst_expectations,
    
    // ENHANCED: Process timing fields with proper priority and validation
    filing_date: filing.filing_date || '',
    detected_at: filing.detected_at || null, // When we detected the filing (precise)
    display_time: filing.display_time || filing.detected_at || filing.filing_date, // Best time for display
    
    // ENHANCED: Add timing metadata for debugging
    detection_age_minutes: filing.detection_age_minutes || null,
    detection_age_hours: filing.detection_age_hours || null,
    is_recently_detected: filing.is_recently_detected || false,
    
    // 字段映射
    key_tags: cleanTags(filing.tags || filing.key_tags || []),
    item_type: filing.event_type || filing.item_type || null,
    
    // 确保 form_type 存在
    form_type: filing.form_type || filing.filing_type || '',
    
    // 清理 AI 生成的内容
    ai_summary: cleanAISummary(filing.ai_summary),
    one_liner: filing.one_liner ? filing.one_liner.replace('FEED_SUMMARY: ', '') : null,
    feed_summary: getDisplaySummary(filing),
    
    // 确保其他重要字段存在
    accession_number: filing.accession_number || '',
    filing_url: filing.file_url || filing.filing_url || '',
    
    // 处理投票和评论数
    vote_counts: filing.vote_counts || { bullish: 0, neutral: 0, bearish: 0 },
    comment_count: filing.comment_count || 0,
    user_vote: filing.user_vote || null,
    
    // 处理情绪/语调
    sentiment: filing.sentiment || filing.management_tone || null,
    management_tone: filing.management_tone || filing.sentiment || null,
    
    // Type-specific fields
    auditor_opinion: filing.auditor_opinion,
    three_year_financials: filing.three_year_financials,
    business_segments: filing.business_segments,
    risk_summary: filing.risk_summary,
    growth_drivers: filing.growth_drivers,
    management_outlook: filing.management_outlook,
    strategic_adjustments: filing.strategic_adjustments,
    market_impact_10k: filing.market_impact_10k,
    
    core_metrics: filing.core_metrics,
    cost_structure: filing.cost_structure,
    growth_decline_analysis: filing.growth_decline_analysis,
    management_tone_analysis: filing.management_tone_analysis,
    market_impact_10q: filing.market_impact_10q,
    expectations_comparison: filing.expectations_comparison,
    beat_miss_analysis: filing.beat_miss_analysis,
    
    items: filing.items,
    event_timeline: filing.event_timeline,
    event_nature_analysis: filing.event_nature_analysis,
    market_impact_analysis: filing.market_impact_analysis,
    key_considerations: filing.key_considerations,
    
    ipo_details: filing.ipo_details,
    company_overview: filing.company_overview,
    financial_summary: filing.financial_summary,
    risk_categories: filing.risk_categories,
    growth_path_analysis: filing.growth_path_analysis,
    competitive_moat_analysis: filing.competitive_moat_analysis,
    
    fiscal_year: filing.fiscal_year,
    fiscal_quarter: filing.fiscal_quarter,
    period_end_date: filing.period_end_date,
    guidance_update: filing.guidance_update,
    financial_highlights: filing.financial_highlights,
    
    company: filing.company,
    
    // 🔥 添加 view_limit_info字段
    view_limit_info: filing.view_limit_info,
  };
};

// Helper function to clean comment data
const cleanCommentData = (comment: any): Comment => {
  console.log('Cleaning comment data:', comment.id, 'reply_to:', comment.reply_to);
  
  return {
    ...comment,
    id: String(comment.id),
    filing_id: String(comment.filing_id),
    user_id: String(comment.user_id),
    username: comment.username || comment.user_name || 'Anonymous',
    user_name: comment.username || comment.user_name || 'Anonymous',
    is_editable: Boolean(comment.is_editable),
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    net_votes: comment.net_votes || 0,
    vote_count: comment.vote_count || 0,
    user_vote: comment.user_vote || null,
    user_tier: comment.user_tier || 'free',
    
    reply_to: comment.reply_to ? {
      comment_id: comment.reply_to.comment_id,
      user_id: comment.reply_to.user_id,
      username: comment.reply_to.username,
      content_preview: comment.reply_to.content_preview
    } : null,
  };
};

// Get filings list with optional ticker filter
// ENHANCED: Handle detected_at timestamps in response with better logging
export const getFilings = async (
  page: number = 1, 
  formType?: string,  // 🔥 formType 移到第二位
  ticker?: string     // 🔥 ticker 移到第三位
): Promise<{ data: Filing[]; total: number; page: number; pages: number }> => {
  try {
    const skip = (page - 1) * 20;
    const params: any = { skip, limit: 20 };
    
    if (ticker) {
      params.ticker = ticker;
    }
    
    // 🔥 添加 form_type 参数
    if (formType && formType !== 'all') {
      params.form_type = formType;
    }
    
    console.log('Fetching filings with params:', params);
    
    const response = await apiClient.get('/filings/', { params });
    
    console.log('API Response structure:', {
      hasData: !!response?.data,
      hasItems: !!response?.items,
      isArray: Array.isArray(response),
      responseKeys: response ? Object.keys(response) : 'none',
      firstItemFields: response?.data?.[0] ? Object.keys(response.data[0]) : 'none'
    });
    
    let items: any[] = [];
    let total = 0;
    
    // ENHANCED: More robust response parsing to handle various API response formats
    if (response && typeof response === 'object') {
      // Try response.data first (most common)
      if (Array.isArray(response.data)) {
        items = response.data;
        total = response.total || items.length;
        console.log('✅ Parsed from response.data:', items.length, 'items');
      } 
      // Try response.items (alternative format)
      else if (Array.isArray(response.items)) {
        items = response.items;
        total = response.total || items.length;
        console.log('✅ Parsed from response.items:', items.length, 'items');
      } 
      // Try direct array response
      else if (Array.isArray(response)) {
        items = response;
        total = items.length;
        console.log('✅ Parsed from direct array:', items.length, 'items');
      }
      // If still empty, log the actual response structure for debugging
      else {
        console.error('❌ Unexpected API response format:', {
          type: typeof response,
          keys: Object.keys(response),
          hasData: 'data' in response,
          hasItems: 'items' in response,
          dataType: typeof response.data,
          itemsType: typeof response.items,
          sample: JSON.stringify(response).substring(0, 300)
        });
      }
    } else {
      console.error('❌ Invalid response type:', typeof response);
    }
    
    const cleanedFilings = items.map(cleanFilingData);
    
    // ENHANCED: Better logging of timing information
    console.log('Cleaned filings with timing info:', cleanedFilings.slice(0, 2).map(f => ({
      id: f.id,
      ticker: f.company_ticker,
      form_type: f.form_type,
      filing_date: f.filing_date,
      detected_at: f.detected_at,
      display_time: f.display_time,
      detection_age_minutes: f.detection_age_minutes,
      is_recently_detected: f.is_recently_detected
    })));
    
    return {
      data: cleanedFilings,
      total: total,
      page: page,
      pages: Math.ceil(total / 20)
    };
  } catch (error) {
    console.error('Error fetching filings:', error);
    throw error;
  }
};

// Get filing by ID - 🔥 关键修改：处理403错误和时间戳
// ENHANCED: Better timing information handling
export const getFilingById = async (id: string): Promise<Filing> => {
  try {
    const response = await apiClient.get(`/filings/${id}`);
    
    // ENHANCED: Log detailed timing information
    console.log('Filing detail timing info:', {
      id: response.id,
      filing_date: response.filing_date,
      detected_at: response.detected_at,
      display_time: response.display_time,
      detection_age_minutes: response.detection_age_minutes,
      detection_age_hours: response.detection_age_hours,
      is_recently_detected: response.is_recently_detected
    });
    
    return cleanFilingData(response);
  } catch (error: any) {
    console.error('Error fetching filing:', error);
    
    // 🔥 处理403限制错误
    if (error.response?.status === 403) {
      const errorDetail = error.response.data?.detail;
      
      // 检查是否是每日限制错误
      if (errorDetail && typeof errorDetail === 'object' && errorDetail.error === 'DAILY_LIMIT_REACHED') {
        const limitError: any = new Error(errorDetail.message);
        limitError.isLimitError = true;
        limitError.limitInfo = {
          views_today: errorDetail.views_today || 2,
          daily_limit: errorDetail.daily_limit || 2,
        };
        throw limitError;
      }
    }
    
    throw error;
  }
};

// Vote on a filing
export const voteOnFiling = async (
  filingId: string, 
  voteType: VoteType
): Promise<{ vote_counts: { bullish: number; neutral: number; bearish: number }; user_vote: VoteType }> => {
  try {
    const response = await apiClient.post(`/filings/${filingId}/vote`, {
      sentiment: voteType
    });
    return response;
  } catch (error) {
    console.error('Error voting on filing:', error);
    throw error;
  }
};

// Get comments for a filing
export const getFilingComments = async (
  filingId: string,
  skip: number = 0,
  limit: number = 20
): Promise<CommentListResponse> => {
  try {
    const response = await apiClient.get(`/filings/${filingId}/comments`, {
      params: { skip, limit }
    });
    
    console.log('Raw comments response:', response);
    
    const cleanedComments = response.items.map(cleanCommentData);
    
    return {
      ...response,
      items: cleanedComments
    };
  } catch (error) {
    console.error('Error fetching comments:', error);
    throw error;
  }
};

// Add comment to a filing (with reply support)
export const addComment = async (
  filingId: string,
  content: string,
  replyToCommentId?: string
): Promise<Comment> => {
  try {
    const payload: any = { content };
    
    if (replyToCommentId) {
      payload.reply_to_comment_id = Number(replyToCommentId);
    }
    
    console.log('Adding comment with payload:', payload);
    
    const response = await apiClient.post(`/filings/${filingId}/comments`, payload);
    return cleanCommentData(response);
  } catch (error) {
    console.error('Error adding comment:', error);
    throw error;
  }
};

// Update comment
export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  try {
    const response = await apiClient.put(`/comments/${commentId}`, {
      content
    });
    return cleanCommentData(response);
  } catch (error) {
    console.error('Error updating comment:', error);
    throw error;
  }
};

// Delete comment
export const deleteComment = async (commentId: string): Promise<void> => {
  try {
    await apiClient.delete(`/comments/${commentId}`);
  } catch (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Vote on comment
export const voteOnComment = async (
  commentId: string,
  voteType: 'up' | 'down' | 'none'
): Promise<CommentVoteResponse> => {
  try {
    const voteMap = {
      'up': 'upvote',
      'down': 'downvote',
      'none': 'none'
    };
    
    const response = await apiClient.post(`/comments/${commentId}/vote`, {
      vote_type: voteMap[voteType] || 'none'
    });
    
    return response;
  } catch (error) {
    console.error('Error voting on comment:', error);
    throw error;
  }
};

// Check view limit - 🔥 新增：获取用户查看统计
export const getUserViewStats = async (): Promise<{
  views_today: number;
  daily_limit: number;
  views_remaining: number;
  is_pro: boolean;
  next_reset: string | null;
}> => {
  try {
    const response = await apiClient.get('/filings/user/view-stats');
    return response;
  } catch (error) {
    console.error('Error checking view stats:', error);
    // 返回默认值而不是抛出错误
    return {
      views_today: 0,
      daily_limit: 2,
      views_remaining: 2,
      is_pro: false,
      next_reset: null,
    };
  }
};