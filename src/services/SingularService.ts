/**
 * Singular Analytics Service
 * Tracks key user events for marketing attribution and optimization
 * 
 * Events tracked:
 * - Signup: User registration (email, Apple, Google)
 * - ViewContent: User views a filing
 * - PaywallHit: User hits the 2 free filings/day limit
 * - Subscription: User subscribes ($19.99/month)
 */

import { Platform } from 'react-native';
import { Singular, SingularConfig } from 'singular-react-native';

// Singular API keys (get these from Singular dashboard)
const SINGULAR_API_KEY = Platform.select({
  ios: 'YOUR_IOS_API_KEY', // Replace with your iOS API key
  android: 'YOUR_ANDROID_API_KEY', // Replace with your Android API key
}) || '';

const SINGULAR_SECRET_KEY = Platform.select({
  ios: 'YOUR_IOS_SECRET_KEY', // Replace with your iOS secret key
  android: 'YOUR_ANDROID_SECRET_KEY', // Replace with your Android secret key
}) || '';

// Enable debug logging in development
const DEBUG_MODE = __DEV__;

class SingularService {
  private isInitialized: boolean = false;

  /**
   * Initialize Singular SDK
   * Call this in App.tsx when the app starts
   */
  async init(): Promise<void> {
    try {
      if (this.isInitialized) {
        if (DEBUG_MODE) console.log('[Singular] Already initialized');
        return;
      }

      // Initialize Singular SDK with new API
      const config = new SingularConfig(
        SINGULAR_API_KEY,
        SINGULAR_SECRET_KEY
      );

      // Enable logging in development
      if (DEBUG_MODE) {
        config.withLoggingEnabled();
      }

      Singular.init(config);
      
      this.isInitialized = true;
      if (DEBUG_MODE) console.log('[Singular] ✅ Initialized successfully');
    } catch (error) {
      console.error('[Singular] ❌ Initialization failed:', error);
    }
  }

  /**
   * Track Signup event
   * Called when user successfully registers (email, Apple, or Google)
   * @param method - 'email' | 'apple' | 'google'
   */
  trackSignup(method: 'email' | 'apple' | 'google'): void {
    try {
      if (!this.isInitialized) {
        console.warn('[Singular] SDK not initialized, skipping Signup event');
        return;
      }

      const eventData: Record<string, string | number | boolean> = {
        registration_method: method,
      };

      Singular.eventWithArgs('Signup', eventData);

      if (DEBUG_MODE) {
        console.log('[Singular] 📝 Signup event tracked:', eventData);
      }
    } catch (error) {
      console.error('[Singular] Error tracking Signup:', error);
    }
  }

  /**
   * Track ViewContent event
   * Called when user opens a filing detail page
   */
  trackViewContent(params: {
    filingId: string;
    companyName: string;
    formType: string;
  }): void {
    try {
      if (!this.isInitialized) {
        console.warn('[Singular] SDK not initialized, skipping ViewContent event');
        return;
      }

      const eventData: Record<string, string | number | boolean> = {
        filing_id: params.filingId,
        company_name: params.companyName,
        form_type: params.formType,
      };

      Singular.eventWithArgs('ViewContent', eventData);

      if (DEBUG_MODE) {
        console.log('[Singular] 👀 ViewContent event tracked:', eventData);
      }
    } catch (error) {
      console.error('[Singular] Error tracking ViewContent:', error);
    }
  }

  /**
   * Track PaywallHit event
   * Called when free user tries to view 3rd filing and hits the daily limit
   */
  trackPaywallHit(params: {
    viewsToday: number;
    dailyLimit: number;
  }): void {
    try {
      if (!this.isInitialized) {
        console.warn('[Singular] SDK not initialized, skipping PaywallHit event');
        return;
      }

      const eventData: Record<string, string | number | boolean> = {
        views_today: params.viewsToday,
        daily_limit: params.dailyLimit,
      };

      Singular.eventWithArgs('PaywallHit', eventData);

      if (DEBUG_MODE) {
        console.log('[Singular] 🚫 PaywallHit event tracked:', eventData);
      }
    } catch (error) {
      console.error('[Singular] Error tracking PaywallHit:', error);
    }
  }

  /**
   * Track Subscription revenue event
   * Called when user successfully completes subscription purchase
   */
  trackSubscription(params: {
    productId: string;
    price: number;
    currency: string;
    platform: 'ios' | 'android';
  }): void {
    try {
      if (!this.isInitialized) {
        console.warn('[Singular] SDK not initialized, skipping Subscription event');
        return;
      }

      const additionalData: Record<string, string | number | boolean> = {
        product_id: params.productId,
        platform: params.platform,
      };

      // Track custom revenue event with event name
      Singular.customRevenueWithArgs(
        'Subscription',
        params.currency,
        params.price,
        additionalData
      );

      if (DEBUG_MODE) {
        console.log('[Singular] 💰 Subscription event tracked:', {
          productId: params.productId,
          price: params.price,
          currency: params.currency,
          platform: params.platform,
        });
      }
    } catch (error) {
      console.error('[Singular] Error tracking Subscription:', error);
    }
  }

  /**
   * Check if Singular is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}

// Export singleton instance
const singularService = new SingularService();
export default singularService;