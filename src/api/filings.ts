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
    vote_count: comment.vote_count || 0,
    user_vote: comment.user_vote || null,
  };
};

// Get filings list with optional ticker filter - UPDATED
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
    
    const response = await apiClient.get('/filings/', { params });
    
    // 处理响应数据
    const responseData = response.data || response;
    const items = Array.isArray(responseData) ? responseData : 
                  (responseData.items || responseData.results || []);
    
    // 使用 cleanFilingData 处理每个 filing
    const cleanedFilings = items.map(cleanFilingData);
    
    return {
      data: cleanedFilings,
      total: responseData.total || cleanedFilings.length,
      page: page,
      pages: responseData.pages || Math.ceil((responseData.total || cleanedFilings.length) / 20)
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

// Add comment to a filing
export const addComment = async (
  filingId: string,
  content: string
): Promise<Comment> => {
  try {
    const response = await apiClient.post(`/filings/${filingId}/comments`, {
      content
    });
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
  voteType: 'up' | 'down'
): Promise<CommentVoteResponse> => {
  try {
    const response = await apiClient.post(`/comments/${commentId}/vote`, null, {
      params: { vote_type: voteType }
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