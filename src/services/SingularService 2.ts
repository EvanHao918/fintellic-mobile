// src/services/SingularService.ts
import { Singular, SingularConfig } from 'singular-react-native';
import { Platform } from 'react-native';

// Singular SDK 配置
const SINGULAR_SDK_KEY = 'all_sight_app_d1fe4376';
const SINGULAR_SDK_SECRET = ''; // Singular 不需要 secret

class SingularService {
  private static instance: SingularService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): SingularService {
    if (!SingularService.instance) {
      SingularService.instance = new SingularService();
    }
    return SingularService.instance;
  }

  /**
   * 初始化 Singular SDK
   */
  public async init(): Promise<void> {
    if (this.isInitialized) {
      console.log('✅ Singular SDK already initialized');
      return;
    }

    try {
      console.log('🚀 Initializing Singular SDK...');

      const config = new SingularConfig(
        SINGULAR_SDK_KEY,
        SINGULAR_SDK_SECRET
      );

      // 可选配置
      config.withLoggingEnabled(); // 开发时启用日志
      
      // 初始化 SDK
      Singular.init(config);

      this.isInitialized = true;
      console.log('✅ Singular SDK initialized successfully');

    } catch (error) {
      console.error('❌ Singular SDK initialization failed:', error);
      throw error;
    }
  }

  /**
   * Event 1: Signup（用户注册）
   */
  public trackSignup(method: 'email' | 'apple' | 'google'): void {
    try {
      Singular.event(`Signup_${method}`);
      console.log('📊 Singular Event: Signup', { method });
    } catch (error) {
      console.error('❌ Singular trackSignup failed:', error);
    }
  }

  /**
   * Event 2: ViewContent（查看 Filing 详情）
   */
  public trackViewContent(params: {
    filingId: string;
    companyName: string;
    formType: string;
  }): void {
    try {
      Singular.event(`ViewContent_${params.formType}`);
      console.log('📊 Singular Event: ViewContent', params);
    } catch (error) {
      console.error('❌ Singular trackViewContent failed:', error);
    }
  }

  /**
   * Event 3: PaywallHit（触发付费墙）
   */
  public trackPaywallHit(params: {
    viewsToday: number;
    dailyLimit: number;
  }): void {
    try {
      Singular.event('PaywallHit');
      console.log('📊 Singular Event: PaywallHit', params);
    } catch (error) {
      console.error('❌ Singular trackPaywallHit failed:', error);
    }
  }

  /**
   * Event 4: Subscription（订阅成功）
   */
  public trackSubscription(params: {
    productId: string;
    price: number;
    currency: string;
    platform: 'ios' | 'android';
  }): void {
    try {
      Singular.event(`Subscription_${params.platform}`);
      console.log('📊 Singular Event: Subscription', params);
    } catch (error) {
      console.error('❌ Singular trackSubscription failed:', error);
    }
  }

  /**
   * 检查 SDK 是否已初始化
   */
  public isReady(): boolean {
    return this.isInitialized;
  }
}

export default SingularService.getInstance();