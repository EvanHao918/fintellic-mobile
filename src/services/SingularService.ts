/**
 * Singular Analytics Service
 * Tracks key user events for marketing attribution and optimization
 * 
 * Events tracked:
 * - Signup: User registration (email, Apple, Google)
 * - ViewContent: User views a filing
 * - PaywallHit: User hits the 2 free filings/day limit
 * - Subscription: User subscribes ($19.99/month)
 * 
 * Using NativeSingular TurboModule API because app has newArchEnabled: true
 * (React Native 0.79.4 with New Architecture)
 */

import { Platform } from 'react-native';
import NativeSingular from 'singular-react-native/js/NativeSingular';

const SINGULAR_API_KEY = Platform.select({
  ios: 'all_sight_app_d1fe4376',
  android: 'all_sight_app_d1fe4376',
}) || '';

const SINGULAR_SECRET_KEY = Platform.select({
  ios: '5a93e5a2d1a21f9a15cc30a2f296daf8',
  android: '5a93e5a2d1a21f9a15cc30a2f296daf8',
}) || '';

const DEBUG_MODE = __DEV__;

class SingularService {
  private isInitialized: boolean = false;

  async init(): Promise<void> {
    try {
      if (this.isInitialized) {
        if (DEBUG_MODE) console.log('[Singular] Already initialized');
        return;
      }

      // New Architecture requires NativeSingular TurboModule API
      // Codegen generates NativeSingular for this app (confirmed in build logs)
      const config = {
        apikey: SINGULAR_API_KEY,
        secret: SINGULAR_SECRET_KEY,
        facebookAppId: '2018869265332448',
        enableLogging: DEBUG_MODE,
        logLevel: DEBUG_MODE ? 3 : 0,
      };

      NativeSingular.init(config);

      this.isInitialized = true;
      if (DEBUG_MODE) console.log('[Singular] ✅ Initialized successfully');
    } catch (error) {
      console.error('[Singular] ❌ Initialization failed:', error);
    }
  }

  trackSignup(method: 'email' | 'apple' | 'google'): void {
    try {
      if (!this.isInitialized) {
        console.warn('[Singular] SDK not initialized, skipping Signup event');
        return;
      }
      const eventData: Record<string, string | number | boolean> = {
        registration_method: method,
      };
      NativeSingular.eventWithArgs('Signup', eventData);
      if (DEBUG_MODE) console.log('[Singular] Signup event tracked:', eventData);
    } catch (error) {
      console.error('[Singular] Error tracking Signup:', error);
    }
  }

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
      NativeSingular.eventWithArgs('ViewContent', eventData);
      if (DEBUG_MODE) console.log('[Singular] ViewContent event tracked:', eventData);
    } catch (error) {
      console.error('[Singular] Error tracking ViewContent:', error);
    }
  }

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
      NativeSingular.eventWithArgs('PaywallHit', eventData);
      if (DEBUG_MODE) console.log('[Singular] PaywallHit event tracked:', eventData);
    } catch (error) {
      console.error('[Singular] Error tracking PaywallHit:', error);
    }
  }

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
      NativeSingular.customRevenueWithArgs(
        'Subscription',
        params.currency,
        params.price,
        additionalData
      );
      if (DEBUG_MODE) console.log('[Singular] Subscription event tracked:', params);
    } catch (error) {
      console.error('[Singular] Error tracking Subscription:', error);
    }
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

const singularService = new SingularService();
export default singularService;