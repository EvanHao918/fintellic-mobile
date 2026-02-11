import React, { useEffect, useRef, useState } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector, useDispatch } from 'react-redux';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { RootState, AppDispatch } from '../store';
import LoginScreen from '../screens/LoginScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import PersonalizationScreen from '../screens/PersonalizationScreen';
import DrawerNavigator from './DrawerNavigator';
import FilingDetailScreen from '../screens/FilingDetailScreen';
import CompanyFilingsScreen from '../screens/CompanyFilingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import { RootStackParamList } from '../types';
import NotificationService from '../services/NotificationService';
import SingularService from '../services/SingularService';
import { getOnboardingStatus } from '../store/slices/authSlice';

const Stack = createStackNavigator<RootStackParamList>();

// Deep linking configuration for password reset
const linking = {
  prefixes: ['http://localhost:8081', 'http://localhost:19006'],
  config: {
    screens: {
      Login: 'login',
      ResetPassword: 'reset-password',
      TermsOfService: 'terms',
      PrivacyPolicy: 'privacy',
    },
  },
};

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // 🆕 Initialize Singular SDK on app start
  useEffect(() => {
    const initializeSingular = async () => {
      try {
        await SingularService.init();
      } catch (error) {
        console.error('Failed to initialize Singular SDK:', error);
      }
    };
    
    initializeSingular();
  }, []);

  // 登录后获取 onboarding 状态
  useEffect(() => {
    if (isAuthenticated) {
      setIsCheckingOnboarding(true);
      dispatch(getOnboardingStatus()).finally(() => {
        setIsCheckingOnboarding(false);
      });
    } else {
      setIsCheckingOnboarding(false);
    }
  }, [isAuthenticated, dispatch]);

  // 检查 onboarding 状态（只有在确认获取到状态后才判断）
  const needsOnboarding = isAuthenticated && user && user.onboarding_completed === 0;

  // Set navigation ref for NotificationService when navigation is ready
  const onNavigationReady = () => {
    if (navigationRef.current) {
      NotificationService.setNavigationRef({
        navigate: (name: string, params?: any) => {
          // @ts-ignore - dynamic navigation
          navigationRef.current?.navigate(name, params);
        },
        getCurrentRoute: () => navigationRef.current?.getCurrentRoute(),
      });
      console.log('✅ Navigation ref set for NotificationService');
    }
  };

  return (
    <NavigationContainer 
      ref={navigationRef}
      linking={linking}
      onReady={onNavigationReady}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen 
              name="ResetPassword" 
              component={ResetPasswordScreen}
              options={{ 
                headerShown: false,
                title: 'Reset Password'
              }}
            />
            {/* 添加 Terms 和 Privacy 到未认证路由 */}
            <Stack.Screen 
              name="TermsOfService" 
              component={TermsScreen}
              options={{ 
                headerShown: false,
                title: 'Terms of Service'
              }}
            />
            <Stack.Screen 
              name="PrivacyPolicy" 
              component={PrivacyPolicyScreen}
              options={{ 
                headerShown: false,
                title: 'Privacy Policy'
              }}
            />
          </>
        ) : isCheckingOnboarding ? (
          // 正在检查 onboarding 状态，显示空白或 loading
          <Stack.Screen 
            name="Main" 
            component={() => (
              <View style={loadingStyles.container}>
                <ActivityIndicator size="large" color="#F59E0B" />
              </View>
            )}
            options={{ headerShown: false }}
          />
        ) : needsOnboarding ? (
          // 需要完成 onboarding 调查
          <Stack.Screen 
            name="Personalization" 
            component={PersonalizationScreen}
            options={{ headerShown: false }}
          />
        ) : (
          <>
            <Stack.Screen name="Main" component={DrawerNavigator} />
            <Stack.Screen 
              name="FilingDetail" 
              component={FilingDetailScreen}
              options={{ headerShown: false }}
            />
            <Stack.Screen 
              name="CompanyFilings" 
              component={CompanyFilingsScreen}
              options={{ 
                headerShown: false,
                cardStyle: { flex: 1 },
                cardOverlayEnabled: false,
                presentation: 'card',
              }}
            />
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{ 
                headerShown: false
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

// Loading 样式
const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
  },
});