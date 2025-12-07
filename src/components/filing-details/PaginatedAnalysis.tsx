// src/components/filing-details/PaginatedAnalysis.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Platform,
  Animated,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { colors, typography, spacing, borderRadius } from '../../theme';
import { parseUnifiedAnalysis } from '../../utils/textHelpers';

interface PaginatedAnalysisProps {
  pages: string[];  // 分页后的文本数组
}

const PaginatedAnalysis: React.FC<PaginatedAnalysisProps> = ({ pages }) => {
  const [currentPage, setCurrentPage] = useState(0);
  
  // 🆕 动画值
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  
  // 如果只有一页，不显示分页功能
  const isSinglePage = pages.length <= 1;
  
  // 🆕 带动画的页面切换
  const animatePageChange = (newPage: number) => {
    // 确定滑动方向
    const direction = newPage > currentPage ? -1 : 1;
    
    // 淡出 + 滑动
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction * 30, // 向左或向右滑动30px
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // 切换页面
      setCurrentPage(newPage);
      
      // 重置位置
      slideAnim.setValue(direction * -30);
      
      // 淡入 + 滑回
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };
  
  // 上一页
  const goToPreviousPage = () => {
    if (currentPage > 0) {
      animatePageChange(currentPage - 1);
    }
  };
  
  // 下一页
  const goToNextPage = () => {
    if (currentPage < pages.length - 1) {
      animatePageChange(currentPage + 1);
    }
  };
  
  // 跳转到指定页
  const goToPage = (pageIndex: number) => {
    if (pageIndex !== currentPage) {
      animatePageChange(pageIndex);
    }
  };
  
  // 渲染页码指示器（带左右箭头）
  const renderPageIndicator = () => {
    if (isSinglePage) return null;
    
    return (
      <View style={styles.pageIndicatorContainer}>
        {/* 左箭头 */}
        <TouchableOpacity
          style={[styles.navButton, currentPage === 0 && styles.navButtonDisabled]}
          onPress={goToPreviousPage}
          activeOpacity={0.7}
          disabled={currentPage === 0}
        >
          <Icon 
            name="chevron-left" 
            size={24} 
            color={currentPage === 0 ? colors.textSecondary + '40' : colors.primary} 
          />
        </TouchableOpacity>
        
        {/* 页码指示器 */}
        <View style={styles.pageIndicatorCenter}>
          <View style={styles.pageIndicator}>
            {pages.map((_, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => goToPage(index)}
                style={[
                  styles.dot,
                  index === currentPage && styles.dotActive,
                ]}
              />
            ))}
          </View>
          <Text style={styles.pageText}>
            Page {currentPage + 1} of {pages.length}
          </Text>
        </View>
        
        {/* 右箭头 */}
        <TouchableOpacity
          style={[styles.navButton, currentPage === pages.length - 1 && styles.navButtonDisabled]}
          onPress={goToNextPage}
          activeOpacity={0.7}
          disabled={currentPage === pages.length - 1}
        >
          <Icon 
            name="chevron-right" 
            size={24} 
            color={currentPage === pages.length - 1 ? colors.textSecondary + '40' : colors.primary} 
          />
        </TouchableOpacity>
      </View>
    );
  };
  
  // 🆕 渲染当前页内容（带动画）
  const renderPageContent = () => {
    const pageText = pages[currentPage] || '';
    const elements = parseUnifiedAnalysis(pageText);
    
    return (
      <Animated.View
        style={[
          styles.animatedContentWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          },
        ]}
      >
        <ScrollView
          style={styles.pageContent}
          showsVerticalScrollIndicator={true}
          contentContainerStyle={styles.pageContentInner}
        >
          {elements}
        </ScrollView>
      </Animated.View>
    );
  };
  
  return (
    <View style={styles.outerContainer}>
      {/* 🆕 纸张卡片容器（铺满宽度） */}
      <View style={styles.paperContainer}>
        {/* 页面内容 */}
        <View style={styles.pageWrapper}>
          {renderPageContent()}
        </View>
        
        {/* 🆕 页码指示器 + 左右箭头 */}
        {renderPageIndicator()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  // 🆕 外层容器（不再使用 flexDirection: row）
  outerContainer: {
    marginVertical: spacing.md,
  },
  
  // 🆕 纸张卡片效果（铺满宽度）
  paperContainer: {
    flex: 1,
    backgroundColor: colors.white,
    marginHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.gray200 || '#E5E7EB',
    ...Platform.select({
      ios: {
        shadowColor: colors.black,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: {
        elevation: 4,
      },
      web: {
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.06)',
      } as any,
    }),
  },
  
  pageWrapper: {
    flex: 1,
  },
  
  // 🆕 动画包装器
  animatedContentWrapper: {
    flex: 1,
  },
  
  pageContent: {
    flex: 1,
  },
  
  pageContentInner: {
    padding: spacing.xl,  // 🆕 增大内边距，让内容更充实
    paddingBottom: spacing.xl,
  },
  
  // 🆕 页码指示器（包含左右箭头）
  pageIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.gray50 || colors.backgroundSecondary,
    borderBottomLeftRadius: borderRadius.lg,
    borderBottomRightRadius: borderRadius.lg,
  },
  
  // 🆕 页码中央区域
  pageIndicatorCenter: {
    flex: 1,
    alignItems: 'center',
  },
  
  pageIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.textSecondary + '40',
    marginHorizontal: 4,
  },
  
  dotActive: {
    width: 24,
    backgroundColor: colors.primary,
  },
  
  pageText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    fontFamily: typography.fontFamily.serif,
  },
  
  // 🆕 导航按钮（在底部页码两侧）
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.primary,
    ...Platform.select({
      web: {
        cursor: 'pointer',
      } as any,
    }),
  },
  
  navButtonDisabled: {
    borderColor: colors.textSecondary + '20',
    opacity: 0.5,
    ...Platform.select({
      web: {
        cursor: 'not-allowed',
      } as any,
    }),
  },
});

export default PaginatedAnalysis;