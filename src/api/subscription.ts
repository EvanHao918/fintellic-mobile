// src/api/subscription.ts

import apiClient from './client';
import {
  SubscriptionInfo,
  PricingInfo,
  EarlyBirdStatus,
  PaymentHistory,
  SubscriptionHistory,
  SubscriptionCreate,
  SubscriptionUpdate,
  SubscriptionCancel,
  SubscriptionResponse,
  CreateCheckoutSession,
  CheckoutSessionResponse
} from '../types/subscription';

/**
 * 订阅相关API调用
 */
export const subscriptionAPI = {
  /**
   * 获取早鸟状态（无需认证）
   */
  getEarlyBirdStatus: async (): Promise<EarlyBirdStatus> => {
    try {
      const response = await apiClient.get<EarlyBirdStatus>('/subscriptions/early-bird-status');
      return response;
    } catch (error) {
      console.error('Failed to get early bird status:', error);
      throw error;
    }
  },

  /**
   * 获取用户个性化价格（需认证）
   */
  getPricing: async (): Promise<PricingInfo> => {
    try {
      const response = await apiClient.get<PricingInfo>('/subscriptions/pricing');
      return response;
    } catch (error) {
      console.error('Failed to get pricing:', error);
      throw error;
    }
  },

  /**
   * 获取当前订阅状态（需认证）
   */
  getCurrentSubscription: async (): Promise<SubscriptionInfo> => {
    try {
      const response = await apiClient.get<SubscriptionInfo>('/subscriptions/current');
      return response;
    } catch (error) {
      console.error('Failed to get current subscription:', error);
      throw error;
    }
  },

  /**
   * 创建新订阅（需认证）
   */
  createSubscription: async (data: SubscriptionCreate): Promise<SubscriptionResponse> => {
    try {
      const response = await apiClient.post<SubscriptionResponse>('/subscriptions/create', data);
      return response;
    } catch (error) {
      console.error('Failed to create subscription:', error);
      throw error;
    }
  },

  /**
   * 更新订阅（切换月付/年付）（需认证）
   */
  updateSubscription: async (data: SubscriptionUpdate): Promise<SubscriptionResponse> => {
    try {
      const response = await apiClient.put<SubscriptionResponse>('/subscriptions/update', data);
      return response;
    } catch (error) {
      console.error('Failed to update subscription:', error);
      throw error;
    }
  },

  /**
   * 取消订阅（需认证）
   */
  cancelSubscription: async (data: SubscriptionCancel): Promise<SubscriptionResponse> => {
    try {
      const response = await apiClient.post<SubscriptionResponse>('/subscriptions/cancel', data);
      return response;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  },

  /**
   * 获取订阅历史（需认证）
   */
  getSubscriptionHistory: async (): Promise<SubscriptionHistory[]> => {
    try {
      const response = await apiClient.get<SubscriptionHistory[]>('/subscriptions/history');
      return response;
    } catch (error) {
      console.error('Failed to get subscription history:', error);
      throw error;
    }
  },

  /**
   * 获取支付历史（需认证）
   * @param limit 返回记录数，默认10
   */
  getPaymentHistory: async (limit: number = 10): Promise<PaymentHistory[]> => {
    try {
      const response = await apiClient.get<PaymentHistory[]>('/subscriptions/payments', {
        params: { limit }
      });
      return response;
    } catch (error) {
      console.error('Failed to get payment history:', error);
      throw error;
    }
  },

  /**
   * 创建Stripe Checkout Session（需认证）
   * 注：这是Phase 3的功能，目前返回模拟数据
   */
  createCheckoutSession: async (data: CreateCheckoutSession): Promise<CheckoutSessionResponse> => {
    try {
      const response = await apiClient.post<CheckoutSessionResponse>('/subscriptions/create-checkout-session', data);
      return response;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      throw error;
    }
  },

  /**
   * Mock升级到Pro（仅开发环境）
   * @param plan 'monthly' 或 'yearly'
   */
  mockUpgradeToPro: async (plan: 'monthly' | 'yearly'): Promise<any> => {
    try {
      const response = await apiClient.post('/users/me/upgrade-mock', { plan });
      return response;
    } catch (error) {
      console.error('Failed to mock upgrade:', error);
      throw error;
    }
  },
};

/**
 * 用户订阅相关API（通过/users/me端点）
 */
export const userSubscriptionAPI = {
  /**
   * 获取用户订阅状态
   */
  getSubscription: async (): Promise<SubscriptionInfo> => {
    try {
      const response = await apiClient.get<SubscriptionInfo>('/users/me/subscription');
      return response;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      throw error;
    }
  },

  /**
   * 获取用户个性化价格
   */
  getPricing: async (): Promise<PricingInfo> => {
    try {
      const response = await apiClient.get<PricingInfo>('/users/me/pricing');
      return response;
    } catch (error) {
      console.error('Failed to get user pricing:', error);
      throw error;
    }
  },
};

/**
 * 辅助函数
 */
export const subscriptionHelpers = {
  /**
   * 判断是否为早鸟用户
   */
  isEarlyBirdUser: (pricingTier?: string): boolean => {
    return pricingTier === 'EARLY_BIRD';
  },

  /**
   * 判断是否为Pro用户
   */
  isProUser: (tier?: string): boolean => {
    return tier === 'PRO' || tier === 'pro';
  },

  /**
   * 计算年付节省金额
   */
  calculateYearlySavings: (monthlyPrice: number, yearlyPrice: number): number => {
    return (monthlyPrice * 12) - yearlyPrice;
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
   * 格式化订阅到期时间
   */
  formatExpiryDate: (expiresAt: string): string => {
    const date = new Date(expiresAt);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
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

  /**
   * 获取紧急程度文案
   */
  getUrgencyMessage: (slotsRemaining: number): string => {
    if (slotsRemaining === 0) {
      return 'Early bird offer SOLD OUT!';
    } else if (slotsRemaining < 100) {
      return `🔥 LAST CHANCE! Only ${slotsRemaining} spots left!`;
    } else if (slotsRemaining < 500) {
      return `⚡ HURRY! Only ${slotsRemaining} spots remaining!`;
    } else if (slotsRemaining < 2000) {
      return `🎯 Limited offer: ${slotsRemaining} spots available`;
    } else {
      return `🐦 Early bird special: Save $10/month forever!`;
    }
  },
};