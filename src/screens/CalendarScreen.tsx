import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { Calendar, DateData } from 'react-native-calendars';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import apiClient from '../api/client';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface EarningsDay {
  date: string;
  count: number;
  companies: Array<{
    ticker: string;
    name: string;
    time: 'BMO' | 'AMC' | 'TBD';
    eps_estimate?: number;
    revenue_estimate?: number;
  }>;
}

interface EarningsCalendarResponse {
  month: string;
  year: number;
  total_earnings: number;
  earnings_days: EarningsDay[];
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [earningsData, setEarningsData] = useState<EarningsDay[]>([]);
  const [markedDates, setMarkedDates] = useState<any>({});
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'watchlist' | 'all'>('watchlist');
  
  const user = useSelector((state: RootState) => state.auth.user);

  // Load watchlist
  useEffect(() => {
    loadWatchlist();
  }, []);

  // Load earnings data when watchlist is loaded (only once on mount)
  useEffect(() => {
    if (watchlist.length >= 0) { // Load even if watchlist is empty
      fetchEarningsCalendar();
    }
  }, [watchlist]);

  // Update marked dates when selected date changes
  useEffect(() => {
    if (earningsData.length > 0) {
      const marked: any = {};
      
      // Mark all earnings dates
      earningsData.forEach((day: EarningsDay) => {
        const hasWatchlistCompany = day.companies.some(c => 
          watchlist.includes(c.ticker)
        );
        
        marked[day.date] = {
          marked: true,
          dotColor: hasWatchlistCompany ? colors.primary : colors.textSecondary,
          customStyles: {
            container: {
              backgroundColor: hasWatchlistCompany ? colors.primaryLight + '15' : colors.gray100,
            },
            text: {
              color: hasWatchlistCompany ? colors.primary : colors.text,
              fontWeight: 'bold',
            },
          },
        };
      });
      
      // Mark the currently selected date
      if (selectedDate) {
        marked[selectedDate] = {
          ...marked[selectedDate],
          selected: true,
          selectedColor: colors.primary,
        };
      }
      
      setMarkedDates(marked);
    }
  }, [selectedDate, earningsData, watchlist]);

  const loadWatchlist = async () => {
    try {
      // First try to get from API if user is logged in
      if (user) {
        const watchlistData = await apiClient.get<any[]>('/watchlist/');
        if (watchlistData && Array.isArray(watchlistData)) {
          const tickers = watchlistData.map((item: any) => 
            typeof item === 'string' ? item : item.ticker
          );
          setWatchlist(tickers);
          await AsyncStorage.setItem('@fintellic_watchlist', JSON.stringify(tickers));
        }
      } else {
        // Fallback to local storage
        const saved = await AsyncStorage.getItem('@fintellic_watchlist');
        if (saved) {
          setWatchlist(JSON.parse(saved));
        }
      }
    } catch (error) {
      console.error('Failed to load watchlist:', error);
      // Fallback to local storage
      const saved = await AsyncStorage.getItem('@fintellic_watchlist');
      if (saved) {
        setWatchlist(JSON.parse(saved));
      }
    }
  };

  const fetchEarningsCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Get current month
      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth() + 1;
      
      // Calculate next month
      const nextMonth = currentMonth === 12 ? 1 : currentMonth + 1;
      const nextYear = currentMonth === 12 ? currentYear + 1 : currentYear;
      
      // Fetch current month and next month in parallel
      const [currentMonthData, nextMonthData] = await Promise.all([
        apiClient.get<EarningsCalendarResponse>('/earnings/calendar/monthly', {
          params: { year: currentYear, month: currentMonth }
        }),
        apiClient.get<EarningsCalendarResponse>('/earnings/calendar/monthly', {
          params: { year: nextYear, month: nextMonth }
        })
      ]);
      
      // Merge earnings_days from both months
      const allEarnings: EarningsDay[] = [
        ...(currentMonthData?.earnings_days || []),
        ...(nextMonthData?.earnings_days || [])
      ];
      
      if (allEarnings.length > 0) {
        setEarningsData(allEarnings);
        
        // Mark dates on calendar
        const marked: any = {};
        allEarnings.forEach((day: EarningsDay) => {
          const hasWatchlistCompany = day.companies.some(c => 
            watchlist.includes(c.ticker)
          );
          
          marked[day.date] = {
            marked: true,
            dotColor: hasWatchlistCompany ? colors.primary : colors.textSecondary,
            customStyles: {
              container: {
                backgroundColor: hasWatchlistCompany ? colors.primaryLight + '15' : colors.gray100,
              },
              text: {
                color: hasWatchlistCompany ? colors.primary : colors.text,
                fontWeight: 'bold',
              },
            },
          };
        });
        
        // Mark selected date
        if (selectedDate) {
          marked[selectedDate] = {
            ...marked[selectedDate],
            selected: true,
            selectedColor: colors.primary,
          };
        }
        
        setMarkedDates(marked);
      }
    } catch (error) {
      console.error('Failed to fetch earnings calendar:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadWatchlist();
    await fetchEarningsCalendar();
    setRefreshing(false);
  };

  // 添加到 watchlist
  const addToWatchlist = async (ticker: string) => {
    try {
      await apiClient.post(`/watchlist/${ticker}`);
      // 更新本地 watchlist 状态
      setWatchlist(prev => [...prev, ticker]);
      // 同步到 AsyncStorage
      const updatedWatchlist = [...watchlist, ticker];
      await AsyncStorage.setItem('@fintellic_watchlist', JSON.stringify(updatedWatchlist));
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add to watchlist');
    }
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const getSelectedDateEarnings = () => {
    return earningsData.find(day => day.date === selectedDate);
  };

  // 获取某天的 BMO/AMC 数量统计
  const getDayStats = (date: string) => {
    const dayData = earningsData.find(day => day.date === date);
    if (!dayData) return { bmo: 0, amc: 0 };
    
    const bmo = dayData.companies.filter(c => c.time?.toUpperCase() === 'BMO').length;
    const amc = dayData.companies.filter(c => c.time?.toUpperCase() === 'AMC').length;
    return { bmo, amc };
  };

  // 检查日期是否是今天
  const isToday = (dateString: string) => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };

  // 获取筛选后的公司列表
  const getFilteredCompanies = () => {
    const dayData = getSelectedDateEarnings();
    if (!dayData) return [];
    
    if (activeTab === 'watchlist') {
      return dayData.companies.filter(c => watchlist.includes(c.ticker));
    }
    return dayData.companies;
  };

  // 获取 watchlist 中的公司数量
  const getWatchlistCount = () => {
    const dayData = getSelectedDateEarnings();
    if (!dayData) return 0;
    return dayData.companies.filter(c => watchlist.includes(c.ticker)).length;
  };

  const formatSelectedDate = (dateString: string) => {
    const [year, month, day] = dateString.split('-').map(num => parseInt(num));
    const date = new Date(year, month - 1, day);
    
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderEarningItem = (company: any) => {
    const isWatchlisted = watchlist.includes(company.ticker);
    
    return (
      <View key={company.ticker} style={[
        styles.earningItem,
        isWatchlisted && styles.earningItemWatchlisted,
      ]}>
        <View style={styles.earningItemContent}>
          {/* 第一行：Ticker + 公司名 */}
          <View style={styles.earningItemRow}>
            <View style={styles.earningItemLeft}>
              <Text style={styles.ticker}>{company.ticker}</Text>
              <Text style={styles.companyName}>{company.name}</Text>
            </View>
            
            {/* 右侧：标签 + 按钮 */}
            <View style={styles.earningItemRight}>
              <View style={[
                styles.timeTagFilled,
                company.time?.toUpperCase() === 'BMO' ? styles.timeTagFilledBmo : styles.timeTagFilledAmc
              ]}>
                <Text style={styles.timeTagFilledText}>
                  {company.time?.toLowerCase()}
                </Text>
              </View>
              
              {isWatchlisted ? (
                <View style={styles.watchlistedBadge}>
                  <Icon name="bookmark" type="material" size={16} color={colors.primary} />
                </View>
              ) : (
                <TouchableOpacity 
                  style={styles.remindMeButton} 
                  onPress={() => addToWatchlist(company.ticker)}
                >
                  <Icon name="notifications-none" type="material" size={14} color={colors.primary} />
                  <Text style={styles.remindMeText}>Remind me</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const getTimeStyle = (time: string) => {
    const upperTime = time?.toUpperCase() || '';
    
    switch (upperTime) {
      case 'BMO':
        return { backgroundColor: '#2563EB' };
      case 'AMC':
        return { backgroundColor: '#10B981' };
      case 'TBD':
        return { backgroundColor: colors.gray500 };
      default:
        return { backgroundColor: colors.textSecondary };
    }
  };

  // 自定义日历日期组件
  const CustomDayComponent = ({ date, state, marking }: any) => {
    const dateString = date.dateString;
    const stats = getDayStats(dateString);
    const isCurrentDay = isToday(dateString);
    const isSelected = dateString === selectedDate;
    const hasEvents = stats.bmo > 0 || stats.amc > 0;
    const isDisabled = state === 'disabled';
    
    return (
      <View style={styles.dayWrapper}>
        <TouchableOpacity
          style={[
            styles.dayContainer,
            isSelected && styles.dayContainerSelected,
          ]}
          onPress={() => setSelectedDate(dateString)}
          disabled={isDisabled}
        >
        <View style={[
          styles.dayNumberContainer,
          isCurrentDay && styles.todayCircle,
          isSelected && !isCurrentDay && styles.selectedCircle,
        ]}>
          <Text style={[
            styles.dayNumber,
            isDisabled && styles.dayNumberDisabled,
            isCurrentDay && styles.todayText,
            isSelected && !isCurrentDay && styles.selectedText,
          ]}>
            {date.day}
          </Text>
        </View>
        
        {hasEvents && !isDisabled && (
          <View style={styles.dayBadges}>
            {stats.bmo > 0 && (
              <View style={styles.bmoBadgeFilled}>
                <Text style={styles.badgeTextBmo}>bmo</Text>
                <Text style={styles.badgeCountBmo}>{stats.bmo}</Text>
              </View>
            )}
            {stats.amc > 0 && (
              <View style={styles.amcBadgeFilled}>
                <Text style={styles.badgeTextAmc}>amc</Text>
                <Text style={styles.badgeCountAmc}>{stats.amc}</Text>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
      </View>
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading earnings calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedEarnings = getSelectedDateEarnings();

  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings Calendar</Text>
          <Text style={styles.headerSubtitle}>
            Track upcoming earnings announcements
          </Text>
          <Text style={styles.headerDisclaimer}>
            (Data from FMP. Dates are estimates and subject to change.)
          </Text>
        </View>

        {/* Calendar Container with Border */}
        <View style={styles.calendarWrapper}>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            dayComponent={CustomDayComponent}
            theme={{
              backgroundColor: colors.white,
              calendarBackground: colors.white,
              textSectionTitleColor: colors.textSecondary,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textMonthFontFamily: typography.fontFamily.semibold,
              textDayHeaderFontFamily: typography.fontFamily.medium,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
        </View>

        {/* Selected Date Earnings */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateTitle}>
            {formatSelectedDate(selectedDate)}
          </Text>
          
          {selectedEarnings && selectedEarnings.companies.length > 0 ? (
            <>
              {/* Tab 切换 */}
              <View style={styles.tabContainer}>
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'watchlist' && styles.tabActive]}
                  onPress={() => setActiveTab('watchlist')}
                >
                  <Icon 
                    name="bookmark" 
                    type="material" 
                    size={16} 
                    color={activeTab === 'watchlist' ? colors.primary : colors.primary} 
                  />
                  <Text style={[styles.tabText, activeTab === 'watchlist' && styles.tabTextActive]}>
                    My Watchlist
                  </Text>
                  <Text style={[styles.tabCount, activeTab === 'watchlist' && styles.tabCountActive]}>
                    {getWatchlistCount()}
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.tab, activeTab === 'all' && styles.tabActive]}
                  onPress={() => setActiveTab('all')}
                >
                  <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
                    All Companies
                  </Text>
                  <Text style={[styles.tabCount, activeTab === 'all' && styles.tabCountActive]}>
                    {selectedEarnings.companies.length}
                  </Text>
                </TouchableOpacity>
              </View>
              
              {/* 公司列表 */}
              <View style={styles.earningsList}>
                {getFilteredCompanies().length > 0 ? (
                  getFilteredCompanies().map(renderEarningItem)
                ) : (
                  <View style={styles.noWatchlistContainer}>
                    <Text style={styles.noWatchlistText}>
                      {activeTab === 'watchlist' 
                        ? 'No watchlist companies reporting this day'
                        : 'No companies reporting this day'}
                    </Text>
                  </View>
                )}
              </View>
            </>
          ) : (
            <View style={styles.noEarningsContainer}>
              <Icon
                name="event-busy"
                type="material"
                size={48}
                color={colors.gray400}
              />
              <Text style={styles.noEarningsText}>
                No earnings scheduled for this date
              </Text>
            </View>
          )}
        </View>

        {/* Legend - 横向固定底栏 */}
        <View style={styles.legendBar}>
          <View style={styles.legendBarItem}>
            <View style={styles.legendBmoBadge}>
              <Text style={styles.legendBadgeText}>bmo</Text>
            </View>
            <Text style={styles.legendBarText}>Before market{'\n'}open</Text>
          </View>
          
          <View style={styles.legendBarItem}>
            <View style={styles.legendAmcBadge}>
              <Text style={styles.legendBadgeText}>amc</Text>
            </View>
            <Text style={styles.legendBarText}>After market{'\n'}close</Text>
          </View>
          
          <View style={styles.legendBarItem}>
            <Icon name="bookmark" type="material" size={20} color={colors.primary} />
            <Text style={styles.legendBarText}>In my{'\n'}watchlist</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: '#F9FAFB',
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  headerDisclaimer: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  calendarWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
  },
  calendar: {
    borderRadius: borderRadius.lg,
    paddingBottom: spacing.sm,
  },
  
  // 自定义日历日期样式
  dayWrapper: {
    borderWidth: 0.5,
    borderColor: '#E5E7EB',
  },
  dayContainer: {
    width: 44,
    minHeight: 60,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    backgroundColor: 'transparent',
  },
  dayContainerSelected: {
    backgroundColor: '#F3F4F6',
  },
  dayNumberContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
  },
  todayCircle: {
    backgroundColor: '#F97316',
  },
  selectedCircle: {
    backgroundColor: colors.primary,
  },
  dayNumber: {
    fontSize: 14,
    fontFamily: typography.fontFamily.medium,
    color: colors.text,
  },
  dayNumberDisabled: {
    color: colors.gray300,
  },
  todayText: {
    color: colors.white,
    fontFamily: typography.fontFamily.bold,
  },
  selectedText: {
    color: colors.white,
    fontFamily: typography.fontFamily.bold,
  },
  dayBadges: {
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: 2,
    gap: 2,
  },
  bmoBadgeFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#2563EB',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 36,
  },
  amcBadgeFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#10B981',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    minWidth: 36,
  },
  badgeTextBmo: {
    fontSize: 8,
    fontFamily: typography.fontFamily.medium,
    color: '#FFFFFF',
  },
  badgeCountBmo: {
    fontSize: 8,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  badgeTextAmc: {
    fontSize: 8,
    fontFamily: typography.fontFamily.medium,
    color: '#FFFFFF',
  },
  badgeCountAmc: {
    fontSize: 8,
    fontFamily: typography.fontFamily.bold,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  
  // Tab 切换样式
  tabContainer: {
    flexDirection: 'row',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.primary,
  },
  tabText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  tabTextActive: {
    color: colors.text,
  },
  tabCount: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  tabCountActive: {
    color: colors.primary,
  },

  selectedDateContainer: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  selectedDateTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  earningsList: {
    gap: spacing.sm,
  },
  
  // 公司卡片新样式
  earningItem: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
    borderLeftWidth: 4,
    borderLeftColor: colors.gray300,
    overflow: 'hidden',
  },
  earningItemWatchlisted: {
    borderLeftColor: colors.primary,
  },
  earningItemContent: {
    padding: spacing.md,
  },
  earningItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  earningItemLeft: {
    flex: 1,
  },
  earningItemRight: {
    alignItems: 'flex-end',
    gap: spacing.xs,
  },
  ticker: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  
  // Time tag 填充样式
  timeTagFilled: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: borderRadius.sm,
  },
  timeTagFilledBmo: {
    backgroundColor: '#2563EB',
  },
  timeTagFilledAmc: {
    backgroundColor: '#10B981',
  },
  timeTagFilledText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.semibold,
    color: '#FFFFFF',
  },
  
  // Remind me 按钮
  remindMeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.primary,
    gap: 4,
  },
  remindMeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.medium,
    color: colors.primary,
  },
  watchlistedBadge: {
    padding: spacing.xs,
  },
  
  noWatchlistContainer: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  noWatchlistText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  noEarningsContainer: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  noEarningsText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  
  // Legend 横向底栏样式
  legendBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  legendBarItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  legendBmoBadge: {
    backgroundColor: '#2563EB',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  legendAmcBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  legendBadgeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  legendBarText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 14,
  },
});