// src/types/index.ts

// Navigation Types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  Login: undefined;
  Register: undefined;
  Personalization: undefined;  // 新增：用户偏好调查
  FilingDetail: { filingId: number; initialFiling?: Filing };
  CompanyFilings: { ticker: string; companyName: string };
  Subscription: undefined;
  NotificationSettings: undefined;
  ChangePassword: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
  ResetPassword: { token?: string };  // 新增：密码重置路由
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

// Filing Filter Types
export type FilingTypeFilter = 'all' | '10-Q' | '10-K' | '8-K' | 'S-1';

// Password change types
export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface ChangePasswordResponse {
  message: string;
}

// User Types - 包含订阅相关字段
export interface User {
  id: number;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  tier: 'free' | 'pro' | 'FREE' | 'PRO';
  is_pro?: boolean;
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at?: string;
  last_login_at?: string;
  registration_source?: 'email' | 'apple' | 'google' | 'linkedin';
  has_social_auth?: boolean;
  daily_view_count?: number;
  daily_reports_count?: number;
  
  // 订阅相关字段
  is_early_bird?: boolean;
  pricing_tier?: 'EARLY_BIRD' | 'STANDARD';
  user_sequence_number?: number;
  subscription_type?: 'MONTHLY' | 'YEARLY';
  subscription_price?: number;
  is_subscription_active?: boolean;
  subscription_started_at?: string;
  subscription_expires_at?: string;
  next_billing_date?: string;
  subscription_auto_renew?: boolean;
  last_payment_date?: string;
  last_payment_amount?: number;
  total_payment_amount?: number;
  subscription_status?: 'active' | 'cancelled' | 'expired';
  subscription_plan?: 'monthly' | 'yearly';
  subscription_cancelled_at?: string;
  monthly_price?: number;
  yearly_price?: number;
  
  // 通知相关字段
  device_tokens?: Array<{
    token: string;
    platform: 'ios' | 'android';
    created_at: string;
  }>;
  notification_settings?: {
    enabled: boolean;
    watchlist_only: boolean;
    filing_types: string[];
  };
  
  // Onboarding 相关字段
  onboarding_completed?: number;  // 0=未完成, 1=已完成
  onboarding_responses?: Record<string, any>;
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

export interface AuthResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
  user: User;
}

// Smart Markup Types for Unified Analysis
export interface SmartMarkupData {
  numbers: string[];
  concepts: string[];
  positive: string[];
  negative: string[];
  insights: string[];
}

// Company Info Interface
export interface CompanyInfo {
  id: number;
  cik: string;
  ticker: string;
  name: string;
  
  // 基础信息
  is_sp500: boolean;
  is_nasdaq100: boolean;
  is_public: boolean;
  has_s1_filing: boolean;
  
  // 扩展信息
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
  
  // FMP API 新增字段
  market_cap_formatted?: string;
  analyst_consensus?: string;  // 分析师共识评级 (Strong Buy/Buy/Hold/Sell/Strong Sell)
  
  // SIC classification
  sic?: string;
  sic_description?: string;
}

// Filing Types
export interface Filing {
  id: number;
  company_id: number;
  form_type: string;
  filing_date: string;
  detected_at?: string | null;
  display_time?: string | null;
  period_date?: string;
  accession_number: string;
  filing_url: string;
  
  company_name: string;
  company_ticker: string;
  company_cik: string;
  
  company?: CompanyInfo;
  
  detection_age_minutes?: number | null;
  detection_age_hours?: number | null;
  is_recently_detected?: boolean;
  
  // Unified analysis fields
  unified_analysis?: string;
  unified_feed_summary?: string;
  analysis_version?: 'v1' | 'v2';
  smart_markup_data?: SmartMarkupData;
  analyst_expectations?: {
    revenue_estimate?: {
      value: number;
      analysts: number;
    };
    eps_estimate?: {
      value: number;
      analysts: number;
    };
  };
  
  // AI-generated fields (legacy)
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
  tags?: string[];
  keywords?: string[];
  
  // 8-K specific
  item_type?: string;
  items?: string[];
  event_timeline?: any;
  event_nature_analysis?: string;
  market_impact_analysis?: string;
  key_considerations?: string;
  
  // 10-K/10-Q specific
  fiscal_year?: number;
  fiscal_quarter?: string;
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
  
  view_limit_info?: {
    views_remaining: number;
    is_pro: boolean;
    views_today: number;
  };
  
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

// Comment Types
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
  user_tier?: 'free' | 'pro' | 'FREE' | 'PRO';
  
  // Interaction
  vote_count?: number;
  user_vote?: 'up' | 'down' | null | number;
  upvotes?: number;
  downvotes?: number;
  net_votes?: number;
  
  // Reply info
  reply_to?: {
    comment_id?: string | number;
    user_id?: string | number;
    username: string;
    content_preview: string;
  };
  
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

// Company Types
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

// Settings Types
export interface UserSettings {
  notifications: {
    all_filings: boolean;
    watchlist_only: boolean;
    push_enabled: boolean;
    email_enabled: boolean;
    filing_types?: {
      filing_10k: boolean;
      filing_10q: boolean;
      filing_8k: boolean;
      filing_s1: boolean;
    };
    quiet_hours?: {
      start: string | null;
      end: string | null;
    };
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
  STORAGE_KEY: '@fintellic_history',
  MAX_HISTORY_ITEMS: 100,
  TIME_THRESHOLDS: {
    JUST_NOW: 60,
    MINUTES: 3600,
    HOURS: 86400,
    DAYS: 604800,
  },
  DATE_GROUPS: {
    TODAY: 'Today',
    YESTERDAY: 'Yesterday',
  },
  ERROR_MESSAGES: {
    LOAD_FAILED: 'Failed to load history',
    ADD_FAILED: 'Failed to add to history',
    REMOVE_FAILED: 'Failed to remove from history',
    CLEAR_FAILED: 'Failed to clear history',
  },
  SUCCESS_MESSAGES: {
    HISTORY_CLEARED: 'History cleared',
  },
  ALERT_TITLES: {
    CLEAR_HISTORY: 'Clear History',
    ERROR: 'Error',
    SUCCESS: 'Success',
  },
  ALERT_MESSAGES: {
    CLEAR_CONFIRMATION: 'Are you sure you want to clear all browsing history?',
  },
};

// Helper type to determine if filing has unified analysis
export type HasUnifiedAnalysis = (filing: Filing) => boolean;

// Helper functions
export const isProUser = (user: User | null): boolean => {
  if (!user) return false;
  return (
    user.tier === 'pro' || 
    user.tier === 'PRO' ||
    user.is_pro === true ||
    user.is_subscription_active === true
  );
};

export const isEarlyBirdUser = (user: User | null): boolean => {
  if (!user) return false;
  return user.is_early_bird === true || 
         user.pricing_tier === 'EARLY_BIRD';
};

export const getUserTierDisplay = (user: User | null): 'free' | 'pro' => {
  if (isProUser(user)) {
    return 'pro';
  }
  return 'free';
};

export const canUserComment = (user: User | null): boolean => {
  return isProUser(user);
};

export const canUserViewComments = (user: User | null): boolean => {
  return true;
};

// Export notification types
export * from './notification';