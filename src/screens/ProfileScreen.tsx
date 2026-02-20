import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon, Avatar } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootState, AppDispatch } from '../store';
import { logout, refreshUserInfo } from '../store/slices/authSlice';
import { fetchCurrentSubscription } from '../store/slices/subscriptionSlice';
import { colors, typography, spacing, borderRadius } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList, isProUser as checkIsProUser } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Main'>;

interface SettingItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: string;
  iconType?: string;
  action?: () => void;
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
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [userStats, setUserStats] = useState<UserStats>({
    reportsRead: 0,
    watchlistCount: 0,
    joinedDays: 0,
  });

  // Load user stats and preferences
  useEffect(() => {
    loadUserStats();
    // Load subscription info
    if (user) {
      dispatch(fetchCurrentSubscription());
    }
  }, [dispatch, user]);

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

  // Get subscription subtitle text
  const getSubscriptionSubtitle = () => {
    if (!isProUser) {
      return 'Unlock unlimited access';
    }
    
    if (currentSubscription) {
      const planType = currentSubscription.subscription_type === 'MONTHLY' ? 'Monthly' : 'Annual';
      const price = currentSubscription.current_price;
      
      if (price) {
        return `${planType} • ${price}`;
      }
    }
    
    return 'Manage your Pro subscription';
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
    },
  ];

  const appSettings: SettingItem[] = [
    {
      id: 'privacy',
      title: 'Privacy Policy',
      icon: 'shield',
      iconType: 'feather',
      action: () => navigation.navigate('PrivacyPolicy'),
      hasArrow: true,
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      icon: 'file-text',
      iconType: 'feather',
      action: () => navigation.navigate('TermsOfService'),
      hasArrow: true,
    },
    {
      id: 'support',
      title: 'Support',
      icon: 'help-circle',
      iconType: 'feather',
      action: () => Alert.alert('Support', 'Contact support@allsight.app'),
      hasArrow: true,
    },
    {
      id: 'about',
      title: 'About HermesSpeed',
      subtitle: `Version 1.0.0`,
      icon: 'info',
      iconType: 'feather',
      action: () => Alert.alert('HermesSpeed', 'AI-powered financial intelligence platform.'),
      hasArrow: true,
    },
  ];

  const dangerSettings: SettingItem[] = [
    {
      id: 'logout',
      title: 'Log out',
      icon: 'log-out',
      iconType: 'feather',
      action: handleLogout,
      danger: false,
      hasArrow: false,
    },
  ];

  // Render setting item
  const renderSettingItem = (item: SettingItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.settingItem}
      onPress={item.action}
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
      {item.hasArrow && (
        <Icon
          name="chevron-right"
          type="material"
          size={24}
          color={colors.gray400}
        />
      )}
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
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={styles.profileHeaderContent}>
            <View style={styles.profileHeaderLeft}>
              <Text style={styles.userName}>{user?.full_name || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email}</Text>
              <View style={styles.membershipBadge}>
                {isProUser ? (
                  <>
                    <Icon name="star" type="material" size={14} color={colors.warning} />
                    <Text style={styles.membershipText}>Pro Member</Text>
                  </>
                ) : (
                  <Text style={styles.membershipText}>Free Member</Text>
                )}
              </View>
            </View>
            <Avatar
              size={64}
              rounded
              title={user?.full_name?.charAt(0).toUpperCase() || 'U'}
              containerStyle={styles.avatar}
              titleStyle={styles.avatarText}
            />
          </View>
        </View>

        {/* Upgrade to Pro Card */}
        <TouchableOpacity 
          style={styles.upgradeCard}
          onPress={() => navigation.navigate('Subscription')}
        >
          <View style={styles.upgradeLeft}>
            <Image source={require('../assets/images/rocket_icon.png')} style={styles.rocketIcon} />
            <View style={styles.upgradeText}>
              <Text style={styles.upgradeTitle}>
                {isProUser ? 'Manage Subscription' : 'Upgrade to Pro'}
              </Text>
              <Text style={styles.upgradeSubtitle}>{getSubscriptionSubtitle()}</Text>
            </View>
          </View>
          <Icon name="chevron-right" type="material" size={24} color="#9CA3AF" />
        </TouchableOpacity>

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

        {/* Settings List */}
        <View style={styles.settingsList}>
          {appSettings.map(renderSettingItem)}
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <Icon name="log-out" type="feather" size={20} color="#111827" />
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>

        {/* Bottom padding */}
        <View style={{ height: spacing.xxxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  profileHeader: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  profileHeaderContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileHeaderLeft: {
    flex: 1,
  },
  avatar: {
    backgroundColor: '#FF5700',
  },
  avatarText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  userName: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
    marginBottom: spacing.sm,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  membershipText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: '#374151',
    marginLeft: spacing.xs,
  },
  upgradeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFF7ED',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#F97316',
  },
  upgradeLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  rocketIcon: {
    width: 20,
    height: 20,
  },
  upgradeText: {
    marginLeft: spacing.sm,
  },
  upgradeTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: '#F97316',
  },
  upgradeSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#9CA3AF',
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: 'row',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    marginTop: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: '#111827',
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: spacing.sm,
  },
  settingsList: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
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
    fontWeight: typography.fontWeight.medium,
    color: '#111827',
  },
  settingItemSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#6B7280',
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
  },
  logoutText: {
    fontSize: typography.fontSize.base,
    color: '#111827',
    marginLeft: spacing.md,
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
});