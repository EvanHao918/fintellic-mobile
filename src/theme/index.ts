// src/theme/index.ts
import { Theme } from 'react-native-elements';

// Color palette - Hermes Theme (Dark Gold/Orange)
export const colors = {
  // Primary colors - Hermes Orange/Dark Gold
  primary: '#D97706',       // Dark amber/orange (Hermes primary)
  primaryDark: '#B45309',   // Darker amber
  primaryLight: '#F59E0B',  // Lighter amber
  
  // Accent colors - Complementary dark gold
  accent: '#92400E',        // Dark bronze
  accentLight: '#DC2626',   // Warm red accent
  
  // Secondary colors - Neutral grays
  secondary: '#F8FAFC',     // Off white
  secondaryDark: '#F1F5F9', // Light gray
  secondaryLight: '#FFFFFF', // Pure white
  
  // Status colors - Clear but not harsh
  success: '#10B981',       // Emerald
  warning: '#F59E0B',       // Amber (matches primary light)
  error: '#EF4444',         // Red
  errorLight: '#FEE2E2',    // Light red background
  info: '#3B82F6',          // Blue
  
  // Filing type colors - Distinguished but harmonious
  filing10K: '#2563EB',     // Blue (annual) - 保持原始蓝色
  filing10Q: '#10B981',     // Emerald (quarterly)
  filing8K: '#DC2626',      // Warm red (current)
  filingS1: '#7C3AED',      // Purple (IPO)
  
  // Sentiment colors - Clear indicators
  bullish: '#10B981',       // Emerald
  neutral: '#6B7280',       // Gray
  bearish: '#EF4444',       // Red
  
  // Grayscale - Balanced range
  black: '#000000',
  gray900: '#111827',
  gray800: '#1F2937',
  gray700: '#374151',
  gray600: '#4B5563',
  gray500: '#6B7280',
  gray400: '#9CA3AF',
  gray300: '#D1D5DB',
  gray200: '#E5E7EB',
  gray100: '#F3F4F6',
  gray50: '#F9FAFB',
  white: '#FFFFFF',
  
  // Semantic colors
  text: '#1F2937',          // Dark gray
  textSecondary: '#6B7280', // Medium gray
  textInverse: '#FFFFFF',   
  background: '#FFFFFF',    
  backgroundSecondary: '#F9FAFB',
  border: '#E5E7EB',
  divider: 'rgba(0, 0, 0, 0.06)',
  overlay: 'rgba(0, 0, 0, 0.5)',
  
  // Action colors - Using Hermes theme
  actionPrimary: '#D97706',
  actionSecondary: '#6B7280',
  actionDisabled: 'rgba(0, 0, 0, 0.26)',
  actionDisabledBackground: 'rgba(0, 0, 0, 0.12)',
};

// Typography - Clean & Readable
export const typography = {
  // Font families
  fontFamily: {
    regular: 'System',
    medium: 'System',
    semibold: 'System',
    bold: 'System',
  },
  
  // Font sizes - Comfortable scale
  fontSize: {
    xs: 12,
    sm: 14,
    base: 16,
    md: 18,
    lg: 20,
    xl: 24,
    xxl: 30,
    xxxl: 36,
  },
  
  // Font weights
  fontWeight: {
    regular: '400' as '400',
    medium: '500' as '500',
    semibold: '600' as '600',
    bold: '700' as '700',
  },
  
  // Line heights
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
};

// Spacing - Generous and consistent
export const spacing = {
  xxs: 4,
  xs: 8,
  sm: 12,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
};

// Border radius - Soft but not playful
export const borderRadius = {
  none: 0,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  xxl: 20,
  full: 9999,
};

// Shadows - Subtle depth
export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 16,
  },
};

// Animation durations
export const animation = {
  fast: 200,
  normal: 300,
  slow: 500,
};

// Filing type configurations
export const filingTypes = {
  '10-K': {
    color: colors.filing10K,
    label: '10-K',
    description: 'Annual Report',
  },
  '10-Q': {
    color: colors.filing10Q,
    label: '10-Q',
    description: 'Quarterly Report',
  },
  '8-K': {
    color: colors.filing8K,
    label: '8-K',
    description: 'Current Report',
  },
  'S-1': {
    color: colors.filingS1,
    label: 'S-1',
    description: 'IPO Registration',
  },
};

// Sentiment configurations
export const sentiments = {
  bullish: {
    color: colors.bullish,
    icon: 'trending-up',
    emoji: '↗',
    label: 'Bullish',
  },
  neutral: {
    color: colors.neutral,
    icon: 'trending-flat',
    emoji: '→',
    label: 'Neutral',
  },
  bearish: {
    color: colors.bearish,
    icon: 'trending-down',
    emoji: '↘',
    label: 'Bearish',
  },
};

// React Native Elements theme configuration
export const theme: Theme = {
  colors: {
    primary: colors.primary,
    secondary: colors.secondary,
    success: colors.success,
    warning: colors.warning,
    error: colors.error,
    grey0: colors.gray900,
    grey1: colors.gray800,
    grey2: colors.gray700,
    grey3: colors.gray600,
    grey4: colors.gray500,
    grey5: colors.gray400,
    greyOutline: colors.border,
    searchBg: colors.gray100,
    disabled: colors.actionDisabled,
    divider: colors.divider,
  },
  Text: {
    style: {
      fontSize: typography.fontSize.base,
      color: colors.text,
      fontWeight: typography.fontWeight.regular,
    },
    h1Style: {
      fontSize: typography.fontSize.xxxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
    },
    h2Style: {
      fontSize: typography.fontSize.xxl,
      fontWeight: typography.fontWeight.bold,
      color: colors.text,
    },
    h3Style: {
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text,
    },
    h4Style: {
      fontSize: typography.fontSize.lg,
      fontWeight: typography.fontWeight.semibold,
      color: colors.text,
    },
  },
  Button: {
    titleStyle: {
      fontSize: typography.fontSize.base,
      fontWeight: typography.fontWeight.semibold,
    },
    buttonStyle: {
      borderRadius: borderRadius.md,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
    },
    disabledStyle: {
      backgroundColor: colors.actionDisabledBackground,
    },
    disabledTitleStyle: {
      color: colors.actionDisabled,
    },
  },
  Input: {
    inputStyle: {
      fontSize: typography.fontSize.base,
      color: colors.text,
    },
    inputContainerStyle: {
      borderBottomColor: colors.border,
    },
    placeholderTextColor: colors.textSecondary,
    errorStyle: {
      color: colors.error,
      fontSize: typography.fontSize.sm,
      marginTop: spacing.xxs,
    },
  },
  Card: {
    containerStyle: {
      borderRadius: borderRadius.lg,
      ...shadows.md,
      borderWidth: 0,
      marginHorizontal: 0,
      marginTop: 0,
      marginBottom: spacing.md,
    },
  },
  ListItem: {
    containerStyle: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
    },
  },
};

// Style helpers
export const commonStyles = {
  // Containers
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  contentContainer: {
    padding: spacing.md,
  },
  
  // Cards
  card: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    ...shadows.md,
  },
  
  // Buttons
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center' as 'center',
  },
  
  secondaryButton: {
    backgroundColor: colors.white,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: spacing.sm - 1,
    paddingHorizontal: spacing.lg,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center' as 'center',
  },
  
  // Text styles
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  body: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.regular,
    color: colors.text,
    lineHeight: typography.fontSize.base * typography.lineHeight.normal,
  },
  caption: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.regular,
    color: colors.textSecondary,
  },
  
  // Form styles
  inputContainer: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  
  // Layout helpers
  row: {
    flexDirection: 'row' as 'row',
    alignItems: 'center' as 'center',
  },
  spaceBetween: {
    justifyContent: 'space-between' as 'space-between',
  },
  center: {
    justifyContent: 'center' as 'center',
    alignItems: 'center' as 'center',
  },
  
  // Filing type badge
  filingBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xxs,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start' as 'flex-start',
  },
  filingBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
  },
};

// Export all theme utilities
export default {
  theme,
  colors,
  typography,
  spacing,
  borderRadius,
  shadows,
  animation,
  filingTypes,
  sentiments,
  commonStyles,
};