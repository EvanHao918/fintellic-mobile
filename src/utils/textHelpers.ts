// src/utils/textHelpers.ts
/**
 * Minimalist Text Processing for AI-Generated Filing Analysis
 * 
 * SUPPORTED MARKUP (aligned with ai_processor.py v3.0):
 * 
 * STRUCTURAL MARKUP:
 * - ### SECTION X: → Level 1 heading (largest, uppercase)
 * - ## Subheader → Level 2 heading (medium, bold)
 * - --- → Horizontal separator line
 * 
 * INLINE EMPHASIS (three types):
 * - **text** → Yellow highlight (numbers, metrics)
 * - __text__ → Bold text (key concepts)
 * - *text* → Italic text (cautionary terms)
 * 
 * DESIGN PHILOSOPHY:
 * - Clean visual hierarchy for retail investors
 * - Simple & Fast: Minimal regex operations
 * - Professional appearance without emoji clutter
 * 
 * Version: 4.0 - Unified markup system with three inline emphasis types
 * Last updated: 2025-11-19
 */

import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../theme';

// ==================== UTILITY FUNCTIONS ====================

/**
 * Clean AI-generated summary text
 */
export const cleanAISummary = (text: string | undefined): string => {
  if (!text) return '';
  
  let cleaned = text
    .replace(/^FEED_SUMMARY:\s*/i, '')
    .replace(/^FULL_SUMMARY:\s*/i, '')
    .replace(/\n\nFULL_SUMMARY:\n/g, '\n\n');
  
  return cleaned.trim();
};

/**
 * Clean tag arrays
 */
export const cleanTags = (tags: string[] | undefined): string[] => {
  if (!tags || !Array.isArray(tags)) return [];
  
  return tags
    .map(tag => tag.replace(/^#/, '').replace(/\[\d+\]/g, '').trim())
    .filter(tag => tag.length > 0);
};

/**
 * Format large numbers with B/M/K suffixes
 */
export const formatNumber = (num: number | undefined, decimals: number = 0): string => {
  if (num === undefined || num === null) return 'N/A';
  
  if (num >= 1000000000) return `$${(num / 1000000000).toFixed(decimals)}B`;
  if (num >= 1000000) return `$${(num / 1000000).toFixed(decimals)}M`;
  if (num >= 1000) return `$${(num / 1000).toFixed(decimals)}K`;
  
  return `$${num.toFixed(decimals)}`;
};

/**
 * Format percentage values
 */
export const formatPercentage = (value: number | undefined, decimals: number = 1): string => {
  if (value === undefined || value === null) return 'N/A';
  return `${value.toFixed(decimals)}%`;
};

/**
 * Remove source citations from text
 */
export const removeCitations = (text: string): string => {
  return text
    .replace(/\[DOC:[^\]]+\]/g, '')
    .replace(/\[FMP\]/g, '')
    .replace(/\[CALC:[^\]]+\]/g, '')
    .replace(/\[\d+\]/g, '')
    .replace(/\[NO_DATA\]/g, '')
    .replace(/\[CAUTION\]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
};

// ==================== SMART TEXT PAGINATION ====================

/**
 * Intelligently paginate long analysis text
 */
export const smartPaginateText = (
  text: string,
  charsPerPage: number = 2000
): string[] => {
  if (!text || text.trim().length === 0) return [''];
  
  if (text.length < charsPerPage * 0.75) {
    console.log(`[Pagination] Content too short (${text.length} chars), skipping pagination`);
    return [text];
  }
  
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) return [text];
  
  const pages: string[] = [];
  let currentPage = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const nextLength = currentPage.length + (currentPage ? 2 : 0) + para.length;
    
    const isSectionBreak = /^---+/.test(para.trim());
    const isMajorHeading = /^### SECTION \d+:/i.test(para.trim());
    
    if (nextLength > charsPerPage && currentPage) {
      if (isSectionBreak || isMajorHeading) {
        pages.push(currentPage.trim());
        currentPage = para;
        console.log(`  [Pagination] Split before section at ${nextLength} chars`);
      } else if (nextLength > charsPerPage * 1.5) {
        pages.push(currentPage.trim());
        currentPage = para;
        console.log(`  [Pagination] Force split at ${nextLength} chars (too long)`);
      } else {
        currentPage += '\n\n' + para;
      }
    } else {
      currentPage += (currentPage ? '\n\n' : '') + para;
    }
  }
  
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  
  if (pages.length === 0) {
    return [text];
  }
  
  console.log(`✅ [Pagination] Split ${text.length} chars into ${pages.length} pages:`);
  pages.forEach((page, idx) => {
    const wordCount = page.split(/\s+/).length;
    console.log(`   Page ${idx + 1}: ${page.length} chars, ~${wordCount} words`);
  });
  
  return pages;
};

// ==================== THREE-LEVEL HEADING SYSTEM ====================

/**
 * Detect line type based on markup
 */
type LineType = 
  | 'section-title'      // ### SECTION X:
  | 'subheader'          // ## Header text
  | 'separator'          // ---
  | 'paragraph';         // Regular text

interface ParsedLine {
  type: LineType;
  content: string;
  title?: string;
}

/**
 * Parse a line and detect its type
 */
const parseLineType = (line: string): ParsedLine => {
  const trimmed = line.trim();
  
  // Level 1: Section title (### SECTION X:)
  if (/^###\s+/.test(trimmed)) {
    let content = trimmed.replace(/^###\s+/, '');
    content = content.replace(/\*\*/g, '');  // Remove any ** markers
    
    return {
      type: 'section-title',
      content: content.trim()
    };
  }
  
  // Level 2: Subheader (## Header text)
  if (/^##\s+/.test(trimmed)) {
    let content = trimmed.replace(/^##\s+/, '');
    content = content.replace(/\*\*/g, '');  // Remove any ** markers
    
    return {
      type: 'subheader',
      content: content.trim(),
      title: content.trim()
    };
  }
  
  // Separator
  if (/^---+$/.test(trimmed)) {
    return {
      type: 'separator',
      content: ''
    };
  }
  
  // Default: paragraph
  return {
    type: 'paragraph',
    content: line
  };
};

/**
 * Parse inline markup in paragraph text
 * Priority order: __bold__ > *italic* > **highlight**
 */
interface InlineSegment {
  type: 'plain' | 'highlight' | 'bold' | 'italic';
  content: string;
}

const parseInlineMarkup = (text: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  
  // Combined pattern to match all three types in priority order
  // Priority: __bold__ > *italic* > **highlight**
  const pattern = /__([^_]+)__|(?<!\*)\*(?!\*)([^*]+?)(?<!\*)\*(?!\*)|(\*\*)([^*]+?)\*\*/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = pattern.exec(text)) !== null) {
    // Plain text before any markup
    if (match.index > lastIndex) {
      const plainText = text.substring(lastIndex, match.index);
      if (plainText) {
        segments.push({ type: 'plain', content: plainText });
      }
    }
    
    // Determine which type matched
    if (match[1] !== undefined) {
      // __bold__
      segments.push({
        type: 'bold',
        content: match[1]
      });
    } else if (match[2] !== undefined) {
      // *italic*
      segments.push({
        type: 'italic',
        content: match[2]
      });
    } else if (match[4] !== undefined) {
      // **highlight**
      segments.push({
        type: 'highlight',
        content: match[4]
      });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining text
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    if (remaining) {
      segments.push({ type: 'plain', content: remaining });
    }
  }
  
  return segments;
};

// ==================== RENDERING FUNCTIONS ====================

/**
 * Render a single line based on its type
 */
const renderLine = (parsed: ParsedLine, index: number): React.ReactElement => {
  const key = `line-${index}`;
  
  switch (parsed.type) {
    case 'section-title':
      return React.createElement(
        Text,
        { key, style: styles.sectionTitle },
        parsed.content
      );
    
    case 'subheader':
      return React.createElement(
        Text,
        { key, style: styles.subheaderText },
        parsed.title
      );
    
    case 'separator':
      return React.createElement(View, { key, style: styles.separator });
    
    case 'paragraph':
    default:
      return renderParagraph(parsed.content, key);
  }
};

/**
 * Render a paragraph with inline markup
 */
const renderParagraph = (text: string, key: string): React.ReactElement => {
  const segments = parseInlineMarkup(text);
  
  const renderedSegments = segments.map((segment, idx) => {
    const segKey = `${key}-seg-${idx}`;
    
    if (segment.type === 'highlight') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.highlight },
        segment.content
      );
    } else if (segment.type === 'bold') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.boldText },
        segment.content
      );
    } else if (segment.type === 'italic') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.italicText },
        segment.content
      );
    } else {
      return React.createElement(
        Text,
        { key: segKey, style: styles.plainText },
        segment.content
      );
    }
  });
  
  return React.createElement(
    Text,
    { key, style: styles.paragraph },
    ...renderedSegments
  );
};

/**
 * Main rendering function: parse and render enhanced text
 */
export const renderEnhancedText = (
  text: string,
  containerStyle?: any
): React.ReactElement[] => {
  if (!text) return [];
  
  // Split by lines (preserve single newlines for bullets)
  const lines = text.split('\n');
  const elements: React.ReactElement[] = [];
  
  lines.forEach((line, index) => {
    if (line.trim().length === 0) return; // Skip empty lines
    
    const parsed = parseLineType(line);
    const element = renderLine(parsed, index);
    elements.push(element);
  });
  
  return elements;
};

/**
 * Render a single paragraph (legacy compatibility)
 */
export const renderEnhancedParagraph = (
  content: string,
  paragraphStyle?: any
): React.ReactElement => {
  return renderParagraph(content, 'para-0');
};

/**
 * Parse unified analysis (legacy compatibility)
 */
export const parseUnifiedAnalysis = (text: string): React.ReactElement[] => {
  return renderEnhancedText(text);
};

// ==================== LEGACY COMPATIBILITY ====================

export const hasUnifiedAnalysis = (filing: any): boolean => {
  return !!filing?.unified_analysis && !!filing?.analysis_version;
};

export const getDisplaySummary = (filing: any): string => {
  if (filing?.unified_feed_summary) {
    return filing.unified_feed_summary;
  }
  return filing?.one_liner || filing?.ai_summary || '';
};

export const getDisplayAnalysis = (filing: any): string => {
  if (hasUnifiedAnalysis(filing)) {
    return filing.unified_analysis;
  }
  return filing?.ai_summary || '';
};

// ==================== STYLES ====================

const styles = StyleSheet.create({
  // Level 1: Section Title (largest, no bold, uppercase)
  sectionTitle: {
    fontSize: 22,
    fontWeight: '400',  // Normal weight
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginTop: 32,
    marginBottom: 16,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Level 2: Subheader (medium, bold, no emoji)
  subheaderText: {
    fontSize: 18,
    fontWeight: '700',  // Bold
    color: '#1a1a1a',
    marginTop: 24,
    marginBottom: 12,
    lineHeight: 26,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Separator (horizontal line)
  separator: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 24,
  },
  
  // Paragraph container
  paragraph: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 26,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Plain text (default)
  plainText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 26,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Inline emphasis: Yellow highlight (numbers, metrics)
  highlight: {
    fontSize: typography.fontSize.base,
    fontWeight: '400',  // Normal weight
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 3,
    color: colors.text,
    fontFamily: typography.fontFamily.serif,
  },
  
  // Inline emphasis: Bold text (key concepts)
  boldText: {
    fontSize: typography.fontSize.base,
    fontWeight: '700',  // Bold
    color: '#1a1a1a',
    fontFamily: typography.fontFamily.serif,
  },
  
  // Inline emphasis: Italic text (cautionary terms)
  italicText: {
    fontSize: typography.fontSize.base,
    fontStyle: 'italic',
    color: '#666',
    fontFamily: typography.fontFamily.serif,
  },
});

// ==================== EXPORTS ====================

export default {
  cleanAISummary,
  cleanTags,
  formatNumber,
  formatPercentage,
  removeCitations,
  smartPaginateText,
  renderEnhancedParagraph,
  renderEnhancedText,
  parseUnifiedAnalysis,
  hasUnifiedAnalysis,
  getDisplaySummary,
  getDisplayAnalysis,
};