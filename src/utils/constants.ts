// API Configuration
export const API_BASE_URL = 'https://web-production-39ac3.up.railway.app/api/v1';

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: '@fintellic_auth_token',
  REFRESH_TOKEN: '@fintellic_refresh_token',
  USER_INFO: '@fintellic_user_info',
  REMEMBER_ME: '@fintellic_remember_me',
  BIOMETRIC_ENABLED: '@fintellic_biometric_enabled',
  DEVICE_ID: '@fintellic_device_id',
  LAST_LOGIN_METHOD: '@fintellic_last_login_method',
  // ENHANCED: Add timezone preference storage
  TIMEZONE_PREFERENCE: '@fintellic_timezone_preference',
  USE_USER_TIMEZONE: '@fintellic_use_user_timezone',
};

// App Configuration
export const APP_CONFIG = {
  ITEMS_PER_PAGE: 20,
  REFRESH_INTERVAL: 60000, // 1 minute
  TOKEN_REFRESH_THRESHOLD: 300000, // 5 minutes
  BIOMETRIC_TIMEOUT: 30000, // 30 seconds
};

// ENHANCED: Timezone Configuration
export const TIMEZONE_CONFIG = {
  // Default display timezone (Eastern Time - where US markets operate)
  DEFAULT_TIMEZONE: 'America/New_York',
  
  // Supported timezones for user preference
  SUPPORTED_TIMEZONES: [
    { value: 'America/New_York', label: 'Eastern Time (ET)', abbreviation: 'ET' },
    { value: 'America/Chicago', label: 'Central Time (CT)', abbreviation: 'CT' },
    { value: 'America/Denver', label: 'Mountain Time (MT)', abbreviation: 'MT' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)', abbreviation: 'PT' },
    { value: 'UTC', label: 'UTC', abbreviation: 'UTC' },
    { value: 'local', label: 'Local Time', abbreviation: 'Local' }, // User's device timezone
  ],
  
  // Display preferences
  SHOW_TIMEZONE_ABBREVIATION: true,
  SHOW_RELATIVE_TIME: true, // "2h ago" vs exact time
  RELATIVE_TIME_THRESHOLD_HOURS: 24, // Show relative time for times within 24 hours
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
    urgency: 'medium', // For time display styling
  },
  '10-Q': {
    color: '#10B981', // green
    label: '10-Q',
    description: 'Quarterly Report',
    urgency: 'medium',
  },
  '8-K': {
    color: '#EF4444', // red
    label: '8-K',
    description: 'Current Report',
    urgency: 'high', // 8-K are usually urgent news
  },
  'S-1': {
    color: '#F97316', // orange
    label: 'S-1',
    description: 'IPO Registration',
    urgency: 'high', // IPOs are high interest
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

// ENHANCED: Time Display Configuration
export const TIME_DISPLAY_CONFIG = {
  // When to show different time formats
  SHOW_SECONDS_THRESHOLD: 60, // Show seconds for times within 1 minute
  SHOW_MINUTES_THRESHOLD: 3600, // Show "Xm ago" for times within 1 hour
  SHOW_HOURS_THRESHOLD: 86400, // Show "Xh ago" for times within 24 hours
  SHOW_DAYS_THRESHOLD: 604800, // Show "Xd ago" for times within 7 days
  
  // Precision levels
  HIGH_PRECISION: 'seconds', // Show seconds (for very recent filings)
  MEDIUM_PRECISION: 'minutes', // Show minutes (for recent filings)
  LOW_PRECISION: 'hours', // Show hours (for older filings)
  
  // Special cases
  MARKET_HOURS: {
    // US market hours in Eastern Time
    OPEN: { hour: 9, minute: 30 }, // 9:30 AM ET
    CLOSE: { hour: 16, minute: 0 }, // 4:00 PM ET
    PREMARKET_START: { hour: 4, minute: 0 }, // 4:00 AM ET
    AFTERHOURS_END: { hour: 20, minute: 0 }, // 8:00 PM ET
  },
};

// ENHANCED: Time Format Helper with timezone support
export const formatTimeAgo = (date: string | Date, options?: {
  useDetectedTime?: boolean;
  showTimezone?: boolean;
  precision?: 'high' | 'medium' | 'low';
}): string => {
  const {
    useDetectedTime = true,
    showTimezone = false,
    precision = 'medium'
  } = options || {};
  
  const now = new Date();
  const past = new Date(date);
  const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

  // Handle future dates
  if (diffInSeconds < 0) {
    return 'Just filed';
  }

  // High precision - show seconds for very recent
  if (precision === 'high' && diffInSeconds < TIME_DISPLAY_CONFIG.SHOW_SECONDS_THRESHOLD) {
    return diffInSeconds <= 5 ? 'Just now' : `${diffInSeconds}s ago`;
  }

  // Medium precision - show minutes
  if (diffInSeconds < TIME_DISPLAY_CONFIG.SHOW_MINUTES_THRESHOLD) {
    const minutes = Math.floor(diffInSeconds / 60);
    return minutes === 0 ? 'Just now' : `${minutes}m ago`;
  }
  
  // Show hours
  if (diffInSeconds < TIME_DISPLAY_CONFIG.SHOW_HOURS_THRESHOLD) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}h ago`;
  }
  
  // Show days for up to a week
  if (diffInSeconds < TIME_DISPLAY_CONFIG.SHOW_DAYS_THRESHOLD) {
    const days = Math.floor(diffInSeconds / 86400);
    return days === 1 ? 'Yesterday' : `${days}d ago`;
  }
  
  // For older dates, show the actual date
  const formatter = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: past.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    timeZone: showTimezone ? TIMEZONE_CONFIG.DEFAULT_TIMEZONE : undefined,
  });
  
  return formatter.format(past);
};

// ENHANCED: Market Hours Helper
export const getMarketStatus = (date?: Date): {
  status: 'premarket' | 'open' | 'afterhours' | 'closed';
  label: string;
} => {
  const checkDate = date || new Date();
  
  // Convert to Eastern Time for market hours check
  const etDate = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    weekday: 'short'
  }).formatToParts(checkDate);
  
  const weekday = etDate.find(part => part.type === 'weekday')?.value;
  const hour = parseInt(etDate.find(part => part.type === 'hour')?.value || '0');
  const minute = parseInt(etDate.find(part => part.type === 'minute')?.value || '0');
  
  // Weekend - markets closed
  if (weekday === 'Sat' || weekday === 'Sun') {
    return { status: 'closed', label: 'Markets Closed' };
  }
  
  const currentMinutes = hour * 60 + minute;
  const marketOpen = TIME_DISPLAY_CONFIG.MARKET_HOURS.OPEN.hour * 60 + 
                    TIME_DISPLAY_CONFIG.MARKET_HOURS.OPEN.minute;
  const marketClose = TIME_DISPLAY_CONFIG.MARKET_HOURS.CLOSE.hour * 60 + 
                     TIME_DISPLAY_CONFIG.MARKET_HOURS.CLOSE.minute;
  const preMarketStart = TIME_DISPLAY_CONFIG.MARKET_HOURS.PREMARKET_START.hour * 60;
  const afterHoursEnd = TIME_DISPLAY_CONFIG.MARKET_HOURS.AFTERHOURS_END.hour * 60;
  
  if (currentMinutes >= marketOpen && currentMinutes < marketClose) {
    return { status: 'open', label: 'Market Open' };
  } else if (currentMinutes >= preMarketStart && currentMinutes < marketOpen) {
    return { status: 'premarket', label: 'Pre-Market' };
  } else if (currentMinutes >= marketClose && currentMinutes < afterHoursEnd) {
    return { status: 'afterhours', label: 'After Hours' };
  } else {
    return { status: 'closed', label: 'Markets Closed' };
  }
};