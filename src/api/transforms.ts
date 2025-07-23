// src/api/transforms.ts
// Centralized data transformation functions for API responses

import { Filing, FilingType, ManagementTone, ProcessingStatus, Company, ViewLimitInfo } from '../types';
import { cleanAISummary, cleanTags } from '../utils/textHelpers';

// Transform backend company to frontend format
export const transformCompany = (backendCompany: any): Company => {
  if (!backendCompany) return {} as Company;
  
  return {
    id: backendCompany.cik || backendCompany.id || '',
    ticker: backendCompany.ticker || '',
    name: backendCompany.name || '',
    sector: backendCompany.sector,
    industry: backendCompany.industry,
    market_cap: backendCompany.market_cap,
    employees: backendCompany.employees,
    description: backendCompany.description,
    website: backendCompany.website,
    indices: backendCompany.indices,
    created_at: backendCompany.created_at,
    updated_at: backendCompany.updated_at,
  };
};

// Unified filing transformation function
export const transformFiling = (backendFiling: any): Filing => {
  // Handle empty or invalid data
  if (!backendFiling) {
    throw new Error('Invalid filing data');
  }

  // Extract and clean data
  const filing: Filing = {
    // Basic fields
    id: String(backendFiling.id),
    company_id: backendFiling.company?.cik || backendFiling.cik || '',
    company_name: backendFiling.company?.name || '',
    company_ticker: backendFiling.company?.ticker || '',
    company: backendFiling.company ? transformCompany(backendFiling.company) : undefined,
    
    // Filing details
    filing_type: backendFiling.form_type as FilingType,
    filing_date: backendFiling.filing_date,
    accession_number: backendFiling.accession_number,
    filing_url: backendFiling.file_url || backendFiling.filing_url || '',
    processing_status: (backendFiling.status || 'completed') as ProcessingStatus,
    
    // AI-generated content (with cleaning)
    ai_summary: cleanAISummary(backendFiling.ai_summary || backendFiling.one_liner),
    feed_summary: cleanAISummary(backendFiling.one_liner || backendFiling.feed_summary),
    management_tone: (backendFiling.management_tone || backendFiling.sentiment) as ManagementTone,
    
    // Arrays and objects
    tags: cleanTags(backendFiling.key_tags || backendFiling.tags),
    key_insights: backendFiling.key_quotes || backendFiling.key_questions || backendFiling.key_insights || [],
    risk_factors: backendFiling.risk_factors || [],
    future_outlook: backendFiling.future_outlook,
    financial_highlights: backendFiling.financial_highlights || backendFiling.financial_data,
    
    // Voting data
    vote_counts: backendFiling.vote_counts || {
      bullish: backendFiling.bullish_votes || 0,
      neutral: backendFiling.neutral_votes || 0,
      bearish: backendFiling.bearish_votes || 0
    },
    user_vote: backendFiling.user_vote || null,
    
    // Metadata
    view_count: backendFiling.view_count || 0,
    comment_count: backendFiling.comment_count || 0,
    view_limit_info: backendFiling.view_limit_info ? {
      views_remaining: backendFiling.view_limit_info.views_remaining,
      is_pro: backendFiling.view_limit_info.is_pro,
      views_today: backendFiling.view_limit_info.views_today,
      daily_limit: backendFiling.view_limit_info.daily_limit,
    } : undefined,
    created_at: backendFiling.created_at || backendFiling.filing_date,
    updated_at: backendFiling.updated_at || backendFiling.filing_date,
    
    // Special fields
    item_type: backendFiling.item_type,
    
    // ========== 添加所有缺失的字段 ==========
    
    // 8-K specific fields
    items: backendFiling.items,
    event_timeline: backendFiling.event_timeline,
    event_nature_analysis: backendFiling.event_nature_analysis,
    market_impact_analysis: backendFiling.market_impact_analysis,
    key_considerations: backendFiling.key_considerations,
    
    // 10-K specific fields
    auditor_opinion: backendFiling.auditor_opinion,
    three_year_financials: backendFiling.three_year_financials,
    business_segments: backendFiling.business_segments,
    risk_summary: backendFiling.risk_summary,
    growth_drivers: backendFiling.growth_drivers,
    management_outlook: backendFiling.management_outlook,
    strategic_adjustments: backendFiling.strategic_adjustments,
    market_impact_10k: backendFiling.market_impact_10k,
    
    // 10-Q specific fields
    expectations_comparison: backendFiling.expectations_comparison,
    cost_structure: backendFiling.cost_structure,
    guidance_update: backendFiling.guidance_update,
    growth_decline_analysis: backendFiling.growth_decline_analysis,
    management_tone_analysis: backendFiling.management_tone_analysis,
    beat_miss_analysis: backendFiling.beat_miss_analysis,
    market_impact_10q: backendFiling.market_impact_10q,
    fiscal_year: backendFiling.fiscal_year,
    fiscal_quarter: backendFiling.fiscal_quarter,
    period_end_date: backendFiling.period_end_date,
    
    // S-1 specific fields
    ipo_details: backendFiling.ipo_details,
    company_overview: backendFiling.company_overview,
    financial_summary: backendFiling.financial_summary,
    risk_categories: backendFiling.risk_categories,
    growth_path_analysis: backendFiling.growth_path_analysis,
    competitive_moat_analysis: backendFiling.competitive_moat_analysis,
  };

  return filing;
};

// Transform filing list response
export const transformFilingList = (response: any) => {
  if (!response || !response.data) {
    return {
      data: [],
      total: 0,
      skip: 0,
      limit: 20,
    };
  }

  return {
    data: response.data.map(transformFiling),
    total: response.total || response.data.length,
    skip: response.skip || 0,
    limit: response.limit || 20,
  };
};

// Transform vote response
export const transformVoteResponse = (response: any) => {
  return {
    vote_counts: response.vote_counts || {
      bullish: response.bullish || 0,
      neutral: response.neutral || 0,
      bearish: response.bearish || 0,
    },
    user_vote: response.user_vote || null,
  };
};

// Transform comment
// 替换原有的 transformComment 函数
export const transformComment = (comment: any) => {
    return {
      id: String(comment.id),
      filing_id: String(comment.filing_id),
      user_id: String(comment.user_id),
      username: comment.username || comment.user_name || 'Anonymous',
      user_name: comment.username || comment.user_name || 'Anonymous', // backward compatibility
      user_tier: comment.user_tier || 'free',
      content: comment.content || '',
      created_at: comment.created_at,
      updated_at: comment.updated_at || comment.created_at,
      is_editable: Boolean(comment.is_editable),
      // New voting fields
      upvotes: comment.upvotes || 0,
      downvotes: comment.downvotes || 0,
      net_votes: comment.net_votes || 0,
      user_vote: comment.user_vote || 0,
      // Reply information
      reply_to: comment.reply_to ? {
        comment_id: comment.reply_to.comment_id,
        user_id: comment.reply_to.user_id,
        username: comment.reply_to.username,
        content_preview: comment.reply_to.content_preview
      } : undefined
    };
  };