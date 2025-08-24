// src/components/filing-details/CompanyInfoCard.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { CompanyInfo } from '../../types';

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
        <View style={styles.header}>
          <View style={styles.companyBasic}>
            <Text style={styles.ticker}>{company.ticker}</Text>
            <Text style={styles.companyName}>{company.name}</Text>
          </View>
          <View style={styles.ipoBadge}>
            <Icon name="rocket-launch" size={16} color={colors.filingS1} />
            <Text style={styles.ipoBadgeText}>Pre-IPO</Text>
          </View>
        </View>
        
        <View style={styles.divider} />
        
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

  // 成熟公司 - 显示完整信息
  return (
    <View style={styles.card}>
      {/* 公司标题部分 */}
      <View style={styles.header}>
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

      <View style={styles.divider} />

      {/* 公司详细信息网格 */}
      <View style={styles.infoGrid}>
        {/* 第一行：行业信息 */}
        <View style={styles.infoRow}>
          {company.sector && (
            <View style={styles.infoItem}>
              <Icon name="business" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Sector</Text>
              <Text style={styles.infoValue}>{company.sector}</Text>
            </View>
          )}
          {company.industry && (
            <View style={styles.infoItem}>
              <Icon name="category" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Industry</Text>
              <Text style={styles.infoValue} numberOfLines={1}>{company.industry}</Text>
            </View>
          )}
        </View>

        {/* 第二行：位置和规模 */}
        <View style={styles.infoRow}>
          {company.headquarters && (
            <View style={styles.infoItem}>
              <Icon name="location-city" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>HQ</Text>
              <Text style={styles.infoValue}>{company.headquarters}</Text>
            </View>
          )}
          {company.employees && (
            <View style={styles.infoItem}>
              <Icon name="groups" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Employees</Text>
              <Text style={styles.infoValue}>
                {company.employee_size || formatEmployees(company.employees)}
              </Text>
            </View>
          )}
        </View>

        {/* 第三行：其他信息 */}
        <View style={styles.infoRow}>
          {company.founded_year && (
            <View style={styles.infoItem}>
              <Icon name="event-note" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Founded</Text>
              <Text style={styles.infoValue}>{company.founded_year}</Text>
            </View>
          )}
          {company.exchange && (
            <View style={styles.infoItem}>
              <Icon name="show-chart" size={14} color={colors.textSecondary} />
              <Text style={styles.infoLabel}>Exchange</Text>
              <Text style={styles.infoValue}>{company.exchange}</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
};

// Helper function to format employee count
const formatEmployees = (count: number): string => {
  if (count < 1000) return count.toString();
  if (count < 10000) return `${(count / 1000).toFixed(1)}K`;
  if (count < 1000000) return `${Math.round(count / 1000)}K`;
  return `${(count / 1000000).toFixed(1)}M`;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.lg, // 🆕 增大圆角
    // 🆕 增强阴影效果 - 更明显的灰色阴影
    ...Platform.select({
      ios: {
        shadowColor: '#000000', // 使用纯黑色阴影
        shadowOffset: { width: 0, height: 6 }, // 更大的阴影偏移
        shadowOpacity: 0.15, // 增强阴影透明度
        shadowRadius: 12, // 更大的阴影半径
      },
      android: {
        elevation: 8, // 显著增强安卓阴影
      },
    }),
    // 🆕 添加明显边框
    borderWidth: 1.5, // 增加边框宽度
    borderColor: '#E5E7EB', // 明显的灰色边框
  },
  ipoCard: {
    borderWidth: 1.5, // 增加边框宽度
    borderColor: '#F59E0B', // 🆕 更明显的橙色边框（S-1颜色）
    // 🆕 IPO卡片特殊背景和阴影
    backgroundColor: '#FEF3C7', // 淡黄色背景
    ...Platform.select({
      ios: {
        shadowColor: '#F59E0B', // 橙色阴影
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.2,
        shadowRadius: 12,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  companyBasic: {
    flex: 1,
  },
  ticker: {
    fontSize: 26, // 🆕 增大字体
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    letterSpacing: -0.8, // 🆕 调整字间距
  },
  companyName: {
    fontSize: typography.fontSize.md, // 🆕 稍微增大
    color: colors.textSecondary,
    marginTop: 4, // 🆕 增加间距
  },
  indices: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  indexBadge: {
    paddingHorizontal: spacing.md, // 🆕 增大内边距
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.md, // 🆕 增大圆角
    // 🆕 添加明显阴影
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.25, // 更强的阴影
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  sp500Badge: {
    backgroundColor: '#1e40af',
  },
  nasdaq100Badge: {
    backgroundColor: '#0891b2',
  },
  indexBadgeText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold, // 🆕 加粗
    letterSpacing: 0.4, // 🆕 增加字间距
  },
  ipoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.filingS1 + '15', // 🆕 稍微加深背景
    paddingHorizontal: spacing.md, // 🆕 增大内边距
    paddingVertical: spacing.sm, // 🆕 增大内边距
    borderRadius: borderRadius.md, // 🆕 增大圆角
    gap: spacing.xs,
    // 🆕 添加边框
    borderWidth: 1,
    borderColor: colors.filingS1 + '30',
  },
  ipoBadgeText: {
    color: colors.filingS1,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold, // 🆕 加粗
  },
  divider: {
    height: 1.5, // 🆕 增加分割线厚度
    backgroundColor: '#D1D5DB', // 🆕 更明显的灰色分割线
    marginVertical: spacing.lg, // 🆕 增大间距
  },
  infoGrid: {
    gap: spacing.lg, // 🆕 增大间距
  },
  infoRow: {
    flexDirection: 'row',
    gap: spacing.xl, // 🆕 增大间距
  },
  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm, // 🆕 增大间距
    // 🆕 添加明显背景和边框
    backgroundColor: '#F9FAFB', // 明显的浅灰背景
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: '#E5E7EB', // 明显的灰色边框
    // 🆕 添加轻微阴影
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  infoLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    marginLeft: spacing.xs, // 🆕 稍微增加间距
    fontWeight: typography.fontWeight.medium, // 🆕 加粗
  },
  infoValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold, // 🆕 加粗
    flex: 1,
    textAlign: 'right',
  },
  metaGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.sm, // 🆕 添加间距
  },
  metaItem: {
    flex: 1,
    alignItems: 'center',
    gap: spacing.xs,
    // 🆕 添加明显背景和边框
    backgroundColor: '#F3F4F6', // 明显的浅灰背景
    padding: spacing.md, // 增大内边距
    borderRadius: borderRadius.md, // 增大圆角
    borderWidth: 1.5,
    borderColor: '#D1D5DB', // 明显的灰色边框
    // 🆕 添加阴影
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  metaLabel: {
    fontSize: typography.fontSize.xs,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium, // 🆕 加粗
  },
  metaValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold, // 🆕 加粗
    textAlign: 'center',
  },
  basicInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md, // 🆕 增大间距
    // 🆕 添加明显背景和边框
    backgroundColor: '#F3F4F6', // 明显的浅灰背景
    padding: spacing.md, // 增大内边距
    borderRadius: borderRadius.md, // 增大圆角
    borderWidth: 1,
    borderColor: '#D1D5DB', // 明显的灰色边框
  },
  basicLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium, // 🆕 加粗
  },
  basicValue: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold, // 🆕 加粗
  },
});

export default CompanyInfoCard;