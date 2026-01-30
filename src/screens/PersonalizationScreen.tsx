// src/screens/PersonalizationScreen.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { AppDispatch } from '../store';
import { completeOnboarding } from '../store/slices/authSlice';
import themeConfig from '../theme';

const { colors, typography, spacing, borderRadius } = themeConfig;
const { width } = Dimensions.get('window');

// ==================== 调查问题配置 ====================
const SURVEY_STEPS = [
  {
    id: 'user_type',
    step: 1,
    title: 'How would you describe yourself?',
    subtitle: 'Select one that best fits:',
    multiSelect: false,
    options: [
      { id: 'individual_investor', label: 'Individual investor' },
      { id: 'active_trader', label: 'Active trader (day/swing)' },
      { id: 'financial_professional', label: 'Financial professional' },
      { id: 'student_learner', label: 'Student & learner' },
      { id: 'curious_observer', label: 'Curious observer' },
    ],
  },
  {
    id: 'sectors',
    step: 2,
    title: 'Which sectors interest you most?',
    subtitle: 'Select all that apply:',
    multiSelect: true,
    options: [
      // GICS Sector Classification - 缩短标签
      { id: 'technology', label: 'Technology' },
      { id: 'software', label: 'Software/Cloud' },
      { id: 'semiconductors', label: 'Semiconductors' },
      { id: 'ai_ml', label: 'AI/ML' },
      { id: 'healthcare', label: 'Healthcare' },
      { id: 'pharmaceuticals', label: 'Pharma' },
      { id: 'financials', label: 'Financials' },
      { id: 'fintech', label: 'Fintech' },
      { id: 'consumer_discretionary', label: 'Consumer' },
      { id: 'consumer_staples', label: 'Staples' },
      { id: 'retail_ecommerce', label: 'Retail/E-com' },
      { id: 'communication_services', label: 'Telecom' },
      { id: 'media_entertainment', label: 'Media' },
      { id: 'industrials', label: 'Industrials' },
      { id: 'aerospace_defense', label: 'Aerospace' },
      { id: 'energy', label: 'Energy' },
      { id: 'clean_energy', label: 'Clean Energy' },
      { id: 'utilities', label: 'Utilities' },
      { id: 'real_estate', label: 'Real Estate' },
      { id: 'materials', label: 'Materials' },
      { id: 'ipo_spac', label: 'IPOs/SPACs' },
    ],
  },
  {
    id: 'info_types',
    step: 3,
    title: 'What information matters most?',
    subtitle: 'Select all that apply:',
    multiSelect: true,
    options: [
      { id: 'earnings', label: 'Earnings & financial results' },
      { id: 'corporate_events', label: 'Corporate events & filings' },
      { id: 'ipos', label: 'IPOs & new public companies' },
      { id: 'market_news', label: 'Market-moving news' },
    ],
  },
];

const TOTAL_STEPS = SURVEY_STEPS.length;

// ==================== 组件 ====================
export default function PersonalizationScreen() {
  const dispatch = useDispatch<AppDispatch>();
  const [currentStep, setCurrentStep] = useState(0);
  const [responses, setResponses] = useState<Record<string, string[]>>({
    user_type: [],
    sectors: [],
    info_types: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentSurvey = SURVEY_STEPS[currentStep];

  // 处理选项选择
  const handleOptionSelect = (optionId: string) => {
    const questionId = currentSurvey.id;
    const isMultiSelect = currentSurvey.multiSelect;

    setResponses((prev) => {
      const currentSelections = prev[questionId] || [];

      if (isMultiSelect) {
        // 多选：切换选中状态
        if (currentSelections.includes(optionId)) {
          return {
            ...prev,
            [questionId]: currentSelections.filter((id) => id !== optionId),
          };
        } else {
          return {
            ...prev,
            [questionId]: [...currentSelections, optionId],
          };
        }
      } else {
        // 单选：替换
        return {
          ...prev,
          [questionId]: [optionId],
        };
      }
    });
  };

  // 检查选项是否被选中
  const isOptionSelected = (optionId: string) => {
    return responses[currentSurvey.id]?.includes(optionId) || false;
  };

  // 下一步
  const handleNext = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // 最后一步，提交
      handleSubmit(false);
    }
  };

  // 返回上一步
  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // 跳过当前问题
  const handleSkip = () => {
    if (currentStep < TOTAL_STEPS - 1) {
      // 跳过当前问题，进入下一个
      setCurrentStep(currentStep + 1);
    } else {
      // 最后一步，跳过并完成
      handleSubmit(true);
    }
  };

  // 提交
  const handleSubmit = async (skipped: boolean) => {
    setIsSubmitting(true);
    try {
      await dispatch(
        completeOnboarding({
          responses: skipped ? {} : responses,
          skipped,
        })
      ).unwrap();
      console.log('Onboarding completed:', skipped ? 'skipped' : responses);
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 当前步骤是否有选择
  const hasSelection = (responses[currentSurvey.id]?.length || 0) > 0;

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FFFFFF', '#FEF3C7', '#F59E0B']}
        style={styles.gradient}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea} edges={['left', 'right']}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={handleBack}
              disabled={currentStep === 0}
              style={[styles.backButton, currentStep === 0 && styles.backButtonDisabled]}
            >
              <Icon
                name="arrow-back"
                size={24}
                color={currentStep === 0 ? 'transparent' : '#000'}
              />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSkip} disabled={isSubmitting}>
              <Text style={styles.skipText}>SKIP</Text>
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>
              {currentStep + 1}/{TOTAL_STEPS}
            </Text>
          </View>

          {/* Question */}
          <View style={styles.questionContainer}>
            <Text style={styles.questionTitle}>{currentSurvey.title}</Text>
            <Text style={styles.questionSubtitle}>{currentSurvey.subtitle}</Text>
          </View>

          {/* Options - Scrollable */}
          <ScrollView
            style={styles.optionsScrollView}
            contentContainerStyle={styles.optionsContainer}
            showsVerticalScrollIndicator={true}
            bounces={true}
            nestedScrollEnabled={true}
          >
            {currentSurvey.id === 'sectors' ? (
              // 板块选项：标签式镶嵌排列
              <View style={styles.tagsContainer}>
                {currentSurvey.options.map((option) => {
                  const selected = isOptionSelected(option.id);
                  return (
                    <TouchableOpacity
                      key={option.id}
                      style={[styles.tagButton, selected && styles.tagButtonSelected]}
                      onPress={() => handleOptionSelect(option.id)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.tagText, selected && styles.tagTextSelected]}>
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              // 其他选项：列表式排列
              currentSurvey.options.map((option) => {
                const selected = isOptionSelected(option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[styles.optionButton, selected && styles.optionButtonSelected]}
                    onPress={() => handleOptionSelect(option.id)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>

          {/* Bottom section - Fixed */}
          <View style={styles.bottomContainer}>
            {/* Next/Finish button */}
            <TouchableOpacity
              style={[
                styles.nextButton,
                !hasSelection && styles.nextButtonDisabled,
              ]}
              onPress={handleNext}
              disabled={!hasSelection || isSubmitting}
              activeOpacity={0.8}
            >
              <Text style={styles.nextButtonText}>
                {isSubmitting
                  ? 'Saving...'
                  : currentStep === TOTAL_STEPS - 1
                  ? 'Finish'
                  : 'Next'}
              </Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

// ==================== 样式 ====================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backButtonDisabled: {
    opacity: 0,
  },
  skipText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
    color: '#000',
    letterSpacing: 1,
  },

  // Progress
  progressContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },

  // Question
  questionContainer: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  questionTitle: {
    fontSize: 32,
    fontFamily: 'Futura',
    fontWeight: '500',
    color: '#000',
    marginBottom: spacing.xs,
    lineHeight: 40,
  },
  questionSubtitle: {
    fontSize: typography.fontSize.sm,
    color: '#666',
  },

  // Options - 列表式
  optionsScrollView: {
    flex: 1,
  },
  optionsContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  optionButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  optionButtonSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
  },
  optionText: {
    fontSize: typography.fontSize.base,
    color: '#333',
    fontWeight: typography.fontWeight.medium,
  },
  optionTextSelected: {
    color: '#000',
    fontWeight: typography.fontWeight.semibold,
  },

  // Options - 标签式镶嵌排列
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  tagButtonSelected: {
    borderColor: '#F59E0B',
    backgroundColor: 'rgba(254, 243, 199, 0.9)',
  },
  tagText: {
    fontSize: typography.fontSize.sm,
    color: '#333',
    fontWeight: typography.fontWeight.medium,
  },
  tagTextSelected: {
    color: '#000',
    fontWeight: typography.fontWeight.semibold,
  },

  // Bottom - Fixed
  bottomContainer: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    paddingBottom: spacing.lg,
  },
  nextButton: {
    backgroundColor: '#F59E0B',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nextButtonDisabled: {
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
  nextButtonText: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.bold,
    color: '#fff',
  },
});