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
      
      // Get read history count
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
    setRefreshing(false);
  };

  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logout()).unwrap();
          }
        }
      ]
    );
  };

  // Handle upgrade to Pro
  const handleUpgradeToPro = () => {
    navigation.navigate('Subscription');
  };

  // Handle notification toggle
  const handleNotificationToggle = async (type: 'all' | 'watchlist', value: boolean) => {
    if (type === 'all') {
      setAllNotifications(value);
      if (!value) {
        setWatchlistOnly(false);
      }
      await AsyncStorage.setItem('@fintellic_notifications_all', value.toString());
    } else {
      setWatchlistOnly(value);
      if (value) {
        setAllNotifications(false);
      }
      await AsyncStorage.setItem('@fintellic_notifications_watchlist', value.toString());
    }
  };

  // Profile sections
  const profileSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Subscription',
      items: [
        {
          id: 'subscription',
          title: isProUser ? 'Fintellic Pro' : 'Free Plan',
          subtitle: isProUser 
            ? user?.subscription_expires_at 
              ? `Expires ${new Date(user.subscription_expires_at).toLocaleDateString()}`
              : 'Active subscription'
            : `${3 - (user?.daily_reports_count || 0)} daily reports remaining`,
          icon: isProUser ? 'star' : 'star-outline',
          action: () => navigation.navigate('Subscription'),
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Notifications',
      items: [
        {
          id: 'all_notifications',
          title: 'All Notifications',
          subtitle: 'Get notified about all new filings',
          icon: 'notifications',
          hasToggle: true,
          toggleValue: allNotifications,
          onToggle: (value) => handleNotificationToggle('all', value),
        },
        {
          id: 'watchlist_notifications',
          title: 'Watchlist Only',
          subtitle: 'Only companies you follow',
          icon: 'star',
          hasToggle: true,
          toggleValue: watchlistOnly,
          onToggle: (value) => handleNotificationToggle('watchlist', value),
        },
      ],
    },
    {
      title: 'Account',
      items: [
        {
          id: 'change_password',
          title: 'Change Password',
          icon: 'lock',
          action: () => Alert.alert('Coming Soon', 'Password change feature will be available soon'),
          hasArrow: true,
        },
        {
          id: 'export_data',
          title: 'Export My Data',
          icon: 'download',
          iconType: 'material-community',
          action: () => Alert.alert('Export Data', 'Export your reading history and preferences'),
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          id: 'help',
          title: 'Help Center',
          icon: 'help-circle',
          iconType: 'material-community',
          action: () => Alert.alert('Help', 'Visit help.fintellic.com'),
          hasArrow: true,
        },
        {
          id: 'feedback',
          title: 'Send Feedback',
          icon: 'message-square',
          iconType: 'feather',
          action: () => Alert.alert('Feedback', 'We\'d love to hear from you!'),
          hasArrow: true,
        },
        {
          id: 'rate',
          title: 'Rate Fintellic',
          icon: 'star',
          action: () => Alert.alert('Rate Us', 'Please rate us on the App Store'),
          hasArrow: true,
        },
      ],
    },
    {
      title: 'Legal',
      items: [
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'file-document',
          iconType: 'material-community',
          action: () => Alert.alert('Terms', 'View Terms of Service'),
          hasArrow: true,
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'shield-check',
          iconType: 'material-community',
          action: () => Alert.alert('Privacy', 'View Privacy Policy'),
          hasArrow: true,
        },
      ],
    },
  ];

  // Render setting item
  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.action}
      disabled={!item.action && !item.hasToggle}
    >
      <View style={styles.settingItemLeft}>
        <View style={[styles.iconContainer, { backgroundColor: colors.gray100 }]}>
          <Icon
            name={item.icon}
            type={item.iconType || 'material'}
            size={20}
            color={item.danger ? colors.error : colors.primary}
          />
        </View>
        <View style={styles.settingTextContainer}>
          <Text style={[styles.settingTitle, item.danger && styles.dangerText]}>
            {item.title}
          </Text>
          {item.subtitle && (
            <Text style={styles.settingSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      
      {item.hasToggle && item.onToggle ? (
        <Switch
          value={item.toggleValue}
          onValueChange={item.onToggle}
          trackColor={{ false: colors.gray300, true: colors.primary }}
          thumbColor={colors.white}
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

  // Get user initials for avatar
  const getUserInitials = () => {
    const name = user?.username || user?.full_name || user?.email;
    if (name) {
      return name.substring(0, 2).toUpperCase();
    }
    return 'U';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* User Header */}
        <View style={styles.userHeader}>
          <Avatar
            size="large"
            rounded
            title={getUserInitials()}
            containerStyle={styles.avatar}
            titleStyle={styles.avatarText}
          />
          <Text style={styles.userName}>{user?.username || user?.full_name || 'User'}</Text>
          <Text style={styles.userEmail}>{user?.email}</Text>
          
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
        </View>

        {/* Pro Badge or Upgrade Banner */}
        {isProUser ? (
          <View style={styles.proBadge}>
            <Icon name="star" type="material" size={20} color={colors.warning} />
            <Text style={styles.proBadgeText}>Pro Member</Text>
          </View>
        ) : (
          <TouchableOpacity style={styles.upgradeBanner} onPress={handleUpgradeToPro}>
            <View style={styles.upgradeBannerContent}>
              <Icon name="rocket" type="material-community" size={24} color={colors.primary} />
              <View style={styles.upgradeBannerText}>
                <Text style={styles.upgradeBannerTitle}>Upgrade to Pro</Text>
                <Text style={styles.upgradeBannerSubtitle}>Unlock unlimited access</Text>
              </View>
            </View>
            <Icon name="chevron-right" type="material" size={24} color={colors.primary} />
          </TouchableOpacity>
        )}

        {/* Settings Sections */}
        {profileSections.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
            <View style={styles.sectionContent}>
              {section.items.map(renderSettingItem)}
            </View>
          </View>
        ))}

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Fintellic v1.0.0</Text>
          <Text style={styles.versionSubtext}>Made with ❤️ for retail investors</Text>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="logout" type="material" size={20} color={colors.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  userHeader: {
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
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing.md,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  statValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: colors.border,
  },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    marginBottom: spacing.md,
  },
  proBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  upgradeBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.primaryLight + '20',
    marginHorizontal: spacing.md,
    marginVertical: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  upgradeBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  upgradeBannerText: {
    marginLeft: spacing.md,
  },
  upgradeBannerTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  upgradeBannerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
    marginHorizontal: spacing.lg,
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
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingItemLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text,
  },
  settingSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  dangerText: {
    color: colors.error,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  versionText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  versionSubtext: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});