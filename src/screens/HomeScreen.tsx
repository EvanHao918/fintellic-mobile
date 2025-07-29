import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';
import { FilingCard } from '../components';
import { Filing, RootStackParamList } from '../types';
import { RootState } from '../store';
import { fetchFilings, voteFiling, clearFilings } from '../store/slices/filingsSlice';
import { updateFilings } from '../store/slices/globalFilingsSlice';
import { AppDispatch } from '../store';
import { colors, typography, spacing } from '../theme';
import apiClient from '../api/client';
import { useFilingVote } from '../hooks/useFilingVote';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state
  const { 
    filings = [], 
    isLoading = false, 
    isRefreshing = false, 
    hasMore = true, 
    error = null,
    currentPage = 1,
  } = useSelector((state: RootState) => state.filings || {});
  
  const { isAuthenticated = false } = useSelector((state: RootState) => state.auth || {});
  
  // 获取全局filings状态
  const globalFilings = useSelector((state: RootState) => state.globalFilings.filingsById);
  
  // 本地状态用于存储同步后的filings
  const [localFilings, setLocalFilings] = useState<Filing[]>([]);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);

  // 使用共享的投票 hook
  const { handleVote } = useFilingVote();

  // Load initial data
  useEffect(() => {
    if (isAuthenticated && filings.length === 0) {
      dispatch(fetchFilings({ page: 1, isRefresh: true }));
    }
  }, [isAuthenticated]);
  
  // 当主页加载数据时，同步到全局状态
  useEffect(() => {
    if (filings.length > 0) {
      dispatch(updateFilings(filings));
      setLocalFilings(filings);
    }
  }, [filings, dispatch]);
  
  // 监听全局状态变化，更新本地显示
  useEffect(() => {
    const updatedFilings = localFilings.map(filing => {
      const globalFiling = globalFilings[filing.id.toString()];
      if (globalFiling) {
        return {
          ...filing,
          vote_counts: globalFiling.vote_counts || filing.vote_counts,
          user_vote: globalFiling.user_vote !== undefined ? globalFiling.user_vote : filing.user_vote
        };
      }
      return filing;
    });
    
    // 只有当数据真的变化时才更新
    const hasChanges = updatedFilings.some((filing, index) => {
      const original = localFilings[index];
      return JSON.stringify(filing.vote_counts) !== JSON.stringify(original.vote_counts) ||
             filing.user_vote !== original.user_vote;
    });
    
    if (hasChanges) {
      setLocalFilings(updatedFilings);
    }
  }, [globalFilings]);

  // Perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await apiClient.get('/companies/', {
        params: { search: query, limit: 10 }
      });
      setSearchResults(response || []);
    } catch (error) {
      console.error('Search failed:', error);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change with debounce
  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    
    if (searchTimer) {
      clearTimeout(searchTimer);
    }
    
    const newTimer = setTimeout(() => {
      performSearch(text);
    }, 300);
    
    setSearchTimer(newTimer);
  };

  // Navigate to company filings
  const handleSelectCompany = (company: any) => {
    setShowSearch(false);
    setSearchQuery('');
    setSearchResults([]);
    Keyboard.dismiss();
    
    navigation.navigate('CompanyFilings', { 
      ticker: company.ticker,
      companyName: company.name 
    });
  };

  // Handle refresh
  const handleRefresh = useCallback(async () => {
    dispatch(clearFilings());
    await dispatch(fetchFilings({ page: 1, isRefresh: true }));
  }, [dispatch]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && filings.length > 0) {
      dispatch(fetchFilings({ page: currentPage + 1, isRefresh: false }));
    }
  }, [dispatch, isLoading, hasMore, currentPage, filings.length]);

  // Handle filing press
  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  // Render filing item - 使用localFilings
  const renderFiling = useCallback(({ item }: { item: Filing }) => (
    <FilingCard
      filing={item}
      onPress={() => handleFilingPress(item)}
      onVote={handleVote}
    />
  ), [handleFilingPress, handleVote]);
  
  // Render footer
  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  // Render empty state
  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyTitle}>No filings yet</Text>
        <Text style={styles.emptyText}>
          {isAuthenticated 
            ? "Check back soon for the latest financial reports"
            : "Please login to view filings"
          }
        </Text>
        {!isAuthenticated && (
          <TouchableOpacity 
            style={styles.loginButton}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginButtonText}>Login</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  // Render error state
  if (error && (!filings || filings.length === 0)) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={handleRefresh}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={localFilings}
        renderItem={renderFiling}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
        extraData={globalFilings} // 确保全局状态变化时重新渲染
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xxxl * 2,
  },
  emptyTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  loginButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  errorText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
});

export default HomeScreen;