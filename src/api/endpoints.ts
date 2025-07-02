import { apiClient } from './client';
import { 
  LoginRequest, 
  LoginResponse, 
  User, 
  Filing, 
  Company 
} from '../types';

export const api = {
  // Auth endpoints
  auth: {
    login: (data: LoginRequest) => 
      apiClient.post<LoginResponse>('/auth/login', data),
    
    register: (data: { email: string; username: string; password: string }) => 
      apiClient.post<LoginResponse>('/auth/register', data),
    
    getCurrentUser: () => 
      apiClient.get<User>('/users/me'),
  },

  // Filings endpoints
  filings: {
    getList: (params?: { 
      limit?: number; 
      offset?: number; 
      filing_type?: string;
      company_id?: string;
    }) => apiClient.get<Filing[]>('/filings', { params }),
    
    getById: (id: string) => 
      apiClient.get<Filing>(`/filings/${id}`),
    
    getPopular: (period: 'day' | 'week' | 'month') => 
      apiClient.get<Filing[]>(`/filings/popular/${period}`),
    
    vote: (filingId: string, voteType: 'bullish' | 'bearish') => 
      apiClient.post(`/filings/${filingId}/vote`, null, { 
        params: { vote_type: voteType } 
      }),
  },

  // Companies endpoints
  companies: {
    getList: (params?: { search?: string; is_sp500?: boolean }) => 
      apiClient.get<Company[]>('/companies', { params }),
    
    getById: (id: string) => 
      apiClient.get<Company>(`/companies/${id}`),
  },

  // User watchlist
  watchlist: {
    get: () => 
      apiClient.get<Company[]>('/users/me/watchlist'),
    
    add: (companyId: string) => 
      apiClient.post(`/users/me/watchlist/${companyId}`),
    
    remove: (companyId: string) => 
      apiClient.delete(`/users/me/watchlist/${companyId}`),
  },
};