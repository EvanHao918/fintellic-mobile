// src/utils/textHelpers.ts
/**
 * Minimalist Text Processing for AI-Generated Filing Analysis
 * 
 * SUPPORTED MARKUP (aligned with ai_processor.py v14):
 * 
 * STRUCTURAL MARKUP:
 * - ### SECTION X: → Level 1 heading with icon (largest, uppercase)
 * - ## Subheader → Level 2 heading (medium, bold)
 * - --- → Horizontal separator line
 * - [BLOCK: Title] ... [/BLOCK] → Content module card (S-1 pilot, preserved)
 * 
 * NEW MARKUP (8K / 10Q / 10K Section 2):
 * - :::BLOCK ... :::END → Thesis-driven card with random pastel background
 *   - ##THESIS [emoji] [title] → Card header (emoji + title)
 *   - ##SIGNAL_POINT [text] → Observation row at card bottom
 * - :::SIGNAL ... :::END → Key Takeaway plain block (no card, flat on page)
 * 
 * INLINE EMPHASIS:
 * - **text** → Yellow highlight (numbers, metrics)
 * - __text__ → Bold text (key concepts)
 * - ▲X% → Green upward trend
 * - ▼X% → Red downward trend
 * - [DOC: ...] → Gray citation (de-emphasized)
 * 
 * DESIGN PHILOSOPHY:
 * - Clean visual hierarchy for retail investors
 * - Simple & Fast: Minimal regex operations
 * - Professional appearance without emoji clutter
 * 
 * Version: 7.0 - Thesis block + Signal support for 8K/10Q/10K
 * Last updated: 2026-03-05
 */

import React from 'react';
import { Text, View, StyleSheet, Image } from 'react-native';
import { colors, typography, spacing } from '../theme';

// Section title icons mapping
const SECTION_ICONS: { [key: string]: any } = {
  // 10-K sections
  'ANNUAL REVIEW': require('../assets/images/icon_annual_review.png'),
  'STRATEGIC DIRECTION': require('../assets/images/icon_strategic_direction.png'),
  'INVESTMENT PERSPECTIVE': require('../assets/images/icon_investment_perspective.png'),
  // 10-Q sections
  'FACT CLARITY': require('../assets/images/icon_fact_clarity.png'),
  'MARKET PERSPECTIVE': require('../assets/images/icon_market_perspective.png'),
  // S-1 sections
  'IPO SNAPSHOT': require('../assets/images/icon_ipo_snapshot.png'),
  'INVESTMENT ANALYSIS': require('../assets/images/icon_investment_analysis.png'),
};

// Pastel color pool for :::BLOCK cards
const BLOCK_PASTEL_COLORS = [
  '#FEF3C7',  // 淡黄
  '#DBEAFE',  // 淡蓝
  '#D1FAE5',  // 淡绿
  '#EDE9FE',  // 淡紫
  '#FFE4E6',  // 淡粉
  '#E0F2FE',  // 淡天蓝
  '#FEE2E2',  // 淡红
  '#F3F4F6',  // 淡灰
];

// Deterministic color pick based on block index so color is stable across re-renders
const getBlockColor = (index: number): string => {
  return BLOCK_PASTEL_COLORS[index % BLOCK_PASTEL_COLORS.length];
};

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
    const isBlockStart = /^:::BLOCK/.test(para.trim());
    const isSignalStart = /^:::SIGNAL/.test(para.trim());
    
    if (nextLength > charsPerPage && currentPage) {
      if (isSectionBreak || isMajorHeading || isBlockStart || isSignalStart) {
        pages.push(currentPage.trim());
        currentPage = para;
        console.log(`  [Pagination] Split before section/block at ${nextLength} chars`);
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
 * Supported: **highlight**, __bold__, ▲trend up, ▼trend down, [DOC: citation]
 */
interface InlineSegment {
  type: 'plain' | 'highlight' | 'bold' | 'trendUp' | 'trendDown' | 'citation';
  content: string;
}

const parseInlineMarkup = (text: string): InlineSegment[] => {
  const segments: InlineSegment[] = [];
  
  // Combined pattern to match all types
  // Order: __bold__ > **highlight** > ▲...% > ▼...% > [DOC:...] / [FMP] / [CALC:...] / [number]
  const pattern = /__([^_]+)__|\*\*([^*]+?)\*\*|(▲[\d.]+%?)|(▼[\d.]+%?)|(\[DOC:[^\]]+\]|\[FMP\]|\[CALC:[^\]]+\]|\[\d+\])/g;
  
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
      // **highlight**
      segments.push({
        type: 'highlight',
        content: match[2]
      });
    } else if (match[3] !== undefined) {
      // ▲X% trend up
      segments.push({
        type: 'trendUp',
        content: match[3]
      });
    } else if (match[4] !== undefined) {
      // ▼X% trend down
      segments.push({
        type: 'trendDown',
        content: match[4]
      });
    } else if (match[5] !== undefined) {
      // [DOC:...] or [FMP] or [CALC:...] or [number] citation
      segments.push({
        type: 'citation',
        content: match[5]
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
 * Get section icon based on title content
 */
const getSectionIcon = (content: string): any | null => {
  const upperContent = content.toUpperCase();
  for (const [key, icon] of Object.entries(SECTION_ICONS)) {
    if (upperContent.includes(key)) {
      return icon;
    }
  }
  return null;
};

/**
 * Render a single line based on its type
 */
const renderLine = (parsed: ParsedLine, index: number | string): React.ReactElement => {
  const key = typeof index === 'string' ? index : `line-${index}`;
  
  switch (parsed.type) {
    case 'section-title':
      const icon = getSectionIcon(parsed.content);
      return React.createElement(
        View,
        { key, style: styles.sectionTitleContainer },
        icon && React.createElement(
          Image,
          { source: icon, style: styles.sectionIcon, resizeMode: 'contain' }
        ),
        React.createElement(
          Text,
          { style: styles.sectionTitle },
          parsed.content
        )
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
    } else if (segment.type === 'trendUp') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.trendUp },
        segment.content
      );
    } else if (segment.type === 'trendDown') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.trendDown },
        segment.content
      );
    } else if (segment.type === 'citation') {
      return React.createElement(
        Text,
        { key: segKey, style: styles.citation },
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
 * Parse and extract BLOCK sections from text (legacy S-1 [BLOCK:] system)
 * Returns array of { type: 'block' | 'content', title?: string, content: string }
 */
interface ContentSection {
  type: 'block' | 'content';
  title?: string;
  content: string;
}

const parseContentBlocks = (text: string): ContentSection[] => {
  const sections: ContentSection[] = [];
  const blockPattern = /\[BLOCK:\s*([^\]]+)\]([\s\S]*?)\[\/BLOCK\]/g;
  
  let lastIndex = 0;
  let match;
  
  while ((match = blockPattern.exec(text)) !== null) {
    // Content before this block
    if (match.index > lastIndex) {
      const beforeContent = text.substring(lastIndex, match.index).trim();
      if (beforeContent) {
        sections.push({ type: 'content', content: beforeContent });
      }
    }
    
    // The block itself
    sections.push({
      type: 'block',
      title: match[1].trim(),
      content: match[2].trim()
    });
    
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining content after last block
  if (lastIndex < text.length) {
    const remainingContent = text.substring(lastIndex).trim();
    if (remainingContent) {
      sections.push({ type: 'content', content: remainingContent });
    }
  }
  
  // If no blocks found, return entire text as content
  if (sections.length === 0) {
    sections.push({ type: 'content', content: text });
  }
  
  return sections;
};

// ==================== NEW :::BLOCK / :::SIGNAL SYSTEM ====================

interface ThesisBlock {
  type: 'thesis' | 'signal' | 'content';
  thesis?: string;       // ##THESIS line content (emoji + title)
  body?: string;         // paragraphs between ##THESIS and ##SIGNAL_POINT
  signalPoint?: string;  // ##SIGNAL_POINT line content
  content?: string;      // plain content (non-block)
}

/**
 * Parse text into thesis blocks, signal blocks, and plain content
 */
const parseThesisBlocks = (text: string): ThesisBlock[] => {
  const results: ThesisBlock[] = [];
  
  // Split on :::BLOCK and :::SIGNAL markers
  const blockPattern = /:::BLOCK([\s\S]*?):::END|:::SIGNAL([\s\S]*?):::END/g;
  let lastIndex = 0;
  let match;
  let blockIndex = 0;
  
  while ((match = blockPattern.exec(text)) !== null) {
    // Plain content before this block
    if (match.index > lastIndex) {
      const before = text.substring(lastIndex, match.index).trim();
      if (before) {
        results.push({ type: 'content', content: before });
      }
    }
    
    const isThesisBlock = match[1] !== undefined;
    const blockContent = (isThesisBlock ? match[1] : match[2]).trim();
    
    if (isThesisBlock) {
      // Parse ##THESIS, body, ##SIGNAL_POINT
      const thesisMatch = blockContent.match(/^##THESIS\s+(.+)/m);
      const signalMatch = blockContent.match(/##SIGNAL_POINT\s+(.+)/m);
      
      let body = blockContent;
      if (thesisMatch) {
        body = body.replace(/^##THESIS\s+.+/m, '').trim();
      }
      if (signalMatch) {
        body = body.replace(/##SIGNAL_POINT\s+.+/m, '').trim();
      }
      
      results.push({
        type: 'thesis',
        thesis: thesisMatch ? thesisMatch[1].trim() : '',
        body: body,
        signalPoint: signalMatch ? signalMatch[1].trim() : undefined,
      });
      blockIndex++;
    } else {
      // :::SIGNAL — plain content block
      results.push({ type: 'signal', content: blockContent });
    }
    
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining plain content
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex).trim();
    if (remaining) {
      results.push({ type: 'content', content: remaining });
    }
  }
  
  if (results.length === 0) {
    results.push({ type: 'content', content: text });
  }
  
  return results;
};

/**
 * Render a :::BLOCK thesis card with pastel background
 */
const renderThesisCard = (block: ThesisBlock, cardIndex: number): React.ReactElement => {
  const key = `thesis-${cardIndex}`;
  const bgColor = getBlockColor(cardIndex);
  const bodyElements = block.body ? renderContentLines(block.body, `${key}-body`) : [];
  
  return React.createElement(
    View,
    { key, style: [styles.thesisCard, { backgroundColor: bgColor }] },
    // Thesis header row
    block.thesis ? React.createElement(
      View,
      { style: styles.thesisHeader },
      React.createElement(
        Text,
        { style: styles.thesisTitle },
        block.thesis
      )
    ) : null,
    // Body content
    bodyElements.length > 0 ? React.createElement(
      View,
      { style: styles.thesisBody },
      ...bodyElements
    ) : null,
    // Signal point row
    block.signalPoint ? React.createElement(
      View,
      { style: styles.signalPointRow },
      React.createElement(
        Text,
        { style: styles.signalPointText },
        block.signalPoint
      )
    ) : null
  );
};

/**
 * Render a :::SIGNAL block — plain on the page, no card
 */
const renderSignalBlock = (block: ThesisBlock, index: number): React.ReactElement => {
  const key = `signal-${index}`;
  const contentElements = block.content ? renderContentLines(block.content, key) : [];
  
  return React.createElement(
    View,
    { key, style: styles.signalContainer },
    ...contentElements
  );
};

/**
 * Render lines within a section (block or regular content)
 */
const renderContentLines = (content: string, keyPrefix: string): React.ReactElement[] => {
  const lines = content.split('\n');
  const elements: React.ReactElement[] = [];
  
  lines.forEach((line, index) => {
    if (line.trim().length === 0) return;
    
    const parsed = parseLineType(line);
    const element = renderLine(parsed, `${keyPrefix}-${index}`);
    elements.push(element);
  });
  
  return elements;
};

/**
 * Render a legacy [BLOCK:] card component (S-1)
 */
const renderBlock = (section: ContentSection, index: number): React.ReactElement => {
  const key = `block-${index}`;
  const contentElements = renderContentLines(section.content, key);
  
  return React.createElement(
    View,
    { key, style: styles.blockContainer },
    // Block title
    section.title && React.createElement(
      View,
      { style: styles.blockHeader },
      React.createElement(
        Text,
        { style: styles.blockTitle },
        section.title
      )
    ),
    // Block content
    React.createElement(
      View,
      { style: styles.blockContent },
      ...contentElements
    )
  );
};

/**
 * Main rendering function: parse and render enhanced text
 * Supports :::BLOCK/:::SIGNAL (new), [BLOCK:] (S-1 legacy), and plain text
 */
export const renderEnhancedText = (
  text: string,
  containerStyle?: any
): React.ReactElement[] => {
  if (!text) return [];
  
  // Strip bare backtick fences (``` lines) that models sometimes emit
  const cleanedText = text.replace(/^`{3,}.*$/gm, '').trim();
  
  // Check if text contains new :::BLOCK / :::SIGNAL markers
  const hasThesisBlocks = /:::BLOCK|:::SIGNAL/.test(cleanedText);
  
  if (hasThesisBlocks) {
    // New system: parse thesis blocks
    const blocks = parseThesisBlocks(cleanedText);
    const elements: React.ReactElement[] = [];
    let cardIndex = 0;
    
    blocks.forEach((block, i) => {
      if (block.type === 'thesis') {
        elements.push(renderThesisCard(block, cardIndex));
        cardIndex++;
      } else if (block.type === 'signal') {
        elements.push(renderSignalBlock(block, i));
      } else {
        // Plain content — use legacy content rendering
        const contentSections = parseContentBlocks(block.content || '');
        contentSections.forEach((section, si) => {
          if (section.type === 'block') {
            elements.push(renderBlock(section, i * 100 + si));
          } else {
            const contentElements = renderContentLines(section.content, `content-${i}-${si}`);
            elements.push(...contentElements);
          }
        });
      }
    });
    
    return elements;
  }
  
  // Legacy system: parse [BLOCK:] content blocks (S-1)
  const sections = parseContentBlocks(cleanedText);
  const elements: React.ReactElement[] = [];
  
  sections.forEach((section, sectionIndex) => {
    if (section.type === 'block') {
      elements.push(renderBlock(section, sectionIndex));
    } else {
      const contentElements = renderContentLines(section.content, `content-${sectionIndex}`);
      elements.push(...contentElements);
    }
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
  // Level 1: Section Title Container (with icon)
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 16,
  },
  
  // Section Icon
  sectionIcon: {
    width: 24,
    height: 24,
    marginRight: 10,
  },
  
  // Level 1: Section Title (largest, no bold, uppercase)
  sectionTitle: {
    fontSize: 22,
    fontWeight: '400',  // Normal weight
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontFamily: typography.fontFamily.serif,
    flex: 1,
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
  
  // Trend up: Green (▲X%)
  trendUp: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#10B981',  // Green
    fontFamily: typography.fontFamily.serif,
  },
  
  // Trend down: Red (▼X%)
  trendDown: {
    fontSize: typography.fontSize.base,
    fontWeight: '600',
    color: '#EF4444',  // Red
    fontFamily: typography.fontFamily.serif,
  },
  
  // Citation: Gray de-emphasized text
  citation: {
    fontSize: typography.fontSize.sm,
    fontWeight: '400',
    color: '#9CA3AF',  // Gray
    fontFamily: typography.fontFamily.serif,
  },
  
  // Content Block: Card container for legacy S-1 [BLOCK:] system
  blockContainer: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 12,
    overflow: 'hidden',
  },
  
  // Block header (legacy)
  blockHeader: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  
  // Block title (legacy)
  blockTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  
  // Block content (legacy)
  blockContent: {
    padding: 16,
  },

  // ==================== NEW THESIS CARD STYLES ====================

  // :::BLOCK thesis card — pastel background set dynamically
  thesisCard: {
    borderRadius: 12,
    marginVertical: 10,
    overflow: 'hidden',
  },

  // Thesis header row: emoji + title
  thesisHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },

  thesisTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: 22,
    fontFamily: typography.fontFamily.serif,
  },

  // Body content area
  thesisBody: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },

  // Signal point row — bottom of card, subtle separator
  signalPointRow: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },

  signalPointText: {
    fontSize: typography.fontSize.sm,
    fontWeight: '600',
    color: '#374151',
    lineHeight: 20,
    fontFamily: typography.fontFamily.serif,
  },

  // :::SIGNAL plain block — no card, flat on page
  signalContainer: {
    marginTop: 20,
    marginBottom: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: colors.gray900,
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