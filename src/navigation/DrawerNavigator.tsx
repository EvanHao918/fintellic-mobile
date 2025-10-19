// src/navigation/DrawerNavigator.tsx
import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Platform, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { colors, typography, spacing } from '../theme';
import CustomDrawerHeader from '../components/CustomDrawerHeader';
import { isProUser } from '../types';
import { BRAND_NAME, BRAND_TAGLINES, BRAND_IMAGES } from '../constants/brand';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
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
  Notifications: undefined;
};

export type ProfileStackParamList = {
  ProfileMain: undefined;
  ChangePassword: undefined;
  TermsOfService: undefined;
  PrivacyPolicy: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();
const ProfileStack = createStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <ProfileStack.Screen 
        name="ProfileMain" 
        component={ProfileScreen}
      />
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

// Brand Slogan Component with animation - Direct text overlay
function BrandSlogan() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  return (
    <Animated.View 
      style={[
        styles.sloganContainer,
        {
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <Text style={styles.sloganLine1}>{BRAND_TAGLINES.DRAWER_LINE1}</Text>
      <Text style={styles.sloganLine2}>{BRAND_TAGLINES.DRAWER_LINE2}</Text>
    </Animated.View>
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

  const isPro = isProUser(user);

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* Header - UPDATED: Now using full Logo (icon + text) */}
      <View style={styles.drawerHeader}>
        <Image 
          source={BRAND_IMAGES.LOGO_FULL}
          style={styles.drawerLogo}
          resizeMode="contain"
        />
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

      {/* Tagline - Between membership and menu items */}
      <View style={styles.taglineContainer}>
        <Text style={styles.taglineText}>
          Get the Instant Essential{'\n'}before the Market Digests
        </Text>
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

      {/* Brand Slogan - Bottom of drawer */}
      <BrandSlogan />
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
            case 'Notifications':
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
        drawerActiveTintColor: colors.brown,
        drawerInactiveTintColor: colors.brownLight,
        drawerLabelStyle: {
          fontFamily: typography.fontFamily.medium,
          fontSize: typography.fontSize.md,
          textShadowColor: 'rgba(0, 0, 0, 0.3)',
          textShadowOffset: { width: 1, height: 1 },
          textShadowRadius: 2,
        },
        header: (props) => <CustomDrawerHeader title={props.options.title || route.name} />,
      })}
    >
      <Drawer.Screen 
        name="Home" 
        component={HomeScreen}
        options={{ 
          title: BRAND_NAME,
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
      <Drawer.Screen 
        name="Notifications" 
        component={NotificationScreen}
        options={{ 
          title: 'Notifications',
          drawerLabel: 'Notifications',
        }}
      />
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
    backgroundColor: colors.beige,
  },
  drawerHeader: {
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    alignItems: 'flex-start',
  },
  drawerLogo: {
    height: 120,
    width: 220,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
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
  taglineContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  taglineText: {
    fontSize: typography.fontSize.md,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.gray700,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: typography.fontSize.md * 1.5,
    textShadowColor: 'rgba(55, 65, 81, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sloganContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    marginTop: spacing.xl,
    marginBottom: spacing.xl,
    alignItems: 'flex-start',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  sloganLine1: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.gray700,
    letterSpacing: 0.5,
    textAlign: 'left',
    marginBottom: spacing.sm,
    lineHeight: typography.fontSize.lg * 1.5,
    textShadowColor: 'rgba(55, 65, 81, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sloganLine2: {
    fontSize: typography.fontSize.lg,
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.gray600,
    letterSpacing: 0.5,
    textAlign: 'left',
    lineHeight: typography.fontSize.lg * 1.5,
    textShadowColor: 'rgba(75, 85, 99, 0.15)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
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