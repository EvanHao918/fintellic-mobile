import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from 'react-native-elements';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { colors, typography, spacing, borderRadius, shadows } from '../theme';
import apiClient from '../api/client';

// Types for earnings data
interface EarningsEvent {
  ticker: string;
  company_name: string;
  earnings_date: string;
  earnings_time: 'BMO' | 'AMC' | 'TNS'; // Before Market Open / After Market Close / Time Not Specified
  is_watched: boolean;
}

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
  hasEarnings: boolean;
  earningsCount: number;
}

interface WeeklyEarnings {
  title: string;
  data: EarningsEvent[];
}

export default function CalendarScreen() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([]);
  const [monthlyEarnings, setMonthlyEarnings] = useState<Record<string, EarningsEvent[]>>({});
  const [weeklyEarnings, setWeeklyEarnings] = useState<WeeklyEarnings[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('week');
  
  // Get user's watchlist from Redux (will be implemented later)
  // TODO: Add watchlist to User type and implement watchlist state
  const watchlist: string[] = [];

  // Generate calendar days for the month view
  const generateCalendarDays = (date: Date, earnings: Record<string, EarningsEvent[]>) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days: CalendarDay[] = [];
    const current = new Date(startDate);
    
    for (let i = 0; i < 42; i++) { // 6 weeks * 7 days
      const dateKey = current.toISOString().split('T')[0];
      const dayEarnings = earnings[dateKey] || [];
      
      days.push({
        date: dateKey,
        day: current.getDate(),
        isCurrentMonth: current.getMonth() === month,
        hasEarnings: dayEarnings.length > 0,
        earningsCount: dayEarnings.length,
      });
      
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  // Fetch earnings calendar data
  const fetchEarningsCalendar = async () => {
    try {
      setIsLoading(true);
      
      // Fetch monthly earnings
      const monthlyResponse = await apiClient.get('/earnings/calendar/monthly', {
        params: {
          year: selectedDate.getFullYear(),
          month: selectedDate.getMonth() + 1,
        },
      });
      
      // Fetch weekly earnings for "This Week" view
      const weeklyResponse = await apiClient.get('/earnings/calendar/weekly');
      
      // Process monthly data
      const earningsByDate: Record<string, EarningsEvent[]> = {};
      monthlyResponse.data.forEach((event: any) => {
        const date = event.earnings_date.split('T')[0];
        if (!earningsByDate[date]) {
          earningsByDate[date] = [];
        }
        earningsByDate[date].push({
          ...event,
          is_watched: watchlist.includes(event.ticker),
        });
      });
      
      // Process weekly data
      const weeklyData: WeeklyEarnings[] = [];
      const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      
      weeklyResponse.data.forEach((event: any) => {
        const eventDate = new Date(event.earnings_date);
        const dayName = weekDays[eventDate.getDay()];
        const dateStr = eventDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const sectionTitle = `${dayName}, ${dateStr}`;
        
        let section = weeklyData.find(s => s.title === sectionTitle);
        if (!section) {
          section = { title: sectionTitle, data: [] };
          weeklyData.push(section);
        }
        
        section.data.push({
          ...event,
          is_watched: watchlist.includes(event.ticker),
        });
      });
      
      setMonthlyEarnings(earningsByDate);
      setWeeklyEarnings(weeklyData);
      setCalendarDays(generateCalendarDays(selectedDate, earningsByDate));
    } catch (error) {
      console.error('Failed to fetch earnings calendar:', error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEarningsCalendar();
  }, [selectedDate]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchEarningsCalendar();
  };

  // Navigate to previous/next month
  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setMonth(newDate.getMonth() + (direction === 'next' ? 1 : -1));
    setSelectedDate(newDate);
  };

  // Render calendar header
  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <TouchableOpacity onPress={() => navigateMonth('prev')} style={styles.navButton}>
        <Icon name="chevron-left" type="material" size={24} color={colors.text} />
      </TouchableOpacity>
      <Text style={styles.monthTitle}>
        {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
      </Text>
      <TouchableOpacity onPress={() => navigateMonth('next')} style={styles.navButton}>
        <Icon name="chevron-right" type="material" size={24} color={colors.text} />
      </TouchableOpacity>
    </View>
  );

  // Render month view
  const renderMonthView = () => (
    <View>
      {renderCalendarHeader()}
      
      {/* Day labels */}
      <View style={styles.weekDays}>
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <Text key={day} style={styles.weekDayText}>{day}</Text>
        ))}
      </View>
      
      {/* Calendar grid */}
      <View style={styles.calendarGrid}>
        {calendarDays.map((day, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.calendarDay,
              !day.isCurrentMonth && styles.otherMonthDay,
              day.hasEarnings && styles.hasEarningsDay,
            ]}
            onPress={() => {
              if (day.hasEarnings) {
                // TODO: Show earnings for this day
              }
            }}
          >
            <Text style={[
              styles.dayText,
              !day.isCurrentMonth && styles.otherMonthDayText,
            ]}>
              {day.day}
            </Text>
            {day.hasEarnings && (
              <View style={styles.earningsDot}>
                <Text style={styles.earningsCount}>{day.earningsCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render earnings item
  const renderEarningsItem = ({ item }: { item: EarningsEvent }) => (
    <TouchableOpacity style={styles.earningsItem}>
      <View style={styles.earningsItemLeft}>
        <Text style={styles.ticker}>{item.ticker}</Text>
        <Text style={styles.companyName} numberOfLines={1}>{item.company_name}</Text>
      </View>
      <View style={styles.earningsItemRight}>
        <View style={[styles.timeBadge, 
          item.earnings_time === 'BMO' ? styles.bmoBadge : styles.amcBadge
        ]}>
          <Text style={styles.timeText}>{item.earnings_time}</Text>
        </View>
        {item.is_watched && (
          <Icon name="star" type="material" size={20} color={colors.warning} />
        )}
      </View>
    </TouchableOpacity>
  );

  // Render week view
  const renderWeekView = () => (
    <SectionList
      sections={weeklyEarnings}
      keyExtractor={(item) => `${item.ticker}-${item.earnings_date}`}
      renderItem={renderEarningsItem}
      renderSectionHeader={({ section: { title } }) => (
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
      )}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Icon name="event-busy" type="material" size={48} color={colors.textSecondary} />
          <Text style={styles.emptyText}>No earnings scheduled this week</Text>
        </View>
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    />
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Loading earnings calendar...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* View mode toggle */}
      <View style={styles.viewToggle}>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'week' && styles.toggleButtonActive]}
          onPress={() => setViewMode('week')}
        >
          <Text style={[styles.toggleText, viewMode === 'week' && styles.toggleTextActive]}>
            This Week
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, viewMode === 'month' && styles.toggleButtonActive]}
          onPress={() => setViewMode('month')}
        >
          <Text style={[styles.toggleText, viewMode === 'month' && styles.toggleTextActive]}>
            Month View
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {viewMode === 'month' ? renderMonthView() : renderWeekView()}
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
  loadingText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
  },
  viewToggle: {
    flexDirection: 'row',
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.white,
    padding: spacing.xs,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
  },
  toggleButtonActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  navButton: {
    padding: spacing.sm,
  },
  monthTitle: {
    fontSize: typography.fontSize.lg,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  weekDays: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.medium,
    color: colors.textSecondary,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
  otherMonthDay: {
    opacity: 0.3,
  },
  hasEarningsDay: {
    backgroundColor: colors.primaryLight,
    borderRadius: borderRadius.md,
  },
  dayText: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.text,
  },
  otherMonthDayText: {
    color: colors.textSecondary,
  },
  earningsDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsCount: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  sectionHeader: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  sectionTitle: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  earningsItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    backgroundColor: colors.background,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  earningsItemLeft: {
    flex: 1,
  },
  ticker: {
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.bold,
    color: colors.text,
  },
  companyName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
  earningsItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  timeBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  bmoBadge: {
    backgroundColor: colors.info,
  },
  amcBadge: {
    backgroundColor: colors.warning,
  },
  timeText: {
    fontSize: typography.fontSize.xs,
    fontFamily: typography.fontFamily.bold,
    color: colors.white,
  },
  emptyContainer: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: spacing.md,
    fontSize: typography.fontSize.md,
    fontFamily: typography.fontFamily.regular,
    color: colors.textSecondary,
  },
});