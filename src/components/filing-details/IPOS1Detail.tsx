import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Filing } from '../../types';
import { formatNumber } from '../../utils/textHelpers';

interface IPOS1DetailProps {
  filing: Filing;
}

// 格式化货币的辅助函数
const formatCurrency = (value: number | string): string => {
  if (typeof value === 'string') {
    value = parseFloat(value);
  }
  if (isNaN(value)) return 'N/A';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1e9) {
    return `${sign}${(absValue / 1e9).toFixed(1)}B`;
  } else if (absValue >= 1e6) {
    return `${sign}${(absValue / 1e6).toFixed(1)}M`;
  } else if (absValue >= 1e3) {
    return `${sign}${(absValue / 1e3).toFixed(0)}K`;
  }
  return `${sign}${absValue.toFixed(0)}`;
};

const IPOS1Detail: React.FC<IPOS1DetailProps> = ({ filing }) => {
  const openSECFiling = () => {
    if (filing.filing_url) {
      Linking.openURL(filing.filing_url);
    }
  };

  // 从AI Summary中尝试提取IPO信息的备用方案
  const extractIPOInfoFromSummary = (summary: string): any => {
    const info: any = {};
    
    // 尝试提取价格信息
    const priceMatch = summary.match(/\$(\d+(?:\.\d+)?)\s*(?:to|-)\s*\$?(\d+(?:\.\d+)?)\s*per\s*share/i);
    if (priceMatch) {
      info.price_range = `$${priceMatch[1]}-$${priceMatch[2]}`;
    }
    
    // 尝试提取股票代码
    const tickerMatch = summary.match(/ticker[:\s]+([A-Z]{2,5})/i);
    if (tickerMatch) {
      info.ticker = tickerMatch[1];
    }
    
    // 尝试提取交易所
    const exchangeMatch = summary.match(/(NYSE|NASDAQ|AMEX)/i);
    if (exchangeMatch) {
      info.exchange = exchangeMatch[1].toUpperCase();
    }
    
    // 尝试提取募资金额
    const proceedsMatch = summary.match(/(?:raise|raising|proceeds of)\s*\$(\d+(?:\.\d+)?)\s*(million|billion|M|B)/i);
    if (proceedsMatch) {
      const amount = parseFloat(proceedsMatch[1]);
      const multiplier = proceedsMatch[2].toLowerCase().startsWith('b') ? 1e9 : 1e6;
      info.expected_proceeds = amount * multiplier;
    }
    
    return Object.keys(info).length > 0 ? info : null;
  };

  // 渲染IPO基本信息
  const renderIPODetails = () => {
    // 优先使用后端返回的ipo_details
    let details = filing.ipo_details || {};
    
    // 如果后端数据不完整，尝试从summary中提取
    if (!details.ticker && !details.price_range && filing.ai_summary) {
      const extractedInfo = extractIPOInfoFromSummary(filing.ai_summary);
      if (extractedInfo) {
        details = { ...extractedInfo, ...details };
      }
    }
    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>IPO Details</Text>
        </View>
        <View style={styles.card}>
          {details.ticker ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Proposed Ticker:</Text>
              <Text style={styles.detailValue}>{details.ticker}</Text>
            </View>
          ) : null}
          {details.exchange ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Exchange:</Text>
              <Text style={styles.detailValue}>{details.exchange}</Text>
            </View>
          ) : null}
          {details.price_range ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected Price Range:</Text>
              <Text style={styles.detailValue}>{details.price_range}</Text>
            </View>
          ) : null}
          {details.shares_offered ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shares Offered:</Text>
              <Text style={styles.detailValue}>{formatNumber(details.shares_offered)}</Text>
            </View>
          ) : null}
          {details.expected_proceeds ? (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected Proceeds:</Text>
              <Text style={styles.detailValue}>{formatCurrency(details.expected_proceeds)}</Text>
            </View>
          ) : null}
          {!details.ticker && !details.exchange && !details.price_range && (
            <Text style={styles.noDataText}>IPO details not yet available</Text>
          )}
        </View>
      </View>
    );
  };

  // 渲染公司概述
  const renderCompanyOverview = () => {
    if (!filing.company_overview) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="office-building" size={20} color="#E88A36" /> Company Overview
        </Text>
        <View style={styles.card}>
          <Text style={styles.overviewText}>{filing.company_overview}</Text>
        </View>
      </View>
    );
  };

  // 渲染财务摘要
  const renderFinancialSummary = () => {
    if (!filing.financial_summary) return null;

    const summary = filing.financial_summary;
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="currency-usd" size={20} color="#E88A36" /> Financial Summary
        </Text>
        <View style={styles.card}>
          {summary.revenue && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Revenue (Latest):</Text>
              <Text style={styles.metricValue}>{formatCurrency(summary.revenue)}</Text>
            </View>
          )}
          {summary.revenue_growth && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Revenue Growth:</Text>
              <Text style={[styles.metricValue, { color: summary.revenue_growth > 0 ? '#4CAF50' : '#F44336' }]}>
                {summary.revenue_growth > 0 ? '+' : ''}{summary.revenue_growth}%
              </Text>
            </View>
          )}
          {summary.net_income !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Net Income:</Text>
              <Text style={[styles.metricValue, { color: summary.net_income >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(summary.net_income)}
              </Text>
            </View>
          )}
          {summary.cash_position && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cash Position:</Text>
              <Text style={styles.metricValue}>{formatCurrency(summary.cash_position)}</Text>
            </View>
          )}
          {summary.burn_rate && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Monthly Burn Rate:</Text>
              <Text style={styles.metricValue}>{formatCurrency(summary.burn_rate)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 渲染风险分类
  const renderRiskCategories = () => {
    if (!filing.risk_categories) return null;

    const risks = filing.risk_categories;
    const riskSections = [
      { key: 'business_risks', title: 'Business Risks', icon: 'briefcase' },
      { key: 'market_risks', title: 'Market Risks', icon: 'chart-line-variant' },
      { key: 'regulatory_risks', title: 'Regulatory Risks', icon: 'gavel' },
      { key: 'financial_risks', title: 'Financial Risks', icon: 'cash-remove' },
    ];

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#E88A36" /> Risk Factors
        </Text>
        {riskSections.map((section) => {
          const riskItems = risks[section.key];
          if (!riskItems || riskItems.length === 0) return null;

          return (
            <View key={section.key} style={styles.riskCategory}>
              <Text style={styles.riskCategoryTitle}>
                <MaterialCommunityIcons name={section.icon as any} size={16} color="#666" /> {section.title}
              </Text>
              {riskItems.map((risk: string, index: number) => (
                <Text key={index} style={styles.riskItem}>• {risk}</Text>
              ))}
            </View>
          );
        })}
      </View>
    );
  };

  // 渲染成长路径分析
  const renderGrowthAnalysis = () => {
    if (!filing.growth_path_analysis) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#E88A36" /> Growth Path Analysis
        </Text>
        <View style={styles.card}>
          <Text style={styles.analysisText}>{filing.growth_path_analysis}</Text>
        </View>
      </View>
    );
  };

  // 渲染护城河分析
  const renderCompetitiveMoat = () => {
    if (!filing.competitive_moat_analysis) return null;

    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#E88A36" /> Competitive Moat
        </Text>
        <View style={styles.card}>
          <Text style={styles.analysisText}>{filing.competitive_moat_analysis}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 移除了 AI Summary 部分 */}
      
      {/* IPO详情 - 即使没有数据也显示框架 */}
      {renderIPODetails()}

      {/* 公司概述 */}
      {renderCompanyOverview()}

      {/* 财务摘要 */}
      {renderFinancialSummary()}

      {/* 风险因素 */}
      {renderRiskCategories()}

      {/* 成长路径 */}
      {renderGrowthAnalysis()}

      {/* 护城河分析 */}
      {renderCompetitiveMoat()}

      {/* 查看原始文件按钮 */}
      <TouchableOpacity style={styles.viewFilingButton} onPress={openSECFiling}>
        <MaterialCommunityIcons name="file-document" size={20} color="white" />
        <Text style={styles.viewFilingText}>View Full S-1 Filing</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginLeft: 8,
    fontFamily: 'System',
    letterSpacing: -0.3,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  overviewText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#444',
  },
  analysisText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#444',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  detailLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    flex: 1,
    fontFamily: 'System',
  },
  detailValue: {
    fontSize: 15,
    color: '#1e293b',
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
    fontFamily: 'System',
  },
  noDataText: {
    fontSize: 14,
    color: '#94a3b8',
    textAlign: 'center',
    fontStyle: 'italic',
    fontFamily: 'System',
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  metricLabel: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
    fontFamily: 'System',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    fontFamily: 'System',
  },
  riskCategory: {
    marginBottom: 16,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  riskCategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  riskItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 8,
    marginTop: 6,
    lineHeight: 20,
  },
  viewFilingButton: {
    backgroundColor: '#E88A36',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    marginHorizontal: 16,
    marginVertical: 24,
    borderRadius: 12,
    shadowColor: '#E88A36',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  viewFilingText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default IPOS1Detail;