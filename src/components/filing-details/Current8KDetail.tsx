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

// Define FilingDetail interface locally if not exported from types
interface FilingDetail {
  id: number;
  form_type: string;  // 使用 form_type 作为主要字段
  company_name: string;
  company_ticker: string;
  filing_date: string;
  filing_url: string;  // 统一使用 filing_url
  accession_number: string;
  ai_summary?: string;
  
  // 8-K specific fields
  item_type?: string;
  items?: Array<{ item_number: string; description: string }>;
  event_timeline?: {
    event_date?: string;
    filing_date: string;
    effective_date?: string;
  };
  event_nature_analysis?: string; // GPT
  market_impact_analysis?: string; // GPT
  key_considerations?: string; // GPT
  [key: string]: any;
}

interface Current8KDetailProps {
  filing: FilingDetail;
}

// Item type mapping for 8-K forms
const ITEM_TYPE_MAPPING: { [key: string]: { title: string; icon: string; color: string } } = {
  '1.01': { title: 'Entry into Material Agreement', icon: 'description', color: '#3B82F6' },
  '1.02': { title: 'Termination of Material Agreement', icon: 'cancel', color: '#EF4444' },
  '1.03': { title: 'Bankruptcy or Receivership', icon: 'gavel', color: '#DC2626' },
  '2.01': { title: 'Completion of Acquisition or Disposition', icon: 'business', color: '#8B5CF6' },
  '2.02': { title: 'Results of Operations', icon: 'trending-up', color: '#10B981' },
  '2.03': { title: 'Material Direct Financial Obligation', icon: 'account-balance', color: '#F59E0B' },
  '3.01': { title: 'Notice of Delisting', icon: 'warning', color: '#EF4444' },
  '3.02': { title: 'Unregistered Sales of Securities', icon: 'security', color: '#6366F1' },
  '4.01': { title: 'Changes in Accountant', icon: 'swap-horiz', color: '#8B5CF6' },
  '5.01': { title: 'Changes in Control', icon: 'swap-vert', color: '#EC4899' },
  '5.02': { title: 'Executive Changes', icon: 'people', color: '#8B5CF6' },
  '5.03': { title: 'Amendments to Articles/Bylaws', icon: 'article', color: '#6366F1' },
  '5.07': { title: 'Submission of Matters to Shareholders', icon: 'how-to-vote', color: '#3B82F6' },
  '7.01': { title: 'Regulation FD Disclosure', icon: 'info', color: '#6B7280' },
  '8.01': { title: 'Other Events', icon: 'more-horiz', color: '#6B7280' },
};

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

  // Parse items from filing data
  const parseItems = () => {
    if (filing.items && filing.items.length > 0) {
      return filing.items;
    }
    
    // Fallback: try to parse from item_type
    if (filing.item_type) {
      const itemData = ITEM_TYPE_MAPPING[filing.item_type];
      if (itemData) {
        return [{ item_number: filing.item_type, description: itemData.title }];
      }
    }
    
    return [];
  };

  const items = parseItems();

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

      {/* 2. Item 摘要卡 */}
      {items.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="assignment" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Reported Items</Text>
          </View>
          
          <View style={styles.itemsList}>
            {items.map((item, index) => {
              const itemConfig = ITEM_TYPE_MAPPING[item.item_number] || {
                title: item.description || 'Other Event',
                icon: 'info',
                color: '#6B7280',
              };
              
              return (
                <View key={index} style={styles.itemCard}>
                  <View style={[styles.itemIcon, { backgroundColor: itemConfig.color + '20' }]}>
                    <Icon name={itemConfig.icon} size={24} color={itemConfig.color} />
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={styles.itemNumber}>Item {item.item_number}</Text>
                    <Text style={styles.itemTitle}>{itemConfig.title}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* 3. 事件正文摘要卡 - 修复：只使用 ai_summary */}
      {filing.ai_summary && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="subject" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Event Summary</Text>
          </View>
          
          <View style={styles.summaryCard}>
            <Text style={styles.summaryText}>
              {filing.ai_summary}
            </Text>
          </View>
        </View>
      )}

      {/* 4. 时间线卡 */}
      {filing.event_timeline && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="timeline" size={24} color={redColor} />
            <Text style={styles.sectionTitle}>Event Timeline</Text>
          </View>
          
          <View style={styles.timeline}>
            {filing.event_timeline.event_date && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Event Occurred</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(filing.event_timeline.event_date)}
                  </Text>
                </View>
              </View>
            )}
            
            <View style={styles.timelineItem}>
              <View style={[styles.timelineDot, { backgroundColor: redColor }]} />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineLabel}>Filed with SEC</Text>
                <Text style={styles.timelineDate}>
                  {formatDateTime(filing.event_timeline.filing_date)}
                </Text>
              </View>
            </View>
            
            {filing.event_timeline.effective_date && (
              <View style={styles.timelineItem}>
                <View style={styles.timelineDot} />
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineLabel}>Effective Date</Text>
                  <Text style={styles.timelineDate}>
                    {formatDateTime(filing.event_timeline.effective_date)}
                  </Text>
                </View>
              </View>
            )}
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
          
          <Text style={styles.analysisText}>{filing.event_nature_analysis}</Text>
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
            <Text style={styles.analysisText}>{filing.market_impact_analysis}</Text>
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
            <Text style={styles.analysisText}>{filing.key_considerations}</Text>
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
  
  // Items List
  itemsList: {
    gap: spacing.md,
  },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  itemIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  itemContent: {
    flex: 1,
  },
  itemNumber: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  itemTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  
  // Summary
  summaryCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  summaryText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  
  // Timeline
  timeline: {
    paddingLeft: spacing.md,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: spacing.lg,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.textSecondary,
    marginTop: spacing.xs,
    marginRight: spacing.md,
  },
  timelineContent: {
    flex: 1,
  },
  timelineLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  timelineDate: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  
  // Analysis
  analysisText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
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