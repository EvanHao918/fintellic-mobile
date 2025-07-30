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
import { useSelector } from 'react-redux';
import FilingCard from '../components/FilingCard';
import { colors, typography, spacing } from '../theme';
import { getFilings } from '../api/filings';
import { useFilingVote } from '../hooks/useFilingVote';
import { RootState } from '../store';
import type { Filing, RootStackParamList } from '../types';

type CompanyFilingsScreenNavigationProp = StackNavigationProp<RootStackParamList>;
type CompanyFilingsScreenRouteProp = RouteProp<RootStackParamList, 'CompanyFilings'>;

const CompanyFilingsScreen: React.FC = () => {
  const route = useRoute<CompanyFilingsScreenRouteProp>();
  const navigation = useNavigation<CompanyFilingsScreenNavigationProp>();
  const { ticker, companyName } = route.params;

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // 从 Redux store 获取所有 filings
  const allFilings = useSelector((state: RootState) => state.filings.filings);
  
  // 筛选出当前公司的 filings
  const companyFilings = allFilings.filter(filing => filing.company_ticker === ticker);
  
  // Get user info for Pro status
  const { user } = useSelector((state: RootState) => state.auth || {});
  const isProUser = user?.tier === 'pro';

  // 初始加载检查
  useEffect(() => {
    // 如果 Redux store 中有该公司的数据，直接使用
    if (companyFilings.length > 0) {
      setIsLoading(false);
    } else {
      // 否则需要加载数据
      setIsLoading(true);
      // 这里可以触发一个加载所有数据的 action
      // 或者显示"暂无数据"
      setTimeout(() => {
        setIsLoading(false);
        if (companyFilings.length === 0) {
          setError('No filings found for this company');
        }
      }, 1000);
    }
  }, [ticker, companyFilings.length]);

  const handleRefresh = useCallback(() => {
    // 返回主页或重新加载
    navigation.goBack();
  }, [navigation]);

  const handleLoadMore = useCallback(() => {
    // 不需要加载更多，因为我们使用的是已有数据
  }, []);

  const handleFilingPress = useCallback((filing: Filing) => {
    navigation.navigate('FilingDetail', { filingId: filing.id });
  }, [navigation]);

  const renderItem = useCallback(({ item }: { item: Filing }) => (
    <FilingCard 
      filing={item} 
      onPress={() => handleFilingPress(item)}
      isProUser={isProUser}
    />
  ), [handleFilingPress, isProUser]);

  const renderFooter = () => {
    if (!isLoading || companyFilings.length === 0) return null;
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

  if (isLoading && companyFilings.length === 0) {
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

  if (error && companyFilings.length === 0) {
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
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.retryButtonText}>Go Back</Text>
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
        data={companyFilings}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={[
          styles.listContent,
          companyFilings.length === 0 && styles.emptyListContent
        ]}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
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