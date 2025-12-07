// src/navigation/DrawerNavigator.tsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView, DrawerItemList, DrawerContentComponentProps } from '@react-navigation/drawer';
import { createStackNavigator } from '@react-navigation/stack';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { setFilingTypeFilter } from '../store/slices/filingsSlice';
import { colors, typography, spacing, borderRadius } from '../theme';
import CustomDrawerHeader from '../components/CustomDrawerHeader';
import { isProUser, FilingTypeFilter } from '../types';
import { BRAND_NAME, BRAND_TAGLINES, BRAND_IMAGES } from '../constants/brand';

// Import screens
import HomeScreen from '../screens/HomeScreen';
import CalendarScreen from '../screens/CalendarScreen';
import WatchlistScreen from '../screens/WatchlistScreen';
import HistoryScreen from '../screens/HistoryScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NotificationScreen from '../screens/NotificationScreen';
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
  const filingTypeFilter = useSelector((state: RootState) => state.filings.filingTypeFilter);

  // 控制 Home 子菜单的展开/收起状态
  const [isHomeExpanded, setIsHomeExpanded] = useState(false);

  const handleLogout = () => {
    dispatch(logout() as any);
  };

  const isPro = isProUser(user);

  // 筛选类型选项 - 使用与 FilingCard 相同的颜色和详细标签
  const filterOptions: Array<{ value: FilingTypeFilter; label: string; color?: string }> = [
    { value: 'all', label: 'All Filings', color: colors.gray600 },
    { value: '10-Q', label: '10-Q Quarterly', color: colors.filing10Q },   // 季度财报
    { value: '10-K', label: '10-K Annual', color: colors.filing10K },      // 年度财报
    { value: '8-K', label: '8-K Current', color: colors.filing8K },        // 重大事件
    { value: 'S-1', label: 'S-1 IPO', color: colors.filingS1 },            // IPO 招股书
  ];

  // 处理筛选类型选择
  const handleFilterSelect = (filter: FilingTypeFilter) => {
    dispatch(setFilingTypeFilter(filter));
    setIsHomeExpanded(false); // 选择后收起子菜单
  };

  // 处理 Home 点击（导航）
  const handleHomePress = () => {
    props.navigation.navigate('Home');
  };

  // 获取当前筛选类型的显示文本（简短版本用于 Home 项）
  const getCurrentFilterLabel = () => {
    const shortLabels: { [key: string]: string } = {
      'all': 'All',
      '10-Q': '10-Q',
      '10-K': '10-K',
      '8-K': '8-K',
      'S-1': 'S-1',
    };
    return shortLabels[filingTypeFilter] || 'All';
  };

  // 检查当前路由是否是 Home
  const isHomeActive = props.state.routes[props.state.index].name === 'Home';

  return (
    <DrawerContentScrollView {...props} style={styles.drawerContainer}>
      {/* Header */}
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

      {/* Tagline */}
      <View style={styles.taglineContainer}>
        <Text style={styles.taglineText}>
          They chase the noise,{'\n'}you track the source.
        </Text>
      </View>

      {/* Custom Menu Items */}
      <View style={styles.menuContainer}>
        {/* Home 项 - 自定义渲染 */}
        <View>
          <TouchableOpacity
            style={[styles.drawerItem, isHomeActive && styles.drawerItemActive]}
            onPress={handleHomePress}
          >
            <View style={styles.drawerItemLeft}>
              <Icon
                name="home"
                type="material"
                size={24}
                color={isHomeActive ? colors.brown : colors.brownLight}
              />
              <Text style={[
                styles.drawerItemLabel,
                isHomeActive && styles.drawerItemLabelActive
              ]}>
                Home ({getCurrentFilterLabel()})
              </Text>
            </View>
            <TouchableOpacity 
              onPress={() => setIsHomeExpanded(!isHomeExpanded)}
              style={styles.expandButton}
            >
              <Icon
                name={isHomeExpanded ? "expand-less" : "expand-more"}
                type="material"
                size={24}
                color={isHomeActive ? colors.brown : colors.brownLight}
              />
            </TouchableOpacity>
          </TouchableOpacity>

          {/* Home 子菜单 - 筛选选项 */}
          {isHomeExpanded && (
            <View style={styles.subMenu}>
              {filterOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.subMenuItem,
                    filingTypeFilter === option.value && styles.subMenuItemActive
                  ]}
                  onPress={() => handleFilterSelect(option.value)}
                >
                  {/* 使用彩色标签样式 */}
                  <View style={[
                    styles.filingTypeBadge,
                    { backgroundColor: option.color }
                  ]}>
                    <Text style={styles.filingTypeBadgeText}>
                      {option.label}
                    </Text>
                  </View>
                  
                  {/* 选中标记 */}
                  {filingTypeFilter === option.value && (
                    <Icon
                      name="check"
                      type="material"
                      size={16}
                      color={option.color}
                      style={styles.checkIcon}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* 其他菜单项 - 使用原生 DrawerItem */}
        {props.state.routes.map((route, index) => {
          if (route.name === 'Home') return null; // 已自定义渲染

          const isFocused = props.state.index === index;
          let iconName = 'circle';
          let label = route.name;

          switch (route.name) {
            case 'Calendar':
              iconName = 'calendar-today';
              label = 'Calendar';
              break;
            case 'Watchlist':
              iconName = 'star';
              label = 'Watchlist';
              break;
            case 'History':
              iconName = 'history';
              label = 'History';
              break;
            case 'Notifications':
              iconName = 'notifications';
              label = 'Notifications';
              break;
            case 'Profile':
              iconName = 'person';
              label = 'Profile';
              break;
          }

          return (
            <TouchableOpacity
              key={route.key}
              style={[styles.drawerItem, isFocused && styles.drawerItemActive]}
              onPress={() => props.navigation.navigate(route.name)}
            >
              <Icon
                name={iconName}
                type="material"
                size={24}
                color={isFocused ? colors.brown : colors.brownLight}
              />
              <Text style={[
                styles.drawerItemLabel,
                isFocused && styles.drawerItemLabelActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
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
    fontSize: typography.fontSize.lg,  // Increased from md to lg
    fontWeight: '600',
    fontStyle: 'italic',
    fontFamily: Platform.OS === 'ios' ? 'Georgia' : 'serif',
    color: colors.gray700,
    letterSpacing: 0.3,
    textAlign: 'center',
    lineHeight: typography.fontSize.lg * 1.5,
    textShadowColor: 'rgba(55, 65, 81, 0.15)',
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
  // 自定义 Drawer Item 样式
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  drawerItemActive: {
    backgroundColor: colors.brown + '15',
  },
  drawerItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  drawerItemLabel: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    color: colors.brownLight,
    marginLeft: spacing.md,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  drawerItemLabelActive: {
    color: colors.brown,
  },
  expandButton: {
    padding: spacing.xs,
  },
  // 子菜单样式
  subMenu: {
    backgroundColor: colors.beige,
    paddingLeft: spacing.xl + spacing.lg,
    borderLeftWidth: 2,
    borderLeftColor: colors.brown + '30',
    marginLeft: spacing.lg,
    paddingVertical: spacing.xs,
  },
  subMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingLeft: spacing.lg,
  },
  subMenuItemActive: {
    backgroundColor: colors.brown + '10',
  },
  // 彩色标签样式 - 与 FilingCard 保持一致
  filingTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.xs,
  },
  filingTypeBadgeText: {
    fontSize: 10,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    letterSpacing: 0.3,
  },
  checkIcon: {
    marginLeft: 'auto',
  },
});