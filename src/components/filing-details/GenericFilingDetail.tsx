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
  filing_url: string;  // 注意：可能需要从 file_url 改为 filing_url
  accession_number: string;
  cik?: string;
  ai_summary?: string;
  one_liner?: string;
  business_overview?: string;
  key_points?: string[];
  key_insights?: string[];
  risks?: string[];
  risk_factors?: string[];
  opportunities?: string[];
  financial_highlights?: any;
  financial_metrics?: any;
  item_type?: string;  // 修正：从 event_type 改为 item_type
  key_tags?: string[];  // 使用 key_tags 而不是 tags
  management_tone?: string;
  sentiment?: string;
  sentiment_explanation?: string;
  vote_counts: any;
  comment_count: number;
  view_limit_info?: any;
  [key: string]: any;
}

interface GenericFilingDetailProps {
  filing: FilingDetail;
}

const GenericFilingDetail: React.FC<GenericFilingDetailProps> = ({ filing }) => {
  // Generic filing component for unknown or other filing types
  
  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const renderSection = (title: string, content: any, icon: string = 'info') => {
    if (!content) return null;

    const isArray = Array.isArray(content);
    const isString = typeof content === 'string';
    const isEmpty = isArray ? content.length === 0 : !content;

    if (isEmpty) return null;

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name={icon} size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>

        {isString && (
          <Text style={styles.sectionContent}>{content}</Text>
        )}

        {isArray && (
          <View style={styles.itemsList}>
            {content.map((item: string, idx: number) => (
              <View key={idx} style={styles.itemRow}>
                <Icon name="chevron-right" size={20} color={colors.textSecondary} />
                <Text style={styles.itemText}>{item}</Text>
              </View>
            ))}
          </View>
        )}

        {!isString && !isArray && typeof content === 'object' && (
          <View style={styles.dataGrid}>
            {Object.entries(content).map(([key, value]) => (
              <View key={key} style={styles.dataItem}>
                <Text style={styles.dataLabel}>
                  {key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </Text>
                <Text style={styles.dataValue}>{String(value)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Generic Header */}
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Icon name="description" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>{filing.form_type}</Text>
        <Text style={styles.headerSubtitle}>
          {filing.company_name} • {formatDate(filing.filing_date)}
        </Text>
      </View>

      {/* AI Summary if available */}
      {filing.ai_summary && (
        <View style={[styles.section, styles.summarySection]}>
          <View style={styles.sectionHeader}>
            <Icon name="auto-awesome" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>AI Summary</Text>
          </View>
          <Text style={styles.summaryText}>{filing.ai_summary}</Text>
        </View>
      )}

      {/* Dynamic sections based on available data */}
      {renderSection('Overview', filing.one_liner || filing.business_overview, 'info')}
      {renderSection('Key Points', filing.key_points || filing.key_insights, 'lightbulb')}
      {renderSection('Risk Factors', filing.risks || filing.risk_factors, 'warning')}
      {renderSection('Opportunities', filing.opportunities, 'trending-up')}
      
      {/* Financial Information if available */}
      {(filing.financial_highlights || filing.financial_metrics) && (
        renderSection(
          'Financial Information', 
          filing.financial_highlights || filing.financial_metrics, 
          'attach-money'
        )
      )}

      {/* Event Information if available - 使用 item_type */}
      {filing.item_type && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="event" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Event Type</Text>
          </View>
          <View style={styles.eventBadge}>
            <Text style={styles.eventText}>{filing.item_type}</Text>
          </View>
        </View>
      )}

      {/* Tags - 使用 key_tags */}
      {filing.key_tags && filing.key_tags.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="label" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Topics</Text>
          </View>
          <View style={styles.tagsContainer}>
            {filing.key_tags.map((tag: string, index: number) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Management Tone/Sentiment */}
      {(filing.management_tone || filing.sentiment) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="mood" size={24} color={colors.primary} />
            <Text style={styles.sectionTitle}>Management Sentiment</Text>
          </View>
          <View style={styles.sentimentCard}>
            <Text style={styles.sentimentLabel}>
              {filing.management_tone || filing.sentiment}
            </Text>
            {filing.sentiment_explanation && (
              <Text style={styles.sentimentExplanation}>
                {filing.sentiment_explanation}
              </Text>
            )}
          </View>
        </View>
      )}

      {/* Additional Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="info" size={24} color={colors.primary} />
          <Text style={styles.sectionTitle}>Filing Information</Text>
        </View>
        <View style={styles.filingInfo}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filing Type:</Text>
            <Text style={styles.infoValue}>{filing.form_type}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Filing Date:</Text>
            <Text style={styles.infoValue}>{formatDate(filing.filing_date)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Accession Number:</Text>
            <Text style={styles.infoValue}>{filing.accession_number}</Text>
          </View>
          {filing.cik && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>CIK:</Text>
              <Text style={styles.infoValue}>{filing.cik}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.secButton}
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
    backgroundColor: colors.primary,
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
  summarySection: {
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
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
  },
  sectionContent: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    lineHeight: 24,
  },
  summaryText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  itemsList: {
    marginTop: spacing.sm,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.sm,
  },
  itemText: {
    flex: 1,
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginLeft: spacing.xs,
    lineHeight: 22,
  },
  dataGrid: {
    gap: spacing.sm,
  },
  dataItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  dataLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  dataValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
  },
  eventBadge: {
    backgroundColor: colors.primary + '10',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    alignSelf: 'flex-start',
  },
  eventText: {
    color: colors.primary,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  sentimentCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.sm,
  },
  sentimentLabel: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    textTransform: 'capitalize',
  },
  sentimentExplanation: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
    lineHeight: 20,
  },
  filingInfo: {
    gap: spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  infoLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  footer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  secButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
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

export default GenericFilingDetail;