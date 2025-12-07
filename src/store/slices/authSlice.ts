import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginCredentials, AuthResponse } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
import { HISTORY_CONSTANTS } from '../../constants/history';
import apiClient from '../../api/client';
import { authAPI, SocialAuthResponse } from '../../api/endpoints';

// Add register credentials interface
interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

// Apple Sign In credentials
interface AppleSignInCredentials {
  identityToken: string;
  authorizationCode?: string;
  fullName?: string;
  givenName?: string;
  familyName?: string;
}

// Google Sign In credentials
interface GoogleSignInCredentials {
  idToken: string;
  accessToken?: string;
}

// 扩展User类型以包含订阅信息
interface UserWithSubscription extends User {
  // 订阅相关字段（从后端返回）
  is_early_bird?: boolean;
  pricing_tier?: 'EARLY_BIRD' | 'STANDARD';
  user_sequence_number?: number;
  subscription_type?: 'MONTHLY' | 'YEARLY';
  subscription_price?: number;
  is_subscription_active?: boolean;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  next_billing_date?: string;
  subscription_auto_renew?: boolean;
  last_payment_date?: string;
  last_payment_amount?: number;
  total_payment_amount?: number;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Login async thunk - 更新以处理订阅信息
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    try {
      // Step 1: Login to get token
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const loginResponse = await apiClient.post<{ 
        access_token: string; 
        token_type: string; 
        refresh_token?: string;
        user_info?: any; // 后端可能直接返回用户信息
      }>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Login response:', loginResponse);

      // Step 2: Set token to API client immediately
      apiClient.setAuthToken(loginResponse.access_token);

      // Step 3: Fetch user information using the token
      // 注意：使用 /users/me 端点获取完整的用户信息（包括订阅状态）
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');
      console.log('User info response with subscription:', userResponse);

      // Step 4: Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.access_token);
      if (loginResponse.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refresh_token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));

      // Return combined response
      return {
        access_token: loginResponse.access_token,
        refresh_token: loginResponse.refresh_token || null,
        token_type: loginResponse.token_type,
        user: userResponse
      };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
);

// Register async thunk - 更新以处理早鸟资格
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials) => {
    try {
      // First, register the user
      const registerResponse = await apiClient.post<{
        id: number;
        email: string;
        full_name?: string;
        username?: string;
        access_token: string;
        refresh_token: string;
        tier: string;
        is_early_bird: boolean;
        pricing_tier?: string;
        user_sequence_number?: number;
        monthly_price: number;
        yearly_price: number;
        early_bird_slots_remaining?: number;
      }>('/auth/register', {
        email: credentials.email,
        password: credentials.password,
        username: credentials.username,
      });

      console.log('Register response with early bird info:', registerResponse);

      // Set token to API client
      apiClient.setAuthToken(registerResponse.access_token);

      // Fetch complete user information
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');

      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, registerResponse.access_token);
      if (registerResponse.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, registerResponse.refresh_token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));

      // 如果是早鸟用户，可以在这里存储一个标记
      if (registerResponse.is_early_bird) {
        await AsyncStorage.setItem('@is_early_bird', 'true');
        console.log(`🎉 Congratulations! User #${registerResponse.user_sequence_number} - Early bird status granted!`);
      }

      return {
        access_token: registerResponse.access_token,
        refresh_token: registerResponse.refresh_token || null,
        token_type: 'bearer',
        user: userResponse,
        registration_info: {
          is_early_bird: registerResponse.is_early_bird,
          user_sequence_number: registerResponse.user_sequence_number,
          early_bird_slots_remaining: registerResponse.early_bird_slots_remaining,
        }
      };
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    }
  }
);

// Logout async thunk
export const logout = createAsyncThunk('auth/logout', async () => {
  try {
    // Call logout API if needed
    await apiClient.post('/auth/logout').catch(() => {
      // Ignore logout API errors
    });
  } catch (error) {
    console.error('Logout API error:', error);
  } finally {
    // Clear stored data
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.USER_INFO,
      '@is_early_bird', // 清除早鸟标记
    ]);
    
    // Optional: Clear history on logout (uncomment if desired)
    // await AsyncStorage.removeItem(HISTORY_CONSTANTS.STORAGE_KEY);
    
    // Clear the auth token from API client
    apiClient.removeAuthToken();
  }
});

// Load stored auth - 更新以处理订阅信息
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async () => {
    try {
      const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
      const refreshToken = await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
      const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);

      if (token && userInfo) {
        const user = JSON.parse(userInfo);
        console.log('Loading stored auth - Token exists:', !!token);
        console.log('Loading stored auth - User with subscription:', user);
        
        // Set token to axios default headers
        apiClient.setAuthToken(token);
        
        // Validate token by fetching current user info
        try {
          const currentUser = await apiClient.get<UserWithSubscription>('/users/me');
          console.log('Current user from API with subscription:', currentUser);
          
          // Update stored user info if it's different
          if (JSON.stringify(currentUser) !== userInfo) {
            await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(currentUser));
          }
          
          return { 
            token, 
            refreshToken: refreshToken || null,
            user: currentUser 
          };
        } catch (apiError) {
          console.error('Token validation failed:', apiError);
          // Token is invalid, clear storage
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.AUTH_TOKEN, 
            STORAGE_KEYS.REFRESH_TOKEN, 
            STORAGE_KEYS.USER_INFO,
            '@is_early_bird'
          ]);
          apiClient.removeAuthToken();
          return null;
        }
      }
      return null;
    } catch (error) {
      console.error('Load stored auth error:', error);
      return null;
    }
  }
);

// Refresh user info - 更新以获取最新订阅状态
export const refreshUserInfo = createAsyncThunk(
  'auth/refreshUserInfo',
  async () => {
    try {
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');
      console.log('Refreshed user info with subscription:', userResponse);
      
      // Update stored user info
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));
      
      return userResponse;
    } catch (error) {
      console.error('Refresh user info error:', error);
      throw error;
    }
  }
);

// 新增：Mock升级到Pro（开发环境用）
export const mockUpgradeToPro = createAsyncThunk(
  'auth/mockUpgradeToPro',
  async (plan: 'monthly' | 'yearly') => {
    try {
      const response = await apiClient.post('/users/me/upgrade-mock', { plan });
      console.log('Mock upgrade response:', response);
      
      // 刷新用户信息以获取更新后的订阅状态
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));
      
      return userResponse;
    } catch (error) {
      console.error('Mock upgrade error:', error);
      throw error;
    }
  }
);

// ==================== Social Auth Thunks ====================

// Apple Sign In
export const appleSignIn = createAsyncThunk(
  'auth/appleSignIn',
  async (credentials: AppleSignInCredentials) => {
    try {
      console.log('Apple Sign In starting...');
      
      const response = await authAPI.appleSignIn({
        identity_token: credentials.identityToken,
        authorization_code: credentials.authorizationCode,
        full_name: credentials.fullName,
        given_name: credentials.givenName,
        family_name: credentials.familyName,
        device_type: 'ios',
      });

      console.log('Apple Sign In response:', response);

      // Set token to API client
      apiClient.setAuthToken(response.access_token);

      // Fetch complete user information
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');
      console.log('User info after Apple Sign In:', userResponse);

      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
      if (response.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));

      // Log new user registration
      if (response.is_new_user) {
        console.log('🎉 New user registered via Apple Sign In!');
        if (response.is_early_bird) {
          await AsyncStorage.setItem('@is_early_bird', 'true');
          console.log(`🎉 Early bird status granted!`);
        }
      }

      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token || null,
        token_type: 'bearer',
        user: userResponse,
        is_new_user: response.is_new_user,
      };
    } catch (error) {
      console.error('Apple Sign In error:', error);
      throw error;
    }
  }
);

// Google Sign In
export const googleSignIn = createAsyncThunk(
  'auth/googleSignIn',
  async (credentials: GoogleSignInCredentials) => {
    try {
      console.log('Google Sign In starting...');
      
      const response = await authAPI.googleSignIn({
        id_token: credentials.idToken,
        access_token: credentials.accessToken,
        device_type: 'ios', // or detect platform
      });

      console.log('Google Sign In response:', response);

      // Set token to API client
      apiClient.setAuthToken(response.access_token);

      // Fetch complete user information
      const userResponse = await apiClient.get<UserWithSubscription>('/users/me');
      console.log('User info after Google Sign In:', userResponse);

      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
      if (response.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, response.refresh_token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));

      // Log new user registration
      if (response.is_new_user) {
        console.log('🎉 New user registered via Google Sign In!');
        if (response.is_early_bird) {
          await AsyncStorage.setItem('@is_early_bird', 'true');
          console.log(`🎉 Early bird status granted!`);
        }
      }

      return {
        access_token: response.access_token,
        refresh_token: response.refresh_token || null,
        token_type: 'bearer',
        user: userResponse,
        is_new_user: response.is_new_user,
      };
    } catch (error) {
      console.error('Google Sign In error:', error);
      throw error;
    }
  }
);

// Create slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      console.log('User updated in Redux:', action.payload);
    },
    // 新增：更新用户订阅状态
    updateUserSubscription: (state, action: PayloadAction<Partial<UserWithSubscription>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        console.log('User subscription updated:', action.payload);
      }
    },
  },
  extraReducers: (builder) => {
    // Login cases
    builder
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        console.log('Login successful, user with subscription set:', action.payload.user);
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.error.message || 'Login failed';
      });

    // Register cases
    builder
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action: any) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        
        // 存储早鸟信息（如果有）
        if (action.payload.registration_info?.is_early_bird) {
          console.log('🎉 Early bird user registered!');
        }
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.error.message || 'Registration failed';
      });

    // Logout cases
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Load stored auth cases
    builder
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.refreshToken = action.payload.refreshToken;
          state.user = action.payload.user;
          state.isAuthenticated = true;
          console.log('Stored auth loaded with subscription info:', action.payload.user);
        }
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
      });

    // Refresh user info cases
    builder
      .addCase(refreshUserInfo.fulfilled, (state, action) => {
        state.user = action.payload;
        console.log('User info refreshed with subscription:', action.payload);
      });
    
    // Mock upgrade cases
    builder
      .addCase(mockUpgradeToPro.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(mockUpgradeToPro.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        console.log('User upgraded to Pro:', action.payload);
      })
      .addCase(mockUpgradeToPro.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Upgrade failed';
      });

    // Apple Sign In cases
    builder
      .addCase(appleSignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(appleSignIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        console.log('Apple Sign In successful:', action.payload.user);
      })
      .addCase(appleSignIn.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.error.message || 'Apple Sign In failed';
      });

    // Google Sign In cases
    builder
      .addCase(googleSignIn.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(googleSignIn.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
        console.log('Google Sign In successful:', action.payload.user);
      })
      .addCase(googleSignIn.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.refreshToken = null;
        state.error = action.error.message || 'Google Sign In failed';
      });
  },
});

export const { clearError, updateUser, updateUserSubscription } = authSlice.actions;
export default authSlice.reducer;