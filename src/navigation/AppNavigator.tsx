import React, { useEffect, useRef } from 'react';
import { NavigationContainer, NavigationContainerRef } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoginScreen from '../screens/LoginScreen';
import ResetPasswordScreen from '../screens/ResetPasswordScreen';
import TermsScreen from '../screens/TermsScreen';
import PrivacyPolicyScreen from '../screens/PrivacyPolicyScreen';
import DrawerNavigator from './DrawerNavigator';
import FilingDetailScreen from '../screens/FilingDetailScreen';
import CompanyFilingsScreen from '../screens/CompanyFilingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import { RootStackParamList } from '../types';
import NotificationService from '../services/NotificationService';

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
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const navigationRef = useRef<NavigationContainerRef<RootStackParamList>>(null);

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