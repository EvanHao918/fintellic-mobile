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

// Define orange color locally if not in theme
const orangeColor = '#F97316';

// Define FilingDetail interface
interface FilingDetail {
  id: number;
  filing_type?: string;
  form_type?: string;
  company_name: string;
  company_ticker: string;
  filing_date: string;
  file_url: string;
  accession_number: string;
  ai_summary?: string;
  
  // S-1 specific fields
  ipo_details?: {
    pricing?: {
      price_range_low?: number;
      price_range_high?: number;
      shares_offered?: number;
      over_allotment?: number;
      expected_proceeds?: number;
    };
    underwriters?: Array<{
      name: string;
      role: string;
      shares?: number;
    }>;
    exchange?: string;
    ticker_symbol?: string;
    use_of_proceeds?: Array<{
      category: string;
      amount?: number;
      percentage: number;
      description?: string;
    }>;
    notable_investors?: string[]; // 简化版：只列出知名投资机构名称
  };
  
  company_overview?: string;
  business_description?: string;
  
  financial_summary?: {
    revenue?: Array<{ year: string; amount: number }>;
    net_income?: Array<{ year: string; amount: number }>;
    gross_margin?: number;
    operating_margin?: number;
    revenue_growth_rate?: number;
  };
  
  risk_categories?: {
    business_risks?: string[];
    market_risks?: string[];
    regulatory_risks?: string[];
    financial_risks?: string[];
  };
  
  growth_path_analysis?: string; // GPT
  competitive_moat_analysis?: string; // GPT
  
  [key: string]: any;
}

interface IPOS1DetailProps {
  filing: FilingDetail;
}

const IPOS1Detail: React.FC<IPOS1DetailProps> = ({ filing }) => {
  const formatCurrency = (value: number | undefined, compact: boolean = true) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: compact ? 'compact' : 'standard',
      maximumFractionDigits: compact ? 1 : 0,
    }).format(value);
  };

  const formatShares = (value: number | undefined) => {
    if (!value) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1,
    }).format(value) + ' shares';
  };

  // Calculate total proceeds
  const calculateProceeds = () => {
    const pricing = filing.ipo_details?.pricing;
    if (!pricing) return undefined;
    
    const avgPrice = pricing.price_range_low && pricing.price_range_high
      ? (pricing.price_range_low + pricing.price_range_high) / 2
      : undefined;
    
    const totalShares = (pricing.shares_offered || 0) + (pricing.over_allotment || 0);
    
    return avgPrice && totalShares ? avgPrice * totalShares : pricing.expected_proceeds;
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* S-1 Header */}
      <View style={[styles.header, { backgroundColor: orangeColor }]}>
        <View style={styles.headerIcon}>
          <Icon name="rocket-launch" size={32} color={colors.white} />
        </View>
        <Text style={styles.headerTitle}>IPO Registration (S-1)</Text>
        <Text style={styles.headerSubtitle}>Initial Public Offering</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>GOING PUBLIC</Text>
        </View>
      </View>

      {/* 1. IPO 基本信息卡 */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="local-offer" size={24} color={orangeColor} />
          <Text style={styles.sectionTitle}>IPO Overview</Text>
        </View>
        
        <View style={styles.ipoHighlights}>
          {/* Price Range */}
          {filing.ipo_details?.pricing && (
            <View style={styles.highlightCard}>
              <Icon name="attach-money" size={20} color={orangeColor} />
              <Text style={styles.highlightLabel}>Price Range</Text>
              <Text style={styles.highlightValue}>
                ${filing.ipo_details.pricing.price_range_low || 'TBD'} - 
                ${filing.ipo_details.pricing.price_range_high || 'TBD'}
              </Text>
            </View>
          )}
          
          {/* Shares Offered */}
          <View style={styles.highlightCard}>
            <Icon name="confirmation-number" size={20} color={orangeColor} />
            <Text style={styles.highlightLabel}>Shares Offered</Text>
            <Text style={styles.highlightValue}>
              {formatShares(filing.ipo_details?.pricing?.shares_offered)}
            </Text>
          </View>
          
          {/* Expected Proceeds */}
          <View style={styles.highlightCard}>
            <Icon name="account-balance" size={20} color={orangeColor} />
            <Text style={styles.highlightLabel}>Expected Proceeds</Text>
            <Text style={styles.highlightValue}>
              {formatCurrency(calculateProceeds())}
            </Text>
          </View>
          
          {/* Exchange & Ticker */}
          {filing.ipo_details?.ticker_symbol && (
            <View style={styles.highlightCard}>
              <Icon name="business" size={20} color={orangeColor} />
              <Text style={styles.highlightLabel}>Exchange / Ticker</Text>
              <Text style={styles.highlightValue}>
                {filing.ipo_details.exchange || 'NYSE'} : {filing.ipo_details.ticker_symbol}
              </Text>
            </View>
          )}
        </View>
        
        {/* Underwriters */}
        {filing.ipo_details?.underwriters && filing.ipo_details.underwriters.length > 0 && (
          <View style={styles.underwritersSection}>
            <Text style={styles.underwritersTitle}>Lead Underwriters</Text>
            <View style={styles.underwritersList}>
              {filing.ipo_details.underwriters.slice(0, 3).map((underwriter, index) => (
                <View key={index} style={styles.underwriterItem}>
                  <Text style={styles.underwriterName}>{underwriter.name}</Text>
                  <Text style={styles.underwriterRole}>{underwriter.role}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>

      {/* 2. 公司业务简述卡 */}
      {(filing.company_overview || filing.business_description) && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="business-center" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Business Overview</Text>
          </View>
          
          <Text style={styles.businessDescription}>
            {filing.company_overview || filing.business_description}
          </Text>
        </View>
      )}

      {/* 3. 募资金额与用途分布 */}
      {filing.ipo_details?.use_of_proceeds && filing.ipo_details.use_of_proceeds.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="pie-chart" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Use of Proceeds</Text>
          </View>
          
          <View style={styles.proceedsList}>
            {filing.ipo_details.use_of_proceeds.map((item, index) => (
              <View key={index} style={styles.proceedItem}>
                <View style={styles.proceedHeader}>
                  <Text style={styles.proceedCategory}>{item.category}</Text>
                  <Text style={styles.proceedPercentage}>{item.percentage}%</Text>
                </View>
                <View style={styles.proceedBar}>
                  <View 
                    style={[
                      styles.proceedFill,
                      { 
                        width: `${item.percentage}%`,
                        backgroundColor: orangeColor + (255 - item.percentage * 2.55).toString(16).padStart(2, '0'),
                      }
                    ]} 
                  />
                </View>
                {item.description && (
                  <Text style={styles.proceedDescription}>{item.description}</Text>
                )}
                {item.amount && (
                  <Text style={styles.proceedAmount}>{formatCurrency(item.amount)}</Text>
                )}
              </View>
            ))}
          </View>
        </View>
      )}

      {/* 4. 财务摘要卡 */}
      {filing.financial_summary && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="show-chart" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Financial Summary</Text>
          </View>
          
          {/* Revenue Trend */}
          {filing.financial_summary.revenue && filing.financial_summary.revenue.length > 0 && (
            <View style={styles.financialCard}>
              <Text style={styles.financialCardTitle}>Revenue Trend</Text>
              <View style={styles.revenueChart}>
                {filing.financial_summary.revenue.map((item, index) => (
                  <View key={index} style={styles.revenueItem}>
                    <Text style={styles.revenueYear}>{item.year}</Text>
                    <Text style={styles.revenueAmount}>{formatCurrency(item.amount)}</Text>
                  </View>
                ))}
              </View>
              {filing.financial_summary.revenue_growth_rate && (
                <View style={styles.growthIndicator}>
                  <Icon name="trending-up" size={16} color={colors.success} />
                  <Text style={styles.growthText}>
                    {filing.financial_summary.revenue_growth_rate}% CAGR
                  </Text>
                </View>
              )}
            </View>
          )}
          
          {/* Key Metrics */}
          <View style={styles.metricsGrid}>
            {filing.financial_summary.gross_margin && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Gross Margin</Text>
                <Text style={styles.metricValue}>
                  {(filing.financial_summary.gross_margin * 100).toFixed(1)}%
                </Text>
              </View>
            )}
            {filing.financial_summary.operating_margin && (
              <View style={styles.metricItem}>
                <Text style={styles.metricLabel}>Operating Margin</Text>
                <Text style={[
                  styles.metricValue,
                  { color: filing.financial_summary.operating_margin < 0 ? colors.error : colors.text }
                ]}>
                  {(filing.financial_summary.operating_margin * 100).toFixed(1)}%
                </Text>
              </View>
            )}
          </View>
        </View>
      )}

      {/* 5. 风险分类卡 */}
      {filing.risk_categories && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="warning" size={24} color={colors.error} />
            <Text style={styles.sectionTitle}>Risk Factors</Text>
          </View>
          
          <View style={styles.riskCategories}>
            {filing.risk_categories.business_risks && filing.risk_categories.business_risks.length > 0 && (
              <View style={styles.riskCategory}>
                <View style={styles.riskCategoryHeader}>
                  <Icon name="business" size={20} color={colors.error} />
                  <Text style={styles.riskCategoryTitle}>Business Risks</Text>
                </View>
                {filing.risk_categories.business_risks.slice(0, 2).map((risk, index) => (
                  <Text key={index} style={styles.riskItem}>• {risk}</Text>
                ))}
              </View>
            )}
            
            {filing.risk_categories.market_risks && filing.risk_categories.market_risks.length > 0 && (
              <View style={styles.riskCategory}>
                <View style={styles.riskCategoryHeader}>
                  <Icon name="trending-down" size={20} color={colors.error} />
                  <Text style={styles.riskCategoryTitle}>Market Risks</Text>
                </View>
                {filing.risk_categories.market_risks.slice(0, 2).map((risk, index) => (
                  <Text key={index} style={styles.riskItem}>• {risk}</Text>
                ))}
              </View>
            )}
            
            {filing.risk_categories.regulatory_risks && filing.risk_categories.regulatory_risks.length > 0 && (
              <View style={styles.riskCategory}>
                <View style={styles.riskCategoryHeader}>
                  <Icon name="gavel" size={20} color={colors.error} />
                  <Text style={styles.riskCategoryTitle}>Regulatory Risks</Text>
                </View>
                {filing.risk_categories.regulatory_risks.slice(0, 2).map((risk, index) => (
                  <Text key={index} style={styles.riskItem}>• {risk}</Text>
                ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* 6. GPT: 成长路径解读 */}
      {filing.growth_path_analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="timeline" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Growth Path Analysis</Text>
            <View style={styles.gptBadge}>
              <Text style={styles.gptBadgeText}>AI</Text>
            </View>
          </View>
          
          <Text style={styles.analysisText}>{filing.growth_path_analysis}</Text>
        </View>
      )}

      {/* 7. GPT: 护城河分析 */}
      {filing.competitive_moat_analysis && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="security" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Competitive Moat Analysis</Text>
            <View style={styles.gptBadge}>
              <Text style={styles.gptBadgeText}>AI</Text>
            </View>
          </View>
          
          <View style={styles.moatCard}>
            <Text style={styles.analysisText}>{filing.competitive_moat_analysis}</Text>
          </View>
        </View>
      )}

      {/* 8. 资本背书 - 极简版 */}
      {filing.ipo_details?.notable_investors && filing.ipo_details.notable_investors.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="verified" size={24} color={orangeColor} />
            <Text style={styles.sectionTitle}>Notable Investors</Text>
          </View>
          
          <View style={styles.investorBackingCard}>
            <Text style={styles.notableInvestorsList}>
              {filing.ipo_details.notable_investors.join(' • ')}
            </Text>
          </View>
        </View>
      )}

      {/* Footer with SEC Link */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.secButton, { backgroundColor: orangeColor }]}
          onPress={() => filing.file_url && Linking.openURL(filing.file_url)}
        >
          <Icon name="launch" size={20} color={colors.white} />
          <Text style={styles.secButtonText}>View Full S-1 Filing</Text>
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
  statusBadge: {
    backgroundColor: colors.white + '20',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.xl,
    marginTop: spacing.sm,
  },
  statusText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
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
    backgroundColor: orangeColor,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  gptBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
  },
  
  // IPO Highlights
  ipoHighlights: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -spacing.xs,
  },
  highlightCard: {
    width: '50%',
    padding: spacing.xs,
    marginBottom: spacing.sm,
  },
  highlightLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  highlightValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  
  // Underwriters
  underwritersSection: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  underwritersTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  underwritersList: {
    gap: spacing.sm,
  },
  underwriterItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  underwriterName: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  underwriterRole: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  
  // Business Description
  businessDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  
  // Use of Proceeds
  proceedsList: {
    gap: spacing.md,
  },
  proceedItem: {
    marginBottom: spacing.md,
  },
  proceedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  proceedCategory: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
  },
  proceedPercentage: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: orangeColor,
  },
  proceedBar: {
    height: 8,
    backgroundColor: colors.background,
    borderRadius: 4,
    overflow: 'hidden',
  },
  proceedFill: {
    height: '100%',
    borderRadius: 4,
  },
  proceedDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  proceedAmount: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    marginTop: spacing.xs,
  },
  
  // Financial Summary
  financialCard: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  financialCardTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginBottom: spacing.md,
  },
  revenueChart: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  revenueItem: {
    alignItems: 'center',
  },
  revenueYear: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  revenueAmount: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  growthIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  growthText: {
    fontSize: typography.fontSize.sm,
    color: colors.success,
    fontWeight: typography.fontWeight.medium,
    marginLeft: spacing.xs,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metricItem: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  metricValue: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginTop: spacing.xs,
  },
  
  // Risk Categories
  riskCategories: {
    gap: spacing.md,
  },
  riskCategory: {
    backgroundColor: colors.error + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
  },
  riskCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  riskCategoryTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.error,
    marginLeft: spacing.sm,
  },
  riskItem: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    lineHeight: 20,
    marginBottom: spacing.xs,
    paddingLeft: spacing.sm,
  },
  
  // Analysis
  analysisText: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    lineHeight: 24,
  },
  moatCard: {
    backgroundColor: orangeColor + '10',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: orangeColor + '30',
  },
  
  // Investor Backing Styles (Ultra Simplified)
  investorBackingCard: {
    backgroundColor: colors.background,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
  },
  notableInvestorsList: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.text,
    textAlign: 'center',
    lineHeight: 26,
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

export default IPOS1Detail;