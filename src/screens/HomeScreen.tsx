import React, { useEffect, useCallback, useState, useMemo } from 'react';
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
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';
import { FilingCard } from '../components';
import { Filing, RootStackParamList, isProUser } from '../types';
import { RootState } from '../store';
import { fetchFilings, voteFiling, clearFilings, selectShouldRefresh, loadFilingTypeFilter } from '../store/slices/filingsSlice';
import { AppDispatch } from '../store';
import { colors, typography, spacing, borderRadius } from '../theme';
import apiClient from '../api/client';
import { useFilingVote } from '../hooks/useFilingVote';
import { storage } from '../utils/storage';

type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // FlatList ref for scroll control
  const flatListRef = React.useRef<FlatList>(null);
  
  // Redux state
  const { 
    filings = [], 
    isLoading = false, 
    isRefreshing = false, 
    hasMore = true, 
    error = null,
    currentPage = 1,
    filingTypeFilter = 'all', // 读取当前筛选类型
  } = useSelector((state: RootState) => state.filings || {});
  
  const { isAuthenticated = false, user } = useSelector((state: RootState) => state.auth || {});
  
  const isPro = isProUser(user);
  
  const shouldRefresh = useSelector(selectShouldRefresh);
  
  // 🔥 后端已经过滤，前端不需要再过滤
  const filteredFilings = useMemo(() => {
    console.log('📊 Displaying filings:', {
      filingTypeFilter,
      totalFilings: filings.length,
      filingTypes: filings.map(f => f.form_type).slice(0, 5)
    });
    
    return filings;
  }, [filings, filingTypeFilter]);
  
  // Search state
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<ReturnType<typeof setTimeout> | null>(null);
  
  // View limit state
  const [viewStats, setViewStats] = useState<{
    views_today: number;
    daily_limit: number;
    views_remaining: number;
    is_pro: boolean;
  } | null>(null);

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

  // 🔥 移除自动加载保存的过滤器 - 每次启动都默认 'all'
  // useEffect(() => {
  //   const loadSavedFilter = async () => {
  //     const savedFilter = await storage.get<'all' | '10-Q' | '10-K' | '8-K' | 'S-1'>('filingTypeFilter');
  //     if (savedFilter) {
  //       dispatch(loadFilingTypeFilter(savedFilter));
  //     }
  //   };
  //   loadSavedFilter();
  // }, [dispatch]);

  // 🔥 Workaround: Fix scroll issue after browser refresh (RN Web specific)
  useEffect(() => {
    // Only run in web environment
    // @ts-ignore - Web-only code, DOM types not available in RN
    if (typeof window !== 'undefined' && typeof document !== 'undefined' && filings.length > 0) {
      // Give React time to render
      const timer = setTimeout(() => {
        // Force recalculate container height
        // @ts-ignore - Web-only code
        const container = document.querySelector('[style*="flex"]');
        // @ts-ignore - Web-only code
        if (container && container.scrollHeight === container.offsetHeight) {
          console.log('🔧 Applying scroll fix for RN Web...');
          // @ts-ignore - Web-only code
          container.style.overflow = 'auto';
          // @ts-ignore - Web-only code
          container.style.height = '100vh';
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [filings.length]);

  // 🔥 确保初始状态为 'all'
  useEffect(() => {
    dispatch(loadFilingTypeFilter('all'));
  }, [dispatch]);

  // 🔥 主数据加载逻辑 - 监听认证状态和刷新需求
  useEffect(() => {
    if (isAuthenticated && (filings.length === 0 || shouldRefresh)) {
      dispatch(fetchFilings({ page: 1, isRefresh: true, formType: filingTypeFilter }));
      fetchViewStats();
    }
  }, [isAuthenticated, shouldRefresh, dispatch]);

  // 🔥 FIX: 确保登录后立即获取 viewStats（解决首次登录一直转圈的问题）
  useEffect(() => {
    if (isAuthenticated && !isPro && !viewStats) {
      console.log('📊 Fetching view stats for free user...');
      fetchViewStats();
    }
  }, [isAuthenticated, isPro, viewStats]);
  
  // 🔥 当过滤器改变时，清空并重新加载
  const prevFilterRef = React.useRef<string | undefined>(undefined);
  useEffect(() => {
    // 跳过初始化
    if (prevFilterRef.current === undefined) {
      prevFilterRef.current = filingTypeFilter;
      return;
    }
    
    // 过滤器改变时 - 直接用 isRefresh 覆盖数据，不清空
    if (prevFilterRef.current !== filingTypeFilter && isAuthenticated) {
      console.log('🔄 Filter changed:', prevFilterRef.current, '→', filingTypeFilter);
      dispatch(fetchFilings({ page: 1, isRefresh: true, formType: filingTypeFilter }));
      
      // 🔥 滚动到顶部
      setTimeout(() => {
        flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
      }, 100);
    }
    
    prevFilterRef.current = filingTypeFilter;
  }, [filingTypeFilter, isAuthenticated, dispatch]);

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
    await dispatch(fetchFilings({ page: 1, isRefresh: true, formType: filingTypeFilter }));
    fetchViewStats();
  }, [dispatch, filingTypeFilter]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    console.log('🔄 Load more triggered:', {
      isLoading,
      hasMore,
      filingsLength: filings.length,
      currentPage,
      filingTypeFilter
    });
    
    // 🔥 移除 filings.length > 0 的限制，允许空列表时加载
    if (!isLoading && hasMore) {
      console.log('✅ Loading more filings...');
      dispatch(fetchFilings({ page: currentPage + 1, isRefresh: false, formType: filingTypeFilter }));
    } else {
      console.log('❌ Cannot load more:', { isLoading, hasMore });
    }
  }, [dispatch, isLoading, hasMore, currentPage, filings.length, filingTypeFilter]);

  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id, initialFiling: filing });
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
    if (!isAuthenticated) return null;
    
    if (isPro || viewStats?.is_pro) return null;
    
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
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <FlatList
        ref={flatListRef}
        data={filteredFilings}
        renderItem={renderFiling}
        keyExtractor={(item) => item.id.toString()}
        style={{ flex: 1 } as any}  // 🔥 确保 FlatList 占满容器
        contentContainerStyle={styles.listContent}
        
        // 🔥 禁用虚拟化，显示所有卡片
        removeClippedSubviews={false}
        initialNumToRender={20}
        maxToRenderPerBatch={20}
        windowSize={21}
        
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
    backgroundColor: colors.beige, // 🎨 修改：使用米色背景
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