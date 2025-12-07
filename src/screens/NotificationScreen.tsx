import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  FlatList,
  RefreshControl,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useNavigation, NavigationProp } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { 
  fetchNotificationSettings,
  fetchNotificationHistory,
  updateNotificationSettings,
  sendTestNotification,
  clearErrors,
  selectNotificationSettings,
  selectNotificationHistory,
  selectNotificationLoading,
  selectNotificationErrors,
  selectPushTokenInfo,
  selectNotificationSummary
} from '../store/slices/notificationSlice';
import { NotificationSettings, NotificationHistory } from '../types/notification';
import { colors, typography, spacing, borderRadius } from '../theme';
import { formatDateTime, formatDistanceToNow } from '../utils/dateHelpers';
import { watchlistAPI } from '../api/watchlist';
// 🔥 FIX: Import NotificationService to register device token
import notificationService from '../services/NotificationService';

type DrawerParamList = {
  Home: undefined;
  Calendar: undefined;
  Watchlist: undefined;
  History: undefined;
  Profile: undefined;
  Notifications: undefined;
};

type NavigationProps = NavigationProp<DrawerParamList>;

interface NotificationScreenProps {}

export default function NotificationScreen({}: NotificationScreenProps) {
  const navigation = useNavigation<NavigationProps>();
  const dispatch = useDispatch<AppDispatch>();
  
  const settings = useSelector(selectNotificationSettings);
  const history = useSelector(selectNotificationHistory);
  const loading = useSelector(selectNotificationLoading);
  const errors = useSelector(selectNotificationErrors);
  const pushTokenInfo = useSelector(selectPushTokenInfo);
  const notificationSummary = useSelector(selectNotificationSummary);
  
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [watchlistLoading, setWatchlistLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  const loadData = async () => {
    try {
      await Promise.all([
        dispatch(fetchNotificationSettings()),
        dispatch(fetchNotificationHistory({ limit: 50, offset: 0 }))
      ]);
      
      await loadWatchlistCount();
    } catch (error) {
      console.error('Error loading notification data:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    }
  };

  const loadWatchlistCount = async () => {
    try {
      setWatchlistLoading(true);
      const response = await watchlistAPI.getCount();
      setWatchlistCount(response.count);
    } catch (error) {
      console.error('Error loading watchlist count:', error);
      setWatchlistCount(0);
    } finally {
      setWatchlistLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // 🔥 FIX: Updated updateSetting to register device token when enabling notifications
  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      // If enabling push notifications, register device token first
      if (key === 'notification_enabled' && value === true) {
        console.log('📱 Enabling push notifications - registering device token...');
        const success = await notificationService.enablePushNotifications();
        if (!success) {
          Alert.alert(
            'Permission Required',
            'Please allow notifications in your device settings to receive alerts.',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Open Settings', onPress: () => Linking.openSettings() }
            ]
          );
          return; // Don't update setting if token registration failed
        }
        console.log('✅ Device token registered successfully');
      }
      
      // If disabling push notifications, unregister device token
      if (key === 'notification_enabled' && value === false) {
        console.log('📱 Disabling push notifications - unregistering device token...');
        await notificationService.disablePushNotifications();
        console.log('✅ Device token unregistered');
      }
      
      // Update the setting on backend
      await dispatch(updateNotificationSettings({ [key]: value }));
      
      if (key === 'watchlist_only') {
        await loadWatchlistCount();
      }
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const openNotificationSettings = () => {
    Alert.alert(
      'Notification Settings',
      'Open device settings to manage notification permissions?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => Linking.openSettings() }
      ]
    );
  };

  const renderSettingItem = (
    title: string,
    description: string,
    value: boolean,
    onToggle: () => void,
    disabled: boolean = false,
    iconName: string = 'notifications'
  ) => (
    <View style={[styles.settingRow, disabled && styles.disabledRow]}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Icon name={iconName} size={24} color={disabled ? colors.gray400 : colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, disabled && styles.disabledText]}>
            {title}
          </Text>
          <Text style={[styles.settingDescription, disabled && styles.disabledText]}>
            {description}
          </Text>
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: colors.gray300, true: colors.primary + '40' }}
        thumbColor={value ? colors.primary : colors.gray400}
      />
    </View>
  );

  const renderHistoryItem = ({ item }: { item: NotificationHistory }) => {
    const timeToDisplay = item.sent_at || item.created_at;
    const relativeTime = formatDistanceToNow(timeToDisplay, 'medium');
    const fullDateTime = formatDateTime(timeToDisplay, false);
    
    return (
      <TouchableOpacity 
        style={styles.historyItem}
        onPress={() => {
          Alert.alert(
            'Notification Details',
            `Title: ${item.title}\n\nBody: ${item.body}\n\nSent: ${fullDateTime}\n\nStatus: ${item.status}`,
            [{ text: 'OK' }]
          );
        }}
      >
        <View style={styles.historyLeft}>
          <View style={styles.historyIconContainer}>
            <Icon 
              name="description" 
              size={20} 
              color={colors.primary}
            />
          </View>
          <View style={styles.historyText}>
            <Text style={styles.historyTitle}>{item.title}</Text>
            <Text style={styles.historyBody} numberOfLines={2}>
              {item.body}
            </Text>
            <View style={styles.historyTimeContainer}>
              <Text style={styles.historyTime}>
                {relativeTime}
              </Text>
            </View>
          </View>
        </View>
        <View style={styles.historyStatus}>
          <Icon 
            name={item.status === 'sent' || item.status === 'delivered' ? 'check-circle' : 'error'} 
            size={16} 
            color={item.status === 'sent' || item.status === 'delivered' ? colors.success : colors.error}
          />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading.settings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (errors.settings) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.center}>
          <Icon name="error" size={48} color={colors.error} />
          <Text style={styles.errorText}>Failed to load notification settings</Text>
          <Text style={styles.errorDetail}>{errors.settings}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Main Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATION SETTINGS</Text>
          
          {renderSettingItem(
            'Push Notifications',
            'Receive alerts for new SEC filings',
            settings.notification_enabled,
            () => updateSetting('notification_enabled', !settings.notification_enabled),
            false,
            'notifications'
          )}

          {renderSettingItem(
            'Watchlist Only',
            `Only notify about companies you follow (${watchlistCount} companies)`,
            settings.watchlist_only,
            () => updateSetting('watchlist_only', !settings.watchlist_only),
            !settings.notification_enabled,
            'star'
          )}
        </View>

        {/* Watchlist Status Card */}
        <View style={styles.watchlistCard}>
          <View style={styles.watchlistInfo}>
            <Icon name="bookmark" size={24} color={colors.primary} />
            <View style={styles.watchlistText}>
              <Text style={styles.watchlistTitle}>
                {watchlistLoading ? (
                  <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={colors.primary} />
                    <Text style={[styles.watchlistTitle, { marginLeft: 8 }]}>
                      Loading watchlist...
                    </Text>
                  </View>
                ) : (
                  `Following ${watchlistCount} companies`
                )}
              </Text>
              <Text style={styles.watchlistDescription}>
                {settings.watchlist_only 
                  ? 'Only receiving notifications for these companies'
                  : 'Receiving notifications for all companies'}
              </Text>
            </View>
          </View>
          <TouchableOpacity 
            style={styles.manageButton}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <Text style={styles.manageButtonText}>Manage Watchlist</Text>
            <Icon name="chevron-right" size={18} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Filing Types Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>FILING TYPES</Text>
          
          {renderSettingItem(
            'Annual Reports (10-K)',
            'Yearly comprehensive financial reports',
            settings.filing_10k,
            () => updateSetting('filing_10k', !settings.filing_10k),
            !settings.notification_enabled,
            'description'
          )}
          {renderSettingItem(
            'Quarterly Reports (10-Q)',
            'Quarterly financial updates',
            settings.filing_10q,
            () => updateSetting('filing_10q', !settings.filing_10q),
            !settings.notification_enabled,
            'event-note'
          )}
          {renderSettingItem(
            'Current Reports (8-K)',
            'Major events and announcements',
            settings.filing_8k,
            () => updateSetting('filing_8k', !settings.filing_8k),
            !settings.notification_enabled,
            'warning'
          )}
          {renderSettingItem(
            'IPO Filings (S-1)',
            'Initial public offering registrations',
            settings.filing_s1,
            () => updateSetting('filing_s1', !settings.filing_s1),
            !settings.notification_enabled,
            'launch'
          )}
        </View>

        {/* Notification History Section */}
        <View style={styles.section}>
          <View style={styles.historyHeader}>
            <Text style={styles.sectionTitle}>RECENT NOTIFICATIONS</Text>
            {loading.history && (
              <ActivityIndicator size="small" color={colors.primary} />
            )}
          </View>
          
          {errors.history && (
            <View style={styles.errorBanner}>
              <Icon name="warning" size={16} color={colors.warning} />
              <Text style={styles.errorBannerText}>Failed to load notification history</Text>
            </View>
          )}
          
          {history.length > 0 ? (
            <View style={styles.historyList}>
              {history.slice(0, 10).map((item, index) => (
                <React.Fragment key={item.id || index}>
                  {renderHistoryItem({ item })}
                </React.Fragment>
              ))}
            </View>
          ) : (
            <View style={styles.emptyHistory}>
              <Icon name="notifications-none" size={48} color={colors.gray300} />
              <Text style={styles.emptyHistoryText}>No notifications yet</Text>
              <Text style={styles.emptyHistoryDescription}>
                You'll see your notification history here
              </Text>
            </View>
          )}
        </View>

        {/* Device Settings Button */}
        <TouchableOpacity 
          style={styles.settingsButton}
          onPress={openNotificationSettings}
        >
          <Icon name="settings" size={20} color={colors.primary} />
          <Text style={styles.settingsButtonText}>Open Device Settings</Text>
        </TouchableOpacity>

        <View style={{ height: spacing.xxl }} />

        {/* Loading Overlay */}
        {loading.updating && (
          <View style={styles.savingOverlay}>
            <View style={styles.savingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.savingText}>Saving settings...</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollView: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: typography.fontSize.lg,
    color: colors.error,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorDetail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginHorizontal: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
  },
  retryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
    letterSpacing: 0.5,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.xs,
    borderRadius: borderRadius.md,
  },
  disabledRow: {
    opacity: 0.5,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.md,
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
  },
  settingText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  disabledText: {
    color: colors.gray400,
  },
  watchlistCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '20',
  },
  watchlistInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  watchlistText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  watchlistTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  watchlistDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    paddingVertical: spacing.xs,
  },
  manageButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    marginRight: spacing.xs,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  settingsButtonText: {
    color: colors.primary,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    marginHorizontal: spacing.md,
  },
  historyList: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.gray100,
  },
  historyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyIconContainer: {
    width: 32,
    alignItems: 'center',
  },
  historyText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  historyTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  historyBody: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  historyTimeContainer: {
    marginTop: 4,
  },
  historyTime: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
  },
  historyStatus: {
    marginLeft: spacing.sm,
  },
  emptyHistory: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  emptyHistoryText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: spacing.md,
  },
  emptyHistoryDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.warning + '20',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.md,
  },
  errorBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginLeft: spacing.sm,
  },
  savingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  savingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  savingText: {
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
});