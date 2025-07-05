import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useDispatch, useSelector } from 'react-redux';
import { FilingCard } from '../components';
import { Filing } from '../types';
import { RootState } from '../store';
import { fetchFilings, voteFiling } from '../store/slices/filingsSlice';
import { AppDispatch } from '../store';
import { colors, typography, spacing } from '../theme';

type HomeScreenNavigationProp = StackNavigationProp<any, 'Home'>;

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux state with default values
  const { 
    filings = [], 
    isLoading = false, 
    isRefreshing = false, 
    hasMore = true, 
    error = null 
  } = useSelector((state: RootState) => state.filings || {});
  
  const { isAuthenticated = false } = useSelector((state: RootState) => state.auth || {});
  
  // Local state
  const [page, setPage] = useState(1);

  // Load initial data
  useEffect(() => {
    if (isAuthenticated) {
      loadFilings(1, true);
    }
  }, [isAuthenticated]);

  // Load filings
  const loadFilings = useCallback(async (pageNum: number, isRefresh = false) => {
    try {
      await dispatch(fetchFilings({ page: pageNum, isRefresh })).unwrap();
      if (!isRefresh) {
        setPage(pageNum);
      } else {
        setPage(1);
      }
    } catch (error) {
      console.error('Failed to load filings:', error);
    }
  }, [dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    loadFilings(1, true);
  }, [loadFilings]);

  // Handle load more - with safe length check
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && filings && filings.length > 0) {
      loadFilings(page + 1);
    }
  }, [isLoading, hasMore, page, filings, loadFilings]);

  // Handle filing press
  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  // Handle vote
  const handleVote = useCallback(async (filingId: string, voteType: 'bullish' | 'neutral' | 'bearish') => {
    if (!isAuthenticated) {
      navigation.navigate('Login');
      return;
    }
    
    try {
      await dispatch(voteFiling({ filingId, voteType })).unwrap();
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  }, [dispatch, isAuthenticated, navigation]);

  // Render filing item
  const renderFiling = useCallback(({ item }: { item: Filing }) => (
    <FilingCard
      filing={item}
      onPress={() => handleFilingPress(item)}
      onVote={(filingId: string, voteType: 'bullish' | 'neutral' | 'bearish') => handleVote(filingId, voteType)}
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

  // Render error state - with safe length check
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
      <View style={styles.header}>
        <Text style={styles.title}>Latest Filings</Text>
        <Text style={styles.subtitle}>5-minute summaries of financial reports</Text>
      </View>
      
      <FlatList
        data={filings || []}
        renderItem={renderFiling}
        keyExtractor={(item) => item.id}
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
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  listContent: {
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