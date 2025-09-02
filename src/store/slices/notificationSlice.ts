// src/store/slices/notificationSlice.ts
// Redux slice for notification state management
// Integrates with existing HermeSpeed Redux architecture

import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { notificationAPI } from '../../api/notifications';
import { 
  NotificationSettings, 
  NotificationHistory, 
  NotificationStats,
  NotificationSettingsUpdate,
  DEFAULT_NOTIFICATION_SETTINGS 
} from '../../types/notification';

// Async thunks for API calls
export const fetchNotificationSettings = createAsyncThunk(
  'notification/fetchSettings',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationAPI.getSettings();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification settings');
    }
  }
);

export const updateNotificationSettings = createAsyncThunk(
  'notification/updateSettings',
  async (settings: NotificationSettingsUpdate, { rejectWithValue }) => {
    try {
      return await notificationAPI.updateSettings(settings);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update notification settings');
    }
  }
);

export const fetchNotificationHistory = createAsyncThunk(
  'notification/fetchHistory',
  async (params: { limit?: number; offset?: number } = {}, { rejectWithValue }) => {
    try {
      return await notificationAPI.getHistory(params.limit, params.offset);
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification history');
    }
  }
);

export const fetchNotificationStats = createAsyncThunk(
  'notification/fetchStats',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationAPI.getStats();
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch notification stats');
    }
  }
);

export const sendTestNotification = createAsyncThunk(
  'notification/sendTest',
  async (params: { title?: string; body?: string } = {}, { rejectWithValue }) => {
    try {
      const result = await notificationAPI.sendTestNotification(params);
      return result;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to send test notification');
    }
  }
);

// State interface
interface NotificationState {
  settings: NotificationSettings;
  history: NotificationHistory[];
  stats: NotificationStats | null;
  
  // Loading states
  settingsLoading: boolean;
  historyLoading: boolean;
  statsLoading: boolean;
  updating: boolean;
  sendingTest: boolean;
  
  // Error states
  settingsError: string | null;
  historyError: string | null;
  statsError: string | null;
  updateError: string | null;
  testError: string | null;
  
  // Push token state
  pushToken: string | null;
  pushTokenSynced: boolean;
  
  // UI state
  lastRefresh: number;
  hasPermission: boolean;
}

// Initial state
const initialState: NotificationState = {
  settings: DEFAULT_NOTIFICATION_SETTINGS,
  history: [],
  stats: null,
  
  // Loading states
  settingsLoading: false,
  historyLoading: false,
  statsLoading: false,
  updating: false,
  sendingTest: false,
  
  // Error states
  settingsError: null,
  historyError: null,
  statsError: null,
  updateError: null,
  testError: null,
  
  // Push token state
  pushToken: null,
  pushTokenSynced: false,
  
  // UI state
  lastRefresh: 0,
  hasPermission: false,
};

// Notification slice
const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    // Synchronous actions
    setPushToken: (state, action: PayloadAction<string | null>) => {
      state.pushToken = action.payload;
    },
    
    setPushTokenSynced: (state, action: PayloadAction<boolean>) => {
      state.pushTokenSynced = action.payload;
    },
    
    setHasPermission: (state, action: PayloadAction<boolean>) => {
      state.hasPermission = action.payload;
    },
    
    clearErrors: (state) => {
      state.settingsError = null;
      state.historyError = null;
      state.statsError = null;
      state.updateError = null;
      state.testError = null;
    },
    
    addNotificationToHistory: (state, action: PayloadAction<NotificationHistory>) => {
      // Add new notification to the beginning of history
      state.history.unshift(action.payload);
      // Keep only the latest 50 notifications
      if (state.history.length > 50) {
        state.history = state.history.slice(0, 50);
      }
    },
    
    markNotificationAsRead: (state, action: PayloadAction<number>) => {
      const notification = state.history.find(n => n.id === action.payload);
      if (notification) {
        notification.read_at = new Date().toISOString();
      }
    },
    
    updateLastRefresh: (state) => {
      state.lastRefresh = Date.now();
    },
    
    // Quick toggle actions for better UX
    toggleNotificationEnabled: (state) => {
      state.settings.notification_enabled = !state.settings.notification_enabled;
    },
    
    toggleWatchlistOnly: (state) => {
      state.settings.watchlist_only = !state.settings.watchlist_only;
    },
  },
  
  extraReducers: (builder) => {
    // Fetch settings
    builder
      .addCase(fetchNotificationSettings.pending, (state) => {
        state.settingsLoading = true;
        state.settingsError = null;
      })
      .addCase(fetchNotificationSettings.fulfilled, (state, action) => {
        state.settingsLoading = false;
        state.settings = action.payload;
        state.lastRefresh = Date.now();
      })
      .addCase(fetchNotificationSettings.rejected, (state, action) => {
        state.settingsLoading = false;
        state.settingsError = action.payload as string;
      });
    
    // Update settings
    builder
      .addCase(updateNotificationSettings.pending, (state) => {
        state.updating = true;
        state.updateError = null;
      })
      .addCase(updateNotificationSettings.fulfilled, (state, action) => {
        state.updating = false;
        state.settings = action.payload;
      })
      .addCase(updateNotificationSettings.rejected, (state, action) => {
        state.updating = false;
        state.updateError = action.payload as string;
      });
    
    // Fetch history
    builder
      .addCase(fetchNotificationHistory.pending, (state) => {
        state.historyLoading = true;
        state.historyError = null;
      })
      .addCase(fetchNotificationHistory.fulfilled, (state, action) => {
        state.historyLoading = false;
        state.history = action.payload;
      })
      .addCase(fetchNotificationHistory.rejected, (state, action) => {
        state.historyLoading = false;
        state.historyError = action.payload as string;
      });
    
    // Fetch stats
    builder
      .addCase(fetchNotificationStats.pending, (state) => {
        state.statsLoading = true;
        state.statsError = null;
      })
      .addCase(fetchNotificationStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload;
      })
      .addCase(fetchNotificationStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.statsError = action.payload as string;
      });
    
    // Send test notification
    builder
      .addCase(sendTestNotification.pending, (state) => {
        state.sendingTest = true;
        state.testError = null;
      })
      .addCase(sendTestNotification.fulfilled, (state, action) => {
        state.sendingTest = false;
        // Optionally add a success message to history
      })
      .addCase(sendTestNotification.rejected, (state, action) => {
        state.sendingTest = false;
        state.testError = action.payload as string;
      });
  },
});

// Export actions
export const {
  setPushToken,
  setPushTokenSynced,
  setHasPermission,
  clearErrors,
  addNotificationToHistory,
  markNotificationAsRead,
  updateLastRefresh,
  toggleNotificationEnabled,
  toggleWatchlistOnly,
} = notificationSlice.actions;

// Selectors
export const selectNotificationSettings = (state: { notification: NotificationState }) => 
  state.notification.settings;

export const selectNotificationHistory = (state: { notification: NotificationState }) => 
  state.notification.history;

export const selectNotificationStats = (state: { notification: NotificationState }) => 
  state.notification.stats;

export const selectNotificationLoading = (state: { notification: NotificationState }) => ({
  settings: state.notification.settingsLoading,
  history: state.notification.historyLoading,
  stats: state.notification.statsLoading,
  updating: state.notification.updating,
  sendingTest: state.notification.sendingTest,
});

export const selectNotificationErrors = (state: { notification: NotificationState }) => ({
  settings: state.notification.settingsError,
  history: state.notification.historyError,
  stats: state.notification.statsError,
  update: state.notification.updateError,
  test: state.notification.testError,
});

export const selectPushTokenInfo = (state: { notification: NotificationState }) => ({
  token: state.notification.pushToken,
  synced: state.notification.pushTokenSynced,
  hasPermission: state.notification.hasPermission,
});

export const selectNotificationSummary = (state: { notification: NotificationState }) => {
  const settings = state.notification.settings;
  
  if (!settings.notification_enabled) {
    return 'Notifications disabled';
  }
  
  const enabledTypes = [];
  if (settings.filing_10k) enabledTypes.push('10-K');
  if (settings.filing_10q) enabledTypes.push('10-Q');
  if (settings.filing_8k) enabledTypes.push('8-K');
  if (settings.filing_s1) enabledTypes.push('S-1');
  
  const scope = settings.watchlist_only ? 'Watchlist only' : 'All companies';
  
  if (enabledTypes.length === 0) {
    return `${scope} • No filing types selected`;
  }
  
  return `${scope} • ${enabledTypes.length} filing type${enabledTypes.length > 1 ? 's' : ''}`;
};

export default notificationSlice.reducer;