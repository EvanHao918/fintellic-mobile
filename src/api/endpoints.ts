// API endpoints configuration
import apiClient from './client';
import { 
  LoginCredentials,
  AuthResponse,
  User,
  Filing,
  Company
} from '../types';

// Auth endpoints
export const authAPI = {
  login: async (credentials: LoginCredentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);
    
    return await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
  },

  register: async (data: { email: string; password: string; full_name: string }) => {
    return await apiClient.post<AuthResponse>('/auth/register', data);
  },

  getCurrentUser: async () => {
    return await apiClient.get<User>('/auth/me');
  },

  refreshToken: async (token: string) => {
    return await apiClient.post<AuthResponse>('/auth/refresh', { token });
  },
};

// Filings endpoints
export const filingsAPI = {
  getList: async (skip: number = 0, limit: number = 20) => {
    return await apiClient.get<{
      items: Filing[];
      total: number;
      page: number;
      pages: number;
    }>('/filings/', {
      params: { skip, limit },
    });
  },

  getById: async (id: string) => {
    return await apiClient.get<Filing>(`/filings/${id}`);
  },

  vote: async (id: string, voteType: string) => {
    return await apiClient.post(`/filings/${id}/vote`, null, {
      params: { vote_type: voteType },
    });
  },

  getPopular: async (period: string = 'week') => {
    return await apiClient.get<Filing[]>(`/filings/popular/${period}`);
  },
};

// Companies endpoints
export const companiesAPI = {
  getList: async () => {
    return await apiClient.get<Company[]>('/companies/');
  },

  getById: async (id: string) => {
    return await apiClient.get<Company>(`/companies/${id}`);
  },

  search: async (query: string) => {
    return await apiClient.get<Company[]>('/companies/search', {
      params: { q: query },
    });
  },
};