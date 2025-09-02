// src/components/filing-details/CompanyInfoCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { CompanyInfo } from '../../types';

// 🔥 设备自适应字体大小计算
const { width: screenWidth } = Dimensions.get('window');
const isTablet = screenWidth > 768;
const isSmallPhone = screenWidth < 375;

const getAdaptiveSize = (baseSize: number) => {
  if (isTablet) return baseSize * 1.2;
  if (isSmallPhone) return baseSize * 0.9;
  return baseSize;
};

const adaptiveSizes = {
  ticker: getAdaptiveSize(24),
  companyName: getAdaptiveSize(14),
  financialValue: getAdaptiveSize(20),
  financialLabel: getAdaptiveSize(12),
  infoLabel: getAdaptiveSize(12),
  infoValue: getAdaptiveSize(13),
  badge: getAdaptiveSize(10),
};

interface CompanyInfoCardProps {
  company?: CompanyInfo;
  filingType: string;
  filingDate: string;
  accessionNumber: string;
}

const CompanyInfoCard: React.FC<CompanyInfoCardProps> = ({ 
  company, 
  filingType,
  filingDate,
  accessionNumber
}) => {
  // Helper function to format employee count
  const formatEmployees = (count: number): string => {
    if (count < 1000) return count.toString();
    if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
    if (count < 1000000) return `${Math.round(count / 1000)}K`;
    return `${(count / 1000000).toFixed(1)}M`;
  };

  // 如果没有公司信息，返回基础卡片
  if (!company) {
    return (
      <View style={styles.card}>
        <View style={styles.basicInfo}>
          <Text style={styles.basicLabel}>Filing Type:</Text>
          <Text style={styles.basicValue}>{filingType}</Text>
        </View>
        <View style={styles.basicInfo}>
          <Text style={styles.basicLabel}>Filed:</Text>
          <Text style={styles.basicValue}>{new Date(filingDate).toLocaleDateString()}</Text>
        </View>
      </View>
    );
  }

  // 判断是否为S-1/IPO公司（数据可能不完整）
  const isIPO = filingType === 'S-1' || company.has_s1_filing;
  const hasFullData = company.sector && company.industry && company.headquarters;

  // S-1/IPO公司 - 显示基础信息
  if (isIPO && !hasFullData) {
    return (
      <View style={[styles.card, styles.ipoCard]}>
        <View style={styles.companyIdentitySection}>
          <View style={styles.companyBasic}>
            <Text style={styles.ticker}>{company.ticker}</Text>
            <Text style={styles.companyName}>{company.name}</Text>
          </View>
          <View style={styles.ipoBadge}>
            <Icon name="rocket-launch" size={16} color={colors.filingS1} />
            <Text style={styles.ipoBadgeText}>Pre-IPO</Text>
          </View>
        </View>
        
        <View style={styles.metaGrid}>
          <View style={styles.metaItem}>
            <Icon name="fingerprint" size={14} color={colors.textSecondary} />
            <Text style={styles.metaLabel}>CIK</Text>
            <Text style={styles.metaValue}>{company.cik}</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="description" size={14} color={colors.textSecondary} />
            <Text style={styles.metaLabel}>Filing</Text>
            <Text style={styles.metaValue}>S-1 Registration</Text>
          </View>
          <View style={styles.metaItem}>
            <Icon name="calendar-today" size={14} color={colors.textSecondary} />
            <Text style={styles.metaLabel}>Filed</Text>
            <Text style={styles.metaValue}>{new Date(filingDate).toLocaleDateString()}</Text>
          </View>
        </View>
      </View>
    );
  }

  // 成熟公司 - 显示完整信息（统一纵向排列设计）
  return (
    <View style={styles.card}>
      {/* 公司身份区域 */}
      <View style={styles.companyIdentitySection}>
        <View style={styles.companyBasic}>
          <Text style={styles.ticker}>{company.ticker}</Text>
          <Text style={styles.companyName}>{company.name}</Text>
        </View>
        <View style={styles.indices}>
          {company.is_sp500 && (
            <View style={[styles.indexBadge, styles.sp500Badge]}>
              <Text style={styles.indexBadgeText}>S&P 500</Text>
            </View>
          )}
          {company.is_nasdaq100 && (
            <View style={[styles.indexBadge, styles.nasdaq100Badge]}>
              <Text style={styles.indexBadgeText}>NASDAQ 100</Text>
            </View>
          )}
        </View>
      </View>

      {/* 所有数据项统一纵向排列 */}
      <View style={styles.dataSection}>
        {/* 市值 */}
        {company.market_cap_formatted && (
          <View style={styles.dataRow}>
            <Icon name="account-balance" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Market Cap</Text>
            <Text style={styles.dataValue}>{company.market_cap_formatted}</Text>
          </View>
        )}
        
        {/* PE比率 */}
        {company.pe_ratio_formatted && (
          <View style={styles.dataRow}>
            <Icon name="trending-up" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>P/E Ratio</Text>
            <Text style={styles.dataValue}>{company.pe_ratio_formatted}</Text>
          </View>
        )}
        
        {/* 行业信息 */}
        {company.sector && (
          <View style={styles.dataRow}>
            <Icon name="business" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Sector</Text>
            <Text style={styles.dataValue}>{company.sector}</Text>
          </View>
        )}
        
        {company.industry && (
          <View style={styles.dataRow}>
            <Icon name="category" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Industry</Text>
            <Text style={styles.dataValue} numberOfLines={1}>{company.industry}</Text>
          </View>
        )}
        
        {/* 地理信息 */}
        {company.headquarters && (
          <View style={styles.dataRow}>
            <Icon name="location-city" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Headquarters</Text>
            <Text style={styles.dataValue}>{company.headquarters}</Text>
          </View>
        )}
        
        {/* 员工信息 */}
        {company.employees && (
          <View style={styles.dataRow}>
            <Icon name="groups" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Employees</Text>
            <Text style={styles.dataValue}>
              {company.employee_size || formatEmployees(company.employees)}
            </Text>
          </View>
        )}
        
        {/* 其他信息 */}
        {company.founded_year && (
          <View style={styles.dataRow}>
            <Icon name="event-note" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Founded</Text>
            <Text style={styles.dataValue}>{company.founded_year}</Text>
          </View>
        )}
        
        {company.exchange && (
          <View style={styles.dataRow}>
            <Icon name="show-chart" size={16} color={colors.textSecondary} />
            <Text style={styles.dataLabel}>Exchange</Text>
            <Text style={styles.dataValue}>{company.exchange}</Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
    borderWidth: 1,
    borderColor: '#F3F4F6',
  },
  ipoCard: {
    borderWidth: 1,
    borderColor: '#F59E0B',
    backgroundColor: '#FFFBEB',
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  
  // 统一数据项样式
  
  // 公司身份区域
  companyIdentitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  companyBasic: {
    flex: 1,
  },
  ticker: {
    fontSize: adaptiveSizes.ticker,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  companyName: {
    fontSize: adaptiveSizes.companyName,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: adaptiveSizes.companyName * 1.3,
  },
  indices: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  indexBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  sp500Badge: {
    backgroundColor: '#1e40af',
  },
  nasdaq100Badge: {
    backgroundColor: '#0891b2',
  },
  indexBadgeText: {
    color: colors.white,
    fontSize: adaptiveSizes.badge,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.3,
  },
  
  // 统一的数据区域
  dataSection: {
    gap: spacing.sm, // 统一间距
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  dataLabel: {
    fontSize: adaptiveSizes.infoLabel,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    minWidth: isSmallPhone ? 80 : 100, // 确保标签对齐
  },
  dataValue: {
    fontSize: adaptiveSizes.infoValue,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  
  // IPO相关样式
  ipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.filingS1 + '15',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.filingS1 + '30',
  },
  ipoBadgeText: {
    color: colors.filingS1,
    fontSize: adaptiveSizes.badge,
    fontWeight: typography.fontWeight.bold,
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  metaLabel: {
    fontSize: adaptiveSizes.infoLabel,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  metaValue: {
    fontSize: adaptiveSizes.infoValue,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
    backgroundColor: '#F8FAFC',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  basicLabel: {
    fontSize: adaptiveSizes.infoLabel,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  basicValue: {
    fontSize: adaptiveSizes.infoValue,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default CompanyInfoCard;