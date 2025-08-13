// src/store/index.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filingsReducer from './slices/filingsSlice';
import subscriptionReducer from './slices/subscriptionSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filings: filingsReducer,
    subscription: subscriptionReducer, // 新增订阅reducer
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: [
          'auth/login/fulfilled',
          'subscription/createSubscription/fulfilled', // 添加订阅相关action
          'subscription/updateSubscription/fulfilled',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;