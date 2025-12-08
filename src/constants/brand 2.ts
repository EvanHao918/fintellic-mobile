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
  };
  
  // Brand name text
  export const BRAND_NAME = 'InsightFlash';
  
  // Brand taglines
  export const BRAND_TAGLINES = {
    MAIN: 'First to Know. First to Act.',
    SUB: 'Complete market surveillance meets lightning-fast analysis — every filing, every insight, zero delay.',
    DRAWER_LINE1: 'Get the Instant Essential',
    DRAWER_LINE2: 'before the Market Digests',
  };
  
  // Export default for convenience
  export default {
    IMAGES: BRAND_IMAGES,
    NAME: BRAND_NAME,
    TAGLINES: BRAND_TAGLINES,
  };