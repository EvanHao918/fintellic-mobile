// src/constants/brand.ts

/**
 * Brand Assets Configuration
 * Centralized brand resources for consistent usage across the app
 */

// Logo image imports
export const BRAND_IMAGES = {
  // Full logo with text (for login screen, splash screen)
  LOGO_FULL: require('../assets/images/AllSight_Logo.png'),
  
  // Icon only (for small spaces, notifications)
  ICON: require('../assets/images/AllSight_Icon.png'),
  
  // Text logo (for navigation bars, headers)
  TEXT_LOGO: require('../assets/images/AllSight_text.png'),
  
  // Header logo (for main app header) - 🎨 NEW
  HEADER_LOGO: require('../assets/images/onboarding_logo.png'),
  
  // Onboarding assets - NEW
  ONBOARDING_LOGO: require('../assets/images/AllSight_Logo.png'),
  ONBOARDING_STAR: require('../assets/images/onboarding_star.png'),
  ONBOARDING_CHECKLIST: require('../assets/images/onboarding_checklist.png'),
  ONBOARDING_ARROW: require('../assets/images/onboarding_arrow.png'),
};

// Brand name text
export const BRAND_NAME = 'AllSight';

// Brand taglines
export const BRAND_TAGLINES = {
  MAIN: 'First to know. First to act',
  SUB: 'Complete market surveillance meets lightning-fast analysis — every filing, every insight, zero delay.',
  DRAWER_LINE1: 'Get the Instant Essential',
  DRAWER_LINE2: 'before the Market Digests',
};

// Onboarding slides content - NEW
export const ONBOARDING_SLIDES = [
  {
    id: 1,
    image: 'ONBOARDING_STAR',
    title: 'Know what matters',
    titleBold: 'before the market reacts.',
    subtitle: 'AI-powered analysis of SEC filings delivered within minutes of release.',
    gradientColors: ['#FFFFFF', '#FEF3C7', '#F59E0B'] as const, // white to amber gradient
  },
  {
    id: 2,
    image: 'ONBOARDING_CHECKLIST',
    title: 'Accuracy, Credibility',
    titleBold: 'Under Pressure.',
    subtitle: 'Complex disclosures translated into clear, decision-ready insights.',
    gradientColors: ['#FFFFFF', '#D1FAE5', '#10B981'] as const, // white to green gradient
  },
  {
    id: 3,
    image: 'ONBOARDING_ARROW',
    title: "Don't follow smart money.",
    titleBold: 'Be it.',
    subtitle: "Break through Wall Street's information gap.",
    gradientColors: ['#FFFFFF', '#E0F2FE', '#7DD3FC'] as const, // white to sky blue gradient
  },
];

// Export default for convenience
export default {
  IMAGES: BRAND_IMAGES,
  NAME: BRAND_NAME,
  TAGLINES: BRAND_TAGLINES,
  ONBOARDING_SLIDES,
};