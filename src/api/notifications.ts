// Notification API endpoints
// Phase 4: Notification System

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

  // Update notification settings
  updateSettings: async (settings: NotificationSettingsUpdate): Promise<NotificationSettings> => {
    try {
      const response = await apiClient.put<NotificationSettings>(
        '/notifications/settings',
        settings
      );
      return response;
    } catch (error) {
      console.error('Error updating notification settings:', error);
      throw error;
    }
  },

  // Register device token for push notifications
  registerDeviceToken: async (data: DeviceTokenRegistration): Promise<{ message: string; token_id?: number }> => {
    try {
      const response = await apiClient.post<{ message: string; token_id?: number }>(
        '/notifications/device/register',
        data
      );
      return response;
    } catch (error) {
      console.error('Error registering device token:', error);
      throw error;
    }
  },

  // Unregister device token
  unregisterDeviceToken: async (token: string): Promise<{ message: string }> => {
    try {
      const response = await apiClient.post<{ message: string }>(
        '/notifications/device/unregister',
        { token }
      );
      return response;
    } catch (error) {
      console.error('Error unregistering device token:', error);
      throw error;
    }
  },

  // Get notification history
  getHistory: async (limit: number = 50, offset: number = 0): Promise<NotificationHistory[]> => {
    try {
      const response = await apiClient.get<NotificationHistory[]>(
        '/notifications/history',
        { params: { limit, offset } }
      );
      return response;
    } catch (error) {
      console.error('Error fetching notification history:', error);
      throw error;
    }
  },

  // Get notification statistics
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
  sendTestNotification: async (data?: TestNotificationRequest): Promise<{ message: string; notification_id?: number }> => {
    try {
      const response = await apiClient.post<{ message: string; notification_id?: number }>(
        '/notifications/test',
        data || {}
      );
      return response;
    } catch (error) {
      console.error('Error sending test notification:', error);
      throw error;
    }
  },

  // Quick toggle methods for convenience
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

  // Update quiet hours
  updateQuietHours: async (start: string | null, end: string | null): Promise<NotificationSettings> => {
    return notificationAPI.updateSettings({
      quiet_hours_start: start,
      quiet_hours_end: end,
    });
  },
};

// Helper functions for notification management
export const notificationHelpers = {
  // Check if notifications are enabled
  isNotificationEnabled: (settings: NotificationSettings): boolean => {
    return settings.notification_enabled;
  },

  // Check if quiet hours are active
  isInQuietHours: (settings: NotificationSettings): boolean => {
    if (!settings.quiet_hours_start || !settings.quiet_hours_end) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = settings.quiet_hours_start;
    const end = settings.quiet_hours_end;

    // Handle overnight quiet hours (e.g., 22:00 to 08:00)
    if (start > end) {
      return currentTime >= start || currentTime <= end;
    }
    
    // Handle same-day quiet hours (e.g., 08:00 to 22:00)
    return currentTime >= start && currentTime <= end;
  },

  // Format quiet hours for display
  formatQuietHours: (start: string | null, end: string | null): string => {
    if (!start || !end) {
      return 'Not set';
    }
    return `${start} - ${end}`;
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

  // Count enabled notifications
  countEnabledNotifications: (settings: NotificationSettings): number => {
    let count = 0;
    if (settings.filing_10k) count++;
    if (settings.filing_10q) count++;
    if (settings.filing_8k) count++;
    if (settings.filing_s1) count++;
    if (settings.daily_reset_reminder) count++;
    if (settings.subscription_alerts) count++;
    if (settings.market_summary) count++;
    return count;
  },
};