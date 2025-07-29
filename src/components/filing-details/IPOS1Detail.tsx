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
  ipo_details?: string;
  company_overview?: string;
  financial_summary?: string;
  risk_categories?: string;
  growth_path_analysis?: string;
  competitive_moat_analysis?: string;
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

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    
    if (diffHours < 24) {
      return `Filed ${diffHours} hours ago`;
    } else if (diffDays < 7) {
      return `Filed ${diffDays} days ago`;
    } else {
      return `Filed on ${date.toLocaleDateString()}`;
    }
  };

  // 渲染IPO基本信息
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
          <Text style={styles.narrativeText}>{filing.company_overview}</Text>
        </View>
      </View>
    );
  };

  // 渲染财务摘要
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

  // 渲染风险分类
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
          <Text style={styles.narrativeText}>{filing.growth_path_analysis}</Text>
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
          <Text style={styles.narrativeText}>{filing.competitive_moat_analysis}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 紫色报头 */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name="diamond-stone" size={40} color="white" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text style={styles.headerTitle}>IPO Registration (S-1)</Text>
            <Text style={styles.headerSubtitle}>{filing.company_name}</Text>
            <View style={styles.filingTimeContainer}>
              <MaterialCommunityIcons name="clock-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.filingTime}>{formatDate(filing.filing_date)}</Text>
            </View>
          </View>
        </View>
      </View>

      <ScrollView style={styles.scrollContainer}>
        {/* IPO详情 */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f6f8',
  },
  // 紫色报头样式
  header: {
    backgroundColor: '#7C3AED', // S-1的紫色
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: 'white',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
  },
  filingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filingTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
  },
  scrollContainer: {
    flex: 1,
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
  narrativeText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#444',
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