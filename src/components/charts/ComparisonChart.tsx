// src/components/charts/ComparisonChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BarChart } from 'react-native-chart-kit';
import { colors, typography, spacing } from '../../theme';
import { formatNumber, formatPercentage } from '../../utils/textHelpers';

interface ComparisonData {
  category: string;
  value: number;
  previousValue?: number;
}

interface Props {
  data: ComparisonData[];
  metadata?: any;
}

export const ComparisonChart: React.FC<Props> = ({ data, metadata = {} }) => {
  // Validate data
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No data available</Text>
      </View>
    );
  }

  // Limit to 7 categories for better visibility
  const limitedData = data.slice(0, 7);

  const chartData = {
    labels: limitedData.map(d => d.category),
    datasets: [{
      data: limitedData.map(d => d.value),
    }],
  };

  // Format value based on metadata
  const formatValue = (value: number) => {
    if (metadata.format === 'currency') {
      return formatNumber(value, metadata.decimals || 0);
    } else if (metadata.format === 'percentage') {
      return formatPercentage(value, metadata.decimals || 1);
    }
    return value.toFixed(metadata.decimals || 0);
  };

  return (
    <View style={styles.container}>
      <BarChart
        data={chartData}
        width={Dimensions.get('window').width - spacing.lg * 4}
        height={220}
        yAxisLabel=""
        yAxisSuffix=""
        chartConfig={{
          backgroundColor: colors.backgroundSecondary,
          backgroundGradientFrom: colors.backgroundSecondary,
          backgroundGradientTo: colors.backgroundSecondary,
          decimalPlaces: metadata.decimals || 0,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          barPercentage: 0.7,
          style: {
            borderRadius: 8,
          },
        }}
        style={styles.chart}
        showValuesOnTopOfBars={true}
        fromZero={true}
      />
      
      {/* Show changes if previous values exist */}
      {limitedData.some(d => d.previousValue !== undefined) && (
        <View style={styles.changesContainer}>
          {limitedData.map((item, index) => {
            if (item.previousValue === undefined) return null;
            const change = ((item.value - item.previousValue) / item.previousValue) * 100;
            const isPositive = change >= 0;
            
            return (
              <View key={index} style={styles.changeItem}>
                <Text style={styles.changeLabel}>{item.category}</Text>
                <Text style={[
                  styles.changeValue,
                  { color: isPositive ? colors.bullish : colors.bearish }
                ]}>
                  {isPositive ? '+' : ''}{change.toFixed(1)}%
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: spacing.sm,
    borderRadius: 8,
  },
  emptyContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  changesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.md,
    justifyContent: 'center',
  },
  changeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.sm,
    marginVertical: spacing.xs,
  },
  changeLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  changeValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
});