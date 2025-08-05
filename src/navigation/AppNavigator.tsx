import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import LoginScreen from '../screens/LoginScreen';
import DrawerNavigator from './DrawerNavigator';
import FilingDetailScreen from '../screens/FilingDetailScreen';
import CompanyFilingsScreen from '../screens/CompanyFilingsScreen';
import SubscriptionScreen from '../screens/SubscriptionScreen';
import { RootStackParamList } from '../types';

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Login" component={LoginScreen} />
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
                // 添加这些选项来修复滚动问题
                cardStyle: { flex: 1 },
                cardOverlayEnabled: false,
                presentation: 'card', // 使用标准卡片展示
              }}
            />
            <Stack.Screen 
              name="Subscription" 
              component={SubscriptionScreen}
              options={{ 
                headerShown: true,
                headerTitle: 'Subscription Plans'
              }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}