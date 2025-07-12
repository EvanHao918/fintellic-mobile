import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';
import { store } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';

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