// src/types/subscription.ts - Simplified Version

// ==================== 核心枚举 ====================
export enum UserTier {
  FREE = "FREE",
  PRO = "PRO"
}

export enum SubscriptionType {
  MONTHLY = "MONTHLY",
  YEARLY = "YEARLY"
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PENDING = "pending"
}

export enum PaymentMethod {
  APPLE = "apple",
  GOOGLE = "google",
  MOCK = "mock"
}

// ==================== 核心接口 ====================

/**
 * 价格信息
 */
export interface PricingInfo {
  is_early_bird: boolean;
  monthly_price: number;
  yearly_price: number;
  yearly_savings_percentage: number;
  currency: string;
}

/**
 * 订阅信息
 */
export interface SubscriptionInfo {
  is_active: boolean;
  subscription_type?: SubscriptionType;
  status: SubscriptionStatus;
  current_price?: number;
  expires_at?: string;
  auto_renew: boolean;
  payment_method?: PaymentMethod;
}

/**
 * 订阅响应
 */
export interface SubscriptionResponse {
  success: boolean;
  message: string;
  subscription_info?: SubscriptionInfo;
}

/**
 * 支付历史
 */
export interface PaymentHistory {
  id: number;
  amount: number;
  currency: string;
  payment_method: PaymentMethod;
  created_at: string;
}

// ==================== 请求类型 ====================

export interface SubscriptionCreate {
  subscription_type: SubscriptionType;
  payment_method: PaymentMethod;
}

export interface SubscriptionCancel {
  reason?: string;
  cancel_immediately?: boolean;
}

// ==================== Redux状态 ====================

export interface SubscriptionState {
  currentSubscription: SubscriptionInfo | null;
  pricingInfo: PricingInfo | null;
  paymentHistory: PaymentHistory[];
  isLoading: boolean;
  error: string | null;
  isCreatingSubscription: boolean;
  isCancellingSubscription: boolean;
}

// ==================== 产品配置 ====================

export interface ProductConfig {
  ios: {
    monthly: string;
    yearly: string;
  };
  android: {
    monthly: string;
    yearly: string;
  };
}

/**
 * 真实产品配置
 */
export const REAL_PRODUCT_CONFIG: ProductConfig = {
  ios: {
    monthly: 'com.hermespeed.pro.monthly',
    yearly: 'com.hermespeed.pro.yearly'
  },
  android: {
    monthly: 'hermespeed_pro_monthly',
    yearly: 'hermespeed_pro_yearly'
  }
};

// ==================== 常量 ====================

export const SUBSCRIPTION_CONSTANTS = {
  PRICES: {
    DISCOUNTED_MONTHLY: 39.00,
    DISCOUNTED_YEARLY: 280.80,
    STANDARD_MONTHLY: 49.00,
    STANDARD_YEARLY: 352.80,
  },
  FREE_DAILY_LIMIT: 3,
  YEARLY_DISCOUNT_PERCENTAGE: 40,
};