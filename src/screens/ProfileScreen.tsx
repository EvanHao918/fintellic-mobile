import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Avatar } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../store';
import { logout, refreshUserInfo } from '../store/slices/authSlice';
import { fetchCurrentSubscription } from '../store/slices/subscriptionSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { RootStackParamList, isProUser as checkIsProUser, isEarlyBirdUser } from '../types';
import { subscriptionHelpers } from '../api/subscription';
// 🆕 Phase 4: Import notification API and types
import { notificationAPI, notificationHelpers } from '../api/notifications';
import { NotificationSettings, NOTIFICATION_LABELS } from '../types/notification';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType?: string;
  action?: () => void;
  hasToggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (value: boolean) => void;
  hasArrow?: boolean;
  danger?: boolean;
  badge?: string;
}

interface UserStats {
  reportsRead: number;
  watchlistCount: number;
  joinedDays: number;
}

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const user = useSelector((state: RootState) => state.auth.user);
  const { currentSubscription } = useSelector((state: RootState) => state.subscription);
  
  // Derived state
  const isProUser = checkIsProUser(user);
  const isEarlyBird = isEarlyBirdUser(user);
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    reportsRead: 0,
    watchlistCount: 0,
    joinedDays: 0,
  });

  // 🆕 Phase 4: Notification settings state
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings | null>(null);
  const [loadingNotifications, setLoadingNotifications] = useState(false);
  const [notificationExpanded, setNotificationExpanded] = useState(false);

  // Load user stats and preferences
  useEffect(() => {
    loadUserStats();
    loadNotificationSettings(); // 🆕 Load notification settings from backend
    // Load subscription info
    if (user) {
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user]);

  // 🆕 Phase 4: Load notification settings from backend
  const loadNotificationSettings = async () => {
    try {
      setLoadingNotifications(true);
      const settings = await notificationAPI.getSettings();
      setNotificationSettings(settings);
    } catch (error) {
      console.error('Error loading notification settings:', error);
      // If error, fall back to default settings
      setNotificationSettings(null);
    } finally {
      setLoadingNotifications(false);
    }
  };

  // Load user statistics
  const loadUserStats = async () => {
    try {
      // Calculate days since joined
      const joinedDate = new Date(user?.created_at || Date.now());
      const daysSinceJoined = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));
      
      // Get watchlist count from AsyncStorage
      const watchlistData = await AsyncStorage.getItem('@fintellic_watchlist');
      const watchlist = watchlistData ? JSON.parse(watchlistData) : [];
      
      // Get history count
      const historyData = await AsyncStorage.getItem('@fintellic_history');
      const history = historyData ? JSON.parse(historyData) : [];
      
      setUserStats({
        reportsRead: history.length,
        watchlistCount: watchlist.length,
        joinedDays: daysSinceJoined,
      });
    } catch (error) {
      console.error('Error loading user stats:', error);
    }
  };

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    await loadUserStats();
    await loadNotificationSettings(); // 🆕 Refresh notification settings
    await dispatch(refreshUserInfo());
    await dispatch(fetchCurrentSubscription());
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            dispatch(logout() as any);
          },
        },
      ]
    );
  };

  // 🆕 Phase 4: Handle notification toggle with backend API
  const handleNotificationToggle = async (field: keyof NotificationSettings, value: boolean) => {
    if (!notificationSettings) return;

    try {
      // Optimistically update UI
      const updatedSettings = { ...notificationSettings, [field]: value };
      
      // Special handling for master switch
      if (field === 'notification_enabled' && !value) {
        // If turning off all notifications, disable watchlist_only too
        updatedSettings.watchlist_only = false;
      }
      
      setNotificationSettings(updatedSettings);

      // Update backend
      const response = await notificationAPI.updateSettings({ [field]: value });
      setNotificationSettings(response);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      // Revert on error
      await loadNotificationSettings();
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  // 🆕 Phase 4: Enhanced notification settings with expandable UI
  const renderNotificationSection = () => {
    if (!notificationSettings) {
      return (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
          <View style={styles.sectionContent}>
            <View style={styles.settingItem}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          </View>
        </View>
      );
    }

    const getSummaryText = () => {
      if (!notificationSettings.notification_enabled) {
        return 'Notifications disabled';
      }
      const filingTypes = notificationHelpers.getEnabledFilingTypes(notificationSettings);
      const scope = notificationSettings.watchlist_only ? 'Watchlist only' : 'All companies';
      return `${scope} • ${filingTypes.length} filing types`;
    };

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>NOTIFICATIONS</Text>
        <View style={styles.sectionContent}>
          {/* Master Switch with expandable arrow */}
          <TouchableOpacity
            style={styles.settingItem}
            onPress={() => setNotificationExpanded(!notificationExpanded)}
          >
            <View style={styles.settingItemLeft}>
              <Icon
                name="notifications"
                type="material"
                size={24}
                color={colors.textSecondary}
              />
              <View style={styles.settingItemText}>
                <Text style={styles.settingItemTitle}>Push Notifications</Text>
                <Text style={styles.settingItemSubtitle}>
                  {notificationExpanded ? 'Customize your preferences' : getSummaryText()}
                </Text>
              </View>
            </View>
            <View style={styles.settingItemRight}>
              <Switch
                value={notificationSettings.notification_enabled}
                onValueChange={(value) => handleNotificationToggle('notification_enabled', value)}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
                style={{ marginRight: spacing.sm }}
              />
              <Icon
                name={notificationExpanded ? 'keyboard-arrow-up' : 'keyboard-arrow-down'}
                type="material"
                size={24}
                color={colors.gray400}
              />
            </View>
          </TouchableOpacity>

          {/* Expandable Settings */}
          {notificationExpanded && (
            <>
              {/* Notification Scope */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <Text style={styles.subsectionTitle}>NOTIFICATION SCOPE</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.settingItem, styles.indentedItem]}
                onPress={() => handleNotificationToggle('watchlist_only', false)}
              >
                <View style={styles.radioRow}>
                  <View style={styles.radioButton}>
                    {!notificationSettings.watchlist_only && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.settingItemTitle}>All Companies</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Get notified about all company filings
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.settingItem, styles.indentedItem]}
                onPress={() => handleNotificationToggle('watchlist_only', true)}
              >
                <View style={styles.radioRow}>
                  <View style={styles.radioButton}>
                    {notificationSettings.watchlist_only && (
                      <View style={styles.radioButtonSelected} />
                    )}
                  </View>
                  <View style={styles.radioTextContainer}>
                    <Text style={styles.settingItemTitle}>Watchlist Only</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Only get notified about companies you follow
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              {/* Filing Types */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <Text style={styles.subsectionTitle}>FILING TYPES</Text>
              </View>

              {/* 10-K */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="description"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Annual Reports (10-K)</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Comprehensive yearly financial reports
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.filing_10k}
                  onValueChange={(value) => handleNotificationToggle('filing_10k', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* 10-Q */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="event-note"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Quarterly Reports (10-Q)</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Quarterly financial updates
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.filing_10q}
                  onValueChange={(value) => handleNotificationToggle('filing_10q', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* 8-K */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="warning"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Current Reports (8-K)</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Major events and announcements
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.filing_8k}
                  onValueChange={(value) => handleNotificationToggle('filing_8k', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* S-1 */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="trending-up"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>IPO Filings (S-1)</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Initial public offering registrations
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.filing_s1}
                  onValueChange={(value) => handleNotificationToggle('filing_s1', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* Other Notifications */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <Text style={styles.subsectionTitle}>OTHER NOTIFICATIONS</Text>
              </View>

              {/* Daily Reset Reminder */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="refresh"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Daily Reset Reminder</Text>
                    <Text style={styles.settingItemSubtitle}>
                      {isProUser ? 'Daily summary of market activity' : 'Reminder when your daily limit resets'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.daily_reset_reminder}
                  onValueChange={(value) => handleNotificationToggle('daily_reset_reminder', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* Subscription Alerts */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="credit-card"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Subscription Updates</Text>
                    <Text style={styles.settingItemSubtitle}>
                      Payment and subscription notifications
                    </Text>
                  </View>
                </View>
                <Switch
                  value={notificationSettings.subscription_alerts}
                  onValueChange={(value) => handleNotificationToggle('subscription_alerts', value)}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>

              {/* Quiet Hours */}
              <View style={[styles.settingItem, styles.indentedItem]}>
                <Text style={styles.subsectionTitle}>QUIET HOURS</Text>
              </View>
              
              <View style={[styles.settingItem, styles.indentedItem]}>
                <View style={styles.settingItemLeft}>
                  <Icon
                    name="bedtime"
                    type="material"
                    size={20}
                    color={colors.textSecondary}
                  />
                  <View style={styles.settingItemText}>
                    <Text style={styles.settingItemTitle}>Do Not Disturb</Text>
                    <Text style={styles.settingItemSubtitle}>
                      {notificationSettings.quiet_hours_start && notificationSettings.quiet_hours_end
                        ? `${notificationSettings.quiet_hours_start} - ${notificationSettings.quiet_hours_end}`
                        : 'Not set'}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={!!notificationSettings.quiet_hours_start}
                  onValueChange={async (value) => {
                    if (value) {
                      // Enable quiet hours with default times
                      await notificationAPI.updateSettings({
                        quiet_hours_start: '22:00',
                        quiet_hours_end: '08:00'
                      });
                      await loadNotificationSettings();
                    } else {
                      // Disable quiet hours
                      await notificationAPI.updateSettings({
                        quiet_hours_start: null,
                        quiet_hours_end: null
                      });
                      await loadNotificationSettings();
                    }
                  }}
                  trackColor={{ false: colors.gray300, true: colors.primary }}
                  thumbColor={colors.white}
                  disabled={!notificationSettings.notification_enabled}
                />
              </View>
            </>
          )}
        </View>
      </View>
    );
  };

  // 🔥 修正：获取订阅信息文本 - 移除倒计时，显示永久价格锁定
  const getSubscriptionSubtitle = () => {
    if (!isProUser) {
      return 'Unlock unlimited access';
    }
    
    if (currentSubscription) {
      const planType = currentSubscription.subscription_type === 'MONTHLY' ? 'Monthly' : 'Annual';
      const price = currentSubscription.current_price || currentSubscription.monthly_price;
      
      // 🔥 修正：Early Bird用户显示永久价格锁定，不显示倒计时
      if (isEarlyBird) {
        return `${planType} • $${price} • Permanent Price Lock`;
      }
      
      // 🔥 修正：普通用户显示计划类型和价格，不显示天数倒计时
      return `${planType} • $${price}`;
    }
    
    return 'Manage your Pro subscription';
  };

  // 🆕 Phase 4: Get notification summary for display
  const getNotificationSummary = () => {
    if (!notificationSettings) return 'Loading...';
    if (!notificationSettings.notification_enabled) return 'Notifications disabled';
    
    const enabledTypes = notificationHelpers.getEnabledFilingTypes(notificationSettings);
    const scope = notificationSettings.watchlist_only ? 'Watchlist only' : 'All companies';
    
    if (enabledTypes.length === 0) {
      return `${scope} • No filing types selected`;
    }
    
    return `${scope} • ${enabledTypes.length} filing types`;
  };

  // Settings sections
  const accountSettings: SettingItem[] = [
    {
      id: 'upgrade',
      title: isProUser ? 'Manage Subscription' : 'Upgrade to Pro',
      subtitle: getSubscriptionSubtitle(),
      icon: 'star',
      iconType: 'material',
      action: () => navigation.navigate('Subscription'),
      hasArrow: true,
      badge: isEarlyBird ? 'Early Bird' : undefined,
    },
    {
      id: 'password',
      title: 'Change Password',
      subtitle: 'Update your password',
      icon: 'lock',
      iconType: 'material',
      // 🆕 Task 6: Navigate to ChangePassword screen
      action: () => navigation.navigate('ChangePassword'),
      hasArrow: true,
    },
  ];

  // 🆕 Phase 4: Enhanced notification settings with backend integration
  const notificationSettings_items: SettingItem[] = [
    {
      id: 'all_notifications',
      title: 'Push Notifications',
      subtitle: loadingNotifications ? 'Loading...' : getNotificationSummary(),
      icon: 'notifications',
      iconType: 'material',
      hasToggle: true,
      toggleValue: notificationSettings?.notification_enabled ?? false,
      onToggle: (value) => handleNotificationToggle('notification_enabled', value),
      hasArrow: true,
    },
    {
      id: 'watchlist_only',
      title: 'Watchlist Only',
      subtitle: 'Only get notified about companies in your watchlist',
      icon: 'bookmark',
      iconType: 'material',
      hasToggle: true,
      toggleValue: notificationSettings?.watchlist_only ?? false,
      onToggle: (value) => handleNotificationToggle('watchlist_only', value),
    },
    // 🆕 Quick toggles for filing types
    {
      id: 'filing_10k',
      title: NOTIFICATION_LABELS.filing_10k,
      subtitle: 'Annual reports',
      icon: 'description',
      iconType: 'material',
      hasToggle: true,
      toggleValue: notificationSettings?.filing_10k ?? true,
      onToggle: (value) => handleNotificationToggle('filing_10k', value),
    },
    {
      id: 'filing_8k',
      title: NOTIFICATION_LABELS.filing_8k,
      subtitle: 'Significant events',
      icon: 'warning',
      iconType: 'material',
      hasToggle: true,
      toggleValue: notificationSettings?.filing_8k ?? true,
      onToggle: (value) => handleNotificationToggle('filing_8k', value),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'security',
      iconType: 'material',
      // 🆕 Task 6: Navigate to PrivacyPolicy screen
      action: () => navigation.navigate('PrivacyPolicy'),
      hasArrow: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'description',
      iconType: 'material',
      // 🆕 Task 6: Navigate to TermsOfService screen
      action: () => navigation.navigate('TermsOfService'),
      hasArrow: true,
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help',
      iconType: 'material',
      action: () => Alert.alert('Support', 'Contact support@fintellic.com'),
      hasArrow: true,
    },
    {
      id: 'about',
      title: 'About HermeSpeed',
      subtitle: `Version 1.0.0`,
      icon: 'info',
      iconType: 'material',
      action: () => Alert.alert('HermeSpeed', 'AI-powered financial intelligence platform.'),
      hasArrow: true,
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'logout',
      title: 'Logout',
      icon: 'logout',
      iconType: 'material',
      action: handleLogout,
      danger: true,
      hasArrow: true,
    },
  ];

  // Render setting item with loading state
  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.action}
      disabled={item.hasToggle && !item.action}
    >
      <View style={styles.settingItemLeft}>
        <Icon
          name={item.icon}
          type={item.iconType || 'material'}
          size={24}
          color={item.danger ? colors.error : colors.textSecondary}
        />
        <View style={styles.settingItemText}>
          <View style={styles.settingItemTitleRow}>
            <Text style={[styles.settingItemTitle, item.danger && styles.dangerText]}>
              {item.title}
            </Text>
            {item.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.badge}</Text>
              </View>
            )}
          </View>
          {item.subtitle && (
            <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.hasToggle ? (
        <View style={styles.toggleContainer}>
          {loadingNotifications && item.id.includes('notification') ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Switch
              value={item.toggleValue}
              onValueChange={item.onToggle}
              trackColor={{ false: colors.gray300, true: colors.primary }}
              thumbColor={colors.white}
              disabled={
                (!notificationSettings?.notification_enabled && 
                 item.id !== 'all_notifications') ||
                loadingNotifications
              }
            />
          )}
        </View>
      ) : item.hasArrow ? (
        <Icon
          name="chevron-right"
          type="material"
          size={24}
          color={colors.gray400}
        />
      ) : null}
    </TouchableOpacity>
  );

  // Render section
  const renderSection = (title: string, items: SettingItem[]) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionContent}>
        {items.map(renderSettingItem)}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <Avatar
            size={80}
            rounded
            title={user?.full_name?.charAt(0).toUpperCase() || 'U'}
            containerStyle={styles.avatar}
            titleStyle={styles.avatarText}
          />
          <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          <View style={styles.membershipBadge}>
            {isProUser ? (
              <>
                <Icon name="star" type="material" size={16} color={colors.warning} />
                <Text style={styles.membershipText}>Pro Member</Text>
                {isEarlyBird && (
                  <Text style={styles.earlyBirdIndicator}>• Early Bird</Text>
                )}
              </>
            ) : (
              <Text style={styles.membershipText}>Free Member</Text>
            )}
          </View>
          
          {/* 🔥 修正：显示早鸟用户编号和永久价格锁定状态 */}
          {isEarlyBird && user?.user_sequence_number && user.user_sequence_number <= 10000 && (
            <View style={styles.earlyBirdStatus}>
              <Text style={styles.earlyBirdNumber}>
                Early Bird Member #{user.user_sequence_number}
              </Text>
              <Text style={styles.permanentPriceLock}>
                Monthly $39 • Permanent Price Lock ✓
              </Text>
            </View>
          )}
        </View>

        {/* User Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.reportsRead}</Text>
            <Text style={styles.statLabel}>Reports Read</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.watchlistCount}</Text>
            <Text style={styles.statLabel}>Watchlist</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{userStats.joinedDays}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
        </View>

        {/* Settings Sections */}
        {renderSection('Account', accountSettings)}
        {renderNotificationSection()}
        {renderSection('App', appSettings)}
        {renderSection('', dangerSettings)}

        {/* Bottom padding */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    backgroundColor: colors.primary,
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  membershipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  earlyBirdIndicator: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.warning,
  },
  // 🔥 新增：早鸟状态显示样式
  earlyBirdStatus: {
    alignItems: 'center',
    marginTop: spacing.md,
    backgroundColor: colors.warning + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  earlyBirdNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing.xs,
  },
  permanentPriceLock: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.semibold,
  },
  userSequence: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    paddingVertical: spacing.lg,
    marginTop: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: colors.border,
    marginVertical: spacing.sm,
  },
  section: {
    marginTop: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  sectionContent: {
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingItemText: {
    marginLeft: spacing.md,
    flex: 1,
  },
  settingItemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  settingItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.xs,
  },
  badgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },
  dangerText: {
    color: colors.error,
  },
  toggleContainer: {
    minWidth: 51, // Switch width
    alignItems: 'center',
  },
  // 🆕 Phase 4: New styles for expandable notification settings
  settingItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  indentedItem: {
    paddingLeft: spacing.xl + spacing.md,
    backgroundColor: colors.gray50,
  },
  subsectionTitle: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    marginRight: spacing.md,
    marginTop: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioButtonSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  radioTextContainer: {
    flex: 1,
  },
});