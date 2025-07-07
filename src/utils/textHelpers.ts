// src/utils/textHelpers.ts
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