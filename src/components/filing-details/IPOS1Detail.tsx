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
import { parseUnifiedAnalysis, hasUnifiedAnalysis, getDisplayAnalysis } from '../../utils/textHelpers';

interface Filing {
  id: number;
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  
  // Unified analysis fields
  unified_analysis?: string;
  analysis_version?: string;
  smart_markup_data?: any;
  
  // Legacy S-1 specific fields
  ai_summary?: string;
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

  // 统一分析内容 - 唯一的内容区域
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <MaterialCommunityIcons name="rocket-launch" size={20} color="#E88A36" />
          <Text style={styles.sectionTitle}>IPO Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <MaterialCommunityIcons name="auto-fix" size={14} color="#E88A36" />
              <Text style={styles.unifiedBadgeText}>AI</Text>
            </View>
          )}
        </View>

        <View style={styles.unifiedContent}>
          {isUnified ? (
            // 使用智能标记解析
            <View style={styles.analysisText}>
              {parseUnifiedAnalysis(content)}
            </View>
          ) : (
            // 降级到普通文本
            <Text style={styles.legacyText}>{content}</Text>
          )}
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
        {/* 极简的内容结构 - 只有统一分析 */}
        {renderUnifiedAnalysis()}

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
    fontFamily: 'Times New Roman, serif',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 6,
    fontFamily: 'Times New Roman, serif',
  },
  filingTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filingTime: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginLeft: 4,
    fontFamily: 'Times New Roman, serif',
  },
  scrollContainer: {
    flex: 1,
  },

  // Unified Analysis Section - 唯一的内容区域
  unifiedSection: {
    marginBottom: 28,
    marginTop: 20,
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
    flex: 1,
    letterSpacing: -0.3,
    fontFamily: 'Times New Roman, serif',
  },
  unifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E88A36',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  unifiedBadgeText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '600',
    marginLeft: 4,
    fontFamily: 'Times New Roman, serif',
  },
  unifiedContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  analysisText: {
    // Container for parsed unified analysis
    // 实际样式在 textHelpers.ts 中定义
  },
  legacyText: {
    fontSize: 15,
    lineHeight: 23,
    color: '#444',
    fontFamily: 'Times New Roman, serif',
  },

  // View Filing Button
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
    fontFamily: 'Times New Roman, serif',
  },
});

export default IPOS1Detail;