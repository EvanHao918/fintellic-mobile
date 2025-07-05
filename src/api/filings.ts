import apiClient from './client';
import { Filing, FilingType, ManagementTone, ProcessingStatus, VoteType, Comment } from '../types';

// Transform backend filing to frontend format
const transformFiling = (backendFiling: any): Filing => {
  return {
    id: String(backendFiling.id),
    company_id: backendFiling.company?.cik || '',
    company_name: backendFiling.company?.name || '',
    company_ticker: backendFiling.company?.ticker || '',
    company: backendFiling.company,
    filing_type: backendFiling.form_type as FilingType,
    filing_date: backendFiling.filing_date,
    accession_number: backendFiling.accession_number,
    filing_url: backendFiling.file_url || backendFiling.filing_url,
    processing_status: 'completed' as ProcessingStatus,
    ai_summary: backendFiling.one_liner?.replace('FEED_SUMMARY: ', '') || backendFiling.ai_summary,
    feed_summary: backendFiling.one_liner?.replace('FEED_SUMMARY: ', ''),
    management_tone: backendFiling.sentiment as ManagementTone,
    tags: backendFiling.tags,
    vote_counts: backendFiling.vote_counts,
    user_vote: backendFiling.user_vote,
    comment_count: backendFiling.comment_count || 0,
    created_at: backendFiling.filing_date,
    updated_at: backendFiling.filing_date,
  };
};

// Get filings list with pagination
export const getFilings = async (page: number = 1, limit: number = 20) => {
  const response = await apiClient.get<{
    data: any[];  // Backend returns raw format
    total: number;
    skip: number;
    limit: number;
  }>('/filings/', {
    params: {
      skip: (page - 1) * limit,
      limit,
    },
  });
  
  // Transform the data
  return {
    ...response.data,
    data: response.data.data.map(transformFiling),
  };
};

// Get single filing details
export const getFilingById = async (id: string) => {
  const response = await apiClient.get<Filing>(`/filings/${id}`);
  return response.data;
};

// Vote on a filing
export const voteOnFiling = async (filingId: string, voteType: VoteType) => {
  const response = await apiClient.post<{
    vote_counts: {
      bullish: number;
      neutral: number;
      bearish: number;
    };
    user_vote: VoteType | null;
  }>(`/filings/${filingId}/vote`, null, {
    params: {
      vote_type: voteType,
    },
  });
  return response.data;
};

// Get filing comments
export const getFilingComments = async (filingId: string) => {
  const response = await apiClient.get<Comment[]>(`/filings/${filingId}/comments`);
  return response.data;
};

// Post a comment (Pro users only)
export const postComment = async (filingId: string, content: string) => {
  const response = await apiClient.post<Comment>(`/filings/${filingId}/comments`, {
    content,
  });
  return response.data;
};

// Get popular filings
export const getPopularFilings = async (period: 'day' | 'week' | 'month' = 'week') => {
  const response = await apiClient.get<Filing[]>(`/filings/popular/${period}`);
  return response.data;
};

// Search filings
export const searchFilings = async (query: string) => {
  const response = await apiClient.get<Filing[]>('/filings/search', {
    params: { q: query },
  });
  return response.data;
};