// src/components/charts/TrendChart.tsx
import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { colors, typography, spacing } from '../../theme';
import { formatNumber } from '../../utils/textHelpers';

interface TrendData {
  label: string;
  value: number;
  value2?: number;
}

interface Props {
  data: TrendData[];
  metadata?: any;
}

export const TrendChart: React.FC<Props> = ({ data, metadata = {} }) => {
  // Validate data
  if (!data || data.length < 2) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Insufficient data for trend</Text>
      </View>
    );
  }

  // Prepare chart data
  const labels = data.map(d => d.label);
  const values = data.map(d => d.value);
  const hasSecondLine = data.some(d => d.value2 !== undefined);
  
  const datasets = [{
    data: values,
    color: (opacity = 1) => colors.primary,
    strokeWidth: 2,
  }];

  if (hasSecondLine) {
    datasets.push({
      data: data.map(d => d.value2 || 0),
      color: (opacity = 1) => colors.secondary,
      strokeWidth: 2,
    });
  }

  const chartData = {
    labels: labels,
    datasets: datasets,
  };

  // Format Y-axis labels
  const formatYLabel = (value: any) => {
    if (metadata.format === 'currency') {
      return formatNumber(Number(value), metadata.decimals || 0);
    } else if (metadata.format === 'percentage') {
      return `${value}%`;
    }
    return String(value);
  };

  return (
    <View style={styles.container}>
      <LineChart
        data={chartData}
        width={Dimensions.get('window').width - spacing.lg * 4}
        height={220}
        chartConfig={{
          backgroundColor: colors.backgroundSecondary,
          backgroundGradientFrom: colors.backgroundSecondary,
          backgroundGradientTo: colors.backgroundSecondary,
          decimalPlaces: metadata.decimals || 0,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          style: {
            borderRadius: 8,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
          },
        }}
        bezier
        style={styles.chart}
        formatYLabel={formatYLabel}
        yAxisSuffix={metadata.suffix || ''}
        yAxisInterval={1}
      />
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
});