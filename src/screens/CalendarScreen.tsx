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
import { colors, typography, spacing, borderRadius } from '../theme';
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

  // Load earnings data
  useEffect(() => {
    fetchEarningsCalendar();
  }, []);

  const loadWatchlist = async () => {
    try {
      // First try to get from API if user is logged in
      if (user) {
        const response = await apiClient.get('/watchlist');
        if (response.data && Array.isArray(response.data)) {
          const tickers = response.data.map((item: any) => 
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
      const year = now.getFullYear();
      const month = now.getMonth() + 1;
      
      // Fetch monthly calendar
      const monthlyResponse = await apiClient.get('/earnings/calendar/monthly', {
        params: { year, month }
      });
      
      // Check if response has the expected structure
      if (monthlyResponse.data && monthlyResponse.data.earnings_days) {
        const earnings = monthlyResponse.data.earnings_days;
        setEarningsData(earnings);
        
        // Mark dates on calendar
        const marked: any = {};
        earnings.forEach((day: EarningsDay) => {
          const hasWatchlistCompany = day.companies.some(c => 
            watchlist.includes(c.ticker)
          );
          
          marked[day.date] = {
            marked: true,
            dotColor: hasWatchlistCompany ? colors.primary : colors.textSecondary,
            customStyles: {
              container: {
                backgroundColor: hasWatchlistCompany ? colors.primaryLight : colors.gray100,
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
    await fetchEarningsCalendar();
    setRefreshing(false);
  };

  const onDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
  };

  const getSelectedDateEarnings = () => {
    return earningsData.find(day => day.date === selectedDate);
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
                  Rev Est: ${(company.revenue_estimate / 1e9).toFixed(1)}B
                </Text>
              )}
            </View>
          )}
        </View>
        
        <View style={styles.earningItemRight}>
          <View style={[styles.timeBadge, getTimeBadgeStyle(company.time)]}>
            <Text style={styles.timeBadgeText}>{company.time}</Text>
          </View>
          {isWatchlisted && (
            <Icon
              name="star"
              type="material"
              size={16}
              color={colors.warning}
              style={styles.watchlistIcon}
            />
          )}
        </View>
      </View>
    );
  };

  const getTimeBadgeStyle = (time: string) => {
    switch (time) {
      case 'BMO':
        return { backgroundColor: colors.info };
      case 'AMC':
        return { backgroundColor: colors.warning };
      default:
        return { backgroundColor: colors.gray400 };
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const selectedEarnings = getSelectedDateEarnings();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Earnings Calendar</Text>
          <Text style={styles.headerSubtitle}>
            Upcoming earnings announcements
          </Text>
        </View>

        {/* Calendar */}
        <View style={styles.calendarContainer}>
          <Calendar
            current={selectedDate}
            onDayPress={onDayPress}
            markedDates={markedDates}
            markingType="custom"
            theme={{
              backgroundColor: colors.white,
              calendarBackground: colors.white,
              selectedDayBackgroundColor: colors.primary,
              selectedDayTextColor: colors.white,
              todayTextColor: colors.primary,
              dayTextColor: colors.text,
              textDisabledColor: colors.gray400,
              dotColor: colors.primary,
              monthTextColor: colors.text,
              textMonthFontWeight: 'bold',
              textDayFontSize: 14,
              textMonthFontSize: 16,
              textDayHeaderFontSize: 12,
            }}
          />
        </View>

        {/* Selected Date Earnings */}
        <View style={styles.selectedDateContainer}>
          <Text style={styles.selectedDateTitle}>
            {new Date(selectedDate).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
          
          {selectedEarnings ? (
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
              <View style={[styles.legendDot, { backgroundColor: colors.info }]} />
              <Text style={styles.legendText}>BMO - Before Market Open</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: colors.warning }]} />
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
    backgroundColor: colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  calendarContainer: {
    backgroundColor: colors.white,
    paddingBottom: spacing.md,
  },
  selectedDateContainer: {
    padding: spacing.lg,
  },
  selectedDateTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  earningsCount: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  earningsList: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  earningItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  earningItemLeft: {
    flex: 1,
  },
  earningItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ticker: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  estimates: {
    flexDirection: 'row',
    marginTop: spacing.xs,
  },
  estimateText: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.md,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
  },
  timeBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.medium,
    color: colors.white,
  },
  watchlistIcon: {
    marginLeft: spacing.sm,
  },
  noEarningsContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  noEarningsText: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  legend: {
    padding: spacing.lg,
    backgroundColor: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  legendTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  legendItems: {
    gap: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  legendText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
});