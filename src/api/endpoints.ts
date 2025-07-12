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
    
    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });
    return response; // Already returns .data due to ApiClient changes
  },

  register: async (data: { email: string; password: string; full_name: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response;
  },

  // FIXED: Changed from '/auth/me' to '/users/me'
  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/users/me');
    return response;
  },

  refreshToken: async (token: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { token });
    return response;
  },

  // Add upgrade endpoint to auth API for convenience
  upgradeToProMock: async (plan: string) => {
    const response = await apiClient.post('/users/me/upgrade-mock', { plan });
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
    const response = await apiClient.get('/users/me/subscription');
    return response;
  },
};