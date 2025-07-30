// src/components/interactions/StatsDisplay.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { Icon } from 'react-native-elements';
import { colors, typography, spacing } from '../../theme';

interface StatsDisplayProps {
  commentCount: number;
  viewCount: number;
  onCommentPress?: () => void;
  isProUser?: boolean;
  style?: ViewStyle;
  mode?: 'compact' | 'full';
}

export const StatsDisplay: React.FC<StatsDisplayProps> = ({
  commentCount,
  viewCount,
  onCommentPress,
  isProUser = true,
  style,
  mode = 'compact',
}) => {
  return (
    <View style={[styles.container, mode === 'full' && styles.containerFull, style]}>
      {/* Comment Count */}
      {onCommentPress ? (
        <TouchableOpacity 
          style={[styles.statItem, mode === 'full' && styles.statItemFull]} 
          onPress={onCommentPress}
        >
          <Icon 
            name="chat-bubble-outline" 
            size={mode === 'full' ? 18 : 14} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.statText, mode === 'full' && styles.statTextFull]}>
            {commentCount}
          </Text>
          {mode === 'full' && (
            <Text style={styles.statLabel}>Comments</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[styles.statItem, mode === 'full' && styles.statItemFull]}>
          <Icon 
            name="chat-bubble-outline" 
            size={mode === 'full' ? 18 : 14} 
            color={colors.textSecondary} 
          />
          <Text style={[styles.statText, mode === 'full' && styles.statTextFull]}>
            {commentCount}
          </Text>
          {mode === 'full' && (
            <Text style={styles.statLabel}>Comments</Text>
          )}
        </View>
      )}
      
      {/* View Count */}
      <View style={[styles.statItem, mode === 'full' && styles.statItemFull]}>
        <Icon 
          name="visibility" 
          size={mode === 'full' ? 18 : 14} 
          color={colors.textSecondary} 
        />
        <Text style={[styles.statText, mode === 'full' && styles.statTextFull]}>
          {viewCount}
        </Text>
        {mode === 'full' && (
          <Text style={styles.statLabel}>Views</Text>
        )}
      </View>

      {/* Pro Indicator - only show in compact mode */}
      {!isProUser && mode === 'compact' && (
        <View style={styles.proIndicator}>
          <Icon name="lock" size={12} color={colors.warning} />
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  containerFull: {
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
  },
  statItemFull: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 0,
  },
  statText: {
    fontSize: typography.fontSize.xs,
    color: colors.gray600,
    marginLeft: 4,
    fontWeight: '500',
  },
  statTextFull: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray700,
    marginLeft: 0,
    marginTop: spacing.xs,
  },
  statLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  proIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: spacing.sm,
    backgroundColor: colors.warning + '20',
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  proText: {
    fontSize: 10,
    color: colors.warning,
    fontWeight: typography.fontWeight.bold,
    marginLeft: 2,
  },
});