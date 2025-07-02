import React, { useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import TabNavigator from './TabNavigator';
import LoginScreen from '../screens/LoginScreen';
import FilingDetailScreen from '../screens/FilingDetailScreen';
import { RootState, AppDispatch } from '../store';
import { loadStoredAuth } from '../store/slices/authSlice';

export type RootStackParamList = {
  Login: undefined;
  Main: undefined;
  FilingDetail: { filingId: string };
};

const Stack = createStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  const dispatch = useDispatch<AppDispatch>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    // Try to load stored auth on app start
    dispatch(loadStoredAuth());
  }, [dispatch]);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen name="Login" component={LoginScreen} />
      ) : (
        <>
          <Stack.Screen name="Main" component={TabNavigator} />
          <Stack.Screen 
            name="FilingDetail" 
            component={FilingDetailScreen}
            options={{
              headerShown: true,
              headerBackTitle: 'Back',
              title: 'Filing Details',
            }}
          />
        </>
      )}
    </Stack.Navigator>
  );
}