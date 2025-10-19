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
  type: 'plain' | 'number' | 'concept' | 'positive' | 'negative' | 'insight' | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'italic' | 'boldItalic';
  content: string;
  raw?: string;
  level?: number;
}

// Parse content into segments with heading support
const parseContentSegments = (content: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  
  // Check if this is a heading line
  const headingMatch = content.match(/^(#{1,4})\s+(.+)$/);
  if (headingMatch) {
    const level = headingMatch[1].length;
    const headingContent = headingMatch[2];
    
    // Parse the heading content for inline markup
    const headingSegments = parseInlineMarkup(headingContent);
    
    // Return heading segments with appropriate type
    return headingSegments.map(segment => {
      if (segment.type === 'plain') {
        return {
          ...segment,
          type: `heading${level}` as ParsedSegment['type'],
          level
        };
      }
      return segment;
    });
  }
  
  // If not a heading, parse normally
  return parseInlineMarkup(content);
};

// Parse inline markup within text
const parseInlineMarkup = (content: string): ParsedSegment[] => {
  const segments: ParsedSegment[] = [];
  
  // Enhanced regex pattern including italic patterns
  // Order matters: check triple asterisks/underscores first, then double, then single
  const markupPattern = /(\*\*\*[^*]+\*\*\*|___[^_]+___|__[^_]+__|_[^_]+_|\*\*[^*]+\*\*|\*[^*\s][^*]*[^*\s]\*|\*[^*\s]\*|\+\[[^\]]+\]|-\[[^\]]+\]|\[![^\]]+\])/g;
  
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
    if ((markup.startsWith('***') && markup.endsWith('***')) || 
        (markup.startsWith('___') && markup.endsWith('___'))) {
      // Bold + Italic
      segments.push({
        type: 'boldItalic',
        content: markup.slice(3, -3),
        raw: markup
      });
    } else if (markup.startsWith('**') && markup.endsWith('**')) {
      // Important concept (bold)
      segments.push({
        type: 'concept',
        content: markup.slice(2, -2),
        raw: markup
      });
    } else if ((markup.startsWith('__') && markup.endsWith('__')) ||
               (markup.startsWith('_') && markup.endsWith('_') && !markup.startsWith('__'))) {
      // Italic (underscores)
      const startChars = markup.startsWith('__') ? 2 : 1;
      segments.push({
        type: 'italic',
        content: markup.slice(startChars, -startChars),
        raw: markup
      });
    } else if (markup.startsWith('*') && markup.endsWith('*') && !markup.startsWith('**')) {
      // Check if this is italic or number
      const innerContent = markup.slice(1, -1);
      // If it contains numbers or financial symbols, treat as number
      if (/[\d$%,.]/.test(innerContent)) {
        segments.push({
          type: 'number',
          content: innerContent,
          raw: markup
        });
      } else {
        // Otherwise treat as italic
        segments.push({
          type: 'italic',
          content: innerContent,
          raw: markup
        });
      }
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
      
    case 'italic':
      return React.createElement(Text, {
        key,
        style: styles.italicText
      }, segment.content);
      
    case 'boldItalic':
      return React.createElement(Text, {
        key,
        style: styles.boldItalicText
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
      
    case 'heading1':
      return React.createElement(Text, {
        key,
        style: styles.heading1
      }, segment.content);
      
    case 'heading2':
      return React.createElement(Text, {
        key,
        style: styles.heading2
      }, segment.content);
      
    case 'heading3':
      return React.createElement(Text, {
        key,
        style: styles.heading3
      }, segment.content);
      
    case 'heading4':
      return React.createElement(Text, {
        key,
        style: styles.heading4
      }, segment.content);
      
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

// Parse unified analysis with smart markup - MAIN FUNCTION (ENHANCED)
export const parseUnifiedAnalysis = (content: string | undefined): React.ReactElement[] => {
  if (!content) return [React.createElement(Text, { key: 'empty' }, '')];
  
  const elements: React.ReactElement[] = [];
  
  try {
    // Split content into lines first to properly handle headings
    const lines = content.split(/\n/);
    let currentParagraph: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmedLine = line.trim();
      
      // Check if this is a heading
      if (trimmedLine.match(/^#{1,4}\s+/)) {
        // Process any accumulated paragraph first
        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.join('\n').trim();
          if (paragraphText) {
            processParagraph(paragraphText, elements, `para-${i}`);
          }
          currentParagraph = [];
        }
        
        // Process the heading
        const segments = parseContentSegments(trimmedLine);
        const headingElements: React.ReactElement[] = [];
        
        segments.forEach((segment, sIndex) => {
          if (segment.type !== 'insight') {
            headingElements.push(renderSegment(segment, sIndex));
          }
        });
        
        if (headingElements.length > 0) {
          // Get the appropriate heading style based on level
          const headingLevel = trimmedLine.match(/^(#{1,4})/)?.[1].length || 1;
          const headingStyle = getHeadingStyle(headingLevel);
          
          elements.push(
            React.createElement(Text, {
              key: `heading-${i}`,
              style: headingStyle
            }, headingElements)
          );
        }
      } else if (trimmedLine === '') {
        // Empty line - process accumulated paragraph
        if (currentParagraph.length > 0) {
          const paragraphText = currentParagraph.join('\n').trim();
          if (paragraphText) {
            processParagraph(paragraphText, elements, `para-${i}`);
          }
          currentParagraph = [];
        }
      } else {
        // Regular line - add to current paragraph
        currentParagraph.push(line);
      }
    }
    
    // Process any remaining paragraph
    if (currentParagraph.length > 0) {
      const paragraphText = currentParagraph.join('\n').trim();
      if (paragraphText) {
        processParagraph(paragraphText, elements, `para-final`);
      }
    }
    
    // If no elements were created, add the raw text
    if (elements.length === 0 && content.trim()) {
      elements.push(
        React.createElement(Text, {
          key: 'fallback',
          style: styles.paragraph
        }, content)
      );
    }
    
  } catch (error) {
    console.error('Error parsing unified analysis:', error);
    // Fallback to simple text display
    return [
      React.createElement(Text, {
        key: 'error-fallback',
        style: styles.paragraph
      }, content)
    ];
  }
  
  return elements;
};

// Helper function to process a paragraph
const processParagraph = (paragraph: string, elements: React.ReactElement[], keyPrefix: string) => {
  // Check if this paragraph contains an insight box
  const insightMatch = paragraph.match(/\[!([^\]]+)\]/);
  
  if (insightMatch) {
    // Create insight box element
    elements.push(
      React.createElement(View, {
        key: `${keyPrefix}-insight-box`,
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
    
    // Process any remaining content
    const beforeInsight = paragraph.substring(0, insightMatch.index);
    const afterInsight = paragraph.substring(insightMatch.index! + insightMatch[0].length);
    
    if (beforeInsight.trim()) {
      const segments = parseContentSegments(beforeInsight);
      const beforeElements: React.ReactElement[] = [];
      
      segments.forEach((segment, sIndex) => {
        if (segment.type !== 'insight') {
          beforeElements.push(renderSegment(segment, sIndex));
        }
      });
      
      if (beforeElements.length > 0) {
        elements.push(
          React.createElement(Text, {
            key: `${keyPrefix}-before`,
            style: styles.paragraph
          }, beforeElements)
        );
      }
    }
    
    if (afterInsight.trim()) {
      const segments = parseContentSegments(afterInsight);
      const afterElements: React.ReactElement[] = [];
      
      segments.forEach((segment, sIndex) => {
        if (segment.type !== 'insight') {
          afterElements.push(renderSegment(segment, sIndex));
        }
      });
      
      if (afterElements.length > 0) {
        elements.push(
          React.createElement(Text, {
            key: `${keyPrefix}-after`,
            style: styles.paragraph
          }, afterElements)
        );
      }
    }
  } else {
    // Normal paragraph without insight box
    const segments = parseContentSegments(paragraph);
    const paragraphElements: React.ReactElement[] = [];
    
    segments.forEach((segment, sIndex) => {
      if (segment.type !== 'insight') {
        paragraphElements.push(renderSegment(segment, sIndex));
      }
    });
    
    if (paragraphElements.length > 0) {
      elements.push(
        React.createElement(Text, {
          key: keyPrefix,
          style: styles.paragraph
        }, paragraphElements)
      );
    }
  }
};

// Helper function to get heading style based on level
const getHeadingStyle = (level: number): TextStyle => {
  switch (level) {
    case 1:
      return styles.heading1;
    case 2:
      return styles.heading2;
    case 3:
      return styles.heading3;
    case 4:
      return styles.heading4;
    default:
      return styles.heading2;
  }
};

// ==================== NEW: SMART TEXT PAGINATION (SOLUTION 2) ====================

/**
 * 智能文本分页函数
 * 
 * 核心策略：
 * 1. 按段落（\n\n）分割文本
 * 2. 优先在标题（## ）后截断
 * 3. 保证每页不超过目标字符数
 * 4. 避免单页过长（强制截断）
 * 
 * @param text - 原始Markdown文本
 * @param charsPerPage - 每页目标字符数（默认2000）
 * @returns 分页后的文本数组
 */
export const smartPaginateText = (
  text: string,
  charsPerPage: number = 2000
): string[] => {
  if (!text || text.trim().length === 0) {
    return [''];
  }
  
  // 如果文本很短，不分页
  if (text.length < charsPerPage * 0.75) {
    console.log(`Content too short (${text.length} chars), no pagination needed`);
    return [text];
  }
  
  // 按段落分割（双换行符）
  const paragraphs = text.split('\n\n').filter(p => p.trim().length > 0);
  
  if (paragraphs.length === 0) {
    return [text];
  }
  
  const pages: string[] = [];
  let currentPage = '';
  
  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const nextLength = currentPage.length + (currentPage ? 2 : 0) + para.length;
    
    // 检查是否为标题（优先截断点）
    const isHeading = /^#{1,4}\s+/.test(para.trim());
    
    // 检查是否为InsightBox（另一个优先截断点）
    const isInsightBox = /\[!.+\]/.test(para);
    
    if (nextLength > charsPerPage && currentPage) {
      // 如果即将加入的是标题，先结束当前页
      if (isHeading) {
        pages.push(currentPage.trim());
        currentPage = para;
        console.log(`  Split before heading at ${nextLength} chars`);
      }
      // 如果当前页已经很长，强制截断
      else if (nextLength > charsPerPage * 1.5) {
        pages.push(currentPage.trim());
        currentPage = para;
        console.log(`  Force split at ${nextLength} chars (too long)`);
      }
      // 否则继续积累
      else {
        currentPage += '\n\n' + para;
      }
    } else {
      // 正常累积段落
      currentPage += (currentPage ? '\n\n' : '') + para;
    }
  }
  
  // 添加最后一页
  if (currentPage.trim()) {
    pages.push(currentPage.trim());
  }
  
  // 如果没有成功分页，返回原文
  if (pages.length === 0) {
    return [text];
  }
  
  // 输出分页统计
  console.log(`✅ Paginated ${text.length} chars into ${pages.length} pages:`);
  pages.forEach((page, idx) => {
    const wordCount = page.split(/\s+/).length;
    console.log(`   Page ${idx + 1}: ${page.length} chars, ~${wordCount} words`);
  });
  
  return pages;
};

// Check if filing has unified analysis
export const hasUnifiedAnalysis = (filing: any): boolean => {
  return !!filing?.unified_analysis && !!filing?.analysis_version;
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
    fontFamily: 'Times New Roman, serif',
  },
  
  // Heading styles
  heading1: {
    fontSize: 24,
    fontWeight: 'bold' as any,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 32,
    fontFamily: 'Times New Roman, serif',
  },
  
  heading2: {
    fontSize: 20,
    fontWeight: 'bold' as any,
    color: colors.text,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    lineHeight: 28,
    fontFamily: 'Times New Roman, serif',
  },
  
  heading3: {
    fontSize: 18,
    fontWeight: 'bold' as any,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 26,
    fontFamily: 'Times New Roman, serif',
  },
  
  heading4: {
    fontSize: 16,
    fontWeight: 'bold' as any,
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    lineHeight: 24,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Base text styles
  plainText: {
    fontSize: typography.fontSize.base,
    color: colors.text,
    lineHeight: 26,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Key numbers: *37%* or *$5.2B*
  keyNumber: {
    color: colors.primary,
    fontWeight: typography.fontWeight.bold as any,
    fontSize: typography.fontSize.lg,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Important concepts: **transformation**
  keyConcept: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: typography.fontWeight.semibold as any,
    color: colors.text,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Positive trends: +[revenue up 15%]
  positiveTrend: {
    color: '#10B981',
    fontWeight: typography.fontWeight.semibold as any,
    fontSize: typography.fontSize.base,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Negative trends: -[margins down 5%]
  negativeTrend: {
    color: '#EF4444',
    fontWeight: typography.fontWeight.semibold as any,
    fontSize: typography.fontSize.base,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Italic text
  italicText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold as any,
    fontStyle: 'italic' as any,
    lineHeight: 28,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Bold + Italic text
  boldItalicText: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.bold as any,
    fontStyle: 'italic' as any,
    lineHeight: 28,
    fontFamily: 'Times New Roman, serif',
  },
  
  // Insight box container
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EBF8FF',
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
    fontFamily: 'Times New Roman, serif',
  },
});