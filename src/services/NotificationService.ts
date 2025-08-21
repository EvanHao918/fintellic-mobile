// Push Notification Service
// Phase 4: Handle device token registration and permission requests

import { Platform, Alert, Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { notificationAPI } from '../api/notifications';

// Storage keys
const STORAGE_KEYS = {
  PUSH_TOKEN: '@hermespeed_push_token',
  PERMISSION_ASKED: '@hermespeed_permission_asked',
  LAST_TOKEN_SYNC: '@hermespeed_last_token_sync',
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,  // Added for iOS
    shouldShowList: true,    // Added for Android
  }),
});

class NotificationService {
  private pushToken: string | null = null;
  private notificationListener: any = null;
  private responseListener: any = null;

  /**
   * Initialize the notification service
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
   */
  private setupListeners() {
    // Handle notifications received while app is foregrounded
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
      // You can show a custom in-app notification here
    });

    // Handle user tapping on notification
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification response:', response);
      this.handleNotificationResponse(response);
    });
  }

  /**
   * Handle notification tap/response
   */
  private handleNotificationResponse(response: Notifications.NotificationResponse) {
    const { notification } = response;
    const data = notification.request.content.data;

    // Navigate based on notification type
    if (data?.type === 'filing_release' && data?.filingId) {
      // Navigate to filing detail
      // You'll need to implement navigation from your root component
      console.log('Navigate to filing:', data.filingId);
    } else if (data?.type === 'subscription') {
      // Navigate to subscription page
      console.log('Navigate to subscription');
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
          'Please enable notifications in your device settings to receive filing alerts.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Settings', onPress: () => {
              // Use Linking to open app settings
              Linking.openSettings();
            }},
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
        
        // Configure channel for Android
        if (Platform.OS === 'android') {
          await Notifications.setNotificationChannelAsync('default', {
            name: 'Default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
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
   * Schedule a local notification (for testing)
   */
  async scheduleTestNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'HermeSpeed Test',
        body: 'This is a test notification from HermeSpeed!',
        data: { type: 'test' },
      },
      trigger: null, // Immediate notification
    });
  }

  /**
   * Clear all notifications
   */
  async clearAllNotifications() {
    await Notifications.dismissAllNotificationsAsync();
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