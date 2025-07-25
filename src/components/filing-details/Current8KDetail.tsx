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

interface FilingDetail {
  id: number;
  form_type: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;
  accession_number: string;
  ai_summary?: string;
  
  // 8-K specific fields - 全部改为字符串类型
  item_type?: string;
  items?: string;  // 改为string
  event_timeline?: string;  // 改为string
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

  // Format date with time if available
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

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

      {/* 1. 披露元信息卡 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="info" size={24} color={redColor} />
          <Text style={styles.sectionTitle}>Filing Information</Text>
        </View>
        
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Company</Text>
            <Text style={styles.infoValue}>{filing.company_ticker}</Text>
            <Text style={styles.infoSubvalue}>{filing.company_name}</Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Filing Date</Text>
            <Text style={styles.infoValue}>
              {new Date(filing.filing_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </Text>
            <Text style={styles.infoSubvalue}>
              {new Date(filing.filing_date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>
          
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Accession No.</Text>
            <Text style={[styles.infoValue, styles.accessionNumber]}>
              {filing.accession_number}
            </Text>
          </View>
        </View>
      </View>

      {/* 2. Item Type 摘要卡 */}
      {filing.item_type && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="assignment" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Item Type</Text>
          </View>
          
          <View style={styles.narrativeCard}>
            <Text style={styles.itemTypeText}>Item {filing.item_type}</Text>
          </View>
        </View>
      )}

      {/* 3. Items 摘要卡 - 修正版（改为文本显示） */}
      {filing.items && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="list" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Reported Items</Text>
          </View>
          
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeText}>{filing.items}</Text>
          </View>
        </View>
      )}

      {/* 4. 时间线卡 - 修正版（改为文本显示） */}
      {filing.event_timeline && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="timeline" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Event Timeline</Text>
          </View>
          
          <View style={styles.narrativeCard}>
            <Text style={styles.narrativeText}>{filing.event_timeline}</Text>
          </View>
        </View>
      )}

      {/* 5. GPT: 事件性质解释 */}
      {filing.event_nature_analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="psychology" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Event Analysis</Text>
            <View style={styles.gptBadge}>
              <Text style={styles.gptBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.analysisCard}>
            <Text style={styles.narrativeText}>{filing.event_nature_analysis}</Text>
          </View>
        </View>
      )}

      {/* 6. GPT: 市场反应 */}
      {filing.market_impact_analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="show-chart" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Expected Market Impact</Text>
            <View style={styles.gptBadge}>
              <Text style={styles.gptBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.impactCard}>
            <Text style={styles.narrativeText}>{filing.market_impact_analysis}</Text>
          </View>
        </View>
      )}

      {/* 7. GPT: 潜在关注点 */}
      {filing.key_considerations && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="visibility" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Key Considerations</Text>
            <View style={styles.gptBadge}>
              <Text style={styles.gptBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.considerationsCard}>
            <Text style={styles.narrativeText}>{filing.key_considerations}</Text>
          </View>
        </View>
      )}

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
  section: {
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
  gptBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  gptBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  
  // Info Grid
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  infoItem: {
    flex: 1,
    minWidth: '33%',
    padding: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  infoValue: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  infoSubvalue: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  accessionNumber: {
    fontSize: typography.fontSize.sm,
  },
  
  // Narrative Cards - 文本显示样式
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
  itemTypeText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
  
  // Analysis Cards
  analysisCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  impactCard: {
    backgroundColor: '#FEE2E2',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  considerationsCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#EF4444' + '30',
  },
  
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