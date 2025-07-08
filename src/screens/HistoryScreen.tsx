import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { colors, typography, spacing, borderRadius } from '../theme';
import { FilingCard } from '../components';
import { Filing, RootStackParamList } from '../types';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

// History item with timestamp
interface HistoryItem {
  filing: Filing;
  viewedAt: string;
}

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Load history from AsyncStorage
  const loadHistory = async () => {
    try {
      const historyData = await AsyncStorage.getItem('@fintellic_history');
      if (historyData) {
        const parsedHistory: HistoryItem[] = JSON.parse(historyData);
        // Sort by most recent first
        parsedHistory.sort((a, b) => 
          new Date(b.viewedAt).getTime() - new Date(a.viewedAt).getTime()
        );
        setHistory(parsedHistory);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadHistory();
    
    // Reload history when screen comes into focus
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    
    return unsubscribe;
  }, [navigation]);

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  // Clear history
  const clearHistory = () => {
    Alert.alert(
      'Clear History',
      'Are you sure you want to clear all browsing history?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.removeItem('@fintellic_history');
              setHistory([]);
              Alert.alert('Success', 'History cleared');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear history');
            }
          }
        }
      ]
    );
  };

  // Remove single item from history
  const removeFromHistory = async (filingId: string) => {
    try {
      const updatedHistory = history.filter(item => item.filing.id !== filingId);
      await AsyncStorage.setItem('@fintellic_history', JSON.stringify(updatedHistory));
      setHistory(updatedHistory);
    } catch (error) {
      console.error('Failed to remove item from history:', error);
    }
  };

  // Navigate to filing detail
  const handleFilingPress = (filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    
    return past.toLocaleDateString();
  };

  // Group history by date
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    items.forEach(item => {
      const date = new Date(item.viewedAt);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let key: string;
      if (date.toDateString() === today.toDateString()) {
        key = 'Today';
      } else if (date.toDateString() === yesterday.toDateString()) {
        key = 'Yesterday';
      } else {
        key = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }
      
      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(item);
    });
    
    return groups;
  };

  // Render history item
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyItem}>
      <Text style={styles.viewedTime}>{formatTimeAgo(item.viewedAt)}</Text>
      <FilingCard
        filing={item.filing}
        onPress={() => handleFilingPress(item.filing)}
      />
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromHistory(item.filing.id)}
      >
        <Icon name="close" type="material" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
    </View>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="history" type="material" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No History Yet</Text>
      <Text style={styles.emptyText}>
        Filings you view will appear here
      </Text>
    </View>
  );

  // Render section header
  const renderSectionHeader = (date: string) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{date}</Text>
    </View>
  );

  // Group history for display
  const groupedHistory = groupHistoryByDate(history);
  const sections = Object.entries(groupedHistory);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>History</Text>
          <Text style={styles.headerSubtitle}>
            {history.length} {history.length === 1 ? 'filing' : 'filings'} viewed
          </Text>
        </View>
        {history.length > 0 && (
          <TouchableOpacity onPress={clearHistory} style={styles.clearButton}>
            <Icon name="delete-outline" type="material" size={24} color={colors.error} />
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* History List */}
      {sections.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item[0]}
          renderItem={({ item: [date, items] }) => (
            <View>
              {renderSectionHeader(date)}
              {items.map((historyItem) => (
                <View key={historyItem.filing.id}>
                  {renderHistoryItem({ item: historyItem })}
                </View>
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={history.length === 0 ? styles.emptyListContainer : undefined}
        />
      ) : (
        <View style={styles.emptyListContainer}>
          {renderEmptyState()}
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.sm,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  historyItem: {
    position: 'relative',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  viewedTime: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.md,
    marginBottom: spacing.xs,
  },
  removeButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.md,
    padding: spacing.sm,
    zIndex: 1,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});