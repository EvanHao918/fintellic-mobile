// src/api/subscription.ts - Simplified API for Phase 1

import apiClient from './client';
import {
  SubscriptionInfo,
  PricingInfo,
  PaymentHistory,
  SubscriptionCreate,
  SubscriptionCancel,
  SubscriptionResponse,
} from '../types/subscription';

/**
 * 订阅相关API调用 - 精简版
 */
export const subscriptionAPI = {
  /**
   * 获取用户价格信息
   */
  getPricing: async (): Promise<PricingInfo> => {
    const response = await apiClient.get<PricingInfo>('/subscriptions/pricing');
    return response;
  },

  /**
   * 获取当前订阅状态
   */
  getCurrentSubscription: async (): Promise<SubscriptionInfo> => {
    const response = await apiClient.get<SubscriptionInfo>('/subscriptions/current');
    return response;
  },

  /**
   * 创建订阅
   */
  createSubscription: async (data: SubscriptionCreate): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>('/subscriptions/create', data);
    return response;
  },

  /**
   * 取消订阅
   */
  cancelSubscription: async (data: SubscriptionCancel): Promise<SubscriptionResponse> => {
    const response = await apiClient.post<SubscriptionResponse>('/subscriptions/cancel', data);
    return response;
  },

  /**
   * 获取支付历史
   */
  getPaymentHistory: async (limit: number = 10): Promise<PaymentHistory[]> => {
    const response = await apiClient.get<PaymentHistory[]>('/subscriptions/payments', {
      params: { limit }
    });
    return response;
  },

  /**
   * Apple IAP 验证 - Phase 1 集成
   */
  verifyApplePurchase: async (data: {
    receipt_data: string;
    product_id: string;
    transaction_id: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post('/subscriptions/verify/apple', data);
    return response;
  },

  /**
   * Google Play 验证 - Phase 1 集成
   */
  verifyGooglePurchase: async (data: {
    purchase_token: string;
    product_id: string;
    order_id: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post('/subscriptions/verify/google', data);
    return response;
  },

  /**
   * 恢复Apple购买 - Phase 1 集成
   */
  restoreApplePurchase: async (data: {
    receipt_data: string;
  }): Promise<{ success: boolean; message?: string }> => {
    const response = await apiClient.post('/subscriptions/restore/apple', data);
    return response;
  },
};

/**
 * 辅助函数 - 精简版
 */
export const subscriptionHelpers = {
  /**
   * 判断是否为优惠用户
   */
  isDiscountedUser: (pricingTier?: string): boolean => {
    return pricingTier === 'DISCOUNTED' || pricingTier === 'EARLY_BIRD';
  },

  /**
   * 判断是否为Pro用户
   */
  isProUser: (tier?: string): boolean => {
    return tier === 'PRO' || tier === 'pro';
  },

  /**
   * 计算年付节省百分比
   */
  calculateYearlySavingsPercentage: (monthlyPrice: number, yearlyPrice: number): number => {
    const yearlySavings = (monthlyPrice * 12) - yearlyPrice;
    return Math.round((yearlySavings / (monthlyPrice * 12)) * 100);
  },

  /**
   * 格式化价格显示
   */
  formatPrice: (price: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  },

  /**
   * 计算剩余天数
   */
  calculateDaysRemaining: (expiresAt: string): number => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  },
};