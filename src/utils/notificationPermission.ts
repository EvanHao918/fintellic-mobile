// src/utils/notificationPermission.ts
// SIMPLIFIED: Core notification permission utilities only
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import Constants from 'expo-constants';

// Configure notification handler - SIMPLIFIED: Core configuration only
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Request notification permission with clear user feedback
 * SIMPLIFIED: Streamlined permission flow
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  try {
    // Check if we're on a physical device
    if (!Constants.isDevice) {
      console.log('Push notifications only work on physical devices');
      return false;
    }

    // Get existing permission status
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permission if not already granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      Alert.alert(
        'Permission Required',
        'Please enable push notifications in your device settings to receive SEC filing alerts.',
        [{ text: 'OK' }]
      );
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

/**
 * Get Expo push token
 * SIMPLIFIED: Basic token retrieval with proper error handling
 */
export const getExpoPushToken = async (): Promise<string | null> => {
  try {
    if (!Constants.isDevice) {
      console.log('Push tokens are only available on physical devices');
      return null;
    }

    const token = await Notifications.getExpoPushTokenAsync({
      projectId: Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId,
    });

    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
};

/**
 * Schedule local notification for testing
 * SIMPLIFIED: Basic local notification scheduling
 */
export const scheduleLocalNotification = async (
  title: string,
  body: string,
  data?: any,
  trigger?: Notifications.NotificationTriggerInput
) => {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: {
          ...data,
          source: 'local',
          timestamp: new Date().toISOString(),
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: trigger || null, // null means send immediately
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
};

/**
 * Cancel all scheduled notifications
 */
export const cancelAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
};

/**
 * Set badge count (iOS only)
 */
export const setBadgeCount = async (count: number) => {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(count);
    }
  } catch (error) {
    console.error('Error setting badge count:', error);
  }
};

/**
 * Clear badge count (iOS only)
 */
export const clearBadgeCount = async () => {
  try {
    if (Platform.OS === 'ios') {
      await Notifications.setBadgeCountAsync(0);
    }
  } catch (error) {
    console.error('Error clearing badge count:', error);
  }
};

/**
 * Dismiss all notifications
 */
export const dismissAllNotifications = async () => {
  try {
    await Notifications.dismissAllNotificationsAsync();
  } catch (error) {
    console.error('Error dismissing notifications:', error);
  }
};

/**
 * Check if notifications are enabled
 */
export const checkNotificationPermission = async (): Promise<boolean> => {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch (error) {
    console.error('Error checking notification permission:', error);
    return false;
  }
};

/**
 * Get notification permission status details
 */
export const getNotificationPermissionStatus = async () => {
  try {
    const permissions = await Notifications.getPermissionsAsync();
    return {
      granted: permissions.status === 'granted',
      canAskAgain: permissions.canAskAgain,
      status: permissions.status,
    };
  } catch (error) {
    console.error('Error getting permission status:', error);
    return {
      granted: false,
      canAskAgain: false,
      status: 'undetermined',
    };
  }
};

// Listener for received notifications
export const addNotificationReceivedListener = (
  callback: (notification: Notifications.Notification) => void
) => {
  return Notifications.addNotificationReceivedListener(callback);
};

// Listener for notification responses (when user taps on notification)
export const addNotificationResponseReceivedListener = (
  callback: (response: Notifications.NotificationResponse) => void
) => {
  return Notifications.addNotificationResponseReceivedListener(callback);
};