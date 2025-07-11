import axios, { AxiosInstance } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL, STORAGE_KEYS } from '../utils/constants';
import { Platform } from 'react-native';

interface LimitError {
  isLimitError: boolean;
  limitInfo?: {
    views_today: number;
    daily_limit: number;
  };
}

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      async (config) => {
        try {
          // For web platform, try localStorage first
          let token = null;
          
          if (Platform.OS === 'web') {
            // Web platform - use localStorage directly
            token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
            console.log('Web platform - Token from localStorage:', token ? 'exists' : 'not found');
          } else {
            // Mobile platform - use AsyncStorage
            token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
          }
          
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
            console.log('Authorization header set');
          } else {
            console.log('No token found');
          }
        } catch (error) {
          console.error('Error getting token:', error);
        }
        
        console.log('Request config:', {
          url: config.url,
          headers: config.headers,
        });
        
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        console.error('API Error:', {
          status: error.response?.status,
          data: error.response?.data,
          url: error.config?.url,
        });
        
        // Handle 403 errors specially for daily limit
        if (error.response?.status === 403) {
          const errorData = error.response?.data?.detail;
          
          // Check if this is a daily limit error
          if (errorData && typeof errorData === 'object' && errorData.error === 'DAILY_LIMIT_REACHED') {
            const limitError: any = new Error(errorData.message || 'Daily limit reached. Upgrade to Pro for unlimited access.');
            limitError.isLimitError = true;
            limitError.limitInfo = {
              views_today: errorData.views_today || 3,
              daily_limit: errorData.daily_limit || 3
            };
            return Promise.reject(limitError);
          }
        }
        
        if (error.response?.status === 401) {
          // Clear auth data on 401
          if (Platform.OS === 'web') {
            localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
            localStorage.removeItem(STORAGE_KEYS.USER_INFO);
          } else {
            await AsyncStorage.multiRemove([
              STORAGE_KEYS.AUTH_TOKEN,
              STORAGE_KEYS.USER_INFO,
            ]);
          }
          
          // You might want to dispatch a logout action here
          // or navigate to login screen
        }

        // Format error message
        const message = error.response?.data?.detail || 
                       error.response?.data?.message || 
                       error.message || 
                       'Network request failed';

        return Promise.reject(new Error(message));
      }
    );
  }

  // HTTP methods - IMPORTANT: Now returning response.data directly
  async get<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.get<T>(url, config);
    return response.data; // Return data directly
  }

  async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.post<T>(url, data, config);
    return response.data; // Return data directly
  }

  async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    const response = await this.client.put<T>(url, data, config);
    return response.data; // Return data directly
  }

  async delete<T = any>(url: string, config?: any): Promise<T> {
    const response = await this.client.delete<T>(url, config);
    return response.data; // Return data directly
  }

  // Set auth token manually (useful after login)
  setAuthToken(token: string) {
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    console.log('Auth token set manually');
  }

  // Remove auth token
  removeAuthToken() {
    delete this.client.defaults.headers.common['Authorization'];
    console.log('Auth token removed');
  }
}

// Export singleton instance
const apiClient = new ApiClient();
export default apiClient;