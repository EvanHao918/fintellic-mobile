// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@fintellic_auth_token',
  USER_DATA: '@fintellic_user_data',
  THEME_PREFERENCE: '@fintellic_theme',
};

// Filing Type Colors
export const FILING_COLORS = {
  '10-K': '#2196F3', // Blue
  '10-Q': '#4CAF50', // Green
  '8-K': '#F44336',  // Red
  'S-1': '#FF9800',  // Orange
};

// App Constants
export const APP_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  REFRESH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  FREE_TIER_DAILY_LIMIT: 3,
};