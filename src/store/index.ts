import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import filingsReducer from './slices/filingsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    filings: filingsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;