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

// Define navigation type
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
  
  // Redux state selectors
  const settings = useSelector(selectNotificationSettings);
  const history = useSelector(selectNotificationHistory);
  const loading = useSelector(selectNotificationLoading);
  const errors = useSelector(selectNotificationErrors);
  const pushTokenInfo = useSelector(selectPushTokenInfo);
  const notificationSummary = useSelector(selectNotificationSummary);
  
  // Local state for UI interactions
  const [watchlistCount, setWatchlistCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  // Load initial data
  useEffect(() => {
    loadData();
  }, []);

  // Clear errors when component unmounts
  useEffect(() => {
    return () => {
      dispatch(clearErrors());
    };
  }, [dispatch]);

  const loadData = async () => {
    try {
      // Dispatch Redux actions to load data
      await Promise.all([
        dispatch(fetchNotificationSettings()),
        dispatch(fetchNotificationHistory({ limit: 50, offset: 0 }))
      ]);
      
      // Load watchlist count separately (not in Redux yet)
      try {
        const response = await fetch('/api/v1/watchlist/count');
        const data = await response.json();
        setWatchlistCount(data.count || 0);
      } catch (error) {
        console.error('Error loading watchlist count:', error);
        setWatchlistCount(0);
      }
    } catch (error) {
      console.error('Error loading notification data:', error);
      Alert.alert('Error', 'Failed to load notification settings');
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean) => {
    try {
      await dispatch(updateNotificationSettings({ [key]: value }));
    } catch (error) {
      console.error('Error updating settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleSendTestNotification = async () => {
    try {
      await dispatch(sendTestNotification({
        title: 'HermeSpeed Test',
        body: `This is a test notification sent at ${new Date().toLocaleTimeString()}`
      }));
      
      Alert.alert('Success', 'Test notification sent successfully');
      
      // Refresh history to show the test notification
      await dispatch(fetchNotificationHistory({ limit: 50, offset: 0 }));
    } catch (error) {
      console.error('Error sending test notification:', error);
      Alert.alert('Error', 'Failed to send test notification. Please check your notification permissions.');
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
    const timeToDisplay = item.sent_at;
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

  // Show loading state
  if (loading.settings) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading notification settings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show error state
  if (errors.settings) {
    return (
      <SafeAreaView style={styles.container}>
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
    <SafeAreaView style={styles.container}>
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
        {/* Push Token Status Indicator */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Icon 
              name={pushTokenInfo.hasPermission && pushTokenInfo.token ? 'check-circle' : 'warning'} 
              size={20} 
              color={pushTokenInfo.hasPermission && pushTokenInfo.token ? colors.success : colors.warning} 
            />
            <Text style={styles.statusTitle}>
              {pushTokenInfo.hasPermission && pushTokenInfo.token ? 'Notifications Active' : 'Setup Required'}
            </Text>
          </View>
          <Text style={styles.statusDescription}>
            {notificationSummary}
          </Text>
          {pushTokenInfo.token && (
            <Text style={styles.tokenInfo}>
              Token: ...{pushTokenInfo.token.slice(-8)} 
              {pushTokenInfo.synced ? ' (Synced)' : ' (Pending sync)'}
            </Text>
          )}
        </View>

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
                Following {watchlistCount} companies
              </Text>
              <Text style={styles.watchlistDescription}>
                {settings.watchlist_only 
                  ? 'You\'ll only receive notifications from these companies'
                  : 'You\'ll receive notifications from all S&P 500 and NASDAQ companies'
                }
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.manageButton}
            onPress={() => navigation.navigate('Watchlist')}
          >
            <Text style={styles.manageButtonText}>Manage</Text>
            <Icon name="chevron-right" size={16} color={colors.primary} />
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

        {/* Additional Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>OTHER NOTIFICATIONS</Text>
          
          {renderSettingItem(
            'Daily Reset Reminder',
            'Remind when your daily view limit resets (Free users)',
            settings.daily_reset_reminder,
            () => updateSetting('daily_reset_reminder', !settings.daily_reset_reminder),
            !settings.notification_enabled,
            'refresh'
          )}

          {renderSettingItem(
            'Subscription Alerts',
            'Important updates about your subscription',
            settings.subscription_alerts,
            () => updateSetting('subscription_alerts', !settings.subscription_alerts),
            !settings.notification_enabled,
            'card-membership'
          )}

          {renderSettingItem(
            'Market Summary',
            'Weekly summary of market activity',
            settings.market_summary,
            () => updateSetting('market_summary', !settings.market_summary),
            !settings.notification_enabled,
            'trending-up'
          )}
        </View>

        {/* Test and Status Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>TEST & STATUS</Text>
          
          <TouchableOpacity 
            style={[styles.testButton, loading.sendingTest && styles.testButtonDisabled]}
            onPress={handleSendTestNotification}
            disabled={loading.sendingTest || !settings.notification_enabled}
          >
            {loading.sendingTest ? (
              <ActivityIndicator size="small" color={colors.white} />
            ) : (
              <Icon name="send" size={20} color={colors.white} />
            )}
            <Text style={styles.testButtonText}>
              {loading.sendingTest ? 'Sending...' : 'Send Test Notification'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.settingsButton} onPress={openNotificationSettings}>
            <Icon name="settings" size={20} color={colors.primary} />
            <Text style={styles.settingsButtonText}>Device Notification Settings</Text>
          </TouchableOpacity>
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
          
          {history.length === 0 ? (
            <View style={styles.emptyHistory}>
              <Icon name="notifications-none" size={48} color={colors.gray400} />
              <Text style={styles.emptyHistoryText}>No notifications yet</Text>
              <Text style={styles.emptyHistoryDescription}>
                You'll see your notification history here
              </Text>
            </View>
          ) : (
            <FlatList
              data={history.slice(0, 10)} // Show last 10 notifications
              renderItem={renderHistoryItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              style={styles.historyList}
            />
          )}
        </View>

        {/* Debug Information (only in development) */}
        {__DEV__ && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>DEBUG INFO</Text>
            <Text style={styles.debugText}>
              Permission: {pushTokenInfo.hasPermission ? 'Granted' : 'Denied'}
            </Text>
            <Text style={styles.debugText}>
              Token: {pushTokenInfo.token ? 'Available' : 'Missing'}
            </Text>
            <Text style={styles.debugText}>
              Synced: {pushTokenInfo.synced ? 'Yes' : 'No'}
            </Text>
            <Text style={styles.debugText}>
              Platform: {Platform.OS}
            </Text>
          </View>
        )}

        {/* Loading overlay for updates */}
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

  // Status Card
  statusCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statusTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
  },
  statusDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  tokenInfo: {
    fontSize: typography.fontSize.xs,
    color: colors.gray400,
    fontFamily: 'monospace',
  },

  // Sections
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

  // Setting Rows
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

  // Watchlist Card
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

  // Test Button
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  testButtonDisabled: {
    opacity: 0.6,
  },
  testButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.sm,
  },

  // Settings Button
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

  // History
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

  // Empty History
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

  // Error Banner
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

  // Debug Section
  debugSection: {
    backgroundColor: colors.gray100,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  debugTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  debugText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontFamily: 'monospace',
    marginBottom: 2,
  },

  // Saving Overlay
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