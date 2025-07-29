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

// User Types
export interface User {
  id: number;
  email: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  tier: 'free' | 'pro';
  is_pro: boolean;
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
  
  // AI-generated fields
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
  
  // 8-K specific
  item_type?: string;
  items?: string[];
  event_timeline?: any;
  event_nature_analysis?: string;
  market_impact_analysis?: string;
  key_considerations?: string;
  
  // 10-K/10-Q specific
  fiscal_year?: number;
  guidance_update?: string;
  future_outlook?: string;
  risk_factors?: string[];
  expectations_comparison?: string;
  beat_miss_analysis?: string;
  
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

// Comment Types
export interface Comment {
  id: string;
  user_id: string;
  filing_id: number;
  content: string;
  created_at: string;
  updated_at?: string;
  parent_id?: string;
  
  // User info
  username: string;
  user_name?: string;
  user_avatar?: string;
  is_pro_user: boolean;
  user_tier?: 'free' | 'pro';
  
  // Interaction
  vote_count: number;
  user_vote?: 'up' | 'down' | null | number;
  upvotes?: number;
  downvotes?: number;
  net_votes?: number;
  
  // Reply info
  reply_to?: {
    username: string;
    content_preview: string;
  };
  
  // Edit info
  is_editable?: boolean;
}

// Comment Response Types
export interface CommentVoteResponse {
  success: boolean;
  vote_count: number;
  user_vote: 'up' | 'down' | null | number;
  upvotes: number;
  downvotes: number;
  net_votes: number;
}

export interface CommentListResponse {
  items: Comment[];
  total: number;
  skip: number;
  limit: number;
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