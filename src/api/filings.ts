// src/api/filings.ts
import apiClient from './client';
import { 
  Filing, 
  VoteType, 
  Comment, 
  CommentVoteResponse,
  CommentListResponse 
} from '../types';
import { cleanAISummary, cleanTags } from '../utils/textHelpers';

// Helper function to clean filing data
const cleanFilingData = (filing: any): Filing => {
  return {
    ...filing,
    id: String(filing.id),
    
    // 从嵌套的 company 对象中提取字段（重要！）
    company_name: filing.company?.name || filing.company_name || '',
    company_ticker: filing.company?.ticker || filing.company_ticker || '',
    company_cik: filing.company?.cik || filing.company_cik || '',
    
    // 字段映射（后端返回 -> 前端期望）
    key_tags: cleanTags(filing.tags || filing.key_tags || []),
    item_type: filing.event_type || filing.item_type || null,
    
    // 确保 form_type 存在
    form_type: filing.form_type || filing.filing_type || '',
    
    // 清理 AI 生成的内容
    ai_summary: cleanAISummary(filing.ai_summary),
    // 处理 one_liner，移除 "FEED_SUMMARY: " 前缀
    one_liner: filing.one_liner ? filing.one_liner.replace('FEED_SUMMARY: ', '') : null,
    feed_summary: cleanAISummary(filing.one_liner || filing.feed_summary),
    
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
  };
};

// Helper function to clean comment data
const cleanCommentData = (comment: any): Comment => {
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
    user_vote: comment.user_vote || 0,
  };
};

// Get filings list with pagination
export const getFilings = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get('/filings/', {
    params: {
      skip: (page - 1) * limit,
      limit,
    },
  });
  
  // 处理响应数据
  const responseData = response.data || response;
  const filings = responseData.data || responseData || [];
  
  return {
    data: filings.map(cleanFilingData),
    total: responseData.total || filings.length || 0,
    skip: responseData.skip || (page - 1) * limit,
    limit: responseData.limit || limit,
  };
};

// Get single filing details
export const getFilingById = async (id: string) => {
  const response = await apiClient.get(`/filings/${id}`);
  return cleanFilingData(response);
};

export const voteOnFiling = async (filingId: string, voteType: VoteType) => {
    const response = await apiClient.post(`/filings/${filingId}/vote`, {
      sentiment: voteType  // Send sentiment in request body
    });
    
    // Direct return vote response
    return {
      vote_counts: response.vote_counts || {
        bullish: response.bullish || 0,
        neutral: response.neutral || 0,
        bearish: response.bearish || 0,
      },
      user_vote: response.user_vote || null,
    };
};

// Get filing comments - returns Comment array for backward compatibility
export const getFilingComments = async (filingId: string): Promise<Comment[]> => {
  const response = await apiClient.get(`/filings/${filingId}/comments`);
  
  // Handle different response structures
  const data = response.data || response;
  const items = data.items || data || [];
  
  return items.map(cleanCommentData);
};

// Get filing comments with pagination - new function that returns full response
export const getFilingCommentsWithPagination = async (
  filingId: string, 
  skip: number = 0, 
  limit: number = 20
): Promise<CommentListResponse> => {
  const response = await apiClient.get(`/filings/${filingId}/comments`, {
    params: { skip, limit }
  });
  
  const data = response.data || response;
  const items = data.items || [];
  
  return {
    total: data.total || items.length,
    items: items.map(cleanCommentData)
  };
};

// Post a comment with optional reply
export const postComment = async (
  filingId: string, 
  content: string,
  replyToCommentId?: number
): Promise<Comment> => {
  const response = await apiClient.post(`/filings/${filingId}/comments`, {
    content: content.trim(),
    reply_to_comment_id: replyToCommentId
  });
  
  return cleanCommentData(response.data || response);
};

// Vote on a comment
export const voteComment = async (
  commentId: string,
  voteType: 'upvote' | 'downvote' | 'none'
): Promise<CommentVoteResponse> => {
  const response = await apiClient.post(
    `/comments/${commentId}/vote`,
    { vote_type: voteType }
  );
  return response.data || response;
};

// Update a comment
export const updateComment = async (
  commentId: string,
  content: string
): Promise<Comment> => {
  const response = await apiClient.put(`/comments/${commentId}`, {
    content: content.trim()
  });
  
  return cleanCommentData(response.data || response);
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
  await apiClient.delete(`/comments/${commentId}`);
};

// Search filings
export const searchFilings = async (query: string, filters?: {
  form_type?: string;  // 注意：改为 form_type 以匹配后端
  start_date?: string;
  end_date?: string;
}) => {
  const response = await apiClient.get('/filings/search', {
    params: {
      q: query,
      ...filters,
    },
  });
  
  // 处理响应数据
  const responseData = response.data || response;
  const filings = responseData.data || responseData || [];
  
  return {
    data: filings.map(cleanFilingData),
    total: responseData.total || filings.length || 0,
    skip: responseData.skip || 0,
    limit: responseData.limit || 20,
  };
};

// Get popular filings
export const getPopularFilings = async (period: 'day' | 'week' | 'month' = 'week') => {
  const response = await apiClient.get(`/filings/popular/${period}`);
  
  // 处理响应数据
  const responseData = response.data || response;
  const filings = responseData.data || responseData || [];
  
  return {
    data: filings.map(cleanFilingData),
    total: responseData.total || filings.length || 0,
    skip: responseData.skip || 0,
    limit: responseData.limit || 20,
  };
};

// Get company filings
export const getCompanyFilings = async (ticker: string, limit: number = 10) => {
  const response = await apiClient.get(`/companies/${ticker}/filings`, {
    params: { limit },
  });
  
  // 处理响应数据
  const responseData = response.data || response;
  const filings = responseData.data || responseData || [];
  
  return {
    data: filings.map(cleanFilingData),
    total: responseData.total || filings.length || 0,
    skip: responseData.skip || 0,
    limit: responseData.limit || limit,
  };
};

// Check filing access (for free tier limits)
export const checkFilingAccess = async (filingId: string) => {
  const response = await apiClient.get(`/filings/check-access/${filingId}`);
  return response.data;
};