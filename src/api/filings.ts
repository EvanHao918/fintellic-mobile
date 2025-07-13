// src/api/filings.ts
import apiClient from './client';
import { 
  Filing, 
  VoteType, 
  Comment, 
  CommentVoteResponse,
  CommentListResponse 
} from '../types';
import { 
  transformFiling, 
  transformFilingList, 
  transformVoteResponse, 
  transformComment 
} from './transforms';

// Get filings list with pagination
export const getFilings = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get('/filings/', {
    params: {
      skip: (page - 1) * limit,
      limit,
    },
  });
  
  // Use the transform function
  return transformFilingList(response);
};

// Get single filing details
export const getFilingById = async (id: string) => {
  const response = await apiClient.get(`/filings/${id}`);
  return transformFiling(response);
};

export const voteOnFiling = async (filingId: string, voteType: VoteType) => {
    const response = await apiClient.post(`/filings/${filingId}/vote`, {
      sentiment: voteType  // Send sentiment in request body
    });
    
    return transformVoteResponse(response);
};

// Get filing comments - returns Comment array for backward compatibility
export const getFilingComments = async (filingId: string): Promise<Comment[]> => {
  const response = await apiClient.get(`/filings/${filingId}/comments`);
  
  // Handle different response structures
  const data = response.data || response;
  const items = data.items || data || [];
  
  return items.map(transformComment);
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
    items: items.map(transformComment)
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
  
  return transformComment(response.data || response);
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
  
  return transformComment(response.data || response);
};

// Delete a comment
export const deleteComment = async (commentId: string): Promise<void> => {
  await apiClient.delete(`/comments/${commentId}`);
};

// Search filings
export const searchFilings = async (query: string, filters?: {
  filing_type?: string;
  start_date?: string;
  end_date?: string;
}) => {
  const response = await apiClient.get('/filings/search', {
    params: {
      q: query,
      ...filters,
    },
  });
  
  return transformFilingList(response);
};

// Get popular filings
export const getPopularFilings = async (period: 'day' | 'week' | 'month' = 'week') => {
  const response = await apiClient.get(`/filings/popular/${period}`);
  return transformFilingList(response);
};

// Get company filings
export const getCompanyFilings = async (ticker: string, limit: number = 10) => {
  const response = await apiClient.get(`/companies/${ticker}/filings`, {
    params: { limit },
  });
  
  return transformFilingList(response);
};

// Check filing access (for free tier limits)
export const checkFilingAccess = async (filingId: string) => {
  const response = await apiClient.get(`/filings/check-access/${filingId}`);
  return response.data;
};