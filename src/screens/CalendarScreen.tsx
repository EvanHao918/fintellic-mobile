import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
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

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const getSelectedDateEarnings = () => {
    return earningsData.find(day => day.date === selectedDate);
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
      <View key={company.ticker} style={styles.earningItem}>
        <View style={styles.earningItemLeft}>
          <Text style={styles.ticker}>{company.ticker}</Text>
          <Text style={styles.companyName}>{company.name}</Text>
          {(company.eps_estimate || company.revenue_estimate) && (
            <View style={styles.estimates}>
              {company.eps_estimate && (
                <Text style={styles.estimateText}>
                  EPS Est: ${company.eps_estimate}
                </Text>
              )}
              {company.revenue_estimate && (
                <Text style={styles.estimateText}>
                  Rev Est: ${company.revenue_estimate}B
                </Text>
              )}
            </View>
          )}
        </View>
        <View style={styles.earningItemRight}>
          <View style={[styles.timeBadge, getTimeStyle(company.time)]}>
            <Text style={styles.timeText}>{company.time}</Text>
          </View>
          {isWatchlisted && (
            <Icon name="star" type="material" size={20} color={colors.warning} />
          )}
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
            markedDates={markedDates}
            markingType={'custom'}
            theme={{
              backgroundColor: colors.white,
              calendarBackground: colors.white,
              textSectionTitleColor: colors.textSecondary,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.white,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.gray300,
              dotColor: colors.primary,
              selectedDotColor: colors.white,
              arrowColor: colors.primary,
              monthTextColor: colors.text,
              textDayFontFamily: typography.fontFamily.regular,
              textMonthFontFamily: typography.fontFamily.semibold,
              textDayHeaderFontFamily: typography.fontFamily.medium,
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
            style={styles.calendar}
          />
          {/* Overlay grid lines */}
          <View style={styles.gridOverlay} pointerEvents="none">
            {[...Array(6)].map((_, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.gridRow}>
                {[...Array(7)].map((_, colIndex) => (
                  <View key={`cell-${rowIndex}-${colIndex}`} style={styles.gridCell} />
                ))}
              </View>
            ))}
          </View>
        </View>

        {/* Selected Date Earnings */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateTitle}>
            {formatSelectedDate(selectedDate)}
          </Text>
          
          {selectedEarnings && selectedEarnings.companies.length > 0 ? (
            <>
              <Text style={styles.earningsCount}>
                {selectedEarnings.companies.length} companies reporting
              </Text>
              
              <View style={styles.earningsList}>
                {selectedEarnings.companies.map(renderEarningItem)}
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

        {/* Legend */}
        <View style={styles.legend}>
          <Text style={styles.legendTitle}>Time Legend</Text>
          <View style={styles.legendItems}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.legendText}>BMO - Before Market Open</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
              <Text style={styles.legendText}>AMC - After Market Close</Text>
            </View>
            <View style={styles.legendItem}>
              <Icon name="star" type="material" size={16} color={colors.warning} />
              <Text style={styles.legendText}>In your watchlist</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.beige, // 🎨 Changed to beige background
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
    backgroundColor: colors.beige,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontFamily: typography.fontFamily.bold,
    fontStyle: 'italic',
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
  // 🎨 NEW: Calendar wrapper with border and shadow
  calendarWrapper: {
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadows.md,
    position: 'relative',
  },
  // 🎨 NEW: Calendar styling
  calendar: {
    borderRadius: borderRadius.lg,
    paddingBottom: spacing.sm,
  },
  // 🎨 NEW: Grid overlay
  gridOverlay: {
    position: 'absolute',
    top: 110, // Adjust based on header height
    left: 0,
    right: 0,
    bottom: 0,
  },
  gridRow: {
    flexDirection: 'row',
    height: 48, // Approximate height of each week row
  },
  gridCell: {
    flex: 1,
    borderWidth: 0.3,
    borderColor: colors.gray200,
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
    marginBottom: spacing.sm,
  },
  earningsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  earningsList: {
    gap: spacing.sm,
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  earningItemLeft: {
    flex: 1,
  },
  earningItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  ticker: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xxs,
  },
  estimates: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  estimateText: {
    fontSize: typography.fontSize.xs,
    color: colors.primary,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    color: colors.white,
    fontFamily: typography.fontFamily.medium,
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
  legend: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.sm,
  },
  legendTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  legendItems: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});