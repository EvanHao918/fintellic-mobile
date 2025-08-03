// src/utils/historyManager.ts

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Filing } from '../types';
import { HISTORY_CONSTANTS } from '../constants/history';

// History item with timestamp
export interface HistoryItem {
  filing: Filing;
  viewedAt: string;
}

/**
 * HistoryManager class for managing filing view history
 * Handles all history-related operations with AsyncStorage
 */
export class HistoryManager {
  /**
   * Add a filing to history
   * Removes duplicates and maintains max limit
   */
  static async add(filing: Filing): Promise<void> {
    try {
      // Get existing history
      const history = await this.getAll();
      
      // Remove existing entry for the same filing if exists
      const filteredHistory = history.filter(item => item.filing.id !== filing.id);
      
      // Create new history item
      const newItem: HistoryItem = {
        filing,
        viewedAt: new Date().toISOString(),
      };
      
      // Add new item to the beginning
      const updatedHistory = [newItem, ...filteredHistory];
      
      // Keep only the most recent items up to the limit
      const limitedHistory = updatedHistory.slice(0, HISTORY_CONSTANTS.MAX_HISTORY_ITEMS);
      
      // Save to AsyncStorage
      await AsyncStorage.setItem(
        HISTORY_CONSTANTS.STORAGE_KEY,
        JSON.stringify(limitedHistory)
      );
    } catch (error) {
      console.error(HISTORY_CONSTANTS.ERROR_MESSAGES.ADD_FAILED, error);
      throw error;
    }
  }

  /**
   * Get all history items
   * Returns sorted list by most recent first
   */
  static async getAll(): Promise<HistoryItem[]> {
    try {
      const historyData = await AsyncStorage.getItem(HISTORY_CONSTANTS.STORAGE_KEY);
      
      if (!historyData) {
        return [];
      }
      
      const history: HistoryItem[] = JSON.parse(historyData);
      
      // Sort by most recent first (in case data gets corrupted)
      history.sort((a, b) => 
        new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
      );
      
      return history;
    } catch (error) {
      console.error(HISTORY_CONSTANTS.ERROR_MESSAGES.LOAD_FAILED, error);
      return [];
    }
  }

  /**
   * Remove a specific filing from history
   */
  static async remove(filingId: number | string): Promise<void> {
    try {
      const history = await this.getAll();
      const updatedHistory = history.filter(item => item.filing.id.toString() !== filingId.toString());
      
      await AsyncStorage.setItem(
        HISTORY_CONSTANTS.STORAGE_KEY,
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      console.error(HISTORY_CONSTANTS.ERROR_MESSAGES.REMOVE_FAILED, error);
      throw error;
    }
  }

  /**
   * Clear all history
   */
  static async clear(): Promise<void> {
    try {
      await AsyncStorage.removeItem(HISTORY_CONSTANTS.STORAGE_KEY);
    } catch (error) {
      console.error(HISTORY_CONSTANTS.ERROR_MESSAGES.CLEAR_FAILED, error);
      throw error;
    }
  }

  /**
   * Check if a filing exists in history
   */
  static async exists(filingId: number | string): Promise<boolean> {
    try {
      const history = await this.getAll();
      return history.some(item => item.filing.id.toString() === filingId.toString());
    } catch (error) {
      console.error('Failed to check history existence:', error);
      return false;
    }
  }

  /**
   * Get history count
   */
  static async getCount(): Promise<number> {
    try {
      const history = await this.getAll();
      return history.length;
    } catch (error) {
      console.error('Failed to get history count:', error);
      return 0;
    }
  }

  /**
   * Get the most recent history item
   */
  static async getMostRecent(): Promise<HistoryItem | null> {
    try {
      const history = await this.getAll();
      return history.length > 0 ? history[0] : null;
    } catch (error) {
      console.error('Failed to get most recent history:', error);
      return null;
    }
  }

  /**
   * Update the viewedAt timestamp for an existing filing
   */
  static async updateTimestamp(filingId: number | string): Promise<void> {
    try {
      const history = await this.getAll();
      const existingItem = history.find(item => item.filing.id.toString() === filingId.toString());
      
      if (existingItem) {
        // Remove the old entry and add with new timestamp
        await this.remove(filingId);
        await this.add(existingItem.filing);
      }
    } catch (error) {
      console.error('Failed to update timestamp:', error);
      throw error;
    }
  }

  /**
   * Get history grouped by date
   */
  static async getGroupedByDate(): Promise<{ [key: string]: HistoryItem[] }> {
    try {
      const history = await this.getAll();
      const groups: { [key: string]: HistoryItem[] } = {};
      
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      history.forEach(item => {
        const date = new Date(item.viewedAt);
        let key: string;
        
        if (date.toDateString() === today.toDateString()) {
          key = HISTORY_CONSTANTS.DATE_GROUPS.TODAY;
        } else if (date.toDateString() === yesterday.toDateString()) {
          key = HISTORY_CONSTANTS.DATE_GROUPS.YESTERDAY;
        } else {
          key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        }
        
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
      });
      
      return groups;
    } catch (error) {
      console.error('Failed to get grouped history:', error);
      return {};
    }
  }
}