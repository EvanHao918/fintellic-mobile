import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../utils/constants';

// Types
interface WatchedCompany {
  ticker: string;
  name: string;
  sector?: string;
  last_filing?: {
    filing_type: string;
    filing_date: string;
    sentiment?: string;
  };
  upcoming_earnings?: string;
}

export default function WatchlistScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.auth.user);
  const isProUser = user?.is_pro || false;
  
  const [watchlist, setWatchlist] = useState<WatchedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Free user limit
  const WATCHLIST_LIMIT_FREE = 5;
  const canAddMore = isProUser || watchlist.length < WATCHLIST_LIMIT_FREE;

  // Load watchlist
  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get('/watchlist');
      setWatchlist(response.data || []);
      
      // Also save to local storage for offline access
      await AsyncStorage.setItem(
        '@fintellic_watchlist',
        JSON.stringify(response.data || [])
      );
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      // Try to load from local storage
      try {
        const localData = await AsyncStorage.getItem('@fintellic_watchlist');
        if (localData) {
          setWatchlist(JSON.parse(localData));
        }
      } catch (localError) {
        console.error('Failed to load local watchlist:', localError);
      }
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadWatchlist();
  };

  // Search companies
  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get('/companies/search', {
        params: { q: query }
      });
      setSearchResults(response.data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (ticker: string, companyName: string) => {
    if (!canAddMore) {
      Alert.alert(
        'Watchlist Limit',
        `Free users can watch up to ${WATCHLIST_LIMIT_FREE} companies. Upgrade to Pro for unlimited watchlist.`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade to Pro', onPress: () => {/* Navigate to upgrade */} }
        ]
      );
      return;
    }

    try {
      await apiClient.post(`/watchlist/${ticker}`);
      
      // Add to local state
      const newCompany: WatchedCompany = {
        ticker,
        name: companyName,
      };
      setWatchlist([...watchlist, newCompany]);
      
      // Clear search
      setShowSearch(false);
      setSearchQuery('');
      setSearchResults([]);
      
      // Refresh to get full data
      loadWatchlist();
    } catch (error) {
      Alert.alert('Error', 'Failed to add company to watchlist');
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (ticker: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to stop watching ${ticker}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/watchlist/${ticker}`);
              setWatchlist(watchlist.filter(c => c.ticker !== ticker));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove company from watchlist');
            }
          }
        }
      ]
    );
  };

  // Get sentiment color
  const getSentimentColor = (sentiment?: string) => {
    switch (sentiment) {
      case 'bullish': return colors.bullish;
      case 'bearish': return colors.bearish;
      default: return colors.neutral;
    }
  };

  // Render watchlist item
  const renderWatchlistItem = ({ item }: { item: WatchedCompany }) => (
    <TouchableOpacity style={styles.watchlistItem}>
      <View style={styles.itemLeft}>
        <View style={styles.tickerContainer}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          {item.sector && (
            <Text style={styles.sector}>{item.sector}</Text>
          )}
        </View>
        <Text style={styles.companyName} numberOfLines={1}>
          {item.name}
        </Text>
        
        {item.last_filing && (
          <View style={styles.filingInfo}>
            <View style={[styles.filingBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.filingBadgeText}>{item.last_filing.filing_type}</Text>
            </View>
            <Text style={styles.filingDate}>
              {new Date(item.last_filing.filing_date).toLocaleDateString()}
            </Text>
            {item.last_filing.sentiment && (
              <View style={[
                styles.sentimentDot,
                { backgroundColor: getSentimentColor(item.last_filing.sentiment) }
              ]} />
            )}
          </View>
        )}
        
        {item.upcoming_earnings && (
          <View style={styles.earningsInfo}>
            <Icon name="event" type="material" size={14} color={colors.warning} />
            <Text style={styles.earningsText}>
              Earnings: {new Date(item.upcoming_earnings).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
      
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => removeFromWatchlist(item.ticker)}
      >
        <Icon name="close" type="material" size={20} color={colors.error} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  // Render search result
  const renderSearchResult = ({ item }: { item: any }) => {
    const isWatched = watchlist.some(w => w.ticker === item.ticker);
    
    return (
      <TouchableOpacity
        style={styles.searchResult}
        onPress={() => {
          if (!isWatched) {
            addToWatchlist(item.ticker, item.name);
          }
        }}
        disabled={isWatched}
      >
        <View style={styles.itemLeft}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          <Text style={styles.companyName} numberOfLines={1}>{item.name}</Text>
        </View>
        {isWatched ? (
          <Text style={styles.watchedText}>Watching</Text>
        ) : (
          <Icon name="add" type="material" size={24} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Icon name="star-border" type="material" size={64} color={colors.textSecondary} />
      <Text style={styles.emptyTitle}>No Companies in Watchlist</Text>
      <Text style={styles.emptyText}>
        Add companies to get notified about their earnings and filings
      </Text>
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setShowSearch(true)}
      >
        <Icon name="add" type="material" size={20} color={colors.white} />
        <Text style={styles.addButtonText}>Add Companies</Text>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading watchlist...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>My Watchlist</Text>
          <Text style={styles.headerSubtitle}>
            {watchlist.length} {watchlist.length === 1 ? 'company' : 'companies'}
            {!isProUser && ` (${watchlist.length}/${WATCHLIST_LIMIT_FREE})`}
          </Text>
        </View>
        {canAddMore && (
          <TouchableOpacity
            style={styles.addIconButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon 
              name={showSearch ? "close" : "add"} 
              type="material" 
              size={24} 
              color={colors.primary} 
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" type="material" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by ticker or company name"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchCompanies(text);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
          </View>
          
          {isSearching ? (
            <ActivityIndicator style={styles.searchLoading} color={colors.primary} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.ticker}
              style={styles.searchResults}
            />
          ) : searchQuery.length > 0 ? (
            <Text style={styles.noResults}>No companies found</Text>
          ) : null}
        </View>
      )}

      {/* Watchlist */}
      <FlatList
        data={watchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item) => item.ticker}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={watchlist.length === 0 ? styles.emptyListContainer : undefined}
      />

      {/* Pro upgrade prompt */}
      {!isProUser && watchlist.length >= WATCHLIST_LIMIT_FREE && (
        <TouchableOpacity style={styles.upgradePrompt}>
          <Icon name="star" type="material" size={20} color={colors.warning} />
          <Text style={styles.upgradeText}>
            Upgrade to Pro for unlimited watchlist
          </Text>
          <Icon name="chevron-right" type="material" size={20} color={colors.white} />
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
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
  addIconButton: {
    padding: spacing.sm,
  },
  searchContainer: {
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  searchLoading: {
    marginTop: spacing.md,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: spacing.sm,
  },
  searchResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  noResults: {
    textAlign: 'center',
    marginTop: spacing.md,
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
  },
  watchedText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontStyle: 'italic',
  },
  watchlistItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemLeft: {
    flex: 1,
  },
  tickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ticker: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  sector: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  filingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  filingBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  filingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  filingDate: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  sentimentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  earningsInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  earningsText: {
    fontSize: typography.fontSize.xs,
    color: colors.warning,
    marginLeft: spacing.xs,
  },
  removeButton: {
    padding: spacing.sm,
  },
  emptyListContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
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
    marginBottom: spacing.lg,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.xs,
  },
  upgradePrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    padding: spacing.md,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  upgradeText: {
    flex: 1,
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.sm,
  },
});