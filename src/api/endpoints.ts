// API endpoints configuration
import apiClient from './client';
import { 
  LoginCredentials,
  AuthResponse,
  User,
  Filing,
  Company
} from '../types';
import {
  SubscriptionInfo,
  PricingInfo,
} from '../types/subscription';

// Social auth response types
export interface SocialAuthResponse {
  id: number;
  email: string | null;
  full_name: string | null;
  username: string | null;
  access_token: string;
  refresh_token: string;
  token_type: string;
  is_new_user: boolean;
  email_verified: boolean;
  tier: string;
  is_early_bird: boolean;
  pricing_tier: string | null;
  user_sequence_number: number | null;
  monthly_price: number;
  yearly_price: number;
  early_bird_slots_remaining: number | null;
  linked_providers: string[];
}

export interface SocialAccountStatus {
  apple_linked: boolean;
  google_linked: boolean;
  linkedin_linked: boolean;
  can_unlink: boolean;
}

// Auth endpoints
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response;
  },

  register: async (data: { email: string; password: string; full_name: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/users/me');
    return response;
  },

  refreshToken: async (token: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { token });
    return response;
  },

  upgradeToProMock: async (plan: string) => {
    const response = await apiClient.post('/users/me/upgrade-mock', { plan });
    return response;
  },

  // Password Reset APIs
  requestPasswordReset: async (email: string) => {
    const response = await apiClient.post('/auth/password/reset-request', { email });
    return response;
  },

  confirmPasswordReset: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/password/reset-confirm', { 
      token, 
      new_password: newPassword 
    });
    return response;
  },

  // ==================== Social Auth APIs ====================
  
  // Apple Sign In
  appleSignIn: async (data: {
    identity_token: string;
    authorization_code?: string;
    full_name?: string;
    given_name?: string;
    family_name?: string;
    device_id?: string;
    device_type?: string;
  }) => {
    const response = await apiClient.post<SocialAuthResponse>('/auth/apple', data);
    return response;
  },

  // Google Sign In
  googleSignIn: async (data: {
    id_token: string;
    access_token?: string;
    device_id?: string;
    device_type?: string;
  }) => {
    const response = await apiClient.post<SocialAuthResponse>('/auth/google', data);
    return response;
  },

  // Get social account status
  getSocialAccounts: async () => {
    const response = await apiClient.get<SocialAccountStatus>('/auth/social-accounts');
    return response;
  },

  // Link social account
  linkSocialAccount: async (provider: 'apple' | 'google' | 'linkedin', token: string) => {
    const response = await apiClient.post<SocialAccountStatus>('/auth/link-social', {
      provider,
      token,
    });
    return response;
  },

  // Unlink social account
  unlinkSocialAccount: async (provider: 'apple' | 'google' | 'linkedin') => {
    const response = await apiClient.post<SocialAccountStatus>('/auth/unlink-social', {
      provider,
    });
    return response;
  },
};

// Filings endpoints
export const filingsAPI = {
  getList: async (skip: number = 0, limit: number = 20) => {
    const response = await apiClient.get<{
      items: Filing[];
      total: number;
      page: number;
      pages: number;
    }>('/filings/', {
      params: { skip, limit },
    });
    return response;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Filing>(`/filings/${id}`);
    return response;
  },

  vote: async (id: string, voteType: string) => {
    const response = await apiClient.post(`/filings/${id}/vote`, null, {
      params: { vote_type: voteType },
    });
    return response;
  },

  getPopular: async (period: string = 'week') => {
    const response = await apiClient.get<Filing[]>(`/filings/popular/${period}`);
    return response;
  },
};

// Companies endpoints
export const companiesAPI = {
  getList: async () => {
    const response = await apiClient.get<Company[]>('/companies/');
    return response;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return response;
  },

  search: async (query: string) => {
    const response = await apiClient.get<Company[]>('/companies/search', {
      params: { q: query },
    });
    return response;
  },
};

// User endpoints
export const userAPI = {
  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/users/me');
    return response;
  },

  updateProfile: async (data: Partial<User>) => {
    const response = await apiClient.put<User>('/users/me', data);
    return response;
  },

  upgradeToProMock: async (plan: string) => {
    const response = await apiClient.post('/users/me/upgrade-mock', { plan });
    return response;
  },

  getSubscription: async () => {
    const response = await apiClient.get<SubscriptionInfo>('/users/me/subscription');
    return response;
  },
  
  getPricing: async () => {
    const response = await apiClient.get<PricingInfo>('/users/me/pricing');
    return response;
  },
};

// 订阅专用端点
export { subscriptionAPI } from '../api/subscription';

// 导出通知API
export { notificationAPI, notificationHelpers } from './notifications';

// 导出watchlist API
export { watchlistAPI, watchlistHelpers } from './watchlist';