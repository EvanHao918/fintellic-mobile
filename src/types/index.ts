// User related types
export interface User {
    id: string;
    email: string;
    username?: string;
    full_name: string;
    is_pro: boolean;
    tier?: 'free' | 'pro';
    daily_reports_count?: number;
    subscription_expires_at?: string | null;
    created_at: string;
    updated_at: string;
  }
  
  export interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  }
  
  export interface LoginCredentials {
    email: string;
    password: string;
  }
  
  export interface RegisterCredentials extends LoginCredentials {
    username: string;
  }
  
  // Company related types
  export interface Company {
    id: string;
    ticker: string;
    name: string;
    sector?: string;
    industry?: string;
    market_cap?: number;
    employees?: number;
    description?: string;
    website?: string;
    indices?: string; // "S&P 500,NASDAQ 100"
    created_at: string;
    updated_at: string;
  }
  
  // Filing related types
  export type FilingType = '10-K' | '10-Q' | '8-K' | 'S-1';
  export type ManagementTone = 'bullish' | 'neutral' | 'bearish';
  export type VoteType = 'bullish' | 'neutral' | 'bearish';
  export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
  
  export interface VoteCounts {
    bullish: number;
    neutral: number;
    bearish: number;
  }
  
  export interface FinancialHighlights {
    revenue?: number;
    net_income?: number;
    eps?: number;
    total_assets?: number;
    total_liabilities?: number;
    shareholders_equity?: number;
    operating_cash_flow?: number;
    // Add new fields for structured financial data
    revenue_trend?: Array<{
      period: string;
      value: number;
      label: string;
      unit?: string;
    }>;
    key_metrics?: Array<{
      label: string;
      value: number;
      unit: string;
      change?: number;
      direction?: 'up' | 'down' | 'flat';
    }>;
    segment_breakdown?: Array<{
      category: string;
      value: number;
      percentage?: number;
      unit?: string;
    }>;
    valuation_metrics?: Array<{
      label: string;
      value: string | number;
      unit?: string;
    }>;
  }
  
  // Backend filing response structure
  export interface FilingResponse {
    id: number;
    form_type: string;
    filing_date: string;
    accession_number: string;
    file_url: string;
    one_liner: string;
    sentiment: ManagementTone;
    tags: string[];
    vote_counts: VoteCounts;
    company: {
      ticker: string;
      name: string;
      cik: string;
    };
  }
  
  // Frontend filing structure (normalized)
  export interface Filing {
    id: string;
    company_id: string;
    company_name: string;
    company_ticker: string;
    company?: Company;
    filing_type: FilingType;
    filing_date: string;
    accession_number: string;
    filing_url: string;
    processing_status: ProcessingStatus;
    ai_summary?: string;
    feed_summary?: string;
    management_tone?: ManagementTone;
    key_insights?: string[];
    financial_highlights?: FinancialHighlights;
    risk_factors?: string[];
    future_outlook?: string;
    tags?: string[];
    event_type?: string; // For 8-K filings
    vote_counts?: VoteCounts;
    user_vote?: VoteType | null;
    view_count?: number;
    comment_count?: number;
    view_limit_info?: ViewLimitInfo;  // Add this line
    created_at: string;
    updated_at: string;
  }

  // Comment reply information
  export interface ReplyInfo {
    comment_id: number;
    user_id: number;
    username: string;
    content_preview: string;
  }
  
  // Comment related types - Updated with voting and reply features
  export interface Comment {
    id: string;
    filing_id: string;
    user_id: string;
    username: string;
    user_name?: string; // Keep for backward compatibility
    user_tier: 'free' | 'pro';
    content: string;
    created_at: string;
    updated_at: string;
    is_editable: boolean;
    // New fields for voting and reply
    upvotes: number;
    downvotes: number;
    net_votes: number;
    user_vote: number; // -1, 0, or 1
    reply_to?: ReplyInfo;
  }

  // Comment creation request
  export interface CommentCreate {
    content: string;
    reply_to_comment_id?: number;
  }

  // Comment vote request
  export interface CommentVoteRequest {
    vote_type: 'upvote' | 'downvote' | 'none';
  }

  // Comment vote response
  export interface CommentVoteResponse {
    comment_id: number;
    upvotes: number;
    downvotes: number;
    net_votes: number;
    user_vote: number;
  }

  // Comment list response
  export interface CommentListResponse {
    total: number;
    items: Comment[];
  }

  export interface ViewLimitInfo {
    views_remaining: number;
    is_pro: boolean;
    views_today: number;
    daily_limit?: number;
  }
  
  // Navigation types
  export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    FilingDetail: { filingId: string };
    Subscription: undefined;
  };
  
  export type TabParamList = {
    Home: undefined;
    Calendar: undefined;
    Watchlist: undefined;
    History: undefined;
    Profile: undefined;
  };
  
  // API Response types
  export interface ApiError {
    detail: string;
    status_code?: number;
  }
  
  export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    pages: number;
  }
  
  export interface AuthResponse {
    access_token: string;
    token_type: string;
    user: User;
  }
  
  // Store types
  export interface RootState {
    auth: AuthState;
    filings: any; // Will be defined in filingsSlice
  }
  
  // Visual data types for charts
  export interface VisualData {
    id: string;
    type: 'trend' | 'comparison' | 'metrics';
    title: string;
    subtitle?: string;
    data: any;
    metadata?: {
      format?: 'currency' | 'percentage' | 'number' | 'ratio';
      unit?: string;
      prefix?: string;
      suffix?: string;
      decimals?: number;
    };
  }