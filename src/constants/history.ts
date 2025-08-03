// src/constants/history.ts

export const HISTORY_CONSTANTS = {
    // Storage key for AsyncStorage
    STORAGE_KEY: '@fintellic_history',
    
    // Maximum number of history items to store
    MAX_HISTORY_ITEMS: 100,
    
    // Time formatting thresholds (in seconds)
    TIME_THRESHOLDS: {
      JUST_NOW: 60,           // Less than 1 minute
      MINUTES: 3600,          // Less than 1 hour  
      HOURS: 86400,           // Less than 24 hours
      DAYS: 604800,           // Less than 7 days
    },
    
    // Date grouping labels
    DATE_GROUPS: {
      TODAY: 'Today',
      YESTERDAY: 'Yesterday',
    },
    
    // Error messages
    ERROR_MESSAGES: {
      LOAD_FAILED: 'Failed to load history',
      ADD_FAILED: 'Failed to add to history',
      REMOVE_FAILED: 'Failed to remove from history',
      CLEAR_FAILED: 'Failed to clear history',
    },
    
    // Success messages
    SUCCESS_MESSAGES: {
      HISTORY_CLEARED: 'History cleared',
    },
    
    // Alert titles
    ALERT_TITLES: {
      CLEAR_HISTORY: 'Clear History',
      ERROR: 'Error',
      SUCCESS: 'Success',
    },
    
    // Alert messages
    ALERT_MESSAGES: {
      CLEAR_CONFIRMATION: 'Are you sure you want to clear all browsing history?',
    },
  };