// src/hooks/useHistory.ts

import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { HistoryManager, HistoryItem } from '../utils/historyManager';
import { Filing } from '../types';
import { HISTORY_CONSTANTS } from '../constants/history';

interface UseHistoryReturn {
  history: HistoryItem[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  
  // Actions
  loadHistory: () => Promise<void>;
  addToHistory: (filing: Filing) => Promise<void>;
  removeFromHistory: (filingId: string | number) => Promise<void>;
  clearHistory: () => void;
  refreshHistory: () => Promise<void>;
  
  // Computed values
  historyCount: number;
  isEmpty: boolean;
}

/**
 * Custom hook for managing filing history
 * Provides state management and actions for history operations
 */
export function useHistory(): UseHistoryReturn {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history from storage
  const loadHistory = useCallback(async () => {
    try {
      setError(null);
      const loadedHistory = await HistoryManager.getAll();
      setHistory(loadedHistory);
    } catch (err) {
      setError(HISTORY_CONSTANTS.ERROR_MESSAGES.LOAD_FAILED);
      console.error('Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Add filing to history
  const addToHistory = useCallback(async (filing: Filing) => {
    try {
      await HistoryManager.add(filing);
      // Reload history to update UI
      await loadHistory();
    } catch (err) {
      console.error('Failed to add to history:', err);
      // Don't show error to user for add operations
    }
  }, [loadHistory]);

  // Remove single item from history
  const removeFromHistory = useCallback(async (filingId: string | number) => {
    try {
      await HistoryManager.remove(filingId);
      // Update local state immediately for better UX
      setHistory(prev => prev.filter(item => item.filing.id.toString() !== filingId.toString()));
    } catch (err) {
      setError(HISTORY_CONSTANTS.ERROR_MESSAGES.REMOVE_FAILED);
      console.error('Failed to remove from history:', err);
      // Reload history in case of error
      await loadHistory();
    }
  }, [loadHistory]);

  // Clear all history with confirmation
  const clearHistory = useCallback(() => {
    Alert.alert(
      HISTORY_CONSTANTS.ALERT_TITLES.CLEAR_HISTORY,
      HISTORY_CONSTANTS.ALERT_MESSAGES.CLEAR_CONFIRMATION,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await HistoryManager.clear();
              setHistory([]);
              Alert.alert(
                HISTORY_CONSTANTS.ALERT_TITLES.SUCCESS,
                HISTORY_CONSTANTS.SUCCESS_MESSAGES.HISTORY_CLEARED
              );
            } catch (err) {
              Alert.alert(
                HISTORY_CONSTANTS.ALERT_TITLES.ERROR,
                HISTORY_CONSTANTS.ERROR_MESSAGES.CLEAR_FAILED
              );
            }
          }
        }
      ]
    );
  }, []);

  // Refresh history (pull-to-refresh)
  const refreshHistory = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await loadHistory();
    } finally {
      setIsRefreshing(false);
    }
  }, [loadHistory]);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    isRefreshing,
    error,
    
    // Actions
    loadHistory,
    addToHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
    
    // Computed values
    historyCount: history.length,
    isEmpty: history.length === 0,
  };
}

/**
 * Hook to automatically add filing to history when viewing
 */
export function useAddToHistory(filing: Filing | null) {
  useEffect(() => {
    if (filing) {
      // Add to history without awaiting (fire and forget)
      HistoryManager.add(filing).catch(err => {
        console.error('Failed to add to history:', err);
      });
    }
  }, [filing?.id]); // Only re-run if filing ID changes
}