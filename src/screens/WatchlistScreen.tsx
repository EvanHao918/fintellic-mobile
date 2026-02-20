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
  Modal,
  Animated,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import apiClient from '../api/client';

interface WatchedCompany {
  ticker: string;
  name: string;
  sector?: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  last_filing?: {
    form_type: string;
    filing_date: string;
  };
}

interface CompanySearchResult {
  ticker: string;
  name: string;
  sector?: string;
  is_sp500: boolean;
  is_nasdaq100: boolean;
  is_watchlisted: boolean;
}

export default function WatchlistScreen() {
  const [watchlist, setWatchlist] = useState<WatchedCompany[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [searchResults, setSearchResults] = useState<CompanySearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [tickerToDelete, setTickerToDelete] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchAnimation] = useState(new Animated.Value(0));

  const loadWatchlist = async () => {
    try {
      setIsLoading(true);
      const data = await apiClient.get<WatchedCompany[]>('/watchlist/');
      setWatchlist(data || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load watchlist');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadWatchlist();
  }, []);

  const toggleSearch = () => {
    setShowSearch(!showSearch);
    Animated.timing(searchAnimation, {
      toValue: showSearch ? 0 : 1,
      duration: 200,
      useNativeDriver: false,
    }).start();
    if (showSearch) {
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const searchCompanies = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
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

  const addToWatchlist = async (ticker: string) => {
    try {
      await apiClient.post(`/watchlist/${ticker}`);
      loadWatchlist();
      setSearchResults(searchResults.map(company => 
        company.ticker === ticker ? { ...company, is_watchlisted: true } : company
      ));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to watchlist');
    }
  };

  const confirmDelete = async () => {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/watchlist/${tickerToDelete}`);
      setDeleteModalVisible(false);
      setTickerToDelete('');
      loadWatchlist();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to remove from watchlist');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    const days = Math.floor((Date.now() - new Date(dateString).getTime()) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days}d ago`;
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const renderWatchlistItem = ({ item }: { item: WatchedCompany }) => (
    <View style={styles.card}>
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            {item.is_sp500 && (
              <View style={styles.spBadge}>
                <Text style={styles.spBadgeText}>S&P 500</Text>
              </View>
            )}
            {item.is_nasdaq100 && (
              <View style={styles.nasdaqBadge}>
                <Text style={styles.nasdaqBadgeText}>NASDAQ 100</Text>
              </View>
            )}
          </View>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.sector && <Text style={styles.sector}>{item.sector}</Text>}
        </View>
        
        <View style={styles.cardRight}>
          <TouchableOpacity 
            style={styles.deleteButton}
            onPress={() => { setTickerToDelete(item.ticker); setDeleteModalVisible(true); }}
          >
            <Icon name="close" size={16} color="#9CA3AF" />
          </TouchableOpacity>
          {item.last_filing && (
            <Text style={styles.filingDate}>{formatDate(item.last_filing.filing_date)}</Text>
          )}
        </View>
      </View>
    </View>
  );

  const renderSearchResult = ({ item }: { item: CompanySearchResult }) => (
    <TouchableOpacity 
      style={styles.searchCard}
      onPress={() => !item.is_watchlisted && addToWatchlist(item.ticker)}
      disabled={item.is_watchlisted}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardLeft}>
          <View style={styles.tickerRow}>
            <Text style={styles.ticker}>{item.ticker}</Text>
            {item.is_sp500 && (
              <View style={styles.spBadge}>
                <Text style={styles.spBadgeText}>S&P 500</Text>
              </View>
            )}
            {item.is_nasdaq100 && (
              <View style={styles.nasdaqBadge}>
                <Text style={styles.nasdaqBadgeText}>NASDAQ 100</Text>
              </View>
            )}
          </View>
          <Text style={styles.companyName}>{item.name}</Text>
          {item.sector && <Text style={styles.sector}>{item.sector}</Text>}
        </View>
        
        <View style={styles.cardRight}>
          {item.is_watchlisted ? (
            <Icon name="check-circle" size={20} color="#10B981" />
          ) : (
            <Icon name="add-circle" size={20} color="#3B82F6" />
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* 有数据时显示 header 和搜索框 */}
      {watchlist.length > 0 && (
        <>
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Watchlist</Text>
            <Text style={styles.subtitle}>{watchlist.length} companies</Text>
          </View>

          {/* 搜索框 */}
          <View style={styles.searchContainer}>
            <View style={styles.searchInputWrapper}>
              <TextInput
                style={styles.searchInput}
                placeholder="Search companies..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={(text) => { setSearchQuery(text); searchCompanies(text); }}
              />
              <View style={styles.searchIconWrapper}>
                <Icon name="search" size={20} color="#F97316" />
              </View>
            </View>
          </View>
        </>
      )}

      {/* 搜索结果 */}
      {searchQuery.length > 0 && watchlist.length > 0 && (
        <View style={styles.searchResultsContainer}>
          {isSearching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator color="#3B82F6" />
              <Text style={styles.searchLoadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <FlatList
              data={searchResults}
              renderItem={renderSearchResult}
              keyExtractor={(item) => item.ticker}
              style={styles.searchResults}
            />
          ) : (
            <View style={styles.noResultsContainer}>
              <Text style={styles.noResults}>No companies found</Text>
            </View>
          )}
        </View>
      )}

      {/* Watchlist 列表 */}
      {watchlist.length > 0 && searchQuery.length === 0 && (
        <FlatList
          data={watchlist}
          renderItem={renderWatchlistItem}
          keyExtractor={(item) => item.ticker}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWatchlist(); }} />}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* 空状态 - 搜索框在中间 */}
      {watchlist.length === 0 && (
        <View style={styles.emptyContainer}>
          {/* 搜索框始终在顶部可见 */}
          {searchQuery.length > 0 && (
            <View style={styles.searchContainer}>
              <View style={styles.searchInputWrapper}>
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search companies..."
                  placeholderTextColor="#9CA3AF"
                  value={searchQuery}
                  onChangeText={(text) => { setSearchQuery(text); searchCompanies(text); }}
                />
                <View style={styles.searchIconWrapper}>
                  <Icon name="search" size={20} color="#F97316" />
                </View>
              </View>
            </View>
          )}

          {/* 空状态内容 */}
          {searchQuery.length === 0 && (
            <View style={styles.empty}>
              <Image 
                source={require('../assets/images/watchlist_empty.png')} 
                style={styles.emptyImage}
                resizeMode="contain"
              />
              <Text style={styles.emptyTitle}>Start Your Watchlist</Text>
              <Text style={styles.emptyText}>Track companies you're{'\n'}interested in</Text>
              
              {/* 搜索框在中间 */}
              <View style={styles.emptySearchContainer}>
                <View style={styles.searchInputWrapper}>
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search companies..."
                    placeholderTextColor="#9CA3AF"
                    value={searchQuery}
                    onChangeText={(text) => { setSearchQuery(text); searchCompanies(text); }}
                  />
                  <View style={styles.searchIconWrapper}>
                    <Icon name="search" size={20} color="#F97316" />
                  </View>
                </View>
              </View>
            </View>
          )}

          {/* 空状态下的搜索结果 */}
          {searchQuery.length > 0 && (
            <View style={styles.emptySearchResults}>
              {isSearching ? (
                <View style={styles.searchLoading}>
                  <ActivityIndicator color="#3B82F6" />
                  <Text style={styles.searchLoadingText}>Searching...</Text>
                </View>
              ) : searchResults.length > 0 ? (
                <FlatList
                  data={searchResults}
                  renderItem={renderSearchResult}
                  keyExtractor={(item) => item.ticker}
                  style={styles.searchResults}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Text style={styles.noResults}>No companies found</Text>
                </View>
              )}
            </View>
          )}
        </View>
      )}

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Remove {tickerToDelete}?</Text>
            <Text style={styles.modalText}>You won't receive notifications for this company anymore.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmDeleteButton} onPress={confirmDelete}>
                {isDeleting ? <ActivityIndicator color="#FFF" /> : <Text style={styles.deleteText}>Remove</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F9FAFB',
  },
  center: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
  },
  
  // Header
  headerContainer: { 
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  title: { 
    fontSize: 28, 
    fontWeight: '700', 
    color: '#111827',
  },
  subtitle: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 2,
  },
  
  // Search
  searchContainer: { 
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#F9FAFB',
  },
  searchInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  searchInput: { 
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    fontSize: 16,
    color: '#111827',
  },
  searchIconWrapper: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF7ED',
  },
  searchResultsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  searchLoading: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    paddingVertical: 20,
  },
  searchLoadingText: { 
    marginLeft: 8, 
    color: '#6B7280',
  },
  searchResults: { 
    flex: 1,
  },
  noResultsContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  noResults: { 
    fontSize: 16, 
    color: '#6B7280', 
    textAlign: 'center',
  },
  
  // Cards
  listContainer: { 
    paddingTop: 8,
    paddingBottom: 20,
  },
  card: { 
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  searchCard: { 
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginVertical: 4,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLeft: {
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  tickerRow: { 
    flexDirection: 'row', 
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 4,
  },
  ticker: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#111827',
  },
  
  // Badges - 新样式
  spBadge: { 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#F97316',
    backgroundColor: '#FFF7ED',
  },
  spBadgeText: { 
    fontSize: 11,
    fontWeight: '600',
    color: '#F97316',
  },
  nasdaqBadge: { 
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: '#ECFDF5',
  },
  nasdaqBadgeText: { 
    fontSize: 11,
    fontWeight: '600',
    color: '#10B981',
  },
  
  // Content
  companyName: { 
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
    marginBottom: 2,
  },
  sector: { 
    fontSize: 13,
    color: '#9CA3AF',
  },
  
  // Delete button
  deleteButton: {
    padding: 4,
  },
  
  // Filing date
  filingDate: { 
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 8,
  },
  
  // Empty State
  emptyContainer: { 
    flex: 1,
  },
  empty: { 
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: -80,
  },
  emptyImage: {
    width: 120,
    height: 120,
    marginBottom: 24,
  },
  emptyTitle: { 
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
  },
  emptyText: { 
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  emptySearchContainer: {
    width: '100%',
    paddingHorizontal: 0,
  },
  emptySearchResults: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  
  // Modal
  modalOverlay: { 
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: { 
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
  },
  modalTitle: { 
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalText: { 
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: { 
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: { 
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 8,
  },
  confirmDeleteButton: { 
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: 8,
  },
  cancelText: { 
    color: '#374151',
    fontWeight: '600',
  },
  deleteText: { 
    color: '#FFF',
    fontWeight: '600',
  },
  
  // Loading
  loadingText: { 
    marginTop: 16,
    fontSize: 16,
    color: '#6B7280',
  },
});