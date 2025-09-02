// src/navigation/DrawerNavigator.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { colors, typography, spacing } from '../theme';
import CustomDrawerHeader from '../components/CustomDrawerHeader';
import { isProUser } from '../types'; // å¯¼å…¥è¾…åŠ©å‡½æ•°

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen'; // NEW: Import NotificationScreen
// ðŸ†• Task 6: Import new screens
import ChangePasswordScreen from '../screens/ChangePasswordScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';

// Define drawer params
export type DrawerParamList = {
  Home: undefined;
  Calendar: undefined;
  Watchlist: undefined;
  History: undefined;
  Profile: undefined;
  Notifications: undefined; // NEW: Add Notifications to param list
};

// ðŸ†• Task 6: Stack navigator param list for Profile-related screens
export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

// ðŸ†• Task 6: Profile Stack Navigator with nested screens
function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false, // We'll use the drawer header
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
      {/* ðŸ†• Task 6: New screens */}
      <ProfileStack.Screen 
        name="ChangePassword" 
        component={ChangePasswordScreen}
        options={{ 
          headerShown: true,
          title: 'Change Password',
          headerStyle: { backgroundColor: colors.white },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
        }}
      />
      <ProfileStack.Screen 
        name="TermsOfService" 
        component={TermsScreen}
        options={{ 
          headerShown: true,
          title: 'Terms of Service',
          headerStyle: { backgroundColor: colors.white },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
        }}
      />
      <ProfileStack.Screen 
        name="PrivacyPolicy" 
        component={PrivacyPolicyScreen}
        options={{ 
          headerShown: true,
          title: 'Privacy Policy',
          headerStyle: { backgroundColor: colors.white },
          headerTitleStyle: { color: colors.text },
          headerTintColor: colors.primary,
        }}
      />
    </ProfileStack.Navigator>
  );
}

// Custom drawer content
function CustomDrawerContent(props: DrawerContentComponentProps) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const user = useSelector((state: RootState) => state.auth.user);

  const handleLogout = () => {
    dispatch(logout() as any);
  };

  // ðŸ"¥ å…³é"®ä¿®å¤ï¼šä½¿ç"¨ç»Ÿä¸€çš„isProUserå‡½æ•°åˆ¤æ–­
  const isPro = isProUser(user);

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* Header */}
      <View style={styles.drawerHeader}>
        <Text style={styles.appName}>HermeSpeed</Text>
        <Text style={styles.userName}>{user?.full_name || user?.username || 'User'}</Text>
        <View style={styles.membershipBadge}>
          {isPro ? (
            <>
              <Icon name="star" type="material" size={16} color={colors.warning} />
              <Text style={styles.membershipText}>Pro Member</Text>
            </>
          ) : (
            <Text style={styles.membershipText}>Free Member</Text>
          )}
        </View>
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <DrawerItemList {...props} />
      </View>

      {/* Logout Button */}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Icon name="logout" type="material" size={20} color={colors.error} />
        <Text style={styles.logoutText}>Logout</Text>
      </TouchableOpacity>
    </DrawerContentScrollView>
  );
}

export default function DrawerNavigator() {
  return (
    <Drawer.Navigator
      initialRouteName="Home"
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={({ route }) => ({
        drawerIcon: ({ focused, color, size }) => {
          let iconName: string;

          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Calendar':
              iconName = 'calendar-today';
              break;
            case 'Watchlist':
              iconName = 'star';
              break;
            case 'History':
              iconName = 'history';
              break;
            case 'Profile':
              iconName = 'person';
              break;
            case 'Notifications': // NEW: Icon for Notifications
              iconName = 'notifications';
              break;
            default:
              iconName = 'home';
          }

          return (
            <Icon
              name={iconName}
              type="material"
              size={size}
              color={color}
            />
          );
        },
        drawerActiveTintColor: colors.primary,
        drawerInactiveTintColor: colors.textSecondary,
        drawerLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.fontSize.md,
        },
        header: (props) => <CustomDrawerHeader title={props.options.title || route.name} />,
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: 'HermeSpeed',
          drawerLabel: 'Home',
        }}
      />
      <Drawer.Screen 
        name="Calendar" 
        component={CalendarScreen}
        options={{ 
          title: 'Earnings Calendar',
          drawerLabel: 'Calendar',
        }}
      />
      <Drawer.Screen 
        name="Watchlist" 
        component={WatchlistScreen}
        options={{ 
          title: 'My Watchlist',
          drawerLabel: 'Watchlist',
        }}
      />
      <Drawer.Screen 
        name="History" 
        component={HistoryScreen}
        options={{ 
          title: 'History',
          drawerLabel: 'History',
        }}
      />
      {/* NEW: Add Notifications screen */}
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{ 
          title: 'Notifications',
          drawerLabel: 'Notifications',
        }}
      />
      {/* ðŸ†• Task 6: Replace ProfileScreen with ProfileStackNavigator */}
      <Drawer.Screen 
        name="Profile" 
        component={ProfileStackNavigator}
        options={{ 
          title: 'Profile',
          drawerLabel: 'Profile',
        }}
      />
    </Drawer.Navigator>
  );
}

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  drawerHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: spacing.md,
  },
  appName: {
    fontSize: typography.fontSize.xxl,
    fontFamily: typography.fontFamily.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  userName: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  membershipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  membershipText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  menuContainer: {
    flex: 1,
    paddingTop: spacing.sm,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  logoutText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.md,
  },
});