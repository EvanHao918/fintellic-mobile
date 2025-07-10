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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Avatar } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient from '../api/client';
import { RootStackParamList } from '../types';

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
  const isProUser = user?.is_pro || user?.tier === 'pro';
  
  // State
  const [allNotifications, setAllNotifications] = useState(true);
  const [watchlistOnly, setWatchlistOnly] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    reportsRead: 0,
    watchlistCount: 0,
    joinedDays: 0,
  });

  // Load user stats and preferences
  useEffect(() => {
    loadUserPreferences();
    loadUserStats();
  }, []);

  // Load notification preferences
  const loadUserPreferences = async () => {
    try {
      const allNotif = await AsyncStorage.getItem('@fintellic_notifications_all');
      const watchlistNotif = await AsyncStorage.getItem('@fintellic_notifications_watchlist');
      
      if (allNotif !== null) setAllNotifications(allNotif === 'true');
      if (watchlistNotif !== null) setWatchlistOnly(watchlistNotif === 'true');
    } catch (error) {
      console.error('Error loading preferences:', error);
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
  const onRefresh = () => {
    setRefreshing(true);
    loadUserStats();
    setTimeout(() => setRefreshing(false), 1000);
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

  // Handle notification toggle
  const handleNotificationToggle = async (type: 'all' | 'watchlist', value: boolean) => {
    try {
      if (type === 'all') {
        setAllNotifications(value);
        await AsyncStorage.setItem('@fintellic_notifications_all', value.toString());
        if (!value) {
          setWatchlistOnly(false);
          await AsyncStorage.setItem('@fintellic_notifications_watchlist', 'false');
        }
      } else {
        setWatchlistOnly(value);
        await AsyncStorage.setItem('@fintellic_notifications_watchlist', value.toString());
      }
    } catch (error) {
      console.error('Error saving notification preference:', error);
    }
  };

  // Settings sections
  const accountSettings: SettingItem[] = [
    {
      id: 'upgrade',
      title: isProUser ? 'Manage Subscription' : 'Upgrade to Pro',
      subtitle: isProUser ? 'Manage your Pro subscription' : 'Unlock unlimited access',
      icon: 'star',
      iconType: 'material',
      action: () => navigation.navigate('Subscription'),
      hasArrow: true,
    },
    {
      id: 'password',
      title: 'Change Password',
      subtitle: 'Update your password',
      icon: 'lock',
      iconType: 'material',
      action: () => Alert.alert('Coming Soon', 'Password change feature will be available soon.'),
      hasArrow: true,
    },
  ];

  const notificationSettings: SettingItem[] = [
    {
      id: 'all_notifications',
      title: 'All Push Notifications',
      subtitle: 'Get notified about all new filings',
      icon: 'notifications',
      iconType: 'material',
      hasToggle: true,
      toggleValue: allNotifications,
      onToggle: (value) => handleNotificationToggle('all', value),
    },
    {
      id: 'watchlist_only',
      title: 'Watchlist Only',
      subtitle: 'Only get notified about companies in your watchlist',
      icon: 'bookmark',
      iconType: 'material',
      hasToggle: true,
      toggleValue: watchlistOnly,
      onToggle: (value) => handleNotificationToggle('watchlist', value),
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'security',
      iconType: 'material',
      action: () => Alert.alert('Privacy Policy', 'Privacy policy will open in browser.'),
      hasArrow: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'description',
      iconType: 'material',
      action: () => Alert.alert('Terms', 'Terms of service will open in browser.'),
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
      title: 'About Fintellic',
      subtitle: `Version 1.0.0`,
      icon: 'info',
      iconType: 'material',
      action: () => Alert.alert('Fintellic', 'AI-powered financial intelligence platform.'),
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

  // Render setting item
  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.action}
      disabled={item.hasToggle}
    >
      <View style={styles.settingItemLeft}>
        <Icon
          name={item.icon}
          type={item.iconType || 'material'}
          size={24}
          color={item.danger ? colors.error : colors.textSecondary}
        />
        <View style={styles.settingItemText}>
          <Text style={[styles.settingItemTitle, item.danger && styles.dangerText]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingItemSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      {item.hasToggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={colors.white}
          disabled={!allNotifications && item.id === 'watchlist_only'}
        />
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
              </>
            ) : (
              <Text style={styles.membershipText}>Free Member</Text>
            )}
          </View>
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
        {renderSection('Notifications', notificationSettings)}
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
  settingItemTitle: {
    fontSize: typography.fontSize.base,
    color: colors.text,
  },
  settingItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerText: {
    color: colors.error,
  },
});