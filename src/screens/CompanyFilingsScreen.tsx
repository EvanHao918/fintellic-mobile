// src/screens/CompanyFilingsScreen.tsx
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import { Icon } from 'react-native-elements';
import FilingCard from '../components/FilingCard';
import { getFilings } from '../api/filings';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import type { Filing, RootStackParamList } from '../types';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';

type CompanyFilingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CompanyFilingsScreenRouteProp = RouteProp<RootStackParamList, 'CompanyFilings'>;

export default function CompanyFilingsScreen() {
  const route = useRoute<CompanyFilingsScreenRouteProp>();
  const navigation = useNavigation<CompanyFilingsScreenNavigationProp>();
  const { ticker, companyName } = route.params;

  const [filings, setFilings] = useState<Filing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const { user } = useSelector((state: RootState) => state.auth || {});
  const isProUser = user?.tier === 'pro';

  const loadFilings = useCallback(async (isRefresh: boolean = false) => {
    try {
      if (isRefresh) {
        setIsRefreshing(true);
        setPage(1);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await getFilings(isRefresh ? 1 : page, undefined, ticker);  // 🔥 修复：ticker 是第三个参数
      
      if (isRefresh) {
        setFilings(response.data);
      } else {
        setFilings(prev => page === 1 ? response.data : [...prev, ...response.data]);
      }

      setHasMore(response.data.length === 20);

    } catch (err) {
      console.error('Error loading company filings:', err);
      setError('Failed to load filings. Please try again.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [ticker, page]);

  useEffect(() => {
    loadFilings();
  }, []);

  const handleRefresh = useCallback(() => {
    loadFilings(true);
  }, [loadFilings]);

  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore && !isRefreshing) {
      setPage(prev => prev + 1);
    }
  }, [isLoading, hasMore, isRefreshing]);

  useEffect(() => {
    if (page > 1) {
      loadFilings();
    }
  }, [page]);

  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  const renderFilingItem = ({ item }: { item: Filing }) => (
    <View style={styles.filingCardWrapper}>
      <FilingCard 
        filing={item} 
        onPress={() => handleFilingPress(item)}
        isProUser={isProUser}
      />
    </View>
  );

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
      <View style={styles.container}>
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
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
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
        <View style={styles.headerRight}>
          <Text style={styles.filingCount}>
            {filings.length} {filings.length === 1 ? 'filing' : 'filings'}
          </Text>
        </View>
      </View>

      {/* Error Banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => loadFilings()}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Filings List */}
      <FlatList
        data={filings}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderFilingItem}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={
          filings.length === 0 ? styles.emptyListContainer : styles.listContent
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 60 : spacing.xl + 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    ...shadows.sm,
  },
  backButton: {
    marginRight: spacing.md,
    padding: spacing.xs,
  },
  headerContent: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
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
  filingCount: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
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
  errorBanner: {
    backgroundColor: colors.error + '10',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.error + '20',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    flex: 1,
  },
  retryButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  retryButtonText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.primary,
  },
  listContent: {
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  filingCardWrapper: {
    marginVertical: spacing.xs,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
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
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
});