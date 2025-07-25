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

interface Filing {
  id: number;
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  ai_summary?: string;
  
  // S-1 specific fields - 全部改为字符串类型
  ipo_details?: string;  // 改为string
  company_overview?: string;
  financial_summary?: string;  // 改为string
  risk_categories?: string;  // 改为string
  growth_path_analysis?: string;
  competitive_moat_analysis?: string;
  financial_highlights?: any;  // 保留结构化数据
  [key: string]: any;
}

interface IPOS1DetailProps {
  filing: Filing;
}

const IPOS1Detail: React.FC<IPOS1DetailProps> = ({ filing }) => {
  const openSECFiling = () => {
    if (filing.filing_url) {
      Linking.openURL(filing.filing_url);
    }
  };

  // 格式化货币的辅助函数（用于financial_highlights）
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

  // 渲染IPO基本信息 - 修正版（改为文本显示）
  const renderIPODetails = () => {
    if (!filing.ipo_details) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-line" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>IPO Details</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.narrativeText}>{filing.ipo_details}</Text>
        </View>
      </View>
    );
  };

  // 渲染公司概述
  const renderCompanyOverview = () => {
    if (!filing.company_overview) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="office-building" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Company Overview</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.overviewText}>{filing.company_overview}</Text>
        </View>
      </View>
    );
  };

  // 渲染财务摘要 - 修正版（改为文本显示）
  const renderFinancialSummary = () => {
    if (!filing.financial_summary) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="currency-usd" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Financial Summary</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.narrativeText}>{filing.financial_summary}</Text>
        </View>
      </View>
    );
  };

  // 渲染财务指标（如果有结构化数据）
  const renderFinancialHighlights = () => {
    if (!filing.financial_highlights) return null;

    const highlights = filing.financial_highlights;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="chart-bar" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Financial Highlights</Text>
        </View>
        <View style={styles.card}>
          {highlights.revenue && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Revenue (Latest):</Text>
              <Text style={styles.metricValue}>{formatCurrency(highlights.revenue)}</Text>
            </View>
          )}
          {highlights.revenue_growth && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Revenue Growth:</Text>
              <Text style={[styles.metricValue, { color: highlights.revenue_growth > 0 ? '#4CAF50' : '#F44336' }]}>
                {highlights.revenue_growth > 0 ? '+' : ''}{highlights.revenue_growth}%
              </Text>
            </View>
          )}
          {highlights.net_income !== undefined && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Net Income:</Text>
              <Text style={[styles.metricValue, { color: highlights.net_income >= 0 ? '#4CAF50' : '#F44336' }]}>
                {formatCurrency(highlights.net_income)}
              </Text>
            </View>
          )}
          {highlights.cash && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Cash Position:</Text>
              <Text style={styles.metricValue}>{formatCurrency(highlights.cash)}</Text>
            </View>
          )}
          {highlights.burn_rate && (
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Monthly Burn Rate:</Text>
              <Text style={styles.metricValue}>{formatCurrency(highlights.burn_rate)}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  // 渲染风险分类 - 修正版（改为文本显示）
  const renderRiskCategories = () => {
    if (!filing.risk_categories) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="alert-circle" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Risk Factors</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.narrativeText}>{filing.risk_categories}</Text>
        </View>
      </View>
    );
  };

  // 渲染成长路径分析
  const renderGrowthAnalysis = () => {
    if (!filing.growth_path_analysis) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="trending-up" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Growth Path Analysis</Text>
        </View>
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
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="shield-check" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>Competitive Moat</Text>
        </View>
        <View style={styles.card}>
          <Text style={styles.analysisText}>{filing.competitive_moat_analysis}</Text>
        </View>
      </View>
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* 移除了 AI Summary 部分 */}
      
      {/* IPO详情 */}
      {renderIPODetails()}

      {/* 公司概述 */}
      {renderCompanyOverview()}

      {/* 财务摘要 */}
      {renderFinancialSummary()}

      {/* 财务指标（如果有） */}
      {renderFinancialHighlights()}

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
  narrativeText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#444',
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