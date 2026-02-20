// src/store/slices/subscriptionSlice.ts - Simplified Redux Slice for Phase 1

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  SubscriptionState,
  SubscriptionInfo,
  PricingInfo,
  PaymentHistory,
  SubscriptionCancel,
} from '../../types/subscription';
import { subscriptionAPI } from '../../api/subscription';

// 初始状态
const initialState: SubscriptionState = {
  currentSubscription: null,
  pricingInfo: null,
  paymentHistory: [],
  isLoading: false,
  error: null,
  isCreatingSubscription: false,
  isCancellingSubscription: false,
};

// ==================== Async Thunks ====================

/**
 * 获取价格信息
 */
export const fetchPricingInfo = createAsyncThunk(
  'subscription/fetchPricingInfo',
  async () => {
    return await subscriptionAPI.getPricing();
  }
);

/**
 * 获取当前订阅状态
 */
export const fetchCurrentSubscription = createAsyncThunk(
  'subscription/fetchCurrentSubscription',
  async () => {
    return await subscriptionAPI.getCurrentSubscription();
  }
);

/**
 * 取消订阅
 */
export const cancelSubscription = createAsyncThunk(
  'subscription/cancelSubscription',
  async (data: SubscriptionCancel, { rejectWithValue }) => {
    try {
      const response = await subscriptionAPI.cancelSubscription(data);
      
      if (response.success) {
        return response;
      }
      
      const errorMessage = response.message || 'Failed to cancel subscription';
      return rejectWithValue(errorMessage);
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to cancel subscription';
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
    return await subscriptionAPI.getPaymentHistory(limit);
  }
);

/**
 * Phase 1: 验证真实购买后更新订阅状态
 */
export const refreshSubscriptionAfterPurchase = createAsyncThunk(
  'subscription/refreshAfterPurchase',
  async () => {
    // 购买完成后刷新订阅和价格信息
    const [subscription, pricing] = await Promise.all([
      subscriptionAPI.getCurrentSubscription(),
      subscriptionAPI.getPricing(),
    ]);
    
    return { subscription, pricing };
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
     * 重置订阅状态
     */
    resetSubscriptionState: () => initialState,
    
    /**
     * Phase 1: 设置购买进行中状态
     */
    setPurchaseInProgress: (state, action: PayloadAction<boolean>) => {
      state.isCreatingSubscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    // 价格信息
    builder
      .addCase(fetchPricingInfo.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPricingInfo.fulfilled, (state, action) => {
        state.pricingInfo = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchPricingInfo.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch pricing info';
      });
    
    // 当前订阅
    builder
      .addCase(fetchCurrentSubscription.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCurrentSubscription.fulfilled, (state, action) => {
        state.currentSubscription = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCurrentSubscription.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch subscription';
      });
    
    // 取消订阅
    builder
      .addCase(cancelSubscription.pending, (state) => {
        state.isCancellingSubscription = true;
        state.error = null;
      })
      .addCase(cancelSubscription.fulfilled, (state, action) => {
        state.isCancellingSubscription = false;
        if (action.payload.subscription_info) {
          state.currentSubscription = action.payload.subscription_info;
        }
      })
      .addCase(cancelSubscription.rejected, (state, action) => {
        state.isCancellingSubscription = false;
        state.error = action.payload as string || 'Failed to cancel subscription';
      });
    
    // 支付历史
    builder
      .addCase(fetchPaymentHistory.fulfilled, (state, action) => {
        state.paymentHistory = action.payload;
      });
    
    // Phase 1: 购买后刷新
    builder
      .addCase(refreshSubscriptionAfterPurchase.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(refreshSubscriptionAfterPurchase.fulfilled, (state, action) => {
        state.currentSubscription = action.payload.subscription;
        state.pricingInfo = action.payload.pricing;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(refreshSubscriptionAfterPurchase.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to refresh subscription data';
      });
  },
});

// ==================== 简化的选择器 ====================

/**
 * 判断用户是否使用优惠价格
 */
export const selectIsDiscountedUser = (state: { subscription: SubscriptionState }) => {
  return state.subscription.pricingInfo?.is_early_bird || false;
};

/**
 * 获取当前月付价格
 */
export const selectCurrentMonthlyPrice = (state: { subscription: SubscriptionState }) => {
  return state.subscription.pricingInfo?.monthly_price || 49;
};

/**
 * 获取当前年付价格
 */
export const selectCurrentYearlyPrice = (state: { subscription: SubscriptionState }) => {
  return (state.subscription.pricingInfo as any)?.yearly_price || 352.80;
};

/**
 * 获取年付节省百分比
 */
export const selectYearlySavingsPercentage = (state: { subscription: SubscriptionState }) => {
  return (state.subscription.pricingInfo as any)?.yearly_savings_percentage || 40;
};

/**
 * 判断用户是否为Pro用户
 */
export const selectIsProUser = (state: { subscription: SubscriptionState }) => {
  return state.subscription.currentSubscription?.is_active || false;
};

// Export actions
export const {
  clearError,
  updateCurrentSubscription,
  resetSubscriptionState,
  setPurchaseInProgress,
} = subscriptionSlice.actions;

// Export reducer
export default subscriptionSlice.reducer;