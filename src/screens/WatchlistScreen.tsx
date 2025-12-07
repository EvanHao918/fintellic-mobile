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
      <View style={styles.header}>
        <View style={styles.tickerRow}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          {item.is_sp500 && <View style={styles.badge}><Text style={styles.badgeText}>S&P</Text></View>}
          {item.is_nasdaq100 && <View style={[styles.badge, styles.nasdaqBadge]}><Text style={[styles.badgeText, styles.nasdaqText]}>NASDAQ 100</Text></View>}
        </View>
        <TouchableOpacity onPress={() => { setTickerToDelete(item.ticker); setDeleteModalVisible(true); }}>
          <Icon name="close" size={18} color="#9CA3AF" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.companyName}>{item.name}</Text>
      {item.sector && <Text style={styles.sector}>{item.sector}</Text>}
      
      {item.last_filing && (
        <View style={styles.filingRow}>
          <View style={styles.filingBadge}>
            <Text style={styles.filingText}>{item.last_filing.form_type}</Text>
          </View>
          <Text style={styles.filingDate}>{formatDate(item.last_filing.filing_date)}</Text>
        </View>
      )}
    </View>
  );

  const renderSearchResult = ({ item }: { item: CompanySearchResult }) => (
    <TouchableOpacity 
      style={styles.searchCard}
      onPress={() => !item.is_watchlisted && addToWatchlist(item.ticker)}
      disabled={item.is_watchlisted}
    >
      <View style={styles.header}>
        <View style={styles.tickerRow}>
          <Text style={styles.ticker}>{item.ticker}</Text>
          {item.is_sp500 && <View style={styles.badge}><Text style={styles.badgeText}>S&P</Text></View>}
          {item.is_nasdaq100 && <View style={[styles.badge, styles.nasdaqBadge]}><Text style={[styles.badgeText, styles.nasdaqText]}>NASDAQ 100</Text></View>}
        </View>
        {item.is_watchlisted ? (
          <Icon name="check-circle" size={20} color="#10B981" />
        ) : (
          <Icon name="add-circle" size={20} color="#3B82F6" />
        )}
      </View>
      <Text style={styles.companyName}>{item.name}</Text>
      {item.sector && <Text style={styles.sector}>{item.sector}</Text>}
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
      <View style={styles.headerContainer}>
        <View>
          <Text style={styles.title}>Watchlist</Text>
          <Text style={styles.subtitle}>{watchlist.length} companies</Text>
        </View>
        <TouchableOpacity style={[styles.searchButton, showSearch && styles.searchButtonActive]} onPress={toggleSearch}>
          <Icon name={showSearch ? "close" : "search"} size={20} color={showSearch ? "#FFF" : "#3B82F6"} />
        </TouchableOpacity>
      </View>

      {showSearch && (
        <Animated.View style={[styles.searchContainer, { opacity: searchAnimation }]}>
          <View style={styles.searchInput}>
            <Icon name="search" size={18} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Search companies..."
              value={searchQuery}
              onChangeText={(text) => { setSearchQuery(text); searchCompanies(text); }}
              autoFocus
              selectionColor="transparent"
              underlineColorAndroid="transparent"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }}>
                <Icon name="close" size={16} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
          
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
          ) : searchQuery.length > 0 && (
            <View style={styles.center}>
              <Text style={styles.noResults}>No companies found</Text>
            </View>
          )}
        </Animated.View>
      )}

      <FlatList
        data={watchlist}
        renderItem={renderWatchlistItem}
        keyExtractor={(item) => item.ticker}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadWatchlist(); }} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Icon name="bookmark-border" size={60} color="#3B82F6" />
            <Text style={styles.emptyTitle}>Start Your Watchlist</Text>
            <Text style={styles.emptyText}>Track companies and get instant SEC filing notifications</Text>
            <TouchableOpacity style={styles.primaryButton} onPress={toggleSearch}>
              <Icon name="add" size={20} color="#FFF" />
              <Text style={styles.buttonText}>Add Companies</Text>
            </TouchableOpacity>
          </View>
        }
        contentContainerStyle={watchlist.length === 0 ? styles.emptyContainer : styles.listContainer}
      />

      <Modal visible={deleteModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Remove {tickerToDelete}?</Text>
            <Text style={styles.modalText}>You won't receive notifications for this company anymore.</Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setDeleteModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
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
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  // Header
  headerContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#F5F0E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 14, color: '#6B7280', marginTop: 2 },
  searchButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF', alignItems: 'center', justifyContent: 'center' },
  searchButtonActive: { backgroundColor: '#3B82F6' },
  
  // Search
  searchContainer: { backgroundColor: '#F5F0E8', paddingBottom: 16 },
  searchInput: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderRadius: 12, paddingHorizontal: 16, marginHorizontal: 20, marginTop: 16, height: 48 },
  input: { flex: 1, marginLeft: 12, fontSize: 16, color: '#111827' },
  searchLoading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 20 },
  searchLoadingText: { marginLeft: 8, color: '#6B7280' },
  searchResults: { maxHeight: 300, marginTop: 8 },
  noResults: { fontSize: 16, color: '#6B7280', textAlign: 'center', paddingVertical: 20 },
  
  // Cards
  listContainer: { paddingTop: 8 },
  card: { backgroundColor: '#FFF', marginHorizontal: 16, marginVertical: 6, borderRadius: 16, padding: 16 },
  searchCard: { backgroundColor: '#FFF', marginHorizontal: 20, marginVertical: 4, borderRadius: 12, padding: 16 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  tickerRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  ticker: { fontSize: 18, fontWeight: '700', color: '#111827', marginRight: 8 },
  
  // Badges
  badge: { backgroundColor: '#EFF6FF', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 6 },
  nasdaqBadge: { backgroundColor: '#F0FDF4' },
  badgeText: { fontSize: 11, color: '#3B82F6', fontWeight: '700' },
  nasdaqText: { color: '#059669' },
  
  // Content
  companyName: { fontSize: 16, color: '#374151', fontWeight: '600', marginBottom: 4 },
  sector: { fontSize: 14, color: '#6B7280' },
  
  // Filing
  filingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  filingBadge: { backgroundColor: '#F1F5F9', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  filingText: { fontSize: 12, fontWeight: '700', color: '#475569' },
  filingDate: { fontSize: 12, color: '#9CA3AF' },
  
  // Empty State
  emptyContainer: { flexGrow: 1 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 32 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: '#111827', marginTop: 16, marginBottom: 8 },
  emptyText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginBottom: 32 },
  primaryButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600', marginLeft: 8 },
  
  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  modal: { backgroundColor: '#FFF', borderRadius: 20, padding: 24, width: '100%', maxWidth: 340 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827', marginBottom: 8, textAlign: 'center' },
  modalText: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginBottom: 24 },
  modalButtons: { flexDirection: 'row', gap: 12 },
  cancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#F1F5F9', borderRadius: 8 },
  deleteButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#EF4444', borderRadius: 8 },
  cancelText: { color: '#374151', fontWeight: '600' },
  deleteText: { color: '#FFF', fontWeight: '600' },
  
  // Loading
  loadingText: { marginTop: 16, fontSize: 16, color: '#6B7280' },
});