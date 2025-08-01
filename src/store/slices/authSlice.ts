import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginCredentials, AuthResponse } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
import { HISTORY_CONSTANTS } from '../../constants/history';
import apiClient from '../../api/client';

// Add register credentials interface
interface RegisterCredentials {
  email: string;
  password: string;
  username: string;
}

const initialState: AuthState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Login async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    try {
      // Step 1: Login to get token
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const loginResponse = await apiClient.post<{ access_token: string; token_type: string; refresh_token?: string }>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      console.log('Login response:', loginResponse);

      // Step 2: Set token to API client immediately
      apiClient.setAuthToken(loginResponse.access_token);

      // Step 3: Fetch user information using the token
      const userResponse = await apiClient.get<User>('/users/me');
      console.log('User info response:', userResponse);

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

// Register async thunk
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials) => {
    try {
      // First, register the user
      const registerResponse = await apiClient.post('/auth/register', {
        email: credentials.email,
        password: credentials.password,
        username: credentials.username,
      });

      console.log('Register response:', registerResponse);

      // After successful registration, automatically log them in
      const formData = new URLSearchParams();
      formData.append('username', credentials.email);
      formData.append('password', credentials.password);

      const loginResponse = await apiClient.post<{ access_token: string; token_type: string; refresh_token?: string }>('/auth/login', formData, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      // Set token to API client
      apiClient.setAuthToken(loginResponse.access_token);

      // Fetch user information
      const userResponse = await apiClient.get<User>('/users/me');

      // Store token and user info
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.access_token);
      if (loginResponse.refresh_token) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginResponse.refresh_token);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));

      return {
        access_token: loginResponse.access_token,
        refresh_token: loginResponse.refresh_token || null,
        token_type: loginResponse.token_type,
        user: userResponse
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
    ]);
    
    // Optional: Clear history on logout (uncomment if desired)
    // await AsyncStorage.removeItem(HISTORY_CONSTANTS.STORAGE_KEY);
    
    // Clear the auth token from API client
    apiClient.removeAuthToken();
  }
});

// Load stored auth
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
        console.log('Loading stored auth - User:', user);
        
        // Set token to axios default headers
        apiClient.setAuthToken(token);
        
        // Validate token by fetching current user info
        try {
          const currentUser = await apiClient.get<User>('/users/me');
          console.log('Current user from API:', currentUser);
          
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
          await AsyncStorage.multiRemove([STORAGE_KEYS.AUTH_TOKEN, STORAGE_KEYS.REFRESH_TOKEN, STORAGE_KEYS.USER_INFO]);
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

// Refresh user info
export const refreshUserInfo = createAsyncThunk(
  'auth/refreshUserInfo',
  async () => {
    try {
      const userResponse = await apiClient.get<User>('/users/me');
      console.log('Refreshed user info:', userResponse);
      
      // Update stored user info
      await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(userResponse));
      
      return userResponse;
    } catch (error) {
      console.error('Refresh user info error:', error);
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
        console.log('Login successful, user set:', action.payload.user);
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
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.token = action.payload.access_token;
        state.refreshToken = action.payload.refresh_token;
        state.user = action.payload.user;
        state.error = null;
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
          console.log('Stored auth loaded, user set:', action.payload.user);
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
        console.log('User info refreshed:', action.payload);
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;