// src/utils/animations.ts
import React from 'react';
import { Animated, Easing } from 'react-native';
import themeConfig from '../theme';

const { animation: animationDurations } = themeConfig;

// Animation configurations
export const animationConfig = {
  // Spring animations for natural feel
  spring: {
    tension: 40,
    friction: 7,
    useNativeDriver: true,
  },
  
  // Timing animations for precise control
  timing: {
    duration: animationDurations.normal,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  },
  
  // Fast timing for quick transitions
  timingFast: {
    duration: animationDurations.fast,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  },
  
  // Slow timing for emphasis
  timingSlow: {
    duration: animationDurations.slow,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  },
};

// Common animation patterns
export const animations = {
  // Fade in animation
  fadeIn: (animatedValue: Animated.Value, config = {}) => {
    return Animated.timing(animatedValue, {
      toValue: 1,
      ...animationConfig.timing,
      ...config,
    });
  },
  
  // Fade out animation
  fadeOut: (animatedValue: Animated.Value, config = {}) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      ...animationConfig.timing,
      ...config,
    });
  },
  
  // Scale animation
  scale: (animatedValue: Animated.Value, toValue: number, config = {}) => {
    return Animated.spring(animatedValue, {
      toValue,
      ...animationConfig.spring,
      ...config,
    });
  },
  
  // Slide in from right
  slideInRight: (animatedValue: Animated.Value, config = {}) => {
    return Animated.spring(animatedValue, {
      toValue: 0,
      ...animationConfig.spring,
      ...config,
    });
  },
  
  // Slide in from bottom
  slideInBottom: (animatedValue: Animated.Value, config = {}) => {
    return Animated.timing(animatedValue, {
      toValue: 0,
      ...animationConfig.timing,
      ...config,
    });
  },
  
  // Bounce animation
  bounce: (animatedValue: Animated.Value, config = {}) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 1.2,
        duration: animationDurations.fast,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.spring(animatedValue, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
        ...config,
      }),
    ]);
  },
  
  // Shake animation for errors
  shake: (animatedValue: Animated.Value) => {
    return Animated.sequence([
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: -10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 10,
        duration: 50,
        useNativeDriver: true,
      }),
      Animated.timing(animatedValue, {
        toValue: 0,
        duration: 50,
        useNativeDriver: true,
      }),
    ]);
  },
};

// Stagger animation helper
export const staggerAnimation = (
  animations: Animated.CompositeAnimation[],
  delay = 50
) => {
  return Animated.stagger(delay, animations);
};

// Parallel animation helper
export const parallelAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.parallel(animations);
};

// Sequence animation helper
export const sequenceAnimation = (animations: Animated.CompositeAnimation[]) => {
  return Animated.sequence(animations);
};

// Hook for fade animation
export const useFadeAnimation = (initialValue = 0, autoStart = false) => {
  const fadeAnim = React.useRef(new Animated.Value(initialValue)).current;
  
  React.useEffect(() => {
    if (autoStart) {
      animations.fadeIn(fadeAnim).start();
    }
  }, [autoStart, fadeAnim]);
  
  return {
    fadeAnim,
    fadeIn: (config?: any) => animations.fadeIn(fadeAnim, config).start(),
    fadeOut: (config?: any) => animations.fadeOut(fadeAnim, config).start(),
  };
};

// Hook for scale animation
export const useScaleAnimation = (initialValue = 1) => {
  const scaleAnim = React.useRef(new Animated.Value(initialValue)).current;
  
  return {
    scaleAnim,
    scaleIn: () => animations.scale(scaleAnim, 1).start(),
    scaleOut: () => animations.scale(scaleAnim, 0).start(),
    scaleTo: (value: number) => animations.scale(scaleAnim, value).start(),
  };
};

// Hook for slide animation
export const useSlideAnimation = (initialValue = 300) => {
  const slideAnim = React.useRef(new Animated.Value(initialValue)).current;
  
  return {
    slideAnim,
    slideIn: () => animations.slideInRight(slideAnim).start(),
    slideOut: () => Animated.timing(slideAnim, {
      toValue: 300,
      ...animationConfig.timing,
    }).start(),
  };
};

// Export animated components factory
export const createAnimatedComponent = (Component: any) => {
  return Animated.createAnimatedComponent(Component);
};