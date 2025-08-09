// src/api/filings.ts
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
const cleanFilingData = (filing: any): Filing => {
  return {
    ...filing,
    id: String(filing.id),
    
    // 从嵌套的 company 对象中提取字段（重要！）
    company_name: filing.company?.name || filing.company_name || '',
    company_ticker: filing.company?.ticker || filing.company_ticker || '',
    company_cik: filing.company?.cik || filing.company_cik || '',
    
    // ==================== UNIFIED ANALYSIS FIELDS (NEW) ====================
    // Pass through unified analysis fields if they exist
    unified_analysis: filing.unified_analysis,
    unified_feed_summary: filing.unified_feed_summary,
    analysis_version: filing.analysis_version,
    smart_markup_data: filing.smart_markup_data,
    analyst_expectations: filing.analyst_expectations,
    // ========================================================================
    
    // 字段映射（后端返回 -> 前端期望）
    key_tags: cleanTags(filing.tags || filing.key_tags || []),
    item_type: filing.event_type || filing.item_type || null,
    
    // 确保 form_type 存在
    form_type: filing.form_type || filing.filing_type || '',
    
    // 清理 AI 生成的内容
    ai_summary: cleanAISummary(filing.ai_summary),
    // 处理 one_liner，移除 "FEED_SUMMARY: " 前缀
    one_liner: filing.one_liner ? filing.one_liner.replace('FEED_SUMMARY: ', '') : null,
    // Use helper function to get best feed summary
    feed_summary: getDisplaySummary(filing),
    
    // 确保其他重要字段存在
    filing_date: filing.filing_date || '',
    accession_number: filing.accession_number || '',
    filing_url: filing.file_url || filing.filing_url || '',
    
    // 处理投票和评论数
    vote_counts: filing.vote_counts || { bullish: 0, neutral: 0, bearish: 0 },
    comment_count: filing.comment_count || 0,
    user_vote: filing.user_vote || null,
    
    // 处理情绪/语调
    sentiment: filing.sentiment || filing.management_tone || null,
    management_tone: filing.management_tone || filing.sentiment || null,
    
    // 10-K specific fields
    auditor_opinion: filing.auditor_opinion,
    three_year_financials: filing.three_year_financials,
    business_segments: filing.business_segments,
    risk_summary: filing.risk_summary,
    growth_drivers: filing.growth_drivers,
    management_outlook: filing.management_outlook,
    strategic_adjustments: filing.strategic_adjustments,
    market_impact_10k: filing.market_impact_10k,
    
    // 10-Q specific fields
    core_metrics: filing.core_metrics,
    cost_structure: filing.cost_structure,
    growth_decline_analysis: filing.growth_decline_analysis,
    management_tone_analysis: filing.management_tone_analysis,
    market_impact_10q: filing.market_impact_10q,
    expectations_comparison: filing.expectations_comparison,
    beat_miss_analysis: filing.beat_miss_analysis,
    
    // 8-K specific fields
    items: filing.items,
    event_timeline: filing.event_timeline,
    event_nature_analysis: filing.event_nature_analysis,
    market_impact_analysis: filing.market_impact_analysis,
    key_considerations: filing.key_considerations,
    
    // S-1 specific fields
    ipo_details: filing.ipo_details,
    company_overview: filing.company_overview,
    financial_summary: filing.financial_summary,
    risk_categories: filing.risk_categories,
    growth_path_analysis: filing.growth_path_analysis,
    competitive_moat_analysis: filing.competitive_moat_analysis,
    
    // Common fields
    fiscal_year: filing.fiscal_year,
    fiscal_quarter: filing.fiscal_quarter,
    period_end_date: filing.period_end_date,
    guidance_update: filing.guidance_update,
    financial_highlights: filing.financial_highlights,
    
    // 确保 company 对象也被传递（用于显示指数标签）
    company: filing.company,
  };
};

// Helper function to clean comment data
const cleanCommentData = (comment: any): Comment => {
  // 🔥 关键修复：处理 reply_to 字段
  console.log('Cleaning comment data:', comment.id, 'reply_to:', comment.reply_to);
  
  return {
    ...comment,
    id: String(comment.id),
    filing_id: String(comment.filing_id),
    user_id: String(comment.user_id),
    username: comment.username || comment.user_name || 'Anonymous',
    user_name: comment.username || comment.user_name || 'Anonymous', // backward compatibility
    is_editable: Boolean(comment.is_editable),
    upvotes: comment.upvotes || 0,
    downvotes: comment.downvotes || 0,
    net_votes: comment.net_votes || 0,
    vote_count: comment.vote_count || 0,
    user_vote: comment.user_vote || null,
    user_tier: comment.user_tier || 'free',
    
    // 🔥 添加 reply_to 字段处理
    reply_to: comment.reply_to ? {
      comment_id: comment.reply_to.comment_id,
      user_id: comment.reply_to.user_id,
      username: comment.reply_to.username,
      content_preview: comment.reply_to.content_preview
    } : null,
  };
};

// Get filings list with optional ticker filter - FIXED VERSION
export const getFilings = async (
  page: number = 1, 
  ticker?: string
): Promise<{ data: Filing[]; total: number; page: number; pages: number }> => {
  try {
    const skip = (page - 1) * 20;
    const params: any = { skip, limit: 20 };
    
    // 如果提供了 ticker，添加到查询参数
    if (ticker) {
      params.ticker = ticker;
    }
    
    console.log('Fetching filings with params:', params);
    
    const response = await apiClient.get('/filings/', { params });
    
    console.log('API Response:', response);
    
    // 处理响应数据 - 适配不同的响应格式
    let items: any[] = [];
    let total = 0;
    
    // 处理后端返回的 data 字段（根据您的网络响应）
    if (response && typeof response === 'object') {
      if (Array.isArray(response.data)) {
        items = response.data;
        total = response.total || items.length;
      } else if (Array.isArray(response.items)) {
        items = response.items;
        total = response.total || items.length;
      } else if (Array.isArray(response)) {
        items = response;
        total = items.length;
      }
    }
    
    // 使用 cleanFilingData 处理每个 filing
    const cleanedFilings = items.map(cleanFilingData);
    
    console.log('Cleaned filings:', cleanedFilings.length);
    
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

// Get filing by ID
export const getFilingById = async (id: string): Promise<Filing> => {
  try {
    const response = await apiClient.get(`/filings/${id}`);
    return cleanFilingData(response);
  } catch (error) {
    console.error('Error fetching filing:', error);
    throw error;
  }
};

// Vote on a filing
export const voteOnFiling = async (
  filingId: string, 
  voteType: VoteType
): Promise<{ vote_counts: { bullish: number; neutral: number; bearish: number }; user_vote: VoteType }> => {
  try {
    // 根据后端的错误，需要在请求体中发送 sentiment 而不是 vote_type
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
    
    // 🔥 Debug log to check response
    console.log('Raw comments response:', response);
    
    // Clean comment data
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
  replyToCommentId?: string  // 🔥 添加回复支持
): Promise<Comment> => {
  try {
    const payload: any = { content };
    
    // 🔥 如果是回复，添加 reply_to_comment_id
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

// Vote on comment - 修复：发送请求体而不是URL参数
export const voteOnComment = async (
  commentId: string,
  voteType: 'up' | 'down' | 'none'
): Promise<CommentVoteResponse> => {
  try {
    // 映射投票类型到后端期望的格式
    const voteMap = {
      'up': 'upvote',
      'down': 'downvote',
      'none': 'none'
    };
    
    // 发送请求体，而不是URL参数
    const response = await apiClient.post(`/comments/${commentId}/vote`, {
      vote_type: voteMap[voteType] || 'none'
    });
    
    return response;
  } catch (error) {
    console.error('Error voting on comment:', error);
    throw error;
  }
};

// Check view limit
export const checkViewLimit = async (): Promise<{ can_view: boolean; views_today: number; daily_limit: number }> => {
  try {
    const response = await apiClient.get('/check-view-limit');
    return response;
  } catch (error) {
    console.error('Error checking view limit:', error);
    throw error;
  }
};