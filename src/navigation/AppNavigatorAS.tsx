// src/navigation/AppNavigatorAS.tsx
// AllSight 2026 root navigator — tabs + pushed detail/company + modal auth/paywall.
// Shared by native (App.tsx) and web preview (App.web.tsx).
import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import MainTabsAS from './MainTabsAS';
import FilingDetailScreenAS from '../screens/FilingDetailScreenAS';
import CompanyScreenAS from '../screens/CompanyScreenAS';
import WatchlistScreenAS from '../screens/WatchlistScreenAS';
import AuthScreenAS from '../screens/AuthScreenAS';
import SubscriptionScreenAS from '../screens/SubscriptionScreenAS';
import { AS } from '../theme/allsight';

const Stack = createStackNavigator();

const navTheme: Theme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    background: AS.color.bg,
    card: AS.color.bg,
    text: AS.color.ink,
    border: AS.color.line,
    primary: AS.color.accent,
    notification: AS.color.accent,
  },
};

const AppNavigatorAS: React.FC = () => (
  <NavigationContainer theme={navTheme}>
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyle: { backgroundColor: AS.color.bg },
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen name="Main" component={MainTabsAS} />
      <Stack.Screen name="FilingDetail" component={FilingDetailScreenAS} />
      <Stack.Screen name="Company" component={CompanyScreenAS} />
      <Stack.Screen name="Watchlist" component={WatchlistScreenAS} />
      <Stack.Group screenOptions={{ presentation: 'modal', ...TransitionPresets.ModalPresentationIOS, gestureEnabled: true }}>
        <Stack.Screen name="Auth" component={AuthScreenAS} />
        <Stack.Screen name="Subscription" component={SubscriptionScreenAS} />
      </Stack.Group>
    </Stack.Navigator>
  </NavigationContainer>
);

export default AppNavigatorAS;
