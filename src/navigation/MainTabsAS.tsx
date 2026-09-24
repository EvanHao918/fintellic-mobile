// src/navigation/MainTabsAS.tsx
// AllSight 2026 bottom tabs — Events / Companies / Calendar / You.
import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import FeedScreenAS from '../screens/FeedScreenAS';
import CompaniesSearchScreenAS from '../screens/CompaniesSearchScreenAS';
import CalendarScreenAS from '../screens/CalendarScreenAS';
import AccountScreenAS from '../screens/AccountScreenAS';
import { store } from '../store';
import { AS } from '../theme/allsight';

const Tab = createBottomTabNavigator();

const ICONS: Record<string, [any, any]> = {
  Events: ['radio', 'radio-outline'],
  Companies: ['search', 'search-outline'],
  Calendar: ['calendar', 'calendar-outline'],
  You: ['person-circle', 'person-circle-outline'],
};

const MainTabsAS: React.FC = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      headerShown: false,
      tabBarActiveTintColor: AS.color.accent,
      tabBarInactiveTintColor: AS.color.ink3,
      tabBarStyle: {
        backgroundColor: AS.color.bg,
        borderTopColor: AS.color.line,
        borderTopWidth: 1,
        height: Platform.OS === 'ios' ? 86 : 64,
        paddingTop: 8,
        paddingBottom: Platform.OS === 'ios' ? 28 : 10,
      },
      tabBarLabelStyle: { fontSize: 11, fontWeight: '600', letterSpacing: 0.2 },
      tabBarIcon: ({ focused, color, size }) => {
        const [on, off] = ICONS[route.name] || ['ellipse', 'ellipse-outline'];
        return <Ionicons name={focused ? on : off} size={size ? size - 1 : 23} color={color} />;
      },
    })}
  >
    <Tab.Screen name="Events" component={FeedScreenAS} />
    <Tab.Screen name="Companies" component={CompaniesSearchScreenAS} />
    <Tab.Screen name="Calendar" component={CalendarScreenAS} />
    <Tab.Screen
      name="You"
      component={AccountScreenAS}
      listeners={({ navigation }) => ({
        // Signed out → skip the empty "Sign in" page and open the Auth sheet directly.
        tabPress: (e) => {
          if (!store.getState().auth?.isAuthenticated) {
            e.preventDefault();
            navigation.navigate('Auth');
          }
        },
      })}
    />
  </Tab.Navigator>
);

export default MainTabsAS;
