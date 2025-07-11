import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthState, User, LoginCredentials, AuthResponse } from '../../types';
import { STORAGE_KEYS } from '../../utils/constants';
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
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// Login async thunk
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials) => {
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const response = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store token
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(response.user));

    // Set token to API client
    apiClient.setAuthToken(response.access_token);

    return response;
  }
);

// Register async thunk
export const register = createAsyncThunk(
  'auth/register',
  async (credentials: RegisterCredentials) => {
    // First, register the user
    const registerResponse = await apiClient.post('/auth/register', {
      email: credentials.email,
      password: credentials.password,
      username: credentials.username,
    });

    // After successful registration, automatically log them in
    const formData = new URLSearchParams();
    formData.append('username', credentials.email);
    formData.append('password', credentials.password);

    const loginResponse = await apiClient.post<AuthResponse>('/auth/login', formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    // Store token
    await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, loginResponse.access_token);
    await AsyncStorage.setItem(STORAGE_KEYS.USER_INFO, JSON.stringify(loginResponse.user));

    // Set token to API client
    apiClient.setAuthToken(loginResponse.access_token);

    return loginResponse;
  }
);

// Logout async thunk
export const logout = createAsyncThunk('auth/logout', async () => {
    // Clear stored data
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.AUTH_TOKEN,
      STORAGE_KEYS.USER_INFO,
    ]);
    
    // Clear the auth token from API client
    apiClient.removeAuthToken();
  });

// Load stored auth async thunk
export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async () => {
    const token = await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    const userInfo = await AsyncStorage.getItem(STORAGE_KEYS.USER_INFO);

    if (token && userInfo) {
      const user = JSON.parse(userInfo);
      // Set token to axios default headers
      apiClient.setAuthToken(token);
      return { token, user };
    }
    return null;
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
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
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
        state.user = action.payload.user;
        state.error = null;
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.error = action.error.message || 'Registration failed';
      });

    // Logout cases
    builder
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      });

    // Load stored auth cases
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      });
  },
});

export const { clearError, updateUser } = authSlice.actions;
export default authSlice.reducer;