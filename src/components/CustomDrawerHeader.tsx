// src/components/CustomDrawerHeader.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Keyboard,
  Platform,
  Dimensions,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { DrawerNavigationProp } from '@react-navigation/drawer';
import { StackNavigationProp } from '@react-navigation/stack';
import { colors, typography, spacing } from '../theme';
import apiClient from '../api/client';
import type { RootStackParamList, DrawerParamList } from '../types';

// Combined navigation type
type CombinedNavigationProp = DrawerNavigationProp<DrawerParamList> & 
  StackNavigationProp<RootStackParamList>;

interface CustomDrawerHeaderProps {
  title?: string;
  showMenuButton?: boolean;
}

interface CompanySearchResult {
  ticker: string;
  name: string;
  is_sp500?: boolean;
  is_nasdaq100?: boolean;
}

export const CustomDrawerHeader: React.FC<CustomDrawerHeaderProps> = ({ 
  title = 'HermeSpeed',
  showMenuButton = true 
}) => {
  const navigation = useNavigation<CombinedNavigationProp>();
  const insets = useSafeAreaInsets();
  
  // 🔥 问题1修复：获取屏幕宽度，动态计算搜索框宽度
  const screenWidth = Dimensions.get('window').width;
  const searchContainerWidth = Math.max(
    Math.min(screenWidth * 0.4, 280), // 最大280px，屏幕40%
    160 // 最小160px
  );
  
  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTimer, setSearchTimer] = useState<NodeJS.Timeout | null>(null);
  const [showResults, setShowResults] = useState(false);

  // Perform search
  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      setShowResults(false);
      return;
    }

    setIsSearching(true);
    setShowResults(true);
    try {
      console.log('Searching for:', query);
      const response = await apiClient.get('/companies/', {
        params: { search: query, limit: 10 }
      });
      console.log('Search response:', response);
      
      // Handle both array response and object with data property
      const results = Array.isArray(response) ? response : 
                     (response.data || response.items || response.results || []);
      setSearchResults(results);
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
  const handleSelectCompany = (company: CompanySearchResult) => {
    console.log('Selected company:', company);
    
    // Clear search
    setSearchQuery('');
    setSearchResults([]);
    setShowResults(false);
    Keyboard.dismiss();
    
    // Navigate to CompanyFilings screen with proper typing
    (navigation as StackNavigationProp<RootStackParamList>).navigate('CompanyFilings', { 
      ticker: company.ticker,
      companyName: company.name 
    });
  };

  const handleSearchFocus = () => {
    if (searchQuery.trim()) {
      setShowResults(true);
    }
  };

  const handleSearchBlur = () => {
    // Delay hiding results to allow clicking on them
    setTimeout(() => {
      setShowResults(false);
    }, 200);
  };

  return (
    <>
      <View style={[styles.header, { paddingTop: insets.top + spacing.md }]}>
        <View style={styles.headerContent}>
          <View style={styles.leftSection}>
            {showMenuButton && (
              <TouchableOpacity
                onPress={() => (navigation as DrawerNavigationProp<DrawerParamList>).openDrawer()}
                style={styles.menuButton}
              >
                <Icon name="menu" type="material" color={colors.white} size={24} />
              </TouchableOpacity>
            )}
            <Text style={styles.title}>{title}</Text>
          </View>
          
          {/* 🔥 问题1修复：响应式搜索框 */}
          <View style={[styles.searchContainer, { width: searchContainerWidth }]}>
            <View style={styles.searchInputWrapper}>
              <Icon
                name="search"
                type="material"
                color={colors.textSecondary}
                size={20}
                style={styles.searchIcon}
              />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ticker..."
                placeholderTextColor={colors.textSecondary}
                value={searchQuery}
                onChangeText={handleSearchChange}
                autoCapitalize="characters"
                autoCorrect={false}
                returnKeyType="search"
                onFocus={handleSearchFocus}
                onBlur={handleSearchBlur}
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    performSearch(searchQuery);
                  }
                }}
                // 防止浏览器自动填充
                autoComplete="off"
                textContentType="none"
                keyboardType="default"
                importantForAutofill="no"
                // 添加Web特定属性（在React Native Web环境中有效）
                {...(Platform.OS === 'web' && {
                  autoComplete: 'off',
                  'data-form-type': 'search',
                  'data-autofill': 'false',
                  name: 'ticker-search', // 明确的搜索用途
                  role: 'searchbox',
                  'aria-label': 'Search company ticker',
                })}
              />
              {isSearching && (
                <ActivityIndicator 
                  size="small" 
                  color={colors.primary} 
                  style={styles.searchLoading}
                />
              )}
              {searchQuery.length > 0 && !isSearching && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setSearchResults([]);
                    setShowResults(false);
                  }}
                  style={styles.clearButton}
                >
                  <Icon name="close" type="material" color={colors.textSecondary} size={18} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>

      {/* 🔥 问题1修复：搜索结果下拉框也使用动态宽度 */}
      {showResults && searchResults.length > 0 && (
        <View style={[
          styles.resultsContainer, 
          { 
            width: searchContainerWidth,
            right: spacing.md // 保持右对齐
          }
        ]}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            style={styles.resultsList}
            showsVerticalScrollIndicator={false}
          >
            {searchResults.map((company, index) => (
              <TouchableOpacity
                key={`${company.ticker}-${index}`}
                style={styles.resultItem}
                onPress={() => handleSelectCompany(company)}
                activeOpacity={0.7}
              >
                <View style={styles.resultContent}>
                  <Text style={styles.resultTicker}>{company.ticker}</Text>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {company.name}
                  </Text>
                </View>
                <View style={styles.resultIndices}>
                  {company.is_sp500 && (
                    <View style={styles.indexBadge}>
                      <Text style={styles.indexBadgeText}>S&P 500</Text>
                    </View>
                  )}
                  {company.is_nasdaq100 && (
                    <View style={[styles.indexBadge, styles.nasdaqBadge]}>
                      <Text style={styles.indexBadgeText}>NASDAQ</Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
      
      {/* No Results */}
      {showResults && searchQuery.length > 0 && !isSearching && searchResults.length === 0 && (
        <View style={[
          styles.resultsContainer, 
          styles.noResultsWrapper,
          { 
            width: searchContainerWidth,
            right: spacing.md 
          }
        ]}>
          <View style={styles.noResultsContainer}>
            <Icon
              name="search-off"
              type="material"
              size={48}
              color={colors.textSecondary}
            />
            <Text style={styles.noResultsText}>No results found for "{searchQuery}"</Text>
            <Text style={styles.noResultsSubtext}>Try searching with a different ticker or company name</Text>
          </View>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  header: {
    backgroundColor: colors.primary, // This now uses the dark amber color #D97706
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
    zIndex: 1000,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    justifyContent: 'space-between',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm, // 🔥 添加右边距，确保与搜索框有间隔
  },
  menuButton: {
    padding: spacing.xs,
    marginRight: spacing.sm,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  searchContainer: {
    // 🔥 问题1修复：移除固定宽度，改为动态设置
    // width: 300, // 删除这行
    minWidth: 160, // 添加最小宽度
    maxWidth: 280, // 添加最大宽度
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 20, // 圆角
    paddingHorizontal: spacing.sm,
    height: 36, // 适中的高度
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.text,
    paddingVertical: spacing.xs,
    fontFamily: typography.fontFamily.regular,
  },
  searchLoading: {
    marginLeft: spacing.xs,
  },
  clearButton: {
    padding: spacing.xs / 2,
    marginLeft: spacing.xs,
  },
  resultsContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 88 : 68,
    // 🔥 问题1修复：移除固定宽度，改为动态设置
    // width: 300, // 删除这行，改为动态设置
    backgroundColor: colors.white,
    maxHeight: 400,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 999,
  },
  resultsList: {
    maxHeight: 400,
    borderRadius: 12,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    backgroundColor: colors.white,
  },
  resultContent: {
    flex: 1,
    marginRight: spacing.sm,
  },
  resultTicker: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  resultName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  resultIndices: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  indexBadge: {
    backgroundColor: colors.primary + '20',  // 使用 primary 颜色的透明版本 (现在是暗金色)
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs / 2,  // 使用 xs 的一半作为更小的间距
    borderRadius: 4,
    marginLeft: spacing.xs,
  },
  nasdaqBadge: {
    backgroundColor: colors.success + '20',  // 使用 success 颜色的透明版本
  },
  indexBadgeText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary, // 现在显示暗金色
    fontWeight: typography.fontWeight.medium,
  },
  noResultsWrapper: {
    // 继承 resultsContainer 的所有样式
  },
  noResultsContainer: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
    marginTop: spacing.md,
  },
  noResultsSubtext: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

export default CustomDrawerHeader;