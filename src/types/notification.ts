// Notification types definition for HermeSpeed
// Phase 4: Notification System

export interface NotificationSettings {
  // Filing notifications
  filing_10k: boolean;
  filing_10q: boolean;
  filing_8k: boolean;
  filing_s1: boolean;
  watchlist_only: boolean;
  
  // Other notifications
  daily_reset_reminder: boolean;
  subscription_alerts: boolean;
  market_summary: boolean;
  
  // Quiet hours
  quiet_hours_start: string | null;  // HH:MM format
  quiet_hours_end: string | null;    // HH:MM format
  
  // Master switch
  notification_enabled: boolean;
  
  // Device tokens (managed by backend)
  device_tokens?: DeviceToken[];
}

export interface DeviceToken {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
  created_at?: string;
  last_used?: string;
}

export interface NotificationSettingsUpdate {
  filing_10k?: boolean;
  filing_10q?: boolean;
  filing_8k?: boolean;
  filing_s1?: boolean;
  watchlist_only?: boolean;
  daily_reset_reminder?: boolean;
  subscription_alerts?: boolean;
  market_summary?: boolean;
  quiet_hours_start?: string | null;
  quiet_hours_end?: string | null;
  notification_enabled?: boolean;
}

export interface NotificationHistory {
  id: number;
  notification_type: string;
  title: string;
  body: string;
  data?: any;
  sent_at: string;
  read_at?: string;
  clicked_at?: string;
  platform?: string;
  status: 'sent' | 'delivered' | 'failed' | 'clicked';
}

export interface NotificationStats {
  total_sent: number;
  total_delivered: number;
  total_clicked: number;
  by_type: {
    [key: string]: {
      sent: number;
      delivered: number;
      clicked: number;
    };
  };
  recent_notifications: NotificationHistory[];
}

export interface DeviceTokenRegistration {
  token: string;
  platform: 'ios' | 'android';
  device_name?: string;
  app_version?: string;
  os_version?: string;
}

export interface TestNotificationRequest {
  notification_type?: 'filing_release' | 'daily_reset' | 'subscription' | 'test';
  title?: string;
  body?: string;
}

// Notification preference labels for UI
export const NOTIFICATION_LABELS = {
  filing_10k: 'Annual Reports (10-K)',
  filing_10q: 'Quarterly Reports (10-Q)',
  filing_8k: 'Current Reports (8-K)',
  filing_s1: 'IPO Filings (S-1)',
  watchlist_only: 'Watchlist Only',
  daily_reset_reminder: 'Daily Reset Reminder',
  subscription_alerts: 'Subscription Updates',
  market_summary: 'Weekly Market Summary',
  notification_enabled: 'Push Notifications',
} as const;

// Notification preference descriptions
export const NOTIFICATION_DESCRIPTIONS = {
  filing_10k: 'Get notified when companies file their annual reports',
  filing_10q: 'Get notified when companies file quarterly reports',
  filing_8k: 'Get notified about significant events and changes',
  filing_s1: 'Get notified when companies file for IPO',
  watchlist_only: 'Only receive notifications for companies in your watchlist',
  daily_reset_reminder: 'Reminder when your daily view limit resets (Free users)',
  subscription_alerts: 'Important updates about your subscription',
  market_summary: 'Weekly summary of market activity',
  notification_enabled: 'Master switch for all push notifications',
} as const;

// Default notification settings
export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  filing_10k: true,
  filing_10q: true,
  filing_8k: true,
  filing_s1: true,
  watchlist_only: false,
  daily_reset_reminder: true,
  subscription_alerts: true,
  market_summary: false,
  quiet_hours_start: '22:00',
  quiet_hours_end: '08:00',
  notification_enabled: true,
};