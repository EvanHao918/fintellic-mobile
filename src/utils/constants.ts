// API Configuration
export const API_BASE_URL = 'http://localhost:8000/api/v1';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@fintellic_auth_token',
  REFRESH_TOKEN: '@fintellic_refresh_token',
  USER_INFO: '@fintellic_user_info',
  REMEMBER_ME: '@fintellic_remember_me',
  BIOMETRIC_ENABLED: '@fintellic_biometric_enabled',
  DEVICE_ID: '@fintellic_device_id',
  LAST_LOGIN_METHOD: '@fintellic_last_login_method',
};

// App Configuration
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 20,
  REFRESH_INTERVAL: 60000, // 1 minute
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes
  BIOMETRIC_TIMEOUT: 30000, // 30 seconds
};

// OAuth Configuration
export const OAUTH_CONFIG = {
  APPLE: {
    SERVICE_ID: 'com.fintellic.app', // Your Apple Service ID
  },
  GOOGLE: {
    IOS_CLIENT_ID: 'YOUR_IOS_CLIENT_ID.apps.googleusercontent.com',
    ANDROID_CLIENT_ID: 'YOUR_ANDROID_CLIENT_ID.apps.googleusercontent.com',
    WEB_CLIENT_ID: 'YOUR_WEB_CLIENT_ID.apps.googleusercontent.com',
    EXPO_CLIENT_ID: 'YOUR_EXPO_CLIENT_ID.apps.googleusercontent.com',
  },
};

// Filing Types Configuration
export const FILING_TYPES = {
  '10-K': {
    color: '#3B82F6', // blue
    label: '10-K',
    description: 'Annual Report',
  },
  '10-Q': {
    color: '#10B981', // green
    label: '10-Q',
    description: 'Quarterly Report',
  },
  '8-K': {
    color: '#EF4444', // red
    label: '8-K',
    description: 'Current Report',
  },
  'S-1': {
    color: '#F97316', // orange
    label: 'S-1',
    description: 'IPO Registration',
  },
};

// Management Tone Configuration
export const MANAGEMENT_TONES = {
  bullish: {
    label: 'Bullish',
    emoji: '😊',
    color: '#10B981',
  },
  neutral: {
    label: 'Neutral',
    emoji: '😐',
    color: '#6B7280',
  },
  bearish: {
    label: 'Bearish',
    emoji: '😟',
    color: '#EF4444',
  },
};

// Vote Types
export const VOTE_TYPES = {
  BULLISH: 'bullish',
  NEUTRAL: 'neutral',
  BEARISH: 'bearish',
} as const;

// Auth Providers
export const AUTH_PROVIDERS = {
  EMAIL: 'email',
  APPLE: 'apple',
  GOOGLE: 'google',
  LINKEDIN: 'linkedin',
} as const;

// Biometric Types
export const BIOMETRIC_TYPES = {
  FACE_ID: 'face_id',
  TOUCH_ID: 'touch_id',
  FINGERPRINT: 'fingerprint',
  FACE_UNLOCK: 'face_unlock',
} as const;

// Time Format Helper
export const formatTimeAgo = (date: string | Date): string => {
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
  
  return past.toLocaleDateString();
};