// src/api/watchlist.ts
// Watchlist API endpoints for managing user's favorite companies
// FIXED: Complete watchlist API integration with proper error handling

import apiClient from './client';

// Types for watchlist operations
export interface WatchedCompany {
  ticker: string;
  name: string;
  sector: string;
  industry?: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  indices: string[];
  added_at: string;
  last_filing?: {
    filing_type: string;
    filing_date: string;
    sentiment?: string;
  };
}

export interface WatchlistCountResponse {
  count: number;
  limit: number | null;
  is_pro: boolean;
}

export interface WatchlistAddResponse {
  message: string;
  ticker: string;
  name: string;
  watchlist_count: number;
}

export interface WatchlistRemoveResponse {
  message: string;
  ticker: string;
  watchlist_count: number;
}

export interface WatchlistStatusResponse {
  ticker: string;
  is_watchlisted: boolean;
  watchlist_count: number;
}

export interface CompanySearchResult {
  ticker: string;
  name: string;
  sector: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  indices: string[];
  is_watchlisted: boolean;
}

export const watchlistAPI = {
  // Get user's complete watchlist with company details
  getWatchlist: async (): Promise<WatchedCompany[]> => {
    try {
      const response = await apiClient.get<WatchedCompany[]>('/watchlist/');
      return response;
    } catch (error) {
      console.error('Error fetching watchlist:', error);
      throw error;
    }
  },

  // Get watchlist count - FIXED: Proper API integration
  getCount: async (): Promise<WatchlistCountResponse> => {
    try {
      const response = await apiClient.get<WatchlistCountResponse>('/watchlist/count');
      return response;
    } catch (error) {
      console.error('Error fetching watchlist count:', error);
      throw error;
    }
  },

  // Add company to watchlist
  addToWatchlist: async (ticker: string): Promise<WatchlistAddResponse> => {
    try {
      const response = await apiClient.post<WatchlistAddResponse>(`/watchlist/${ticker.toUpperCase()}`);
      return response;
    } catch (error) {
      console.error(`Error adding ${ticker} to watchlist:`, error);
      throw error;
    }
  },

  // Remove company from watchlist
  removeFromWatchlist: async (ticker: string): Promise<WatchlistRemoveResponse> => {
    try {
      const response = await apiClient.delete<WatchlistRemoveResponse>(`/watchlist/${ticker.toUpperCase()}`);
      return response;
    } catch (error) {
      console.error(`Error removing ${ticker} from watchlist:`, error);
      throw error;
    }
  },

  // Check if company is in watchlist
  checkStatus: async (ticker: string): Promise<WatchlistStatusResponse> => {
    try {
      const response = await apiClient.get<WatchlistStatusResponse>(`/watchlist/check/${ticker.toUpperCase()}`);
      return response;
    } catch (error) {
      console.error(`Error checking watchlist status for ${ticker}:`, error);
      throw error;
    }
  },

  // Search for companies to add to watchlist
  searchCompanies: async (query: string, limit: number = 20): Promise<CompanySearchResult[]> => {
    try {
      const response = await apiClient.get<CompanySearchResult[]>('/watchlist/search', {
        params: { q: query, limit }
      });
      return response;
    } catch (error) {
      console.error('Error searching companies:', error);
      throw error;
    }
  },

  // Clear entire watchlist
  clearWatchlist: async (): Promise<{ message: string; removed_count: number }> => {
    try {
      const response = await apiClient.delete<{ message: string; removed_count: number }>('/watchlist/clear/all');
      return response;
    } catch (error) {
      console.error('Error clearing watchlist:', error);
      throw error;
    }
  },
};

// Helper functions for watchlist operations
export const watchlistHelpers = {
  // Check if company is in major indices
  isInMajorIndices: (company: CompanySearchResult | WatchedCompany): boolean => {
    return company.is_sp500 || company.is_nasdaq100;
  },

  // Get index badges for company
  getIndexBadges: (company: CompanySearchResult | WatchedCompany): string[] => {
    const badges: string[] = [];
    if (company.is_sp500) badges.push('S&P 500');
    if (company.is_nasdaq100) badges.push('NASDAQ 100');
    return badges;
  },

  // Format company display name
  getDisplayName: (company: CompanySearchResult | WatchedCompany): string => {
    return `${company.ticker} - ${company.name}`;
  },

  // Check if watchlist is at capacity (for free users)
  isAtCapacity: (count: number, limit: number | null): boolean => {
    return limit !== null && count >= limit;
  },

  // Get capacity status text
  getCapacityStatus: (count: number, limit: number | null): string => {
    if (limit === null) {
      return `${count} companies (Unlimited)`;
    }
    return `${count}/${limit} companies`;
  },

  // Validate ticker format
  isValidTicker: (ticker: string): boolean => {
    return /^[A-Z]{1,5}$/.test(ticker.toUpperCase());
  },
};