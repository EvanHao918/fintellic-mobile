// User types
export interface User {
    id: string;
    email: string;
    username: string;
    subscription_tier: 'free' | 'pro';
    created_at: string;
  }
  
  // Filing types
  export interface Filing {
    id: string;
    company_id: string;
    company_name: string;
    company_ticker: string;
    filing_type: '10-K' | '10-Q' | '8-K' | 'S-1';
    filing_date: string;
    period_date?: string;
    accession_number: string;
    filing_url: string;
    processing_status: 'pending' | 'processing' | 'completed' | 'failed';
    ai_summary?: string;
    management_tone?: 'bullish' | 'neutral' | 'bearish';
    key_insights?: string[];
    financial_highlights?: Record<string, any>;
    risks_concerns?: string[];
    created_at: string;
    updated_at: string;
  }
  
  // Company types
  export interface Company {
    id: string;
    ticker: string;
    name: string;
    cik: string;
    sector?: string;
    industry?: string;
    market_cap?: number;
  }
  
  // API Response types
  export interface ApiResponse<T> {
    data: T;
    message?: string;
    status: 'success' | 'error';
  }
  
  // Auth types
  export interface LoginRequest {
    username: string;
    password: string;
  }
  
  export interface LoginResponse {
    access_token: string;
    token_type: string;
    user: User;
  }