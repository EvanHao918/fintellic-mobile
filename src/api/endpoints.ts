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
    return response.data;
  },

  register: async (data: { email: string; password: string; full_name: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await apiClient.get<User>('/auth/me');
    return response.data;
  },

  refreshToken: async (token: string) => {
    const response = await apiClient.post<AuthResponse>('/auth/refresh', { token });
    return response.data;
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
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Filing>(`/filings/${id}`);
    return response.data;
  },

  vote: async (id: string, voteType: string) => {
    const response = await apiClient.post(`/filings/${id}/vote`, null, {
      params: { vote_type: voteType },
    });
    return response.data;
  },

  getPopular: async (period: string = 'week') => {
    const response = await apiClient.get<Filing[]>(`/filings/popular/${period}`);
    return response.data;
  },
};

// Companies endpoints
export const companiesAPI = {
  getList: async () => {
    const response = await apiClient.get<Company[]>('/companies/');
    return response.data;
  },

  getById: async (id: string) => {
    const response = await apiClient.get<Company>(`/companies/${id}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get<Company[]>('/companies/search', {
      params: { q: query },
    });
    return response.data;
  },
};