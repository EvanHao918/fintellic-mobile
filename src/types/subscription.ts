// src/types/subscription.ts - Updated for AllSight monthly-only subscription

// ==================== 核心枚举 ====================
export enum UserTier {
  FREE = "FREE",
  PRO = "PRO"
}

export enum SubscriptionType {
  MONTHLY = "MONTHLY"
  // Note: Only monthly subscription supported
}

export enum SubscriptionStatus {
  ACTIVE = "active",
  CANCELLED = "cancelled",
  EXPIRED = "expired",
  PENDING = "pending"
}

export enum PaymentMethod {
  APPLE = "apple",
  MOCK = "mock"  // Development only
}

// ==================== 核心接口 ====================

/**
 * 价格信息
 */
export interface PricingInfo {
  is_early_bird: boolean;  // Deprecated - use is_discounted
  is_discounted?: boolean;  // Whether showing promotional price
  monthly_price: number;
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
    discounted: string;
    standard: string;
  };
}

/**
 * AllSight Product Configuration
 * Two separate product IDs for manual price switching
 */
export const ALLSIGHT_PRODUCT_CONFIG: ProductConfig = {
  ios: {
    discounted: 'com.allsight.pro.monthly.discounted',  // $19.99
    standard: 'com.allsight.pro.monthly.standard'       // $29.99
  }
};

// ==================== 常量 ====================

export const SUBSCRIPTION_CONSTANTS = {
  PRICES: {
    DISCOUNTED_MONTHLY: 19.99,  // Limited-time promotional price
    STANDARD_MONTHLY: 29.99,    // Standard price
  },
  FREE_DAILY_LIMIT: 2,  // Free users can view 2 reports per day
  FEATURES: {
    FREE: {
      daily_reports: 2,
      ai_analysis: true,
      push_notifications: false,
      unlimited_access: false,
    },
    PRO: {
      daily_reports: 'unlimited',
      ai_analysis: true,
      push_notifications: true,
      unlimited_access: true,
    }
  }
};

/**
 * Helper: Get active product ID based on current pricing mode
 * In production, this should match backend USE_DISCOUNTED_PRICING flag
 */
export const getActiveProductId = (useDiscounted: boolean): string => {
  return useDiscounted 
    ? ALLSIGHT_PRODUCT_CONFIG.ios.discounted 
    : ALLSIGHT_PRODUCT_CONFIG.ios.standard;
};