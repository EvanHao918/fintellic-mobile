// Push Notification Service
// Phase 4: Handle device token registration and permission requests
// SIMPLIFIED: Core functionality only, unified token management, removed Redux dependencies

import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationAPI } from '../api/notifications';
import { PushTokenInfo } from '../types/notification';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@hermespeed_push_token',
  PERMISSION_ASKED: '@hermespeed_permission_asked',
  LAST_TOKEN_SYNC: '@hermespeed_last_token_sync',
};

// Navigation reference type
interface NavigationRef {
  navigate: (name: string, params?: any) => void;
  getCurrentRoute?: () => any;
}

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;
  private navigationRef: NavigationRef | null = null;

  /**
   * Set navigation reference for handling notification taps
   */
  setNavigationRef(navigationRef: NavigationRef) {
    this.navigationRef = navigationRef;
  }

  /**
   * Initialize the notification service
   * SIMPLIFIED: Core initialization only
   */
  async initialize() {
    try {
      // Check if device supports push notifications
      if (!Device.isDevice) {
        console.log('Push notifications only work on physical devices');
        return;
      }

      // Set up notification listeners
      this.setupListeners();

      // Get or request permission
      const hasPermission = await this.checkPermission();
      
      if (hasPermission) {
        await this.registerForPushNotifications();
      }

      // Load cached token
      this.pushToken = await AsyncStorage.getItem(STORAGE_KEYS.PUSH_TOKEN);
      
      // Sync token with backend if needed
      await this.syncTokenWithBackend();
    } catch (error) {
      console.error('Error initializing notification service:', error);
    }
  }

  /**
   * Set up notification listeners
   * SIMPLIFIED: Core notification handling only
   */
  private setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      this.handleForegroundNotification(notification);
    });

    // Handle user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle incoming notification when app is in foreground
   * SIMPLIFIED: Basic foreground handling
   */
  private handleForegroundNotification(notification: Notifications.Notification) {
    const data = notification.request.content.data;
    
    // Show alert for important notifications
    if (data?.type === 'filing_release' || data?.type === 'test') {
      Alert.alert(
        notification.request.content.title || 'HermeSpeed',
        notification.request.content.body || '',
        [
          { text: 'Dismiss', style: 'cancel' },
          { 
            text: 'View', 
            onPress: () => this.handleNotificationResponse({
              notification,
              actionIdentifier: 'default'
            } as any)
          }
        ]
      );
    }
  }

  /**
   * Handle notification tap/response with proper navigation
   * SIMPLIFIED: Core filing notifications only
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { notification } = response;
    const data = notification.request.content.data;

    if (!this.navigationRef) {
      console.warn('Navigation ref not set - cannot navigate from notification');
      return;
    }

    try {
      const notificationType = data?.type as string;
      
      switch (notificationType) {
        case 'filing_release':
          if (data?.filing_id) {
            // Navigate to specific filing detail
            this.navigationRef.navigate('FilingDetail', { 
              filingId: parseInt(data.filing_id as string),
              ticker: (data.ticker as string) || 'Unknown',
              source: 'push_notification'
            });
          } else if (data?.ticker) {
            // Navigate to company filings
            this.navigationRef.navigate('CompanyFilings', { 
              ticker: data.ticker as string,
              source: 'push_notification'
            });
          } else {
            // Fallback to home screen
            this.navigationRef.navigate('Home', {
              source: 'push_notification'
            });
          }
          break;
          
        case 'test':
          // Navigate to notifications settings
          this.navigationRef.navigate('Notifications', {
            source: 'push_notification',
            showTestSuccess: true
          });
          break;
          
        default:
          // Default: navigate to home screen
          this.navigationRef.navigate('Home', {
            source: 'push_notification'
          });
          break;
      }
      
      console.log(`Navigated from ${notificationType || 'unknown'} notification`);
      
    } catch (navigationError) {
      console.error('Error navigating from notification:', navigationError);
      
      // Ultimate fallback: try to navigate to home
      try {
        this.navigationRef.navigate('Home');
      } catch (fallbackError) {
        console.error('All navigation attempts failed:', fallbackError);
      }
    }
  }

  /**
   * Check if app has notification permission
   */
  async checkPermission(): Promise<boolean> {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    return existingStatus === 'granted';
  }

  /**
   * Request notification permission
   * SIMPLIFIED: Clear permission flow
   */
  async requestPermission(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      
      if (existingStatus === 'granted') {
        return true;
      }

      // Check if we've already asked before
      const hasAsked = await AsyncStorage.getItem(STORAGE_KEYS.PERMISSION_ASKED);
      
      if (hasAsked && existingStatus === 'denied') {
        // User has denied before, show alert to go to settings
        Alert.alert(
          'Enable Notifications',
          'Please enable notifications in your device settings to receive SEC filing alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return false;
      }

      // Request permission
      const { status } = await Notifications.requestPermissionsAsync();
      await AsyncStorage.setItem(STORAGE_KEYS.PERMISSION_ASKED, 'true');
      
      return status === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  /**
   * Register for push notifications and get token
   * OPTIMIZED: Simplified token registration
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      // Get Expo push token
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: Constants.expoConfig?.extra?.eas?.projectId,
      });

      if (token.data) {
        this.pushToken = token.data;
        await AsyncStorage.setItem(STORAGE_KEYS.PUSH_TOKEN, token.data);
        
        // Configure notification channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('hermespeed_filings', {
            name: 'HermeSpeed Filing Alerts',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#E88B00',
            description: 'Notifications for new SEC filings and updates',
          });
        }

        return token.data;
      }
    } catch (error) {
      console.error('Error getting push token:', error);
    }

    return null;
  }

  /**
   * Sync token with backend
   * SIMPLIFIED: Basic sync with unified backend storage
   */
  async syncTokenWithBackend(): Promise<boolean> {
    try {
      if (!this.pushToken) {
        return false;
      }

      // Check if we need to sync (once per day)
      const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_TOKEN_SYNC);
      if (lastSync) {
        const lastSyncDate = new Date(lastSync);
        const now = new Date();
        const hoursSinceSync = (now.getTime() - lastSyncDate.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSync < 24) {
          return true; // Already synced recently
        }
      }

      // Register token with backend
      await notificationAPI.registerDeviceToken({
        token: this.pushToken,
        platform: Platform.OS as 'ios' | 'android',
        device_name: Device.deviceName || undefined,
        app_version: Constants.expoConfig?.version,
        os_version: Device.osVersion || undefined,
      });

      // Update last sync time
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_TOKEN_SYNC, new Date().toISOString());
      
      console.log('Push token synced with backend');
      return true;
    } catch (error) {
      console.error('Error syncing push token:', error);
      return false;
    }
  }

  /**
   * Enable push notifications (request permission and register)
   */
  async enablePushNotifications(): Promise<boolean> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        return false;
      }

      const token = await this.registerForPushNotifications();
      if (!token) {
        return false;
      }

      await this.syncTokenWithBackend();
      return true;
    } catch (error) {
      console.error('Error enabling push notifications:', error);
      return false;
    }
  }

  /**
   * Disable push notifications (unregister token)
   */
  async disablePushNotifications(): Promise<boolean> {
    try {
      if (this.pushToken) {
        await notificationAPI.unregisterDeviceToken(this.pushToken);
        await AsyncStorage.removeItem(STORAGE_KEYS.PUSH_TOKEN);
        await AsyncStorage.removeItem(STORAGE_KEYS.LAST_TOKEN_SYNC);
        this.pushToken = null;
      }
      return true;
    } catch (error) {
      console.error('Error disabling push notifications:', error);
      return false;
    }
  }

  /**
   * Get current push token
   */
  getPushToken(): string | null {
    return this.pushToken;
  }

  /**
   * Get push token info for UI display
   * SIMPLIFIED: Core token status only
   */
  async getPushTokenInfo(): Promise<PushTokenInfo> {
    const hasPermission = await this.checkPermission();
    const lastSync = await AsyncStorage.getItem(STORAGE_KEYS.LAST_TOKEN_SYNC);
    
    return {
      token: this.pushToken,
      hasPermission,
      synced: !!lastSync,
      lastSyncAt: lastSync || undefined,
      platform: Platform.OS as 'ios' | 'android',
    };
  }

  /**
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification() {
    try {
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'HermeSpeed Test',
          body: 'This is a test notification from HermeSpeed!',
          data: { 
            type: 'test',
            timestamp: new Date().toISOString(),
            source: 'local'
          },
        },
        trigger: null, // Immediate notification
      });

      return notificationId;
    } catch (error) {
      console.error('Error scheduling test notification:', error);
      return null;
    }
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    try {
      await Notifications.dismissAllNotificationsAsync();
      
      // Also clear badge count on iOS
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(0);
      }
    } catch (error) {
      console.error('Error clearing notifications:', error);
    }
  }

  /**
   * Set badge count (iOS only)
   */
  async setBadgeCount(count: number) {
    try {
      if (Platform.OS === 'ios') {
        await Notifications.setBadgeCountAsync(count);
      }
    } catch (error) {
      console.error('Error setting badge count:', error);
    }
  }

  /**
   * Check if notifications are properly configured
   * SIMPLIFIED: Basic system status
   */
  async getSystemStatus() {
    const hasPermission = await this.checkPermission();
    const pushToken = this.getPushToken();
    
    return {
      hasPermission,
      hasToken: !!pushToken,
      deviceSupported: Device.isDevice,
      platform: Platform.OS,
      isFullyConfigured: hasPermission && !!pushToken
    };
  }

  /**
   * Force refresh token sync
   */
  async forceTokenSync(): Promise<boolean> {
    try {
      // Clear last sync time to force resync
      await AsyncStorage.removeItem(STORAGE_KEYS.LAST_TOKEN_SYNC);
      return await this.syncTokenWithBackend();
    } catch (error) {
      console.error('Error forcing token sync:', error);
      return false;
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
    }
  }
}

// Export singleton instance
export default new NotificationService();