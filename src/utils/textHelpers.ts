// src/utils/textHelpers.ts
import React from 'react';
import { Text, View, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../theme';

// Text processing utilities for cleaning API responses
export const cleanAISummary = (text: string | undefined): string => {
  if (!text) return '';
  
  // Remove FEED_SUMMARY: prefix
  let cleaned = text.replace(/^FEED_SUMMARY:\s*/i, '');
  
  // Remove FULL_SUMMARY: prefix if exists
  cleaned = cleaned.replace(/^FULL_SUMMARY:\s*/i, '');
  
  // Remove any \n\nFULL_SUMMARY:\n patterns
  cleaned = cleaned.replace(/\n\nFULL_SUMMARY:\n/g, '\n\n');
  
  // Trim whitespace
  return cleaned.trim();
};

// Clean tags that might have technical markers
export const cleanTags = (tags: string[] | undefined): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags.map(tag => {
    // Remove # symbols if they exist
    let cleanTag = tag.replace(/^#/, '');
    // Remove any numbers in brackets like [1], [2]
    cleanTag = cleanTag.replace(/\[\d+\]/g, '');
    // Trim whitespace
    return cleanTag.trim();
  }).filter(tag => tag.length > 0);
};

// Format large numbers for display
export const formatNumber = (num: number | undefined, decimals: number = 0): string => {
  if (num === undefined || num === null) return 'N/A';
  
  if (num >= 1000000000) {
    return `$${(num / 1000000000).toFixed(decimals)}B`;
  } else if (num >= 1000000) {
    return `$${(num / 1000000).toFixed(decimals)}M`;
  } else if (num >= 1000) {
    return `$${(num / 1000).toFixed(decimals)}K`;
  }
  
  return `$${num.toFixed(decimals)}`;
};

// Format percentage values
export const formatPercentage = (value: number | undefined, decimals: number = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(decimals)}%`;
};

// Clean any technical markers from text
export const cleanText = (text: string | undefined): string => {
  if (!text) return '';
  
  // Remove common technical markers
  let cleaned = text;
  
  // Remove markdown-style headers
  cleaned = cleaned.replace(/^#+\s+/gm, '');
  
  // Remove excessive whitespace
  cleaned = cleaned.replace(/\s+/g, ' ');
  
  // Remove leading/trailing whitespace
  return cleaned.trim();
};

// ==================== NEW: Smart Markup Parsing ====================

interface MarkupRule {
  pattern: RegExp;
  className?: string;
  prefix?: string;
  suffix?: string;
  icon?: string;
  component?: 'text' | 'highlight' | 'insight-box';
}

// Define markup rules matching backend patterns
const markupRules: MarkupRule[] = [
  {
    // Key numbers: *37%* or *$5.2B*
    pattern: /\*([^*]+)\*/g,
    className: 'keyNumber',
    component: 'text'
  },
  {
    // Important concepts: **transformation** or **market leadership**
    pattern: /\*\*([^*]+)\*\*/g,
    className: 'keyConcept',
    component: 'highlight'
  },
  {
    // Positive trends: +[revenue up 15%]
    pattern: /\+\[([^\]]+)\]/g,
    className: 'positiveTrend',
    prefix: '↑ ',
    component: 'text'
  },
  {
    // Negative trends: -[margins compressed 120bps]
    pattern: /-\[([^\]]+)\]/g,
    className: 'negativeTrend',
    prefix: '↓ ',
    component: 'text'
  },
  {
    // Critical insights: [!This marks a strategic inflection point]
    pattern: /\[!([^\]]+)\]/g,
    className: 'criticalInsight',
    icon: 'lightbulb',
    component: 'insight-box'
  }
];

// Parse unified analysis with smart markup
export const parseUnifiedAnalysis = (content: string | undefined): React.ReactElement[] => {
  if (!content) return [React.createElement(Text, { key: 'empty' }, '')];
  
  const elements: React.ReactElement[] = [];
  let lastIndex = 0;
  let elementKey = 0;
  
  // Create a combined pattern to find all markup
  const allPatterns = markupRules.map(rule => rule.pattern.source).join('|');
  const combinedPattern = new RegExp(`(${allPatterns})`, 'g');
  
  // Find all matches
  const matches = Array.from(content.matchAll(combinedPattern));
  
  matches.forEach((match) => {
    const matchIndex = match.index || 0;
    
    // Add text before the match
    if (matchIndex > lastIndex) {
      const plainText = content.substring(lastIndex, matchIndex);
      elements.push(
        React.createElement(Text, {
          key: `text-${elementKey++}`,
          style: styles.plainText
        }, plainText)
      );
    }
    
    // Find which rule matched
    const matchedText = match[0];
    const rule = markupRules.find(r => new RegExp(r.pattern).test(matchedText));
    
    if (rule) {
      // Extract the actual content without markup
      const extractedMatch = matchedText.match(rule.pattern);
      if (extractedMatch && extractedMatch[1]) {
        const content = extractedMatch[1];
        
        switch (rule.component) {
          case 'highlight':
            elements.push(
              React.createElement(Text, {
                key: `highlight-${elementKey++}`,
                style: [styles.baseMarkup, styles[rule.className || 'baseMarkup'] as TextStyle]
              }, content)
            );
            break;
            
          case 'insight-box':
            elements.push(
              React.createElement(View, {
                key: `insight-${elementKey++}`,
                style: styles.insightBox
              }, [
                React.createElement(Icon, {
                  key: 'icon',
                  name: rule.icon || 'lightbulb',
                  size: 20,
                  color: colors.primary
                }),
                React.createElement(Text, {
                  key: 'text',
                  style: styles.insightText
                }, content)
              ])
            );
            break;
            
          default: // 'text'
            elements.push(
              React.createElement(Text, {
                key: `markup-${elementKey++}`,
                style: [styles.baseMarkup, styles[rule.className || 'baseMarkup'] as TextStyle]
              }, `${rule.prefix || ''}${content}${rule.suffix || ''}`)
            );
        }
      }
    }
    
    lastIndex = matchIndex + matchedText.length;
  });
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    elements.push(
      React.createElement(Text, {
        key: `text-${elementKey++}`,
        style: styles.plainText
      }, remainingText)
    );
  }
  
  return elements;
};

// Check if filing has unified analysis
export const hasUnifiedAnalysis = (filing: any): boolean => {
  return filing?.analysis_version === 'v2' && !!filing?.unified_analysis;
};

// Get display summary (prefer unified over legacy)
export const getDisplaySummary = (filing: any): string => {
  if (filing?.unified_feed_summary) {
    return filing.unified_feed_summary;
  }
  return filing?.one_liner || filing?.ai_summary || '';
};

// Get full analysis content (prefer unified over legacy)
export const getDisplayAnalysis = (filing: any): string => {
  if (hasUnifiedAnalysis(filing)) {
    return filing.unified_analysis;
  }
  return filing?.ai_summary || '';
};

// Define styles interface
interface MarkupStyles {
  plainText: TextStyle;
  baseMarkup: TextStyle;
  keyNumber: TextStyle;
  keyConcept: TextStyle;
  positiveTrend: TextStyle;
  negativeTrend: TextStyle;
  insightBox: ViewStyle;
  insightText: TextStyle;
  [key: string]: TextStyle | ViewStyle;
}

// Styles for markup elements
const styles = StyleSheet.create<MarkupStyles>({
  // Base text styles
  plainText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
  },
  baseMarkup: {
    fontSize: typography.fontSize.base,
    lineHeight: 24,
  },
  
  // Markup-specific styles
  keyNumber: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold as any,
    fontSize: typography.fontSize.lg,
  },
  keyConcept: {
    backgroundColor: colors.warning ? `${colors.warning}20` : '#FFC10720',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text,
  },
  positiveTrend: {
    color: colors.success || '#10B981',
    fontWeight: typography.fontWeight.semibold as any,
  },
  negativeTrend: {
    color: colors.error || '#EF4444',
    fontWeight: typography.fontWeight.semibold as any,
  },
  
  // Insight box styles
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: `${colors.primary}10`,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginVertical: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  insightText: {
    flex: 1,
    marginLeft: spacing.sm,
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 22,
    fontWeight: typography.fontWeight.medium as any,
  },
});