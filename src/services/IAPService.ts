/**
 * In-App Purchase Service - Production-Ready with Enhanced Error Handling
 * Optimized error handling, timeout management, and user experience
 */

import { Platform, EmitterSubscription, Alert } from 'react-native';
import RNIap, {
  Product,
  PurchaseError,
  finishTransaction,
  getSubscriptions,
  initConnection,
  endConnection,
  requestSubscription,
  getAvailablePurchases,
  acknowledgePurchaseAndroid,
  flushFailedPurchasesCachedAsPendingAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Purchase,
  Subscription,
} from 'react-native-iap';
import { SubscriptionType, ALLSIGHT_PRODUCT_CONFIG } from '../types/subscription';
import apiClient from '../api/client';

class IAPService {
  private purchaseUpdateSubscription: EmitterSubscription | null = null;
  private purchaseErrorSubscription: EmitterSubscription | null = null;
  private products: (Product | Subscription)[] = [];
  private isInitialized: boolean = false;
  private initializationPromise: Promise<boolean> | null = null;
  
  // 购买成功回调 - 用于刷新用户信息
  private onPurchaseSuccessCallback: (() => void) | null = null;
  
  // 防止重复处理购买
  private processingTransactions: Set<string> = new Set();
  private lastProcessedTransaction: string | null = null;
  
  // 标记是否正在初始化（清理待处理交易时不处理）
  private isCleaningPendingPurchases: boolean = false;
  
  // Error tracking and retry logic
  private readonly MAX_RETRY_ATTEMPTS = 3;
  private readonly RETRY_DELAY_MS = 2000;
  private readonly CONNECTION_TIMEOUT_MS = 15000;
  private readonly VERIFICATION_TIMEOUT_MS = 30000;

  /**
   * 设置购买成功回调
   */
  setOnPurchaseSuccess(callback: () => void): void {
    this.onPurchaseSuccessCallback = callback;
  }

  /**
   * 初始化IAP - 增强错误处理和超时控制
   */
  async initialize(): Promise<boolean> {
    try {
      // 防止重复初始化
      if (this.isInitialized) return true;
      if (this.initializationPromise) return await this.initializationPromise;

      this.initializationPromise = this._performInitialization();
      const result = await this.initializationPromise;
      this.initializationPromise = null;
      
      return result;
    } catch (error) {
      console.error('IAP initialization failed:', error);
      this.initializationPromise = null;
      return false;
    }
  }

  /**
   * 执行初始化过程
   */
  private async _performInitialization(): Promise<boolean> {
    try {
      // 设置连接超时
      const connectionPromise = initConnection();
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), this.CONNECTION_TIMEOUT_MS)
      );
      
      await Promise.race([connectionPromise, timeoutPromise]);
      
      // Android特定清理
      if (Platform.OS === 'android') {
        try {
          await flushFailedPurchasesCachedAsPendingAndroid();
        } catch (error) {
          console.warn('Failed to flush cached purchases:', error);
          // 不阻止初始化流程
        }
      }
      
      // 先设置监听器
      this.setupListeners();
      
      // iOS: 清理待处理的交易，避免重复触发（设置标记防止监听器处理）
      if (Platform.OS === 'ios') {
        this.isCleaningPendingPurchases = true;
        try {
          const pendingPurchases = await getAvailablePurchases();
          console.log(`Found ${pendingPurchases.length} pending purchases to clear`);
          for (const purchase of pendingPurchases) {
            try {
              await finishTransaction({ purchase, isConsumable: false });
              console.log(`Cleared pending transaction: ${purchase.transactionId}`);
            } catch (e) {
              console.warn(`Failed to clear transaction ${purchase.transactionId}:`, e);
            }
          }
        } catch (error) {
          console.warn('Failed to clear pending iOS purchases:', error);
        } finally {
          this.isCleaningPendingPurchases = false;
        }
      }

      await this.loadProducts();
      
      this.isInitialized = true;
      console.log('IAP service initialized successfully');
      return true;
    } catch (error) {
      console.error('IAP initialization failed:', error);
      this.cleanup();
      throw error;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    try {
      this.purchaseUpdateSubscription?.remove();
      this.purchaseErrorSubscription?.remove();
      
      if (this.isInitialized) {
        await endConnection();
      }
      
      this.isInitialized = false;
      this.initializationPromise = null;
      this.products = [];
      
      console.log('IAP service cleaned up');
    } catch (error) {
      console.warn('Error during IAP cleanup:', error);
    }
  }

  /**
   * 设置监听器
   */
  private setupListeners(): void {
    try {
      this.purchaseUpdateSubscription = purchaseUpdatedListener(
        (purchase: Purchase) => this.handlePurchaseUpdate(purchase)
      );
      
      this.purchaseErrorSubscription = purchaseErrorListener(
        (error: PurchaseError) => this.handlePurchaseError(error)
      );
      
      console.log('IAP listeners set up successfully');
    } catch (error) {
      console.error('Failed to setup IAP listeners:', error);
      throw error;
    }
  }

  /**
   * 加载产品 - 增强错误处理和重试机制
   */
  async loadProducts(retryCount: number = 0): Promise<void> {
    try {
      // 只支持 iOS，使用 discounted 产品
      const productIds: string[] = Platform.OS === 'ios' 
        ? [ALLSIGHT_PRODUCT_CONFIG.ios.discounted]
        : [];

      if (productIds.length === 0) {
        throw new Error('No product IDs configured for this platform');
      }

      this.products = await getSubscriptions({ skus: productIds });
      
      if (this.products.length === 0) {
        throw new Error('No products available from store');
      }
      
      console.log(`Products loaded successfully: ${this.products.length} products`);
    } catch (error) {
      console.error(`Failed to load products (attempt ${retryCount + 1}):`, error);
      
      // 重试逻辑
      if (retryCount < this.MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying product load in ${this.RETRY_DELAY_MS}ms...`);
        await new Promise<void>(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
        return this.loadProducts(retryCount + 1);
      }
      
      // 最终失败
      throw new Error(`Failed to load products after ${this.MAX_RETRY_ATTEMPTS} attempts`);
    }
  }

  /**
   * 获取产品ID - 只支持 iOS discounted 产品
   */
  private getProductId(type: SubscriptionType): string {
    if (Platform.OS !== 'ios') {
      throw new Error(`Platform ${Platform.OS} not supported`);
    }
    
    // 目前只有 monthly 订阅，使用 discounted 价格
    return ALLSIGHT_PRODUCT_CONFIG.ios.discounted;
  }

  /**
   * 购买订阅 - 增强错误处理和用户体验
   */
  async purchaseSubscription(type: SubscriptionType, userId: string): Promise<boolean> {
    try {
      // 确保已初始化
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          throw new Error('Failed to initialize IAP service');
        }
      }

      const productId = this.getProductId(type);
      const product = this.products.find(p => p.productId === productId);
      
      if (!product) {
        throw new Error(`Product not available: ${productId}`);
      }

      console.log(`Starting purchase for product: ${productId}`);

      if (Platform.OS === 'ios') {
        await this.purchaseIOS(productId);
      } else {
        await this.purchaseAndroid(product, productId);
      }

      return true;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // 用户取消不算错误
      if (this.isUserCancellation(error)) {
        console.log('Purchase cancelled by user');
        return false;
      }
      
      // 显示用户友好的错误信息
      this.showPurchaseError(error);
      throw error;
    }
  }

  /**
   * iOS购买流程
   */
  private async purchaseIOS(productId: string): Promise<void> {
    await requestSubscription({
      sku: productId,
      andDangerouslyFinishTransactionAutomaticallyIOS: false,
    });
  }

  /**
   * Android购买流程 - 增强兼容性
   */
  private async purchaseAndroid(product: any, productId: string): Promise<void> {
    try {
      // 尝试新版本Android API
      if (product.subscriptionOfferDetails && Array.isArray(product.subscriptionOfferDetails) && product.subscriptionOfferDetails.length > 0) {
        const offers = product.subscriptionOfferDetails.map((offer: any) => ({
          sku: productId,
          offerToken: offer.offerToken,
        }));
        
        await requestSubscription({
          sku: productId,
          subscriptionOffers: offers,
        });
      } else {
        // 回退到旧版本API
        console.log('Using legacy Android purchase API');
        await requestSubscription({ sku: productId });
      }
    } catch (error) {
      console.error('Android purchase error:', error);
      throw error;
    }
  }

  /**
   * 处理购买更新 - 增强验证和错误处理，防止重复处理
   */
  private async handlePurchaseUpdate(purchase: Purchase): Promise<void> {
    // 如果正在清理待处理交易，跳过处理
    if (this.isCleaningPendingPurchases) {
      console.log(`Skipping purchase update during cleanup: ${purchase.productId}`);
      return;
    }
    
    const transactionId = purchase.transactionId || purchase.productId + Date.now();
    
    // 防止重复处理同一笔交易
    if (this.processingTransactions.has(transactionId)) {
      console.log(`Transaction ${transactionId} is already being processed, skipping...`);
      return;
    }
    
    // 防止短时间内重复处理
    if (this.lastProcessedTransaction === transactionId) {
      console.log(`Transaction ${transactionId} was just processed, skipping...`);
      return;
    }
    
    this.processingTransactions.add(transactionId);
    
    try {
      console.log(`Processing purchase update for product: ${purchase.productId}`);
      
      // 设置验证超时
      const verificationPromise = this.verifyPurchase(purchase);
      const timeoutPromise = new Promise<boolean>((_, reject) => 
        setTimeout(() => reject(new Error('Verification timeout')), this.VERIFICATION_TIMEOUT_MS)
      );
      
      const isValid = await Promise.race([verificationPromise, timeoutPromise]);
      
      // 记录最后处理的交易
      this.lastProcessedTransaction = transactionId;
      
      if (isValid) {
        await this.finishPurchase(purchase);
        this.showPurchaseSuccess();
        
        // 购买成功后调用回调刷新用户信息
        if (this.onPurchaseSuccessCallback) {
          this.onPurchaseSuccessCallback();
        }
      } else {
        this.showVerificationFailure();
      }
    } catch (error) {
      console.error('Purchase update error:', error);
      this.showPurchaseError(error);
    } finally {
      // 清理处理中的交易标记
      this.processingTransactions.delete(transactionId);
    }
  }

  /**
   * 验证购买 - 增强错误处理和重试机制
   */
  private async verifyPurchase(purchase: Purchase, retryCount: number = 0): Promise<boolean> {
    try {
      const endpoint = Platform.OS === 'ios' ? '/subscriptions/verify/apple' : '/subscriptions/verify/google';
      const data = Platform.OS === 'ios' ? {
        receipt_data: purchase.transactionReceipt,
        product_id: purchase.productId,
        transaction_id: purchase.transactionId,
      } : {
        purchase_token: purchase.purchaseToken,
        product_id: purchase.productId,
        order_id: purchase.transactionId,
      };

      const response = await apiClient.post(endpoint, data);
      return response.success === true;
    } catch (error) {
      console.error(`Verification failed (attempt ${retryCount + 1}):`, error);
      
      // 网络错误重试
      if (this.isNetworkError(error) && retryCount < this.MAX_RETRY_ATTEMPTS) {
        console.log(`Retrying verification in ${this.RETRY_DELAY_MS}ms...`);
        await new Promise<void>(resolve => setTimeout(resolve, this.RETRY_DELAY_MS));
        return this.verifyPurchase(purchase, retryCount + 1);
      }
      
      return false;
    }
  }

  /**
   * 完成购买
   */
  private async finishPurchase(purchase: Purchase): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        await finishTransaction({ purchase, isConsumable: false });
      } else if (purchase.purchaseToken) {
        await acknowledgePurchaseAndroid({ token: purchase.purchaseToken });
      }
      
      console.log(`Purchase finished for product: ${purchase.productId}`);
    } catch (error) {
      console.error('Error finishing purchase:', error);
      // 不抛出错误，因为购买已经成功验证
    }
  }

  /**
   * 处理购买错误
   */
  private handlePurchaseError(error: PurchaseError): void {
    console.error('Purchase error received:', error);
    
    // 用户取消不显示错误
    if (this.isUserCancellation(error)) {
      return;
    }
    
    this.showPurchaseError(error);
  }

  /**
   * 恢复购买 - 增强错误处理
   */
  async restorePurchases(): Promise<boolean> {
    try {
      if (!this.isInitialized) {
        await this.initialize();
      }

      const purchases = await getAvailablePurchases();
      
      if (purchases.length === 0) {
        Alert.alert('No Purchases', 'No previous purchases found to restore.');
        return false;
      }

      console.log(`Found ${purchases.length} purchases to restore`);
      
      let successCount = 0;
      let failureCount = 0;

      for (const purchase of purchases) {
        try {
          if (Platform.OS === 'ios') {
            await apiClient.post('/subscriptions/restore/apple', {
              receipt_data: purchase.transactionReceipt
            });
          } else {
            await apiClient.post('/subscriptions/verify/google', {
              purchase_token: purchase.purchaseToken,
              product_id: purchase.productId
            });
          }
          successCount++;
        } catch (error) {
          console.warn('Failed to restore purchase:', purchase.productId, error);
          failureCount++;
        }
      }

      if (successCount > 0) {
        Alert.alert('Restore Successful', `Restored ${successCount} purchase(s).`);
        return true;
      } else {
        Alert.alert('Restore Failed', 'Unable to restore any purchases. Please try again or contact support.');
        return false;
      }
    } catch (error) {
      console.error('Restore purchases error:', error);
      Alert.alert('Restore Failed', 'Unable to restore purchases. Please check your connection and try again.');
      return false;
    }
  }

  /**
   * 获取产品价格 - 增强错误处理
   */
  getProductPriceString(type: SubscriptionType): string {
    try {
      const productId = this.getProductId(type);
      const product = this.products.find(p => p.productId === productId);
      
      if (!product) {
        return 'Product unavailable';
      }
      
      const productAny = product as any;
      
      if (Platform.OS === 'ios') {
        return productAny.localizedPrice || 'Price unavailable';
      } else {
        // Android价格处理
        if (productAny.subscriptionOfferDetails && 
            Array.isArray(productAny.subscriptionOfferDetails) && 
            productAny.subscriptionOfferDetails.length > 0) {
          
          const offer = productAny.subscriptionOfferDetails[0];
          if (offer.pricingPhases && 
              offer.pricingPhases.pricingPhaseList && 
              Array.isArray(offer.pricingPhases.pricingPhaseList) && 
              offer.pricingPhases.pricingPhaseList.length > 0) {
            
            return offer.pricingPhases.pricingPhaseList[0].formattedPrice || 'Price unavailable';
          }
        }
        // 旧版本Android API兼容
        return productAny.localizedPrice || 'Price unavailable';
      }
    } catch (error) {
      console.error('Error getting product price:', error);
      return 'Price unavailable';
    }
  }

  /**
   * 检查就绪状态
   */
  isReady(): boolean {
    return this.isInitialized && this.products.length > 0;
  }

  /**
   * 获取所有产品
   */
  getAllProducts(): (Product | Subscription)[] {
    return this.products;
  }

  // ==================== 错误处理辅助方法 ====================

  /**
   * 判断是否为用户取消错误
   */
  private isUserCancellation(error: any): boolean {
    const cancelCodes = ['E_USER_CANCELLED', 'UserCancel'];
    return cancelCodes.includes(error?.code) || cancelCodes.includes(error?.message);
  }

  /**
   * 判断是否为网络错误
   */
  private isNetworkError(error: any): boolean {
    const networkErrors = ['E_NETWORK_ERROR', 'NETWORK_ERROR', 'Network Error'];
    return networkErrors.some(code => 
      error?.code?.includes(code) || 
      error?.message?.includes(code) ||
      error?.message?.toLowerCase().includes('network')
    );
  }

  /**
   * 显示购买成功消息
   */
  private showPurchaseSuccess(): void {
    Alert.alert(
      'Purchase Successful!', 
      'Your Pro subscription has been activated. Welcome to HermeSpeed Pro!',
      [{ text: 'Get Started', style: 'default' }]
    );
  }

  /**
   * 显示验证失败消息
   */
  private showVerificationFailure(): void {
    Alert.alert(
      'Verification Failed', 
      'We received your payment but could not verify it immediately. Your subscription will be activated shortly. If the issue persists, please contact support.',
      [
        { text: 'Contact Support', style: 'default' },
        { text: 'OK', style: 'cancel' }
      ]
    );
  }

  /**
   * 显示购买错误消息
   */
  private showPurchaseError(error: any): void {
    const errorMessages: Record<string, string> = {
      'E_ITEM_UNAVAILABLE': 'This subscription is currently unavailable. Please try again later.',
      'E_NETWORK_ERROR': 'Network connection error. Please check your internet connection and try again.',
      'E_SERVICE_ERROR': 'Store service is temporarily unavailable. Please try again in a few minutes.',
      'E_ALREADY_OWNED': 'You already own this subscription. Try using "Restore Purchases" instead.',
      'E_PAYMENT_NOT_ALLOWED': 'Payments are not allowed on this device. Please check your device settings.',
      'E_BILLING_UNAVAILABLE': 'Billing service is unavailable. Please try again later.',
      'E_DEVELOPER_ERROR': 'There was a configuration error. Please contact support.',
    };

    const errorCode = error?.code || 'UNKNOWN_ERROR';
    const message = errorMessages[errorCode] || 
                   error?.message || 
                   'An unexpected error occurred during purchase. Please try again or contact support if the issue persists.';
    
    Alert.alert('Purchase Error', message, [
      { text: 'Try Again', style: 'default' },
      { text: 'Contact Support', style: 'default' },
      { text: 'Cancel', style: 'cancel' }
    ]);
  }

  // ==================== 调试和状态方法 ====================

  /**
   * 获取服务状态
   */
  getServiceStatus(): object {
    return {
      isInitialized: this.isInitialized,
      productCount: this.products.length,
      platform: Platform.OS,
      hasListeners: !!(this.purchaseUpdateSubscription && this.purchaseErrorSubscription),
      products: this.products.map(p => ({
        id: p.productId,
        price: (p as any).localizedPrice || 'N/A'
      }))
    };
  }

  /**
   * 强制重新初始化
   */
  async forceReinitialize(): Promise<boolean> {
    await this.cleanup();
    return await this.initialize();
  }
}

export const iapService = new IAPService();
export default iapService;