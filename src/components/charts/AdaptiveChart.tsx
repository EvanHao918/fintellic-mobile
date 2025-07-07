// src/components/charts/AdaptiveChart.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendChart } from './TrendChart';
import { ComparisonChart } from './ComparisonChart';
import { MetricCards } from './MetricCards';
import { colors, typography, spacing } from '../../theme';

export interface VisualData {
  id: string;
  type: 'trend' | 'comparison' | 'metrics';
  title: string;
  subtitle?: string;
  data: any;
  metadata?: {
    format?: 'currency' | 'percentage' | 'number' | 'ratio';
    unit?: string;
    prefix?: string;
    suffix?: string;
    decimals?: number;
  };
}

interface Props {
  visual: VisualData;
}

export const AdaptiveChart: React.FC<Props> = ({ visual }) => {
  const renderChart = () => {
    switch (visual.type) {
      case 'trend':
        return <TrendChart data={visual.data} metadata={visual.metadata} />;
      case 'comparison':
        return <ComparisonChart data={visual.data} metadata={visual.metadata} />;
      case 'metrics':
        return <MetricCards data={visual.data} metadata={visual.metadata} />;
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{visual.title}</Text>
      {visual.subtitle && (
        <Text style={styles.subtitle}>{visual.subtitle}</Text>
      )}
      <View style={styles.chartContainer}>
        {renderChart()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  chartContainer: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
  },
});