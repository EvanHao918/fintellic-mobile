import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { parseUnifiedAnalysis, hasUnifiedAnalysis, getDisplayAnalysis } from '../../utils/textHelpers';

interface FilingDetail {
  id: number;
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  accession_number: string;
  
  // Unified analysis fields
  unified_analysis?: string;
  analysis_version?: string;
  smart_markup_data?: any;
  
  // Legacy 8-K specific fields
  ai_summary?: string;
  item_type?: string;
  items?: string;
  event_timeline?: string;
  event_nature_analysis?: string;
  market_impact_analysis?: string;
  key_considerations?: string;
  [key: string]: any;
}

interface Current8KDetailProps {
  filing: FilingDetail;
}

const Current8KDetail: React.FC<Current8KDetailProps> = ({ filing }) => {
  const redColor = '#EF4444'; // 8-K signature color

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // 统一分析内容 - 核心部分
  const renderUnifiedAnalysis = () => {
    const content = getDisplayAnalysis(filing);
    if (!content) return null;

    const isUnified = hasUnifiedAnalysis(filing);

    return (
      <View style={styles.unifiedSection}>
        <View style={styles.sectionHeader}>
          <Icon name="flash-on" size={24} color={redColor} />
          <Text style={styles.sectionTitle}>Event Analysis</Text>
          {isUnified && (
            <View style={styles.unifiedBadge}>
              <Icon name="auto-awesome" size={14} color={redColor} />
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

  // 事件元信息卡（精简版）
  const renderEventMetaCard = () => (
    <View style={styles.metaCard}>
      <View style={styles.metaGrid}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Company</Text>
          <Text style={styles.metaValue}>{filing.company_ticker}</Text>
          <Text style={styles.metaSubvalue}>{filing.company_name}</Text>
        </View>
        
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Filing Date</Text>
          <Text style={styles.metaValue}>
            {new Date(filing.filing_date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </Text>
        </View>
        
        {filing.item_type && (
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>Item Type</Text>
            <Text style={styles.metaValue}>Item {filing.item_type}</Text>
          </View>
        )}
      </View>
    </View>
  );

  // 仅在旧版本时显示的传统内容
  const renderLegacyContent = () => {
    if (hasUnifiedAnalysis(filing)) return null;

    return (
      <>
        {filing.items && (
          <View style={styles.legacySection}>
            <View style={styles.sectionHeader}>
              <Icon name="article" size={24} color={redColor} />
              <Text style={styles.sectionTitle}>What Happened</Text>
            </View>
            <View style={styles.narrativeCard}>
              <Text style={styles.narrativeText}>{filing.items}</Text>
            </View>
          </View>
        )}

        {filing.market_impact_analysis && (
          <View style={styles.legacySection}>
            <View style={styles.sectionHeader}>
              <Icon name="show-chart" size={24} color={redColor} />
              <Text style={styles.sectionTitle}>Potential Market Impact</Text>
            </View>
            <View style={styles.impactCard}>
              <Text style={styles.narrativeText}>{filing.market_impact_analysis}</Text>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* 8-K Header */}
      <View style={[styles.header, { backgroundColor: redColor }]}>
        <View style={styles.headerIcon}>
          <Icon name="flash-on" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>Current Report (8-K)</Text>
        <Text style={styles.headerSubtitle}>Material Event Disclosure</Text>
        <View style={styles.urgencyBadge}>
          <Icon name="schedule" size={16} color={colors.white} />
          <Text style={styles.urgencyText}>
            Filed {getRelativeTime(filing.filing_date)}
          </Text>
        </View>
      </View>

      {/* 简化后的内容结构 */}
      {renderEventMetaCard()}
      {renderUnifiedAnalysis()}
      {renderLegacyContent()}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: redColor }]}
          onPress={() => filing.filing_url && Linking.openURL(filing.filing_url)}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Original SEC Filing</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.white + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  headerTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.white + '90',
    textAlign: 'center',
  },
  urgencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  urgencyText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },

  // Meta Card
  metaCard: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  metaItem: {
    flex: 1,
    minWidth: '33%',
    padding: spacing.xs,
  },
  metaLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  metaValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  metaSubvalue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },

  // Unified Analysis Section
  unifiedSection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginLeft: spacing.sm,
    flex: 1,
  },
  unifiedBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  unifiedBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  unifiedContent: {
    paddingTop: spacing.sm,
  },
  analysisText: {
    // Container for parsed unified analysis
  },
  legacyText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },

  // Legacy sections
  legacySection: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    ...Platform.select({
      ios: {
        shadowColor: colors.text,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  narrativeCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  narrativeText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  impactCard: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },

  // Footer
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  secButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.md,
  },
  secButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.sm,
  },
});

export default Current8KDetail;