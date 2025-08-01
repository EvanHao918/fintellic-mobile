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

// ==================== ENHANCED: Smart Markup Parsing ====================

interface ParsedSegment {
  type: 'plain' | 'number' | 'concept' | 'positive' | 'negative' | 'insight';
  content: string;
  raw?: string;
}

// Parse content into segments
const parseContentSegments = (content: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  
  // Combined regex pattern for all markup types
  const markupPattern = /(\*\*[^*]+\*\*|\*[^*]+\*|\+\[[^\]]+\]|-\[[^\]]+\]|\[![^\]]+\])/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = markupPattern.exec(content)) !== null) {
    // Add plain text before markup
    if (match.index > lastIndex) {
      const plainText = content.substring(lastIndex, match.index);
      if (plainText) {
        segments.push({ type: 'plain', content: plainText });
      }
    }
    
    const markup = match[0];
    
    // Identify markup type and extract content
    if (markup.startsWith('**') && markup.endsWith('**')) {
      // Important concept
      segments.push({
        type: 'concept',
        content: markup.slice(2, -2),
        raw: markup
      });
    } else if (markup.startsWith('*') && markup.endsWith('*')) {
      // Key number
      segments.push({
        type: 'number',
        content: markup.slice(1, -1),
        raw: markup
      });
    } else if (markup.startsWith('+[') && markup.endsWith(']')) {
      // Positive trend
      segments.push({
        type: 'positive',
        content: markup.slice(2, -1),
        raw: markup
      });
    } else if (markup.startsWith('-[') && markup.endsWith(']')) {
      // Negative trend
      segments.push({
        type: 'negative',
        content: markup.slice(2, -1),
        raw: markup
      });
    } else if (markup.startsWith('[!') && markup.endsWith(']')) {
      // Critical insight
      segments.push({
        type: 'insight',
        content: markup.slice(2, -1),
        raw: markup
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Add remaining text
  if (lastIndex < content.length) {
    const remainingText = content.substring(lastIndex);
    if (remainingText) {
      segments.push({ type: 'plain', content: remainingText });
    }
  }
  
  return segments;
};

// Render a single segment
const renderSegment = (segment: ParsedSegment, index: number): React.ReactElement => {
  const key = `segment-${index}`;
  
  switch (segment.type) {
    case 'number':
      return React.createElement(Text, {
        key,
        style: styles.keyNumber
      }, segment.content);
      
    case 'concept':
      return React.createElement(Text, {
        key,
        style: styles.keyConcept
      }, segment.content);
      
    case 'positive':
      return React.createElement(Text, {
        key,
        style: styles.positiveTrend
      }, `↑ ${segment.content}`);
      
    case 'negative':
      return React.createElement(Text, {
        key,
        style: styles.negativeTrend
      }, `↓ ${segment.content}`);
      
    case 'insight':
      // Insights are handled separately as block elements
      return React.createElement(Text, { key }, ''); // Empty placeholder
      
    default:
      return React.createElement(Text, {
        key,
        style: styles.plainText
      }, segment.content);
  }
};

// Parse unified analysis with smart markup - MAIN FUNCTION
export const parseUnifiedAnalysis = (content: string | undefined): React.ReactElement[] => {
  if (!content) return [React.createElement(Text, { key: 'empty' }, '')];
  
  const elements: React.ReactElement[] = [];
  
  // Split content into paragraphs
  const paragraphs = content.split(/\n\n+/);
  
  paragraphs.forEach((paragraph, pIndex) => {
    if (!paragraph.trim()) return;
    
    // Check if this paragraph is an insight box
    if (paragraph.includes('[!') && paragraph.includes(']')) {
      // Extract insight content
      const insightMatch = paragraph.match(/\[!([^\]]+)\]/);
      if (insightMatch) {
        elements.push(
          React.createElement(View, {
            key: `insight-box-${pIndex}`,
            style: styles.insightBox
          }, [
            React.createElement(View, {
              key: 'icon-container',
              style: styles.insightIconContainer
            }, React.createElement(Icon, {
              name: 'lightbulb',
              size: 24,
              color: colors.primary
            })),
            React.createElement(Text, {
              key: 'text',
              style: styles.insightText
            }, insightMatch[1])
          ])
        );
        return;
      }
    }
    
    // Parse segments within the paragraph
    const segments = parseContentSegments(paragraph);
    const paragraphElements: React.ReactElement[] = [];
    
    segments.forEach((segment, sIndex) => {
      if (segment.type !== 'insight') {
        paragraphElements.push(renderSegment(segment, sIndex));
      }
    });
    
    // Wrap paragraph elements in a Text container
    if (paragraphElements.length > 0) {
      elements.push(
        React.createElement(Text, {
          key: `paragraph-${pIndex}`,
          style: styles.paragraph
        }, paragraphElements)
      );
    }
  });
  
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

// Styles for markup elements
const styles = StyleSheet.create({
  // Paragraph container
  paragraph: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.md,
  },
  
  // Base text styles
  plainText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 26,
  },
  
  // Key numbers: *37%* or *$5.2B*
  keyNumber: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold as any,
    fontSize: typography.fontSize.lg,
  },
  
  // Important concepts: **transformation**
  keyConcept: {
    backgroundColor: '#FEF3C7', // Warm yellow background
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text,
  },
  
  // Positive trends: +[revenue up 15%]
  positiveTrend: {
    color: '#10B981', // Green
    fontWeight: typography.fontWeight.semibold as any,
    fontSize: typography.fontSize.base,
  },
  
  // Negative trends: -[margins down 5%]
  negativeTrend: {
    color: '#EF4444', // Red
    fontWeight: typography.fontWeight.semibold as any,
    fontSize: typography.fontSize.base,
  },
  
  // Insight box container
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF8FF', // Light blue background
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    marginVertical: spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  
  insightIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  
  insightText: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 24,
    fontWeight: typography.fontWeight.medium as any,
  },
});