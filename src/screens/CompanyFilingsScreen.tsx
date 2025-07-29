// src/screens/CompanyFilingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { useRoute, useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Icon } from 'react-native-elements';
import { useDispatch, useSelector } from 'react-redux';
import FilingCard from '../components/FilingCard';
import { colors, typography, spacing } from '../theme';
import { getFilings } from '../api/filings';
import { useFilingVote } from '../hooks/useFilingVote';
import { updateFilings } from '../store/slices/globalFilingsSlice';
import { AppDispatch, RootState } from '../store';
import type { Filing, RootStackParamList } from '../types';

type CompanyFilingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CompanyFilingsScreenRouteProp = RouteProp<RootStackParamList, 'CompanyFilings'>;

const CompanyFilingsScreen: React.FC = () => {
  const route = useRoute<CompanyFilingsScreenRouteProp>();
  const navigation = useNavigation<CompanyFilingsScreenNavigationProp>();
  const dispatch = useDispatch<AppDispatch>();
  const { ticker, companyName } = route.params;

  const [filings, setFilings] = useState<Filing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // 使用共享的投票 hook
  const { handleVote } = useFilingVote();
  
  // 监听全局状态的变化并更新本地状态
  const globalFilings = useSelector((state: RootState) => state.globalFilings.filingsById);
  
  useEffect(() => {
    // 当全局状态更新时，同步更新本地状态
    setFilings(prevFilings => 
      prevFilings.map(filing => {
        const globalFiling = globalFilings[filing.id.toString()];
        if (globalFiling) {
          return {
            ...filing,
            vote_counts: globalFiling.vote_counts || filing.vote_counts,
            user_vote: globalFiling.user_vote || filing.user_vote
          };
        }
        return filing;
      })
    );
  }, [globalFilings]);

  // Load filings for specific company
  const loadFilings = async (page: number = 1, refresh: boolean = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      }
      
      console.log('Loading filings for ticker:', ticker);
      
      const response = await getFilings(page, ticker);
      
      console.log('Filings response:', response);

      const newFilings = response.data || [];
      
      // 将新加载的数据更新到全局状态
      dispatch(updateFilings(newFilings));
      
      if (refresh || page === 1) {
        setFilings(newFilings);
      } else {
        setFilings(prev => [...prev, ...newFilings]);
      }
      
      setHasMore(newFilings.length === 20);
      setCurrentPage(page);
      setError(null);
    } catch (err) {
      console.error('Error loading company filings:', err);
      setError('Failed to load filings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadFilings(1);
  }, [ticker]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadFilings(1, true);
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadFilings(currentPage + 1);
    }
  }, [isLoading, hasMore, currentPage]);

  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Filing }) => (
    <FilingCard 
      filing={item} 
      onPress={() => handleFilingPress(item)}
      onVote={handleVote}
    />
  ), [handleFilingPress, handleVote]);

  const renderFooter = () => {
    if (!isLoading || filings.length === 0) return null;
    return (
      <View style={styles.footer}>
        <ActivityIndicator size="small" color={colors.primary} />
      </View>
    );
  };

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Icon
          name="document-text-outline"
          type="ionicon"
          size={64}
          color={colors.textSecondary}
          style={styles.emptyIcon}
        />
        <Text style={styles.emptyTitle}>No Filings Found</Text>
        <Text style={styles.emptyText}>
          No recent filings available for {ticker}
        </Text>
      </View>
    );
  };

  if (isLoading && filings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon
              name="arrow-back"
              type="material"
              color={colors.text}
              size={24}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.ticker}>{ticker}</Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {companyName}
            </Text>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading filings...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && filings.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            <Icon
              name="arrow-back"
              type="material"
              color={colors.text}
              size={24}
            />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={styles.ticker}>{ticker}</Text>
            <Text style={styles.companyName} numberOfLines={1}>
              {companyName}
            </Text>
          </View>
        </View>
        <View style={styles.errorContainer}>
          <Icon
            name="alert-circle-outline"
            type="ionicon"
            size={64}
            color={colors.error}
            style={styles.errorIcon}
          />
          <Text style={styles.errorTitle}>Something went wrong</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadFilings(1)}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Icon
            name="arrow-back"
            type="material"
            color={colors.text}
            size={24}
          />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.ticker}>{ticker}</Text>
          <Text style={styles.companyName} numberOfLines={1}>
            {companyName}
          </Text>
        </View>
      </View>
      
      <FlatList
        data={filings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          filings.length === 0 && styles.emptyListContent
        ]}
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
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  ticker: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  emptyListContent: {
    flex: 1,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    marginBottom: spacing.lg,
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
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorIcon: {
    marginBottom: spacing.lg,
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

export default CompanyFilingsScreen;