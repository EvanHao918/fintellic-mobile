import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { RootState, AppDispatch } from '../store';
import { logout } from '../store/slices/authSlice';
import { colors, typography, spacing, borderRadius } from '../theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function ProfileScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);
  const isProUser = user?.is_pro || false;
  
  // Notification settings (simplified - only push notifications)
  const [allNotifications, setAllNotifications] = useState(true);
  const [watchlistOnly, setWatchlistOnly] = useState(false);

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
          onPress: async () => {
            await dispatch(logout() as any).unwrap();
          }
        }
      ]
    );
  };

  // Handle upgrade to Pro
  const handleUpgradeToPro = () => {
    Alert.alert(
      'Upgrade to Fintellic Pro',
      'Get unlimited watchlist, advanced analytics, and priority notifications for $39.9/month',
      [
        { text: 'Not Now', style: 'cancel' },
        { text: 'Upgrade', onPress: () => {/* Navigate to payment */} }
      ]
    );
  };

  // Handle notification toggle
  const handleNotificationToggle = async (type: 'all' | 'watchlist', value: boolean) => {
    if (type === 'all') {
      setAllNotifications(value);
      if (!value) {
        setWatchlistOnly(false);
      }
      // Save preference
      await AsyncStorage.setItem('@fintellic_notifications_all', value.toString());
    } else {
      setWatchlistOnly(value);
      if (value) {
        setAllNotifications(false);
      }
      // Save preference
      await AsyncStorage.setItem('@fintellic_notifications_watchlist', value.toString());
    }
  };

  // Profile sections
  const profileSections: { title: string; items: SettingItem[] }[] = [
    {
      title: 'Account',
      items: [
        {
          id: 'user_info',
          title: user?.full_name || 'User',
          subtitle: user?.email,
          icon: 'person',
          hasArrow: false,
        },
        {
          id: 'subscription',
          title: isProUser ? 'Fintellic Pro' : 'Free Plan',
          subtitle: isProUser ? 'Active subscription' : 'Upgrade for more features',
          icon: 'star',
          action: !isProUser ? handleUpgradeToPro : undefined,
          hasArrow: !isProUser,
        },
      ],
    },
    {
      title: 'Push Notifications',
      items: [
        {
          id: 'all_notifications',
          title: 'All Push Notifications',
          subtitle: 'Get notified about all new filings',
          icon: 'notifications',
          hasToggle: true,
          toggleValue: allNotifications,
          onToggle: (value) => handleNotificationToggle('all', value),
        },
        {
          id: 'watchlist_notifications',
          title: 'Watchlist Only',
          subtitle: 'Only notify for companies you follow',
          icon: 'star',
          hasToggle: true,
          toggleValue: watchlistOnly,
          onToggle: (value) => handleNotificationToggle('watchlist', value),
        },
      ],
    },
    {
      title: 'Account Management',
      items: [
        {
          id: 'change_password',
          title: 'Change Password',
          icon: 'lock',
          action: () => Alert.alert('Coming Soon', 'Password change feature will be available soon'),
          hasArrow: true,
        },
        ...(isProUser ? [{
          id: 'manage_subscription',
          title: 'Manage Subscription',
          icon: 'credit-card',
          iconType: 'material',
          action: () => Alert.alert('Coming Soon', 'Subscription management will be available soon'),
          hasArrow: true,
        }] : []),
      ],
    },
    {
      title: 'About',
      items: [
        {
          id: 'version',
          title: 'App Version',
          subtitle: '1.0.0',
          icon: 'info',
          hasArrow: false,
        },
        {
          id: 'terms',
          title: 'Terms of Service',
          icon: 'description',
          action: () => Alert.alert('Terms', 'Terms of Service'),
          hasArrow: true,
        },
        {
          id: 'privacy',
          title: 'Privacy Policy',
          icon: 'security',
          action: () => Alert.alert('Privacy', 'Privacy Policy'),
          hasArrow: true,
        },
        {
          id: 'support',
          title: 'Support',
          icon: 'help',
          action: () => Alert.alert('Support', 'Contact support@fintellic.com'),
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
        <Icon
          name={item.icon}
          type={item.iconType || 'material'}
          size={24}
          color={item.danger ? colors.error : colors.textSecondary}
          style={styles.settingIcon}
        />
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
          color={colors.textSecondary}
        />
      ) : null}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* Pro Badge */}
        {isProUser && (
          <View style={styles.proBadge}>
            <Icon name="star" type="material" size={20} color={colors.warning} />
            <Text style={styles.proBadgeText}>Pro Member</Text>
          </View>
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

        {/* Logout Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
            <Icon name="logout" type="material" size={20} color={colors.error} />
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Padding */}
        <View style={{ height: spacing.xxl }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
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
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
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
  settingIcon: {
    marginRight: spacing.md,
  },
  settingTextContainer: {
    flex: 1,
  },
  settingTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
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
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: colors.border,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.sm,
  },
});