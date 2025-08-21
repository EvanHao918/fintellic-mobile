import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';
// 🆕 Phase 4: Import NotificationService
import NotificationService from './src/services/NotificationService';

export default function App() {
  useEffect(() => {
    console.log('🚀 App starting, dispatching loadStoredAuth...');
    
    // Load stored authentication on app start
    store.dispatch(loadStoredAuth() as any)
      .then((result: any) => {
        console.log('📱 loadStoredAuth result:', result);
        console.log('🔍 Current auth state after load:', store.getState().auth);
      })
      .catch((error: any) => {
        console.error('❌ loadStoredAuth error:', error);
      });
    
    // 🆕 Phase 4: Initialize notification service
    console.log('🔔 Initializing NotificationService...');
    NotificationService.initialize()
      .then(() => {
        console.log('✅ NotificationService initialized successfully');
      })
      .catch((error) => {
        console.error('❌ NotificationService initialization error:', error);
      });
    
    // 🆕 Cleanup on unmount
    return () => {
      NotificationService.cleanup();
    };
  }, []);

  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <StatusBar style="dark" />
        <AppNavigator />
      </SafeAreaProvider>
    </Provider>
  );
}