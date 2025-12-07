// Notification API endpoints
// Phase 4: Notification System
// FIXED: All TypeScript type errors resolved
// OPTIMIZED: Simplified API calls matching backend changes, core functionality only

import apiClient from './client';
import {
  NotificationSettings,
  NotificationSettingsUpdate,
  NotificationHistory,
  NotificationStats,
  DeviceTokenRegistration,
  TestNotificationRequest,
} from '../types/notification';

export const notificationAPI = {
  // Get current user's notification settings
  getSettings: async (): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.get<NotificationSettings>('/notifications/settings');
      return response;
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      throw error;
    }
  },

  // Update notification settings - FIXED: No dynamic indexing
  updateSettings: async (settings: NotificationSettingsUpdate): Promise<NotificationSettings> => {
    try {
      // Build filtered settings object explicitly - completely type safe
      const filteredSettings: NotificationSettingsUpdate = {};
      
      if (settings.notification_enabled !== undefined) {
        filteredSettings.notification_enabled = settings.notification_enabled;
      }
      if (settings.filing_10k !== undefined) {
        filteredSettings.filing_10k = settings.filing_10k;
      }
      if (settings.filing_10q !== undefined) {
        filteredSettings.filing_10q = settings.filing_10q;
      }
      if (settings.filing_8k !== undefined) {
        filteredSettings.filing_8k = settings.filing_8k;
      }
      if (settings.filing_s1 !== undefined) {
        filteredSettings.filing_s1 = settings.filing_s1;
      }
      if (settings.watchlist_only !== undefined) {
        filteredSettings.watchlist_only = settings.watchlist_only;
      }

      const response = await apiClient.put<NotificationSettings>(
        '/notifications/settings',
        filteredSettings
      );
      return response;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Get notification history
  getHistory: async (limit: number = 50, offset: number = 0): Promise<NotificationHistory[]> => {
    try {
      const response = await apiClient.get<NotificationHistory[]>(
        '/notifications/history',
        { params: { limit, skip: offset } }
      );
      return response;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      // Return empty array on error instead of throwing
      return [];
    }
  },

  // Register device token for push notifications
  registerDeviceToken: async (data: DeviceTokenRegistration): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/notifications/device/register',
        {
          token: data.token,
          platform: data.platform
        }
      );
      return response;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  },

  // Unregister device token
  unregisterDeviceToken: async (token: string): Promise<{ success: boolean; message: string }> => {
    try {
      const response = await apiClient.post<{ success: boolean; message: string }>(
        '/notifications/device/unregister',
        { token }
      );
      return response;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  },

  // Get notification statistics - SIMPLIFIED
  getStats: async (): Promise<NotificationStats> => {
    try {
      const response = await apiClient.get<NotificationStats>('/notifications/stats');
      return response;
    } catch (error) {
      console.error('Error fetching notification stats:', error);
      throw error;
    }
  },

  // Send test notification
  sendTestNotification: async (data?: TestNotificationRequest): Promise<{ 
    success: boolean; 
    message: string; 
    firebase_configured?: boolean;
    notifications_sent?: number;
  }> => {
    try {
      const response = await apiClient.post<{ 
        success: boolean; 
        message: string; 
        firebase_configured?: boolean;
        notifications_sent?: number;
      }>(
        '/notifications/test',
        data || {}
      );
      return response;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  },

  // SIMPLIFIED: Core toggle methods only
  toggleNotifications: async (enabled: boolean): Promise<NotificationSettings> => {
    return notificationAPI.updateSettings({ notification_enabled: enabled });
  },

  toggleWatchlistOnly: async (enabled: boolean): Promise<NotificationSettings> => {
    return notificationAPI.updateSettings({ watchlist_only: enabled });
  },

  // Update filing type preferences
  updateFilingPreferences: async (preferences: {
    filing_10k?: boolean;
    filing_10q?: boolean;
    filing_8k?: boolean;
    filing_s1?: boolean;
  }): Promise<NotificationSettings> => {
    return notificationAPI.updateSettings(preferences);
  },
};

// SIMPLIFIED: Helper functions for core functionality only
export const notificationHelpers = {
  // Check if notifications are enabled
  isNotificationEnabled: (settings: NotificationSettings): boolean => {
    return settings.notification_enabled;
  },

  // Get enabled filing types
  getEnabledFilingTypes: (settings: NotificationSettings): string[] => {
    const types: string[] = [];
    if (settings.filing_10k) types.push('10-K');
    if (settings.filing_10q) types.push('10-Q');
    if (settings.filing_8k) types.push('8-K');
    if (settings.filing_s1) types.push('S-1');
    return types;
  },

  // Count enabled filing types
  countEnabledFilingTypes: (settings: NotificationSettings): number => {
    let count = 0;
    if (settings.filing_10k) count++;
    if (settings.filing_10q) count++;
    if (settings.filing_8k) count++;
    if (settings.filing_s1) count++;
    return count;
  },

  // Get notification summary text
  getNotificationSummary: (settings: NotificationSettings): string => {
    if (!settings.notification_enabled) {
      return 'Notifications disabled';
    }

    const enabledTypes = notificationHelpers.getEnabledFilingTypes(settings);
    const scope = settings.watchlist_only ? 'Watchlist only' : 'All companies';
    
    if (enabledTypes.length === 0) {
      return `${scope} • No filing types selected`;
    }
    
    return `${scope} • ${enabledTypes.length} filing type${enabledTypes.length > 1 ? 's' : ''}`;
  },

  // Validate settings before sending to API
  validateSettings: (settings: NotificationSettingsUpdate): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    // Check if at least one filing type is enabled when notifications are on
    if (settings.notification_enabled === true) {
      const hasEnabledType = (
        settings.filing_10k === true ||
        settings.filing_10q === true ||
        settings.filing_8k === true ||
        settings.filing_s1 === true
      );
      
      if (!hasEnabledType) {
        errors.push('At least one filing type must be enabled when notifications are turned on');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  },

  // Get filing type display names - FIXED: Explicit key access
  getFilingTypeDisplayName: (filingType: string): string => {
    if (filingType === '10-K') return 'Annual Reports';
    if (filingType === '10-Q') return 'Quarterly Reports';
    if (filingType === '8-K') return 'Current Reports';
    if (filingType === 'S-1') return 'IPO Filings';
    return filingType;
  },

  // Check if user has meaningful notification configuration
  hasValidConfiguration: (settings: NotificationSettings): boolean => {
    if (!settings.notification_enabled) {
      return false;
    }
    
    const enabledTypes = notificationHelpers.getEnabledFilingTypes(settings);
    return enabledTypes.length > 0;
  }
};