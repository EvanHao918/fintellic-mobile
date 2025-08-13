// src/types/subscription.ts

/**
 * 订阅系统类型定义
 * 与后端 app/schemas/subscription.py 保持一致
 */

// ==================== 枚举类型 ====================
export enum UserTier {
    FREE = "FREE",
    PRO = "PRO"
  }
  
  export enum SubscriptionType {
    MONTHLY = "MONTHLY",
    YEARLY = "YEARLY"
  }
  
  export enum PricingTier {
    EARLY_BIRD = "EARLY_BIRD",
    STANDARD = "STANDARD"
  }
  
  export enum SubscriptionStatus {
    ACTIVE = "active",
    CANCELLED = "cancelled",
    EXPIRED = "expired",
    PENDING = "pending"
  }
  
  export enum PaymentMethod {
    STRIPE = "stripe",
    APPLE = "apple",
    GOOGLE = "google"
  }
  
  // ==================== 响应模式 ====================
  
  /**
   * 价格信息（用于前端显示）
   */
  export interface PricingInfo {
    is_early_bird: boolean;
    user_sequence_number?: number;
    pricing_tier: PricingTier;
    monthly_price: number;
    yearly_price: number;
    yearly_savings: number;
    yearly_savings_percentage: number;
    early_bird_slots_remaining?: number;
    currency: string;
    features: {
      unlimited_reports: boolean;
      ai_analysis: boolean;
      push_notifications: boolean;
      priority_support: boolean;
      early_access: boolean;
    };
  }
  
  /**
   * 当前订阅信息
   */
  export interface SubscriptionInfo {
    is_active: boolean;
    subscription_type?: SubscriptionType;
    pricing_tier?: PricingTier;
    status: SubscriptionStatus;
    monthly_price: number;
    current_price?: number;
    expires_at?: string;
    next_billing_date?: string;
    auto_renew: boolean;
    payment_method?: PaymentMethod;
    cancelled_at?: string;
    days_remaining?: number;
    
    // 订阅历史
    started_at?: string;
    total_payments: number;
    last_payment_date?: string;
    last_payment_amount?: number;
  }
  
  /**
   * 订阅操作响应
   */
  export interface SubscriptionResponse {
    success: boolean;
    message: string;
    subscription_info?: SubscriptionInfo;
    payment_required: boolean;
    payment_url?: string;
    client_secret?: string;
  }
  
  /**
   * 早鸟状态信息
   */
  export interface EarlyBirdStatus {
    early_bird_limit: number;
    early_bird_users: number;
    slots_remaining: number;
    is_available: boolean;
    percentage_used: number;
    
    // 价格信息
    early_bird_monthly_price: number;
    early_bird_yearly_price: number;
    standard_monthly_price: number;
    standard_yearly_price: number;
    
    // 营销信息
    marketing_message?: string;
    urgency_level?: 'low' | 'medium' | 'high' | 'critical' | 'sold_out';
  }
  
  /**
   * 支付历史记录
   */
  export interface PaymentHistory {
    id: number;
    amount: number;
    currency: string;
    payment_method: PaymentMethod;
    payment_status: string;
    transaction_id?: string;
    created_at: string;
    description?: string;
  }
  
  /**
   * 订阅历史记录
   */
  export interface SubscriptionHistory {
    id: number;
    subscription_type: SubscriptionType;
    pricing_tier: PricingTier;
    price: number;
    started_at: string;
    expires_at: string;
    status: SubscriptionStatus;
    cancelled_at?: string;
  }
  
  // ==================== 请求模式 ====================
  
  /**
   * 创建订阅请求
   */
  export interface SubscriptionCreate {
    subscription_type: SubscriptionType;
    payment_method: PaymentMethod;
    promo_code?: string;
    auto_renew?: boolean;
  }
  
  /**
   * 更新订阅请求
   */
  export interface SubscriptionUpdate {
    subscription_type: SubscriptionType;
    immediate?: boolean;
  }
  
  /**
   * 取消订阅请求
   */
  export interface SubscriptionCancel {
    reason?: string;
    feedback?: string;
    cancel_immediately?: boolean;
  }
  
  /**
   * 创建Checkout Session请求
   */
  export interface CreateCheckoutSession {
    subscription_type: SubscriptionType;
    success_url: string;
    cancel_url: string;
    promo_code?: string;
  }
  
  /**
   * Checkout Session响应
   */
  export interface CheckoutSessionResponse {
    session_id: string;
    checkout_url: string;
    publishable_key: string;
  }
  
  // ==================== Redux State ====================
  
  /**
   * 订阅相关的Redux状态
   */
  export interface SubscriptionState {
    // 当前订阅状态
    currentSubscription: SubscriptionInfo | null;
    
    // 价格信息
    pricingInfo: PricingInfo | null;
    
    // 早鸟状态
    earlyBirdStatus: EarlyBirdStatus | null;
    
    // 支付历史
    paymentHistory: PaymentHistory[];
    
    // 订阅历史
    subscriptionHistory: SubscriptionHistory[];
    
    // UI状态
    isLoading: boolean;
    error: string | null;
    
    // 操作状态
    isCreatingSubscription: boolean;
    isUpdatingSubscription: boolean;
    isCancellingSubscription: boolean;
  }
  
  // ==================== 常量 ====================
  
  /**
   * 订阅相关常量
   */
  export const SUBSCRIPTION_CONSTANTS = {
    // 价格（与后端config.py保持一致）
    PRICES: {
      EARLY_BIRD_MONTHLY: 39.00,
      EARLY_BIRD_YEARLY: 280.80,
      STANDARD_MONTHLY: 49.00,
      STANDARD_YEARLY: 352.80,
    },
    
    // 限制
    LIMITS: {
      EARLY_BIRD_LIMIT: 10000,
      FREE_DAILY_LIMIT: 3,
    },
    
    // 折扣
    DISCOUNTS: {
      YEARLY_DISCOUNT_PERCENTAGE: 40,
    },
    
    // UI文案
    MESSAGES: {
      UPGRADE_PROMPT: 'Upgrade to Pro for unlimited access',
      EARLY_BIRD_EXPIRED: 'Early bird offer has ended',
      SUBSCRIPTION_CREATED: 'Subscription created successfully',
      SUBSCRIPTION_CANCELLED: 'Subscription cancelled',
      PAYMENT_REQUIRED: 'Payment required to activate subscription',
    },
    
    // 功能对比
    FEATURES: {
      FREE: {
        daily_reports: 3,
        ai_analysis: true,
        push_notifications: false,
        priority_support: false,
        early_access: false,
      },
      PRO: {
        daily_reports: 'Unlimited',
        ai_analysis: true,
        push_notifications: true,
        priority_support: true,
        early_access: true,
      },
    },
  };
  
  // ==================== 辅助类型 ====================
  
  /**
   * 判断用户是否为Pro用户
   */
  export type IsProUser = (user: { tier: string } | null) => boolean;
  
  /**
   * 判断用户是否为早鸟用户
   */
  export type IsEarlyBirdUser = (user: { pricing_tier?: string } | null) => boolean;
  
  /**
   * 计算订阅价格
   */
  export interface SubscriptionPricing {
    monthly: number;
    yearly: number;
    yearlyDiscount: number;
    yearlyDiscountPercentage: number;
  }
  
  /**
   * 订阅计划选项
   */
  export interface SubscriptionPlan {
    id: string;
    name: string;
    type: SubscriptionType;
    price: number;
    originalPrice?: number;
    discount?: number;
    features: string[];
    highlighted?: boolean;
    badge?: string;
  }