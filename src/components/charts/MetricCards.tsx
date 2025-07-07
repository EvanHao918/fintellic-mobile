// src/components/charts/MetricCards.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';

interface MetricData {
  label: string;
  value: string | number;
  change?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
  };
  benchmark?: {
    label: string;
    value: string | number;
  };
}

interface Props {
  data: MetricData[];
  metadata?: any;
}

export const MetricCards: React.FC<Props> = ({ data, metadata = {} }) => {
  if (!data || data.length === 0) {
    return null;
  }

  const getChangeIcon = (direction: string) => {
    switch (direction) {
      case 'up':
        return 'trending-up';
      case 'down':
        return 'trending-down';
      default:
        return 'trending-flat';
    }
  };

  const getChangeColor = (direction: string) => {
    switch (direction) {
      case 'up':
        return colors.bullish;
      case 'down':
        return colors.bearish;
      default:
        return colors.neutral;
    }
  };

  return (
    <View style={styles.container}>
      {data.map((metric, index) => (
        <View key={index} style={styles.card}>
          <Text style={styles.label}>{metric.label}</Text>
          <Text style={styles.value}>{metric.value}</Text>
          
          {metric.change && (
            <View style={styles.changeContainer}>
              <Icon
                name={getChangeIcon(metric.change.direction)}
                size={16}
                color={getChangeColor(metric.change.direction)}
              />
              <Text style={[
                styles.changeText,
                { color: getChangeColor(metric.change.direction) }
              ]}>
                {metric.change.value > 0 ? '+' : ''}{metric.change.value}%
              </Text>
            </View>
          )}
          
          {metric.benchmark && (
            <View style={styles.benchmarkContainer}>
              <Text style={styles.benchmarkLabel}>{metric.benchmark.label}:</Text>
              <Text style={styles.benchmarkValue}>{metric.benchmark.value}</Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    width: '48%',
    minHeight: 100,
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  value: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  changeText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    marginLeft: spacing.xs,
  },
  benchmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  benchmarkLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginRight: spacing.xs,
  },
  benchmarkValue: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
});