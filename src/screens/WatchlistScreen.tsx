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
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiClient from '../api/client';

// Updated Types based on new API
interface WatchedCompany {
  ticker: string;
  name: string;
  sector?: string;
  industry?: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  indices: string[];
  added_at: string;
  last_filing?: {
    filing_type: string;
    filing_date: string;
    sentiment?: string;
  };
}

interface CompanySearchResult {
  ticker: string;
  name: string;
  sector?: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  indices: string[];
  is_watchlisted: boolean;
}

export default function WatchlistScreen() {
  const user = useSelector((state: RootState) => state.auth.user);
  
  const [watchlist, setWatchlist] = useState<WatchedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [watchlistCount, setWatchlistCount] = useState(0);

  // Load watchlist
  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      // API client now returns data directly
      const data = await apiClient.get<WatchedCompany[]>('/watchlist/');
      setWatchlist(data || []);
      setWatchlistCount(data?.length || 0);
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      Alert.alert('Error', 'Failed to load watchlist');
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

  // Search companies using new endpoint
  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // API client now returns data directly
      const data = await apiClient.get<CompanySearchResult[]>('/watchlist/search', {
        params: { q: query, limit: 20 }
      });
      setSearchResults(data || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  // Add to watchlist
  const addToWatchlist = async (ticker: string) => {
    try {
      // API client now returns data directly
      const data = await apiClient.post<{ message: string }>(`/watchlist/${ticker}`);
      Alert.alert('Success', data.message);
      
      // Update local state
      loadWatchlist();
      
      // Update search results to reflect watchlist status
      setSearchResults(searchResults.map(company => 
        company.ticker === ticker 
          ? { ...company, is_watchlisted: true }
          : company
      ));
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.message || 'Failed to add to watchlist'
      );
    }
  };

  // Remove from watchlist
  const removeFromWatchlist = async (ticker: string) => {
    Alert.alert(
      'Remove from Watchlist',
      `Are you sure you want to remove ${ticker} from your watchlist?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              // API client now returns data directly
              const data = await apiClient.delete<{ message: string }>(`/watchlist/${ticker}`);
              Alert.alert('Success', data.message);
              loadWatchlist();
            } catch (error: any) {
              Alert.alert(
                'Error',
                error.message || 'Failed to remove from watchlist'
              );
            }
          }
        }
      ]
    );
  };

  // Render watchlist item
  const renderWatchlistItem = ({ item }: { item: WatchedCompany }) => {
    const indicesText = item.indices.join(' • ');
    
    return (
      <TouchableOpacity style={styles.watchlistItem}>
        <View style={styles.companyInfo}>
          <View style={styles.companyHeader}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            <View style={styles.indicesBadge}>
              <Text style={styles.indicesText}>{indicesText}</Text>
            </View>
          </View>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.sector && (
            <Text style={styles.sector}>{item.sector}</Text>
          )}
          {item.last_filing && (
            <View style={styles.filingInfo}>
              <Icon name="description" type="material" size={14} color={colors.textSecondary} />
              <Text style={styles.filingText}>
                {item.last_filing.filing_type} • {new Date(item.last_filing.filing_date).toLocaleDateString()}
              </Text>
            </View>
          )}
        </View>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => removeFromWatchlist(item.ticker)}
        >
          <Icon name="remove-circle-outline" type="material" size={24} color={colors.error} />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  // Render search result
  const renderSearchResult = ({ item }: { item: CompanySearchResult }) => {
    const indicesText = item.indices.join(' • ');
    
    return (
      <TouchableOpacity 
        style={styles.searchResultItem}
        onPress={() => !item.is_watchlisted && addToWatchlist(item.ticker)}
        disabled={item.is_watchlisted}
      >
        <View style={styles.companyInfo}>
          <View style={styles.companyHeader}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            <View style={styles.indicesBadge}>
              <Text style={styles.indicesText}>{indicesText}</Text>
            </View>
          </View>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.sector && (
            <Text style={styles.sector}>{item.sector}</Text>
          )}
        </View>
        {item.is_watchlisted ? (
          <View style={styles.watchedBadge}>
            <Icon name="check" type="material" size={16} color={colors.success} />
            <Text style={styles.watchedText}>Watching</Text>
          </View>
        ) : (
          <Icon name="add-circle-outline" type="material" size={24} color={colors.primary} />
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
        Add S&P 500 or NASDAQ 100 companies to track their filings
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
            {watchlistCount} {watchlistCount === 1 ? 'company' : 'companies'}
          </Text>
        </View>
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
      </View>

      {/* Search */}
      {showSearch && (
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" type="material" size={20} color={colors.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search S&P 500 or NASDAQ 100 companies"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                searchCompanies(text);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Icon name="close" type="material" size={20} color={colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          
          {isSearching ? (
            <ActivityIndicator style={styles.searchLoading} color={colors.primary} />
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.ticker}
              style={styles.searchResults}
              keyboardShouldPersistTaps="handled"
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
  addIconButton: {
    padding: spacing.sm,
  },
  searchContainer: {
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
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  searchLoading: {
    marginVertical: spacing.md,
  },
  searchResults: {
    maxHeight: 300,
    marginBottom: spacing.md,
  },
  noResults: {
    textAlign: 'center',
    color: colors.textSecondary,
    fontSize: typography.fontSize.sm,
    marginVertical: spacing.md,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.white,
  },
  companyInfo: {
    flex: 1,
  },
  companyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  ticker: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
    marginRight: spacing.sm,
  },
  indicesBadge: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  indicesText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
    fontFamily: typography.fontFamily.medium,
  },
  companyName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  sector: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  filingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  filingText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
  },
  removeButton: {
    padding: spacing.sm,
  },
  watchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray100,  // 使用已定义的颜色
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md,
  },
  watchedText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    marginLeft: spacing.xs,
    fontFamily: typography.fontFamily.medium,
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
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.medium,
    marginLeft: spacing.sm,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
});