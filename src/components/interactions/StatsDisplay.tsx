// src/components/interactions/StatsDisplay.tsx
// 🔥 FIXED: Optimized for top-right positioning to avoid overlap with voting buttons

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
    <View style={[
      mode === 'compact' ? styles.containerCompact : styles.containerFull, 
      style
    ]}>
      {/* Comment Count */}
      {onCommentPress ? (
        <TouchableOpacity 
          style={[
            mode === 'compact' ? styles.statItemCompact : styles.statItemFull
          ]} 
          onPress={onCommentPress}
        >
          <Icon 
            name="chat-bubble-outline" 
            size={mode === 'full' ? 18 : 12} 
            color={colors.textSecondary} 
          />
          <Text style={[
            mode === 'compact' ? styles.statTextCompact : styles.statTextFull
          ]}>
            {commentCount}
          </Text>
          {mode === 'full' && (
            <Text style={styles.statLabel}>Comments</Text>
          )}
        </TouchableOpacity>
      ) : (
        <View style={[
          mode === 'compact' ? styles.statItemCompact : styles.statItemFull
        ]}>
          <Icon 
            name="chat-bubble-outline" 
            size={mode === 'full' ? 18 : 12} 
            color={colors.textSecondary} 
          />
          <Text style={[
            mode === 'compact' ? styles.statTextCompact : styles.statTextFull
          ]}>
            {commentCount}
          </Text>
          {mode === 'full' && (
            <Text style={styles.statLabel}>Comments</Text>
          )}
        </View>
      )}
      
      {/* View Count */}
      <View style={[
        mode === 'compact' ? styles.statItemCompact : styles.statItemFull
      ]}>
        <Icon 
          name="visibility" 
          size={mode === 'full' ? 18 : 12} 
          color={colors.textSecondary} 
        />
        <Text style={[
          mode === 'compact' ? styles.statTextCompact : styles.statTextFull
        ]}>
          {viewCount}
        </Text>
        {mode === 'full' && (
          <Text style={styles.statLabel}>Views</Text>
        )}
      </View>

      {/* Pro Indicator - only show in full mode for non-pro users */}
      {!isProUser && mode === 'full' && (
        <View style={styles.proIndicator}>
          <Icon name="lock" size={12} color={colors.warning} />
          <Text style={styles.proText}>PRO</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  // 🔥 NEW: Separate compact and full container styles
  containerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs, // Use gap instead of margins for cleaner spacing
  },
  containerFull: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingVertical: spacing.sm,
  },
  
  // 🔥 NEW: Optimized compact mode for top-right positioning
  statItemCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2, // Very tight spacing for compact mode
  },
  statItemFull: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  
  // 🔥 OPTIMIZED: Smaller text and tighter spacing for compact mode
  statTextCompact: {
    fontSize: 10, // Smaller font for compact mode
    color: colors.gray600,
    fontWeight: '600',
    lineHeight: 12,
  },
  statTextFull: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.gray700,
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