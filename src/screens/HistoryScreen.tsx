import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing, borderRadius } from '../theme';
import { FilingCard } from '../components';
import { RootStackParamList } from '../types';
import { useHistory } from '../hooks/useHistory';
import { HistoryManager, HistoryItem } from '../utils/historyManager';
import { HISTORY_CONSTANTS } from '../constants/history';

type HistoryScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export default function HistoryScreen() {
  const navigation = useNavigation<HistoryScreenNavigationProp>();
  
  // Use the history hook for state management
  const {
    history,
    isLoading,
    isRefreshing,
    isClearing, // 从 hook 中获取清除状态
    error,
    loadHistory,
    removeFromHistory,
    clearHistory,
    refreshHistory,
    historyCount,
    isEmpty,
  } = useHistory();

  // Reload history when screen comes into focus
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadHistory();
    });
    
    return unsubscribe;
  }, [navigation, loadHistory]);

  // Navigate to filing detail
  const handleFilingPress = (item: HistoryItem) => {
    navigation.navigate('FilingDetail', { filingId: item.filing.id });
  };

  // Format time ago
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);

    if (diffInSeconds < HISTORY_CONSTANTS.TIME_THRESHOLDS.JUST_NOW) {
      return 'just now';
    }
    if (diffInSeconds < HISTORY_CONSTANTS.TIME_THRESHOLDS.MINUTES) {
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    }
    if (diffInSeconds < HISTORY_CONSTANTS.TIME_THRESHOLDS.HOURS) {
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    }
    if (diffInSeconds < HISTORY_CONSTANTS.TIME_THRESHOLDS.DAYS) {
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }
    
    return past.toLocaleDateString();
  };

  // Group history by date
  const groupHistoryByDate = (items: HistoryItem[]) => {
    const groups: { [key: string]: HistoryItem[] } = {};
    
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    items.forEach(item => {
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
  };

  // Render history item
  const renderHistoryItem = ({ item }: { item: HistoryItem }) => (
    <View style={styles.historyItem}>
      <Text style={styles.viewedTime}>{formatTimeAgo(item.viewedAt)}</Text>
      <FilingCard
        filing={item.filing}
        onPress={() => handleFilingPress(item)}
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

  // Render loading state
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>History</Text>
            <Text style={styles.headerSubtitle}>Loading...</Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
            {historyCount} {historyCount === 1 ? 'filing' : 'filings'} viewed
          </Text>
        </View>
        {!isEmpty && (
          <TouchableOpacity 
            onPress={clearHistory} 
            style={[styles.clearButton, isClearing && styles.clearButtonDisabled]}
            disabled={isClearing}
          >
            {isClearing ? (
              <ActivityIndicator size="small" color={colors.error} />
            ) : (
              <Icon name="delete-outline" type="material" size={24} color={colors.error} />
            )}
            <Text style={[styles.clearButtonText, isClearing && styles.clearButtonTextDisabled]}>
              {isClearing ? 'Clearing...' : 'Clear'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Error message if any */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* History List */}
      {sections.length > 0 ? (
        <FlatList
          data={sections}
          keyExtractor={(item) => item[0]}
          renderItem={({ item: [date, items] }) => (
            <View>
              {renderSectionHeader(date)}
              {items.map((historyItem) => (
                <View key={`${historyItem.filing.id}-${historyItem.viewedAt}`}>
                  {renderHistoryItem({ item: historyItem })}
                </View>
              ))}
            </View>
          )}
          refreshControl={
            <RefreshControl 
              refreshing={isRefreshing} 
              onRefresh={refreshHistory}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={isEmpty ? styles.emptyListContainer : undefined}
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
    backgroundColor: colors.white,
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
  clearButtonDisabled: {
    opacity: 0.5,
  },
  clearButtonText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.error,
    marginLeft: spacing.xs,
  },
  clearButtonTextDisabled: {
    opacity: 0.7,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorBanner: {
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.error + '20',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    textAlign: 'center',
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