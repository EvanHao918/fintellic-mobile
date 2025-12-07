// Notification types definition for HermeSpeed
// Phase 4: Notification System
// SIMPLIFIED: Core filing preferences only, removed redundant features

export interface NotificationSettings {
  // Core filing notifications only
  filing_10k: boolean;
  filing_10q: boolean;
  filing_8k: boolean;
  filing_s1: boolean;
  watchlist_only: boolean;
  
  // Master switch
  notification_enabled: boolean;
  
  // Metadata (from backend)
  id?: number;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface NotificationSettingsUpdate {
  filing_10k?: boolean;
  filing_10q?: boolean;
  filing_8k?: boolean;
  filing_s1?: boolean;
  watchlist_only?: boolean;
  notification_enabled?: boolean;
}

export interface NotificationHistory {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  data?: any;
  sent_at: string;
  status: 'sent' | 'delivered' | 'failed' | 'pending';
  error_message?: string;
  created_at: string;
}

export interface NotificationStats {
  total_sent: number;
  total_failed: number;
  device_count: number;
  settings: {
    enabled: boolean;
    watchlist_only?: boolean;
  };
}

export interface DeviceTokenRegistration {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
  app_version?: string;
  os_version?: string;
}

export interface TestNotificationRequest {
  title?: string;
  body?: string;
}

// SIMPLIFIED: Core notification preference labels for UI
export const NOTIFICATION_LABELS = {
  filing_10k: 'Annual Reports (10-K)',
  filing_10q: 'Quarterly Reports (10-Q)',
  filing_8k: 'Current Reports (8-K)',
  filing_s1: 'IPO Filings (S-1)',
  watchlist_only: 'Watchlist Only',
  notification_enabled: 'Push Notifications',
} as const;

// Notification preference descriptions
export const NOTIFICATION_DESCRIPTIONS = {
  filing_10k: 'Get notified when companies file their annual reports',
  filing_10q: 'Get notified when companies file quarterly reports',
  filing_8k: 'Get notified about significant events and changes',
  filing_s1: 'Get notified when companies file for IPO',
  watchlist_only: 'Only receive notifications for companies in your watchlist',
  notification_enabled: 'Master switch for all push notifications',
} as const;

// Default notification settings for new users
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  filing_10k: true,
  filing_10q: true,
  filing_8k: true,
  filing_s1: true,
  watchlist_only: false,
  notification_enabled: true,
};

// Filing type validation helpers
export const FILING_TYPES = ['filing_10k', 'filing_10q', 'filing_8k', 'filing_s1'] as const;
export type FilingType = typeof FILING_TYPES[number];

// Push token management types
export interface PushTokenInfo {
  token: string | null;
  hasPermission: boolean;
  synced: boolean;
  lastSyncAt?: string;
  platform?: 'ios' | 'android';
}

// Redux state types (for store integration)
export interface NotificationState {
  settings: NotificationSettings | null;
  history: NotificationHistory[];
  stats: NotificationStats | null;
  pushTokenInfo: PushTokenInfo;
  loading: {
    settings: boolean;
    history: boolean;
    updating: boolean;
    sendingTest: boolean;
  };
  errors: {
    settings: string | null;
    history: string | null;
    updating: string | null;
    sendingTest: string | null;
  };
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Test notification response
export interface TestNotificationResponse {
  success: boolean;
  message: string;
  firebase_configured?: boolean;
  notifications_sent?: number;
}

// Device token response
export interface DeviceTokenResponse {
  success: boolean;
  message: string;
}

// Validation helpers
export const isValidFilingType = (type: string): type is FilingType => {
  return FILING_TYPES.includes(type as FilingType);
};

export const hasAnyFilingTypeEnabled = (settings: NotificationSettings): boolean => {
  return FILING_TYPES.some(type => settings[type]);
};

export const getEnabledFilingTypes = (settings: NotificationSettings): FilingType[] => {
  return FILING_TYPES.filter(type => settings[type]);
};

// Notification configuration validation
export const validateNotificationSettings = (settings: NotificationSettingsUpdate): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];
  
  // If notifications are enabled, at least one filing type should be enabled
  if (settings.notification_enabled) {
    const hasEnabledType = FILING_TYPES.some(type => 
      settings[type] === true || (settings[type] === undefined && DEFAULT_NOTIFICATION_SETTINGS[type])
    );
    
    if (!hasEnabledType) {
      errors.push('At least one filing type must be enabled when notifications are turned on');
    }
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};