// src/store/slices/subscriptionSlice.ts

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  SubscriptionState,
  SubscriptionInfo,
  PricingInfo,
  EarlyBirdStatus,
  PaymentHistory,
  SubscriptionHistory,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionCancel,
  SubscriptionResponse,
} from '../../types/subscription';
import { subscriptionAPI, userSubscriptionAPI } from '../../api/subscription';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Storage keys for caching
const STORAGE_KEYS = {
  PRICING_INFO: '@subscription_pricing',
  EARLY_BIRD_STATUS: '@early_bird_status',
};

// Initial state
const initialState: SubscriptionState = {
  currentSubscription: null,
  pricingInfo: null,
  earlyBirdStatus: null,
  paymentHistory: [],
  subscriptionHistory: [],
  isLoading: false,
  error: null,
  isCreatingSubscription: false,
  isUpdatingSubscription: false,
  isCancellingSubscription: false,
};

// ==================== Async Thunks ====================

/**
 * 获取早鸟状态
 */
export const fetchEarlyBirdStatus = createAsyncThunk(
  'subscription/fetchEarlyBirdStatus',
  async () => {
    try {
      const status = await subscriptionAPI.getEarlyBirdStatus();
      
      // Cache the status
      await AsyncStorage.setItem(
        STORAGE_KEYS.EARLY_BIRD_STATUS,
        JSON.stringify(status)
      );
      
      return status;
    } catch (error) {
      // Try to load from cache if API fails
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.EARLY_BIRD_STATUS);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }
);

/**
 * 获取用户价格信息
 */
export const fetchPricingInfo = createAsyncThunk(
  'subscription/fetchPricingInfo',
  async () => {
    try {
      const pricing = await subscriptionAPI.getPricing();
      
      // Cache the pricing
      await AsyncStorage.setItem(
        STORAGE_KEYS.PRICING_INFO,
        JSON.stringify(pricing)
      );
      
      return pricing;
    } catch (error) {
      // Try to load from cache if API fails
      const cached = await AsyncStorage.getItem(STORAGE_KEYS.PRICING_INFO);
      if (cached) {
        return JSON.parse(cached);
      }
      throw error;
    }
  }
);

/**
 * 获取当前订阅状态
 */
export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrentSubscription',
  async () => {
    const subscription = await subscriptionAPI.getCurrentSubscription();
    return subscription;
  }
);

/**
 * 创建订阅
 */
export const createSubscription = createAsyncThunk(
  'subscription/createSubscription',
  async (data: SubscriptionCreate) => {
    const response = await subscriptionAPI.createSubscription(data);
    
    // If successful, refresh subscription status
    if (response.success && response.subscription_info) {
      return response;
    }
    
    throw new Error(response.message || 'Failed to create subscription');
  }
);

/**
 * 更新订阅（切换计划）
 */
export const updateSubscription = createAsyncThunk(
  'subscription/updateSubscription',
  async (data: SubscriptionUpdate) => {
    const response = await subscriptionAPI.updateSubscription(data);
    
    if (response.success && response.subscription_info) {
      return response;
    }
    
    throw new Error(response.message || 'Failed to update subscription');
  }
);

/**
 * 取消订阅 - 🔥 修复：增强错误处理和状态更新
 */
export const cancelSubscription = createAsyncThunk(
  'subscription/cancelSubscription',
  async (data: SubscriptionCancel, { rejectWithValue }) => {
    try {
      console.log('🔄 cancelSubscription thunk: dispatching API call with data:', data);
      const response = await subscriptionAPI.cancelSubscription(data);
      
      console.log('📡 cancelSubscription thunk: API response:', response);
      
      if (response.success) {
        return response;
      }
      
      // 如果API返回失败，抛出错误
      const errorMessage = response.message || 'Failed to cancel subscription';
      console.error('❌ cancelSubscription thunk: API returned failure:', errorMessage);
      return rejectWithValue(errorMessage);
    } catch (error: any) {
      console.error('❌ cancelSubscription thunk: Exception occurred:', error);
      const errorMessage = error?.message || error?.toString() || 'Failed to cancel subscription';
      return rejectWithValue(errorMessage);
    }
  }
);

/**
 * 获取支付历史
 */
export const fetchPaymentHistory = createAsyncThunk(
  'subscription/fetchPaymentHistory',
  async (limit: number = 10) => {
    const history = await subscriptionAPI.getPaymentHistory(limit);
    return history;
  }
);

/**
 * 获取订阅历史
 */
export const fetchSubscriptionHistory = createAsyncThunk(
  'subscription/fetchSubscriptionHistory',
  async () => {
    const history = await subscriptionAPI.getSubscriptionHistory();
    return history;
  }
);

/**
 * Mock升级到Pro（开发用）
 */
export const mockUpgradeToPro = createAsyncThunk(
  'subscription/mockUpgradeToPro',
  async (plan: 'monthly' | 'yearly') => {
    const response = await subscriptionAPI.mockUpgradeToPro(plan);
    
    // Refresh subscription status after mock upgrade
    const subscription = await subscriptionAPI.getCurrentSubscription();
    
    return { response, subscription };
  }
);

/**
 * 初始化订阅数据（一次性获取所有必要数据）
 */
export const initializeSubscriptionData = createAsyncThunk(
  'subscription/initialize',
  async () => {
    try {
      // Fetch all necessary data in parallel
      const [earlyBirdStatus, pricingInfo, currentSubscription] = await Promise.all([
        subscriptionAPI.getEarlyBirdStatus(),
        subscriptionAPI.getPricing().catch(() => null), // Pricing requires auth
        subscriptionAPI.getCurrentSubscription().catch(() => null), // Subscription requires auth
      ]);
      
      return {
        earlyBirdStatus,
        pricingInfo,
        currentSubscription,
      };
    } catch (error) {
      console.error('Failed to initialize subscription data:', error);
      throw error;
    }
  }
);

// ==================== Slice ====================

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    /**
     * 清除错误
     */
    clearError: (state) => {
      state.error = null;
    },
    
    /**
     * 更新当前订阅信息
     */
    updateCurrentSubscription: (state, action: PayloadAction<SubscriptionInfo>) => {
      state.currentSubscription = action.payload;
    },
    
    /**
     * 清除缓存数据
     */
    clearCache: (state) => {
      state.pricingInfo = null;
      state.earlyBirdStatus = null;
      AsyncStorage.multiRemove([
        STORAGE_KEYS.PRICING_INFO,
        STORAGE_KEYS.EARLY_BIRD_STATUS,
      ]);
    },
    
    /**
     * 重置订阅状态
     */
    resetSubscriptionState: () => initialState,
  },
  extraReducers: (builder) => {
    // Early bird status
    builder
      .addCase(fetchEarlyBirdStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchEarlyBirdStatus.fulfilled, (state, action) => {
        state.earlyBirdStatus = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchEarlyBirdStatus.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch early bird status';
      });
    
    // Pricing info
    builder
      .addCase(fetchPricingInfo.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchPricingInfo.fulfilled, (state, action) => {
        state.pricingInfo = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchPricingInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch pricing info';
      });
    
    // Current subscription
    builder
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch subscription';
      });
    
    // Create subscription
    builder
      .addCase(createSubscription.pending, (state) => {
        state.isCreatingSubscription = true;
        state.error = null;
      })
      .addCase(createSubscription.fulfilled, (state, action) => {
        state.isCreatingSubscription = false;
        if (action.payload.subscription_info) {
          state.currentSubscription = action.payload.subscription_info;
        }
        state.error = null;
      })
      .addCase(createSubscription.rejected, (state, action) => {
        state.isCreatingSubscription = false;
        state.error = action.error.message || 'Failed to create subscription';
      });
    
    // Update subscription
    builder
      .addCase(updateSubscription.pending, (state) => {
        state.isUpdatingSubscription = true;
        state.error = null;
      })
      .addCase(updateSubscription.fulfilled, (state, action) => {
        state.isUpdatingSubscription = false;
        if (action.payload.subscription_info) {
          state.currentSubscription = action.payload.subscription_info;
        }
        state.error = null;
      })
      .addCase(updateSubscription.rejected, (state, action) => {
        state.isUpdatingSubscription = false;
        state.error = action.error.message || 'Failed to update subscription';
      });
    
    // Cancel subscription - 🔥 修复：完善状态处理
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.isCancellingSubscription = true;
        state.error = null;
        console.log('🔄 Redux: cancelSubscription pending');
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isCancellingSubscription = false;
        console.log('✅ Redux: cancelSubscription fulfilled', action.payload);
        
        // 更新订阅信息
        if (action.payload.subscription_info) {
          state.currentSubscription = action.payload.subscription_info;
        }
        state.error = null;
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isCancellingSubscription = false;
        console.log('❌ Redux: cancelSubscription rejected', action.payload);
        
        // 使用 rejectWithValue 提供的错误信息
        state.error = action.payload as string || action.error.message || 'Failed to cancel subscription';
      });
    
    // Payment history
    builder
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory = action.payload;
      });
    
    // Subscription history
    builder
      .addCase(fetchSubscriptionHistory.fulfilled, (state, action) => {
        state.subscriptionHistory = action.payload;
      });
    
    // Mock upgrade
    builder
      .addCase(mockUpgradeToPro.pending, (state) => {
        state.isCreatingSubscription = true;
      })
      .addCase(mockUpgradeToPro.fulfilled, (state, action) => {
        state.isCreatingSubscription = false;
        state.currentSubscription = action.payload.subscription;
        state.error = null;
      })
      .addCase(mockUpgradeToPro.rejected, (state, action) => {
        state.isCreatingSubscription = false;
        state.error = action.error.message || 'Failed to upgrade';
      });
    
    // Initialize subscription data
    builder
      .addCase(initializeSubscriptionData.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(initializeSubscriptionData.fulfilled, (state, action) => {
        state.isLoading = false;
        state.earlyBirdStatus = action.payload.earlyBirdStatus;
        if (action.payload.pricingInfo) {
          state.pricingInfo = action.payload.pricingInfo;
        }
        if (action.payload.currentSubscription) {
          state.currentSubscription = action.payload.currentSubscription;
        }
        state.error = null;
      })
      .addCase(initializeSubscriptionData.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to initialize subscription data';
      });
  },
});

// Export actions
export const {
  clearError,
  updateCurrentSubscription,
  clearCache,
  resetSubscriptionState,
} = subscriptionSlice.actions;

// Export reducer
export default subscriptionSlice.reducer;