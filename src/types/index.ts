// User related types
export interface User {
    id: string;
    email: string;
    full_name: string;
    is_pro: boolean;
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
    full_name: string;
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
    created_at: string;
    updated_at: string;
  }
  
  // Comment related types
  export interface Comment {
    id: string;
    filing_id: string;
    user_id: string;
    user_name: string;
    content: string;
    created_at: string;
    updated_at: string;
  }
  
  // Navigation types
  export type RootStackParamList = {
    Login: undefined;
    Main: undefined;
    FilingDetail: { filingId: string };
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