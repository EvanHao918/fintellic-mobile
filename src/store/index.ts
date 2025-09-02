// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filingsReducer from './slices/filingsSlice';
import subscriptionReducer from './slices/subscriptionSlice';
import notificationReducer from './slices/notificationSlice'; // 添加通知reducer

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filings: filingsReducer,
    subscription: subscriptionReducer,
    notification: notificationReducer, // 新增通知reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'auth/login/fulfilled',
          'subscription/createSubscription/fulfilled',
          'subscription/updateSubscription/fulfilled',
          'notification/fetchNotificationSettings/fulfilled', // 添加通知相关actions
          'notification/updateNotificationSettings/fulfilled',
          'notification/fetchNotificationHistory/fulfilled',
          'notification/sendTestNotification/fulfilled',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;