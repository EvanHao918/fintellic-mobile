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
  
  // NEW - Very slow for background animations
  timingVerySlow: {
    duration: animationDurations.verySlow,
    easing: Easing.inOut(Easing.ease),
    useNativeDriver: true,
  },
  
  // NEW - Smooth spring for glass effects
  smoothSpring: {
    tension: 50,
    friction: 10,
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
  
  // Pulse animation for emphasis (like button glow)
  pulse: (animatedValue: Animated.Value, config = {}) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1.05,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  },
  
  // Shimmer effect for loading/premium feel
  shimmer: (animatedValue: Animated.Value) => {
    return Animated.loop(
      Animated.timing(animatedValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
  },
  
  // Float animation (up and down gently)
  float: (animatedValue: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: -10,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
  },
  
  // Glow pulse (for gold elements)
  glowPulse: (animatedValue: Animated.Value) => {
    return Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0.6,
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
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

// Hook for pulse animation (button glow effect)
export const usePulseAnimation = (autoStart = true) => {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;
  
  React.useEffect(() => {
    if (autoStart) {
      animations.pulse(pulseAnim).start();
    }
  }, [autoStart, pulseAnim]);
  
  return {
    pulseAnim,
    start: () => animations.pulse(pulseAnim).start(),
    stop: () => pulseAnim.stopAnimation(),
  };
};

// Hook for shimmer effect
export const useShimmerAnimation = (autoStart = true) => {
  const shimmerAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (autoStart) {
      animations.shimmer(shimmerAnim).start();
    }
  }, [autoStart, shimmerAnim]);
  
  return {
    shimmerAnim,
    start: () => animations.shimmer(shimmerAnim).start(),
    stop: () => shimmerAnim.stopAnimation(),
  };
};

// Hook for float animation
export const useFloatAnimation = (autoStart = true) => {
  const floatAnim = React.useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    if (autoStart) {
      animations.float(floatAnim).start();
    }
  }, [autoStart, floatAnim]);
  
  return {
    floatAnim,
    start: () => animations.float(floatAnim).start(),
    stop: () => floatAnim.stopAnimation(),
  };
};

// Hook for glow pulse (gold button effect)
export const useGlowPulseAnimation = (autoStart = true) => {
  const glowAnim = React.useRef(new Animated.Value(0.8)).current;
  
  React.useEffect(() => {
    if (autoStart) {
      animations.glowPulse(glowAnim).start();
    }
  }, [autoStart, glowAnim]);
  
  return {
    glowAnim,
    start: () => animations.glowPulse(glowAnim).start(),
    stop: () => glowAnim.stopAnimation(),
  };
};

// ✨ NEW - Hook for typewriter effect
export const useTypewriterAnimation = (
  text: string,
  speed: number = 80,
  startDelay: number = 500,
  autoStart: boolean = true
) => {
  const [displayedText, setDisplayedText] = React.useState('');
  const [isComplete, setIsComplete] = React.useState(false);
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  
  const startTyping = React.useCallback(() => {
    setDisplayedText('');
    setIsComplete(false);
    
    const startTimeout = setTimeout(() => {
      let index = 0;
      
      const typeNextChar = () => {
        if (index < text.length) {
          setDisplayedText(text.substring(0, index + 1));
          index++;
          timeoutRef.current = setTimeout(typeNextChar, speed);
        } else {
          setIsComplete(true);
        }
      };
      
      typeNextChar();
    }, startDelay);
    
    return () => {
      clearTimeout(startTimeout);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [text, speed, startDelay]);
  
  React.useEffect(() => {
    if (autoStart) {
      const cleanup = startTyping();
      return cleanup;
    }
  }, [autoStart, startTyping]);
  
  const reset = React.useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setDisplayedText('');
    setIsComplete(false);
  }, []);
  
  return {
    displayedText,
    isComplete,
    startTyping,
    reset,
  };
};

// Export animated components factory
export const createAnimatedComponent = (Component: any) => {
  return Animated.createAnimatedComponent(Component);
};