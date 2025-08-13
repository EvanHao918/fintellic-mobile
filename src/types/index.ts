// src/types/index.ts

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  FilingDetail: { filingId: number };
  CompanyFilings: { ticker: string; companyName: string };
  Subscription: undefined;
};

export type DrawerParamList = {
  Home: undefined;
  Calendar: undefined;
  Watchlist: undefined;
  History: undefined;
  Profile: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  Watchlist: undefined;
  History: undefined;
  Profile: undefined;
};

// User Types - 更新以包含订阅相关字段
export interface User {
  id: number;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  tier: 'free' | 'pro' | 'FREE' | 'PRO'; // 支持大小写
  is_pro?: boolean;  // 添加is_pro字段
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  registration_source?: 'email' | 'apple' | 'google' | 'linkedin';
  has_social_auth?: boolean;
  biometric_enabled?: boolean;
  daily_view_count?: number;
  daily_reports_count?: number;
  
  // 订阅相关字段（Phase 2新增）
  is_early_bird?: boolean;  // 是否为早鸟用户
  pricing_tier?: 'EARLY_BIRD' | 'STANDARD';  // 价格层级
  user_sequence_number?: number;  // 用户序号（前10000名）
  subscription_type?: 'MONTHLY' | 'YEARLY';  // 订阅类型
  subscription_price?: number;  // 订阅价格
  is_subscription_active?: boolean;  // 订阅是否激活
  subscription_started_at?: string;  // 订阅开始时间
  subscription_expires_at?: string;  // 订阅到期时间
  next_billing_date?: string;  // 下次计费日期
  subscription_auto_renew?: boolean;  // 是否自动续费
  last_payment_date?: string;  // 最后支付日期
  last_payment_amount?: number;  // 最后支付金额
  total_payment_amount?: number;  // 总支付金额
  subscription_status?: 'active' | 'cancelled' | 'expired';  // 订阅状态
  subscription_plan?: 'monthly' | 'yearly';  // 订阅计划（小写版本）
  subscription_cancelled_at?: string;  // 订阅取消时间
  monthly_price?: number;  // 月度价格（用于显示）
  yearly_price?: number;  // 年度价格（用于显示）
}

// Auth Types
export interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  username?: string;
  full_name?: string;
}

export interface SocialAuthCredentials {
  provider: 'apple' | 'google' | 'linkedin';
  token: string;
  authorizationCode?: string;
  user: {
    id: string;
    email?: string | null;
    fullName?: string | null;
    photoUrl?: string | null;
  };
}

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

// Smart Markup Types for Unified Analysis
export interface SmartMarkupData {
  numbers: string[];      // Key numbers like "37%", "$5.2B"
  concepts: string[];     // Important concepts like "transformation"
  positive: string[];     // Positive trends like "revenue up 15%"
  negative: string[];     // Negative trends like "margins compressed"
  insights: string[];     // Key insights prefixed with [!]
}

// Enhanced Company Type with full details
export interface CompanyInfo {
  id: number;
  cik: string;
  ticker: string;
  name: string;
  
  // 基础信息（所有公司都有）
  is_sp500: boolean;
  is_nasdaq100: boolean;
  is_public: boolean;
  has_s1_filing: boolean;
  
  // 扩展信息（成熟公司可能有）
  legal_name?: string;
  sector?: string;
  industry?: string;
  headquarters?: string;
  country?: string;
  founded_year?: number;
  employees?: number;
  employee_size?: string;
  market_cap?: number;
  exchange?: string;
  indices?: string[];
  company_type?: string;
  website?: string;
  fiscal_year_end?: string;
  state?: string;
  ipo_date?: string;
  
  // SIC classification (legacy)
  sic?: string;
  sic_description?: string;
}

// Filing Types
export interface Filing {
  id: number;
  company_id: number;
  form_type: string;
  filing_date: string;
  period_date?: string;
  accession_number: string;
  filing_url: string;
  
  company_name: string;
  company_ticker: string;
  company_cik: string;
  
  // Enhanced company object with full details
  company?: CompanyInfo;
  
  // ==================== UNIFIED ANALYSIS FIELDS (NEW) ====================
  // Core unified content
  unified_analysis?: string;           // 800-1200 word narrative analysis
  unified_feed_summary?: string;       // One-line feed summary (max 100 chars)
  analysis_version?: 'v1' | 'v2';      // Analysis version indicator
  smart_markup_data?: SmartMarkupData; // Smart markup metadata
  analyst_expectations?: {             // Analyst expectations for 10-Q
    revenue_estimate?: {
      value: number;
      analysts: number;
    };
    eps_estimate?: {
      value: number;
      analysts: number;
    };
  };
  // ========================================================================
  
  // AI-generated fields (LEGACY - kept for backward compatibility)
  ai_summary?: string;
  management_tone?: 'bullish' | 'neutral' | 'bearish';
  key_insights?: string[];
  financial_highlights?: any;
  risks_concerns?: string[];
  opportunities?: string[];
  
  // Feed-specific fields
  one_liner?: string;
  feed_summary?: string;
  key_tags?: string[];
  tags?: string[];  // 后端返回的是 tags 字段（与 key_tags 相同）
  keywords?: string[];  // ENHANCED: AI-extracted keywords (3-5 conceptual terms)
  
  // 8-K specific
  item_type?: string;
  items?: string[];
  event_timeline?: any;
  event_nature_analysis?: string;
  market_impact_analysis?: string;
  key_considerations?: string;
  
  // 10-K/10-Q specific
  fiscal_year?: number;
  fiscal_quarter?: string;  // 添加fiscal_quarter字段
  guidance_update?: string;
  future_outlook?: string;
  risk_factors?: string[];
  expectations_comparison?: string;
  beat_miss_analysis?: string;
  
  // 10-K specific fields
  auditor_opinion?: string;
  three_year_financials?: string;
  business_segments?: string;
  risk_summary?: string;
  growth_drivers?: string;
  management_outlook?: string;
  strategic_adjustments?: string;
  market_impact_10k?: string;
  
  // 10-Q specific fields
  core_metrics?: string;
  cost_structure?: string;
  growth_decline_analysis?: string;
  management_tone_analysis?: string;
  market_impact_10q?: string;
  
  // S-1 specific fields
  ipo_details?: string;
  company_overview?: string;
  financial_summary?: string;
  risk_categories?: string;
  growth_path_analysis?: string;
  competitive_moat_analysis?: string;
  
  // User interaction
  user_vote?: 'bullish' | 'neutral' | 'bearish';
  vote_counts?: {
    bullish: number;
    neutral: number;
    bearish: number;
  };
  comment_count?: number;
  view_count?: number;
  
  // View limit info
  view_limit_info?: {
    views_remaining: number;
    is_pro: boolean;
    views_today: number;
  };
  
  // Processing status
  status: 'pending' | 'processing' | 'completed' | 'failed';
  processed_at?: string;
  error_message?: string;
}

export interface FilingListResponse {
  items: Filing[];
  total: number;
  page: number;
  size: number;
  pages: number;
}

// Vote Types
export type VoteType = 'bullish' | 'neutral' | 'bearish';

// Comment Types - 修复评论类型
export interface Comment {
  id: string;
  user_id: string;
  filing_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string;
  
  // User info
  username: string;
  user_name?: string;
  user_avatar?: string;
  is_pro_user?: boolean;
  user_tier?: 'free' | 'pro' | 'FREE' | 'PRO';  // 支持大小写
  
  // Interaction
  vote_count?: number;
  user_vote?: 'up' | 'down' | null | number;
  upvotes?: number;
  downvotes?: number;
  net_votes?: number;
  
  // Reply info - 更新为匹配后端返回的结构
  reply_to?: {
    comment_id?: string | number;
    user_id?: string | number;
    username: string;
    content_preview: string;
  };
  
  // Edit info
  is_editable?: boolean;
}

// Comment Response Types
export interface CommentVoteResponse {
  success?: boolean;
  comment_id?: string | number;
  vote_count?: number;
  user_vote: 'up' | 'down' | null | number;
  upvotes: number;
  downvotes: number;
  net_votes: number;
}

export interface CommentListResponse {
  items: Comment[];
  total: number;
  skip?: number;
  limit?: number;
}

// Company Types (简化版，用于列表)
export interface Company {
  id: number;
  ticker: string;
  name: string;
  cik: string;
  exchange?: string;
  sector?: string;
  industry?: string;
  market_cap?: number;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  logo_url?: string;
}

// Watchlist Types
export interface WatchlistItem {
  id: number;
  user_id: number;
  company_id: number;
  added_at: string;
  
  // Company info
  company: Company;
}

// View Tracking
export interface UserFilingView {
  id: number;
  user_id: number;
  filing_id: number;
  viewed_at: string;
  view_duration?: number;
}

// Subscription Types
export interface Subscription {
  id: number;
  user_id: number;
  tier: 'pro';
  status: 'active' | 'cancelled' | 'expired';
  started_at: string;
  expires_at: string;
  cancelled_at?: string;
  
  // Payment info
  payment_method?: 'stripe' | 'apple' | 'google';
  payment_id?: string;
  amount: number;
  currency: string;
  billing_period: 'monthly' | 'annual';
}

// API Error Types
export interface ApiError {
  detail: string;
  status_code: number;
  headers?: Record<string, string>;
}

// Device Types
export interface DeviceInfo {
  device_id: string;
  device_name?: string;
  device_type: 'ios' | 'android' | 'web';
  device_os_version?: string;
  app_version?: string;
}

// Biometric Types
export type BiometricType = 'face_id' | 'touch_id' | 'fingerprint' | 'face_unlock';

// Settings Types
export interface UserSettings {
  notifications: {
    all_filings: boolean;
    watchlist_only: boolean;
    push_enabled: boolean;
    email_enabled: boolean;
  };
  privacy: {
    show_profile: boolean;
    allow_messages: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
  };
  biometric: {
    enabled: boolean;
    type?: BiometricType;
    devices: string[];
  };
}

// Visual Data Type for Charts
export interface VisualData {
  id: string;
  type: 'trend' | 'comparison' | 'metrics';
  title: string;
  subtitle?: string;
  data: Array<{
    label?: string;
    value?: number | string;
    change?: {
      value: number;
      direction: 'up' | 'down';
    };
    category?: string;
  }>;
  metadata?: {
    format?: 'currency' | 'percentage' | 'number';
    unit?: string;
    decimals?: number;
  };
}

export const HISTORY_CONSTANTS = {
  // Storage key for AsyncStorage
  STORAGE_KEY: '@fintellic_history',
  
  // Maximum number of history items to store
  MAX_HISTORY_ITEMS: 100,
  
  // Time formatting thresholds (in seconds)
  TIME_THRESHOLDS: {
    JUST_NOW: 60,           // Less than 1 minute
    MINUTES: 3600,          // Less than 1 hour  
    HOURS: 86400,           // Less than 24 hours
    DAYS: 604800,           // Less than 7 days
  },
  
  // Date grouping labels
  DATE_GROUPS: {
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
  },
  
  // Error messages
  ERROR_MESSAGES: {
    LOAD_FAILED: 'Failed to load history',
    ADD_FAILED: 'Failed to add to history',
    REMOVE_FAILED: 'Failed to remove from history',
    CLEAR_FAILED: 'Failed to clear history',
  },
  
  // Success messages
  SUCCESS_MESSAGES: {
    HISTORY_CLEARED: 'History cleared',
  },
  
  // Alert titles
  ALERT_TITLES: {
    CLEAR_HISTORY: 'Clear History',
    ERROR: 'Error',
    SUCCESS: 'Success',
  },
  
  // Alert messages
  ALERT_MESSAGES: {
    CLEAR_CONFIRMATION: 'Are you sure you want to clear all browsing history?',
  },
};

// Helper type to determine if filing has unified analysis
export type HasUnifiedAnalysis = (filing: Filing) => boolean;

// 🔥 关键修复：更新辅助函数以正确处理大小写
export const isProUser = (user: User | null): boolean => {
  if (!user) return false;
  
  // 检查所有可能的Pro状态标识
  return (
    // 检查tier字段（大小写兼容）
    user.tier === 'pro' || 
    user.tier === 'PRO' ||
    // 检查is_pro字段
    user.is_pro === true ||
    // 检查订阅激活状态
    user.is_subscription_active === true
  );
};

export const isEarlyBirdUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_early_bird === true || 
         user.pricing_tier === 'EARLY_BIRD';
};

// 新增：获取用户显示的tier（统一为小写）
export const getUserTierDisplay = (user: User | null): 'free' | 'pro' => {
  if (isProUser(user)) {
    return 'pro';
  }
  return 'free';
};

// 新增：检查用户是否可以发表评论
export const canUserComment = (user: User | null): boolean => {
  return isProUser(user);
};

// 新增：检查用户是否可以查看评论
export const canUserViewComments = (user: User | null): boolean => {
  // 根据您的设计，所有用户都可以查看评论
  // 但只有Pro用户可以发表和互动
  return true;
};