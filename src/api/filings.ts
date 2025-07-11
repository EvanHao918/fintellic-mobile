// src/api/filings.ts
import apiClient from './client';
import { Filing, VoteType, Comment } from '../types';
import { transformFiling, transformFilingList, transformVoteResponse, transformComment } from './transforms';

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
      sentiment: voteType  // 在请求体中发送 sentiment
    });
    
    return transformVoteResponse(response);
  };

// Get filing comments
export const getFilingComments = async (filingId: string) => {
  const response = await apiClient.get<Comment[]>(`/filings/${filingId}/comments`);
  return (response || []).map(transformComment);
};

// Post a comment
export const postComment = async (filingId: string, content: string) => {
  const response = await apiClient.post(`/filings/${filingId}/comments`, {
    content: content.trim()
  });
  
  return transformComment(response);
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