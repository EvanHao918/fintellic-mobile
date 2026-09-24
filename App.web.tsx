// App.web.tsx — Expo Web preview harness (Metro picks this over App.tsx on web).
// Renders the REAL navigator (tabs + push + modals) against the live backend, WITHOUT the
// native-only boot services (notifications / IAP / singular). For live design/UX review only.
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { Provider } from 'react-redux';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { store } from './src/store';
import { loadStoredAuth } from './src/store/slices/authSlice';
import AppNavigatorAS from './src/navigation/AppNavigatorAS';
import { AS } from './src/theme/allsight';

export default function App() {
  useEffect(() => { store.dispatch(loadStoredAuth() as any).catch(() => {}); }, []);
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <View style={styles.wrap}>
          <View style={styles.phone}>
            <AppNavigatorAS />
          </View>
        </View>
      </SafeAreaProvider>
    </Provider>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: '#05080b', alignItems: 'center' },
  phone: { flex: 1, width: 402, maxWidth: '100%', backgroundColor: AS.color.bg, overflow: 'hidden' },
});
