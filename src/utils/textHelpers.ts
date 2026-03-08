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

  // ── Step 1: Tokenize into atomic units ──────────────────────────────
  // :::BLOCK...:::END and :::SIGNAL...:::END are treated as single indivisible tokens.
  // Everything else is split on double newlines as before.
  
  interface Token {
    content: string;
    atomic: boolean; // true = never split mid-token
  }
  
  const tokens: Token[] = [];
  const blockPattern = /:::(?:BLOCK|SIGNAL)[\s\S]*?:::END/g;
  let lastIndex = 0;
  let match;
  
  while ((match = blockPattern.exec(text)) !== null) {
    // Plain text before this block
    if (match.index > lastIndex) {
      const before = text.substring(lastIndex, match.index);
      const paras = before.split('\n\n').filter(p => p.trim().length > 0);
      paras.forEach(p => tokens.push({ content: p, atomic: false }));
    }
    // The block itself — atomic
    tokens.push({ content: match[0], atomic: true });
    lastIndex = match.index + match[0].length;
  }
  
  // Remaining plain text after last block
  if (lastIndex < text.length) {
    const remaining = text.substring(lastIndex);
    const paras = remaining.split('\n\n').filter(p => p.trim().length > 0);
    paras.forEach(p => tokens.push({ content: p, atomic: false }));
  }
  
  if (tokens.length === 0) return [text];

  // ── Step 2: Pack tokens into pages ──────────────────────────────────
  const pages: string[] = [];
  let currentPage = '';

  for (const token of tokens) {
    const separator = currentPage ? '\n\n' : '';
    const nextLength = currentPage.length + separator.length + token.content.length;

    const isSectionBreak = /^---+/.test(token.content.trim());
    const isMajorHeading = /^### SECTION \d+:/i.test(token.content.trim());
    const isBlockUnit = token.atomic;

    if (nextLength > charsPerPage && currentPage) {
      if (isSectionBreak || isMajorHeading || isBlockUnit) {
        // Always start a new page before these
        pages.push(currentPage.trim());
        currentPage = token.content;
        console.log(`  [Pagination] Split before block/section at ${nextLength} chars`);
      } else if (nextLength > charsPerPage * 1.5) {
        // Force split for very long plain paragraphs
        pages.push(currentPage.trim());
        currentPage = token.content;
        console.log(`  [Pagination] Force split at ${nextLength} chars`);
      } else {
        currentPage += '\n\n' + token.content;
      }
    } else {
      currentPage += separator + token.content;
    }
  }

  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }

  if (pages.length === 0) return [text];

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
        '🔑 ' + block.signalPoint
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
    section.title && React.createElement(
      View,
      { style: styles.blockHeader },
      React.createElement(Text, { style: styles.blockTitle }, section.title)
    ),
    React.createElement(View, { style: styles.blockContent }, ...contentElements)
  );
};

// ==================== :::TABLE + :::PULSE SYSTEM ====================

interface TableRow {
  leftTop: string;
  leftSub: string;
  right: string;
}

const parseTableBlock = (content: string): TableRow[] => {
  const rows: TableRow[] = [];
  content.split('\n').forEach(line => {
    const metricMatch = line.match(/^METRIC:\s*(.+?)\s*\|\s*([^|]*)\s*\|\|\s*(.+)$/);
    const labelMatch = line.match(/^([^:|\n]+):\s*\|\s*([^|]*)\s*\|\|\s*(.+)$/);
    const match = metricMatch || labelMatch;
    if (!match) return;
    rows.push({
      leftTop: match[1].trim(),
      leftSub: match[2].replace(/\[?DOC:\s*/, '').replace(/\]/, '').trim(),
      right: match[3].trim(),
    });
  });
  return rows;
};

const renderTableBlock = (content: string, key: string): React.ReactElement => {
  const rows = parseTableBlock(content);
  if (rows.length === 0) return React.createElement(View, { key });

  return React.createElement(
    View,
    { key, style: styles.tableContainer },
    ...rows.map((row, i) =>
      React.createElement(
        View,
        {
          key: `row-${i}`,
          style: [
            styles.tableRow,
            i < rows.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#F3F4F6' }
          ]
        },
        React.createElement(
          View,
          { style: styles.tableLeftCol },
          React.createElement(Text, { style: styles.tableMetricName }, row.leftTop),
          row.leftSub ? React.createElement(Text, { style: styles.tableMetricSource }, row.leftSub) : null
        ),
        React.createElement(
          View,
          { style: styles.tableRightCol },
          React.createElement(Text, { style: styles.tableRightText }, row.right)
        )
      )
    )
  );
};

const renderPulseBlock = (content: string, key: string): React.ReactElement => {
  return React.createElement(
    View,
    { key, style: styles.pulseContainer },
    React.createElement(Text, { style: styles.pulseLabel }, 'FINANCIAL PULSE'),
    React.createElement(Text, { style: styles.pulseText }, content.trim())
  );
};

// ==================== IPO SNAPSHOT + SCORECARD SYSTEM ====================

const SCORECARD_DIMENSIONS = [
  { key: 'GROWTH',    emoji: '📈', label: 'Growth' },
  { key: 'FINANCIAL', emoji: '💰', label: 'Financial Health' },
  { key: 'BACKING',   emoji: '🏦', label: 'Institutional Backing' },
  { key: 'MOAT',      emoji: '🛡️', label: 'Competitive Moat' },
  { key: 'VALUATION', emoji: '🔢', label: 'Valuation' },
  { key: 'CAPITAL',   emoji: '🏗️', label: 'Capital Structure' },
];

interface SnapshotField {
  label: string;
  value: string;
  warn?: boolean;
}

interface ScorecardDimension {
  key: string;
  emoji: string;
  label: string;
  score: number;
  verdict: string;
  detail: string;
}

interface ScorecardData {
  dimensions: ScorecardDimension[];
  overall: { signal: string; text: string };
}

const parseSnapshotBlock = (content: string): SnapshotField[] => {
  const fields: SnapshotField[] = [];
  const labelMap: Record<string, string> = {
    COMPANY: 'Company',
    TYPE: 'IPO Type',
    RAISE: 'Raise',
    UNDERWRITERS: 'Underwriters',
    PROCEEDS: 'Use of Proceeds',
    FINANCIALS: 'Financials',
  };
  
  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z_]+):\s*(.+)$/);
    if (!match) return;
    const [, key, value] = match;
    if (!labelMap[key]) return;
    fields.push({
      label: labelMap[key],
      value: value.replace('WARN', '').trim(),
      warn: value.includes('WARN'),
    });
  });
  
  return fields;
};

const parseScorecardBlock = (content: string): ScorecardData => {
  const dimensions: ScorecardDimension[] = [];
  let overall = { signal: 'MIXED', text: '' };
  
  content.split('\n').forEach(line => {
    const overallMatch = line.match(/^OVERALL:\s*(STRONG|MIXED|WEAK)\s*\|(.+)$/);
    if (overallMatch) {
      overall = { signal: overallMatch[1], text: overallMatch[2].trim() };
      return;
    }
    
    const dimMatch = line.match(/^([A-Z_]+):\s*(\d)\s*\|([^|]+)\|(.+)$/);
    if (!dimMatch) return;
    const [, key, scoreStr, verdict, detail] = dimMatch;
    const dimDef = SCORECARD_DIMENSIONS.find(d => d.key === key);
    if (!dimDef) return;
    
    dimensions.push({
      key,
      emoji: dimDef.emoji,
      label: dimDef.label,
      score: parseInt(scoreStr),
      verdict: verdict.trim(),
      detail: detail.trim(),
    });
  });
  
  // Ensure all 6 dimensions present in correct order
  const ordered = SCORECARD_DIMENSIONS.map(def => {
    return dimensions.find(d => d.key === def.key) || {
      key: def.key, emoji: def.emoji, label: def.label,
      score: 3, verdict: '[NO_DATA]', detail: '[NO_DATA]',
    };
  });
  
  return { dimensions: ordered, overall };
};

const renderSnapshotBlock = (content: string, key: string): React.ReactElement => {
  const fields = parseSnapshotBlock(content);
  
  return React.createElement(
    View,
    { key, style: styles.snapshotContainer },
    ...fields.map((field, i) =>
      React.createElement(
        View,
        { key: `snap-${i}`, style: styles.snapshotRow },
        React.createElement(Text, { style: styles.snapshotLabel }, field.label),
        React.createElement(
          View,
          { style: styles.snapshotValueContainer },
          React.createElement(
            Text,
            { style: [styles.snapshotValue, field.warn && styles.snapshotValueWarn] },
            field.value + (field.warn ? ' ⚠️' : '')
          )
        )
      )
    )
  );
};

// Scorecard uses React state for expand/collapse — rendered as a special component
// We export a flag so the Detail component can detect and render it natively
export const SCORECARD_MARKER = ':::SCORECARD_PARSED:::';

export const extractScorecardData = (text: string): ScorecardData | null => {
  const match = text.match(/:::SCORECARD([\s\S]*?):::END/);
  if (!match) return null;
  return parseScorecardBlock(match[1].trim());
};

export const extractSnapshotFields = (text: string): SnapshotField[] | null => {
  const match = text.match(/:::SNAPSHOT([\s\S]*?):::END/);
  if (!match) return null;
  return parseSnapshotBlock(match[1].trim());
};

const renderScorecardStatic = (content: string, key: string): React.ReactElement => {
  const data = parseScorecardBlock(content);
  const signalColors: Record<string, string> = {
    STRONG: '#16A34A',
    MIXED:  '#CA8A04',
    WEAK:   '#DC2626',
  };
  const signalColor = signalColors[data.overall.signal] || '#6B7280';

  const dimElements = data.dimensions.map((dim, i) => {
    const segments = Array.from({ length: 5 });
    const barColor = dim.score >= 4 ? '#16A34A' : dim.score >= 3 ? '#CA8A04' : '#DC2626';
    
    return React.createElement(
      View,
      { key: `dim-${i}`, style: styles.scoreDimRow },
      // Header: emoji + label + score
      React.createElement(
        View,
        { style: styles.scoreDimHeader },
        React.createElement(
          Text,
          { style: styles.scoreDimLabel },
          `${dim.emoji} ${dim.label}`
        ),
        React.createElement(
          Text,
          { style: styles.scoreDimScore },
          `${dim.score}/5`
        )
      ),
      // Segmented bar
      React.createElement(
        View,
        { style: styles.scoreBarContainer },
        ...segments.map((_, si) =>
          React.createElement(View, {
            key: si,
            style: [styles.scoreBarSegment, { backgroundColor: si < dim.score ? barColor : '#E5E7EB' }]
          })
        )
      ),
      // Verdict
      React.createElement(Text, { style: styles.scoreDimVerdict }, dim.verdict),
      // Detail
      React.createElement(
        View,
        { style: [styles.scoreDimDetail, { borderLeftColor: barColor + '66' }] },
        React.createElement(Text, { style: styles.scoreDimDetailText }, dim.detail)
      )
    );
  });

  return React.createElement(
    View,
    { key, style: styles.scorecardContainer },
    ...dimElements,
    // Overall signal
    React.createElement(
      View,
      { style: [styles.overallSignalContainer, { borderLeftColor: signalColor, backgroundColor: signalColor + '0D' }] },
      React.createElement(
        Text,
        { style: [styles.overallSignalLabel, { color: signalColor }] },
        `${data.overall.signal} SIGNAL`
      ),
      React.createElement(
        Text,
        { style: styles.overallSignalText },
        data.overall.text
      )
    ),
    // Disclaimer
    React.createElement(
      Text,
      { style: styles.ipoDisclaimer },
      'FOR INFORMATIONAL PURPOSES ONLY · NOT INVESTMENT ADVICE'
    )
  );
};

/**
 * Main rendering function: parse and render enhanced text
 * Supports :::SNAPSHOT/:::SCORECARD (S-1), :::BLOCK/:::SIGNAL (8K/10Q/10K), [BLOCK:] (legacy)
 */
export const renderEnhancedText = (
  text: string,
  containerStyle?: any
): React.ReactElement[] => {
  if (!text) return [];
  
  // Strip bare backtick fences (``` lines) that models sometimes emit
  const cleanedText = text.replace(/^`{3,}.*$/gm, '').trim();
  
  // Check for :::TABLE / :::PULSE markers (8K/10Q/10K Section 1)
  const hasTableBlocks = /:::TABLE|:::PULSE/.test(cleanedText);

  if (hasTableBlocks) {
    const elements: React.ReactElement[] = [];
    const blockPattern = /:::(TABLE|PULSE)([\s\S]*?):::END/g;
    let lastIndex = 0;
    let match;
    let blockIndex = 0;

    while ((match = blockPattern.exec(cleanedText)) !== null) {
      if (match.index > lastIndex) {
        const before = cleanedText.substring(lastIndex, match.index).trim();
        if (before) renderContentLines(before, `tbl-pre-${blockIndex}`).forEach(el => elements.push(el));
      }

      const blockType = match[1];
      const blockContent = match[2].trim();
      const key = `tbl-${blockIndex}`;

      if (blockType === 'TABLE') {
        elements.push(renderTableBlock(blockContent, key));
      } else {
        elements.push(renderPulseBlock(blockContent, key));
      }

      blockIndex++;
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < cleanedText.length) {
      const remaining = cleanedText.substring(lastIndex).trim();
      if (remaining) {
        // Still parse thesis blocks in Section 2
        const hasThesis = /:::BLOCK|:::SIGNAL/.test(remaining);
        if (hasThesis) {
          const blocks = parseThesisBlocks(remaining);
          let cardIndex = 0;
          blocks.forEach((block, i) => {
            if (block.type === 'thesis') { elements.push(renderThesisCard(block, cardIndex)); cardIndex++; }
            else if (block.type === 'signal') { elements.push(renderSignalBlock(block, i)); }
            else { renderContentLines(block.content || '', `tbl-rem-${i}`).forEach(el => elements.push(el)); }
          });
        } else {
          renderContentLines(remaining, 'tbl-post').forEach(el => elements.push(el));
        }
      }
    }

    return elements;
  }

  // Check for IPO-specific markers first
  const hasIPOBlocks = /:::SNAPSHOT|:::SCORECARD/.test(cleanedText);
  
  if (hasIPOBlocks) {
    const elements: React.ReactElement[] = [];
    const ipoPattern = /:::(?:SNAPSHOT|SCORECARD)([\s\S]*?):::END/g;
    let lastIndex = 0;
    let match;
    let ipoIndex = 0;
    
    while ((match = ipoPattern.exec(cleanedText)) !== null) {
      // Plain content before this block
      if (match.index > lastIndex) {
        const before = cleanedText.substring(lastIndex, match.index).trim();
        if (before) {
          renderContentLines(before, `ipo-pre-${ipoIndex}`).forEach(el => elements.push(el));
        }
      }
      
      const isSnapshot = match[0].startsWith(':::SNAPSHOT');
      const blockContent = match[1].trim();
      const key = `ipo-${ipoIndex}`;
      
      if (isSnapshot) {
        elements.push(renderSnapshotBlock(blockContent, key));
      } else {
        elements.push(renderScorecardStatic(blockContent, key));
      }
      
      ipoIndex++;
      lastIndex = match.index + match[0].length;
    }
    
    // Remaining content
    if (lastIndex < cleanedText.length) {
      const remaining = cleanedText.substring(lastIndex).trim();
      if (remaining) {
        renderContentLines(remaining, 'ipo-post').forEach(el => elements.push(el));
      }
    }
    
    return elements;
  }
  
  // Check if text contains :::BLOCK / :::SIGNAL markers (8K/10Q/10K)
  const hasThesisBlocks = /:::BLOCK|:::SIGNAL/.test(cleanedText);
  
  if (hasThesisBlocks) {
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
        const contentSections = parseContentBlocks(block.content || '');
        contentSections.forEach((section, si) => {
          if (section.type === 'block') {
            elements.push(renderBlock(section, i * 100 + si));
          } else {
            renderContentLines(section.content, `content-${i}-${si}`).forEach(el => elements.push(el));
          }
        });
      }
    });
    
    return elements;
  }
  
  // Legacy system: parse [BLOCK:] content blocks
  const sections = parseContentBlocks(cleanedText);
  const elements: React.ReactElement[] = [];
  
  sections.forEach((section, sectionIndex) => {
    if (section.type === 'block') {
      elements.push(renderBlock(section, sectionIndex));
    } else {
      renderContentLines(section.content, `content-${sectionIndex}`).forEach(el => elements.push(el));
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
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.08)',
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

  // ==================== TABLE + PULSE STYLES ====================

  tableContainer: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  tableRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
  },

  tableLeftCol: {
    width: '35%',
    paddingRight: 10,
    paddingTop: 1,
  },

  tableMetricName: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#1F2937',
    lineHeight: 20,
  },

  tableMetricSource: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: '#9CA3AF',
    marginTop: 2,
    letterSpacing: 0.2,
  },

  tableRightCol: {
    flex: 1,
  },

  tableRightText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#374151',
    lineHeight: 22,
  },

  pulseContainer: {
    marginTop: 14,
    marginBottom: 4,
    borderLeftWidth: 2,
    borderLeftColor: '#9CA3AF',
    backgroundColor: '#F9FAFB',
    borderRadius: 6,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },

  pulseLabel: {
    fontSize: 8,
    fontFamily: 'Courier New',
    color: '#9CA3AF',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 6,
  },

  pulseText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#374151',
    lineHeight: 22,
  },

  // ==================== IPO SNAPSHOT STYLES ====================

  snapshotContainer: {
    marginVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },

  snapshotRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  snapshotLabel: {
    width: 110,
    fontSize: 13,
    fontFamily: 'Courier New',
    color: '#6B7280',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    paddingTop: 2,
  },

  snapshotValueContainer: {
    flex: 1,
  },

  snapshotValue: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#1F2937',
    lineHeight: 20,
  },

  snapshotValueWarn: {
    color: '#B45309',
  },

  // ==================== IPO SCORECARD STYLES ====================

  scorecardContainer: {
    marginVertical: 12,
  },

  scoreDimRow: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },

  scoreDimHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 7,
  },

  scoreDimLabel: {
    fontSize: 16,
    fontFamily: 'Courier New',
    color: '#1F2937',
    letterSpacing: 0.3,
  },

  scoreDimScore: {
    fontSize: 10,
    fontFamily: 'Courier New',
    color: '#9CA3AF',
  },

  scoreBarContainer: {
    flexDirection: 'row',
    gap: 3,
    height: 4,
    marginBottom: 8,
  },

  scoreBarSegment: {
    flex: 1,
    borderRadius: 2,
  },

  scoreDimVerdict: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },

  scoreDimDetail: {
    borderLeftWidth: 2,
    paddingLeft: 10,
  },

  scoreDimDetailText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#4B5563',
    lineHeight: 22,
  },

  overallSignalContainer: {
    marginTop: 20,
    borderLeftWidth: 3,
    borderRadius: 6,
    padding: 16,
  },

  overallSignalLabel: {
    fontSize: 13,
    fontFamily: 'Courier New',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 8,
  },

  overallSignalText: {
    fontSize: typography.fontSize.sm,
    fontFamily: typography.fontFamily.serif,
    color: '#374151',
    lineHeight: 22,
  },

  ipoDisclaimer: {
    marginTop: 16,
    fontSize: 8,
    fontFamily: 'Courier New',
    color: '#D1D5DB',
    letterSpacing: 1,
    textAlign: 'center',
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