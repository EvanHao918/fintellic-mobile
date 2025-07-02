import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginRequest } from '../../types';
import { api } from '../../api/endpoints';
import { storage } from '../../utils/storage';
import { STORAGE_KEYS } from '../../utils/constants';

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isLoading: false,
  error: null,
  isAuthenticated: false,
};

// Async thunks
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest) => {
    const response = await api.auth.login(credentials);
    
    // Save token to storage
    await storage.set(STORAGE_KEYS.AUTH_TOKEN, response.access_token);
    await storage.set(STORAGE_KEYS.USER_DATA, response.user);
    
    return response;
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStored',
  async () => {
    const token = await storage.get<string>(STORAGE_KEYS.AUTH_TOKEN);
    const user = await storage.get<User>(STORAGE_KEYS.USER_DATA);
    
    if (!token || !user) {
      throw new Error('No stored auth data');
    }
    
    // Verify token by fetching current user
    const currentUser = await api.auth.getCurrentUser();
    
    return { token, user: currentUser };
  }
);

export const logout = createAsyncThunk(
  'auth/logout',
  async () => {
    await storage.remove(STORAGE_KEYS.AUTH_TOKEN);
    await storage.remove(STORAGE_KEYS.USER_DATA);
  }
);

// Slice
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Login
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
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Login failed';
      });
    
    // Load stored auth
    builder
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.token = action.payload.token;
        state.user = action.payload.user;
      })
      .addCase(loadStoredAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      });
    
    // Logout
    builder.addCase(logout.fulfilled, (state) => {
      state.isAuthenticated = false;
      state.token = null;
      state.user = null;
    });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;