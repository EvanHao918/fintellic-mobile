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
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';
import { FilingCard } from '../components';
import { Filing, RootStackParamList, isProUser } from '../types'; // 导入isProUser辅助函数
import { RootState } from '../store';
import { fetchFilings, voteFiling, clearFilings, selectShouldRefresh } from '../store/slices/filingsSlice';
import { AppDispatch } from '../store';
import { colors, typography, spacing, borderRadius } from '../theme';
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
  
  const { isAuthenticated = false, user } = useSelector((state: RootState) => state.auth || {});
  
  // 🔥 关键修复：使用统一的isProUser函数
  const isPro = isProUser(user);
  
  // 检查是否需要刷新
  const shouldRefresh = useSelector(selectShouldRefresh);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  
  // View limit state
  const [viewStats, setViewStats] = useState<{
    views_today: number;
    daily_limit: number;
    views_remaining: number;
    is_pro: boolean;
  } | null>(null);

  // 使用投票 hook
  const { handleVote } = useFilingVote();

  // Fetch view stats
  const fetchViewStats = async () => {
    if (isAuthenticated) {
      try {
        const response = await apiClient.get('/filings/user/view-stats');
        console.log('View stats response:', response);
        setViewStats(response);
      } catch (error) {
        console.log('Failed to fetch view stats:', error);
      }
    }
  };

  // 🔥 关键修复：使用 useFocusEffect 确保每次返回首页时刷新计数
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        fetchViewStats();
      }
    }, [isAuthenticated])
  );

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      if (filings.length === 0 || shouldRefresh) {
        dispatch(fetchFilings({ page: 1, isRefresh: true }));
      }
      // 初始加载时也获取view stats
      fetchViewStats();
    }
  }, [isAuthenticated, dispatch, shouldRefresh]);

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
    // 刷新时也更新view stats
    fetchViewStats();
  }, [dispatch]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && filings.length > 0) {
      dispatch(fetchFilings({ page: currentPage + 1, isRefresh: false }));
    }
  }, [dispatch, isLoading, hasMore, currentPage, filings.length]);

  // 导航时传递回调以在返回时刷新
  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  // Render filing item
  const renderFiling = useCallback(({ item }: { item: Filing }) => (
    <FilingCard
      filing={item}
      onPress={() => handleFilingPress(item)}
      isProUser={isPro}
    />
  ), [handleFilingPress, isPro]);
  
  // Render header with view limit info
  const renderHeader = () => {
    // 🔥 关键修复：Pro用户不显示限制信息
    if (!isAuthenticated) return null;
    
    // 如果是Pro用户或者API返回is_pro为true，不显示限制
    if (isPro || viewStats?.is_pro) return null;
    
    // 只有Free用户显示限制信息
    if (viewStats && viewStats.views_remaining !== undefined) {
      const isLimitReached = viewStats.views_remaining === 0;
      
      return (
        <View style={[styles.limitBanner, isLimitReached && styles.limitBannerWarning]}>
          <View style={styles.limitBannerContent}>
            <Icon 
              name={isLimitReached ? "lock" : "visibility"} 
              size={20} 
              color={isLimitReached ? colors.warning : colors.primary} 
            />
            <Text style={[styles.limitBannerText, isLimitReached && styles.limitBannerTextWarning]}>
              {isLimitReached 
                ? "Daily limit reached - Upgrade to Pro for unlimited access"
                : `${viewStats.views_remaining} of ${viewStats.daily_limit} free reports remaining today`
              }
            </Text>
          </View>
          {isLimitReached && (
            <TouchableOpacity 
              style={styles.upgradeButton}
              onPress={() => navigation.navigate('Subscription' as any)}
            >
              <Text style={styles.upgradeButtonText}>Upgrade</Text>
            </TouchableOpacity>
          )}
        </View>
      );
    }
    
    // 如果还没有加载stats（仅对Free用户显示）
    if (!isPro && !viewStats) {
      return (
        <View style={styles.limitBanner}>
          <View style={styles.limitBannerContent}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.limitBannerText}>Loading view limit...</Text>
          </View>
        </View>
      );
    }
    
    return null;
  };
  
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
            onPress={() => navigation.navigate('Login' as any)}
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
        data={filings}
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
        ListHeaderComponent={renderHeader}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
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
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  limitBanner: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.md,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitBannerWarning: {
    backgroundColor: colors.warning + '10',
  },
  limitBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  limitBannerText: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  limitBannerTextWarning: {
    color: colors.warning,
    fontWeight: typography.fontWeight.semibold,
  },
  upgradeButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
  },
  upgradeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
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