/**
 * In-App Purchase Service
 * 处理Apple IAP和Google Play Billing
 * 适配 react-native-iap v12.16.4
 */

import {
  Platform,
  EmitterSubscription,
  Alert,
} from 'react-native';
import RNIap, {
  Product,
  ProductPurchase,
  PurchaseError,
  SubscriptionPurchase,
  finishTransaction,
  getProducts,
  getSubscriptions,
  initConnection,
  endConnection,
  requestSubscription,
  getAvailablePurchases,
  clearTransactionIOS,
  validateReceiptIos,
  acknowledgePurchaseAndroid,
  flushFailedPurchasesCachedAsPendingAndroid,
  purchaseUpdatedListener,
  purchaseErrorListener,
  Purchase,
  Subscription,
} from 'react-native-iap';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SubscriptionType } from '../types/subscription';
import apiClient from '../api/client';

// 产品ID配置（需要与App Store Connect和Google Play Console一致）
const PRODUCT_IDS = {
  ios: {
    [SubscriptionType.MONTHLY]: 'com.fintellic.app.monthly',
    [SubscriptionType.YEARLY]: 'com.fintellic.app.yearly',
  },
  android: {
    [SubscriptionType.MONTHLY]: 'monthly_subscription',
    [SubscriptionType.YEARLY]: 'yearly_subscription',
  },
};

// 缓存键
const CACHE_KEYS = {
  PENDING_PURCHASE: '@iap_pending_purchase',
  RECEIPT_DATA: '@iap_receipt_data',
};

class IAPService {
  private purchaseUpdateSubscription: EmitterSubscription | null = null;
  private purchaseErrorSubscription: EmitterSubscription | null = null;
  private products: (Product | Subscription)[] = [];
  private isInitialized: boolean = false;

  /**
   * 初始化IAP连接
   */
  async initialize(): Promise<boolean> {
    try {
      if (this.isInitialized) {
        console.log('IAP already initialized');
        return true;
      }

      // 初始化连接
      const result = await initConnection();
      console.log('IAP connection initialized:', result);

      // Android特定：清理失败的购买
      if (Platform.OS === 'android') {
        await flushFailedPurchasesCachedAsPendingAndroid();
      }

      // 设置监听器
      this.setupListeners();

      // 加载产品
      await this.loadProducts();

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Failed to initialize IAP:', error);
      return false;
    }
  }

  /**
   * 清理IAP连接
   */
  async cleanup(): Promise<void> {
    try {
      // 移除监听器
      if (this.purchaseUpdateSubscription) {
        this.purchaseUpdateSubscription.remove();
        this.purchaseUpdateSubscription = null;
      }
      if (this.purchaseErrorSubscription) {
        this.purchaseErrorSubscription.remove();
        this.purchaseErrorSubscription = null;
      }

      // 结束连接
      await endConnection();
      this.isInitialized = false;
      console.log('IAP connection cleaned up');
    } catch (error) {
      console.error('Error cleaning up IAP:', error);
    }
  }

  /**
   * 设置购买监听器
   */
  private setupListeners(): void {
    // 购买更新监听器
    this.purchaseUpdateSubscription = purchaseUpdatedListener(
      async (purchase: Purchase) => {
        console.log('Purchase updated:', purchase);
        await this.handlePurchaseUpdate(purchase);
      }
    );

    // 购买错误监听器
    this.purchaseErrorSubscription = purchaseErrorListener(
      (error: PurchaseError) => {
        console.error('Purchase error:', error);
        this.handlePurchaseError(error);
      }
    );
  }

  /**
   * 加载产品信息
   */
  async loadProducts(): Promise<(Product | Subscription)[]> {
    try {
      const productIds = Platform.select({
        ios: Object.values(PRODUCT_IDS.ios),
        android: Object.values(PRODUCT_IDS.android),
      }) || [];

      console.log('Loading products:', productIds);

      // 获取订阅产品
      const products = await getSubscriptions({ skus: productIds });
      this.products = products;

      console.log('Products loaded:', products);
      return products;
    } catch (error) {
      console.error('Failed to load products:', error);
      return [];
    }
  }

  /**
   * 获取产品信息
   */
  getProduct(subscriptionType: SubscriptionType): Product | Subscription | undefined {
    const productId = this.getProductId(subscriptionType);
    return this.products.find(p => p.productId === productId);
  }

  /**
   * 获取产品ID
   */
  private getProductId(subscriptionType: SubscriptionType): string {
    const ids = Platform.select({
      ios: PRODUCT_IDS.ios,
      android: PRODUCT_IDS.android,
    });
    return ids?.[subscriptionType] || '';
  }

  /**
   * 购买订阅
   */
  async purchaseSubscription(
    subscriptionType: SubscriptionType,
    userId: string
  ): Promise<boolean> {
    try {
      // 确保已初始化
      if (!this.isInitialized) {
        await this.initialize();
      }

      const productId = this.getProductId(subscriptionType);
      if (!productId) {
        throw new Error('Invalid product ID');
      }

      // 获取产品信息
      const product = this.getProduct(subscriptionType);
      if (!product) {
        throw new Error('Product not found');
      }

      console.log('Purchasing subscription:', productId);

      // 保存待处理的购买信息
      await AsyncStorage.setItem(
        CACHE_KEYS.PENDING_PURCHASE,
        JSON.stringify({
          productId,
          subscriptionType,
          userId,
          timestamp: Date.now(),
        })
      );

      // 发起购买
      if (Platform.OS === 'ios') {
        // iOS购买
        await requestSubscription({
          sku: productId,
          andDangerouslyFinishTransactionAutomaticallyIOS: false,
        });
      } else {
        // Android购买 - v12版本的新API
        const subscription = product as Subscription;
        if ('subscriptionOfferDetails' in subscription && subscription.subscriptionOfferDetails?.length) {
          await requestSubscription({
            sku: productId,
            subscriptionOffers: subscription.subscriptionOfferDetails.map(offer => ({
              sku: productId,
              offerToken: offer.offerToken,
            })),
          });
        } else {
          // 旧版本兼容
          await requestSubscription({
            sku: productId,
          });
        }
      }

      return true;
    } catch (error: any) {
      console.error('Purchase failed:', error);
      
      // 用户取消
      if (error.code === 'E_USER_CANCELLED') {
        console.log('User cancelled purchase');
        return false;
      }

      throw error;
    }
  }

  /**
   * 处理购买更新
   */
  private async handlePurchaseUpdate(purchase: Purchase): Promise<void> {
    try {
      console.log('Processing purchase:', purchase);

      // 获取待处理的购买信息
      const pendingPurchaseStr = await AsyncStorage.getItem(CACHE_KEYS.PENDING_PURCHASE);
      const pendingPurchase = pendingPurchaseStr ? JSON.parse(pendingPurchaseStr) : null;

      // 验证购买
      const isValid = await this.verifyPurchase(purchase, pendingPurchase);
      
      if (isValid) {
        // 完成交易
        await this.finishPurchase(purchase);
        
        // 清理待处理的购买
        await AsyncStorage.removeItem(CACHE_KEYS.PENDING_PURCHASE);
        
        Alert.alert(
          'Success!',
          'Your subscription has been activated.',
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          'Verification Failed',
          'Unable to verify your purchase. Please contact support.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error handling purchase update:', error);
      Alert.alert(
        'Error',
        'An error occurred processing your purchase. Please contact support.',
        [{ text: 'OK' }]
      );
    }
  }

  /**
   * 验证购买
   */
  private async verifyPurchase(
    purchase: Purchase,
    pendingPurchase: any
  ): Promise<boolean> {
    try {
      if (Platform.OS === 'ios') {
        // iOS验证
        return await this.verifyIosPurchase(purchase);
      } else {
        // Android验证
        return await this.verifyAndroidPurchase(purchase);
      }
    } catch (error) {
      console.error('Purchase verification failed:', error);
      return false;
    }
  }

  /**
   * 验证iOS购买
   */
  private async verifyIosPurchase(purchase: Purchase): Promise<boolean> {
    try {
      // 验证收据 - v12版本的新API
      const receiptBody = await validateReceiptIos({
        receiptBody: {
          'receipt-data': purchase.transactionReceipt!,
          password: '', // 如果有shared secret，在这里提供
        },
        isTest: __DEV__, // 开发环境使用沙盒
      });

      console.log('iOS receipt validation result:', receiptBody);

      // 发送到后端验证
      const response = await apiClient.post('/subscriptions/verify/apple', {
        receipt_data: purchase.transactionReceipt,
        product_id: purchase.productId,
        transaction_id: purchase.transactionId,
      });

      return response.success === true;
    } catch (error) {
      console.error('iOS verification failed:', error);
      return false;
    }
  }

  /**
   * 验证Android购买
   */
  private async verifyAndroidPurchase(purchase: Purchase): Promise<boolean> {
    try {
      // 发送到后端验证
      const response = await apiClient.post('/subscriptions/verify/google', {
        purchase_token: purchase.purchaseToken,
        product_id: purchase.productId,
        order_id: purchase.transactionId,
      });

      return response.success === true;
    } catch (error) {
      console.error('Android verification failed:', error);
      return false;
    }
  }

  /**
   * 完成购买
   */
  private async finishPurchase(purchase: Purchase): Promise<void> {
    try {
      if (Platform.OS === 'ios') {
        // iOS完成交易
        await finishTransaction({ purchase, isConsumable: false });
      } else {
        // Android确认购买 - 使用正确的参数格式
        if (purchase.purchaseToken) {
          await acknowledgePurchaseAndroid({
            token: purchase.purchaseToken,
          });
        }
      }
      console.log('Purchase finished successfully');
    } catch (error) {
      console.error('Error finishing purchase:', error);
    }
  }

  /**
   * 处理购买错误
   */
  private handlePurchaseError(error: PurchaseError): void {
    console.error('Purchase error:', error);

    let message = 'An error occurred during purchase.';
    
    if (error.code === 'E_USER_CANCELLED') {
      // 用户取消，不显示错误
      return;
    } else if (error.code === 'E_ITEM_UNAVAILABLE') {
      message = 'This subscription is not available.';
    } else if (error.code === 'E_NETWORK_ERROR') {
      message = 'Network error. Please check your connection.';
    } else if (error.code === 'E_SERVICE_ERROR') {
      message = 'Store service error. Please try again later.';
    }

    Alert.alert('Purchase Error', message, [{ text: 'OK' }]);
  }

  /**
   * 恢复购买
   */
  async restorePurchases(): Promise<boolean> {
    try {
      console.log('Restoring purchases...');
      
      const purchases = await getAvailablePurchases();
      console.log('Available purchases:', purchases);

      if (purchases.length === 0) {
        Alert.alert(
          'No Purchases',
          'No previous purchases found.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // 验证并恢复每个购买
      for (const purchase of purchases) {
        if (Platform.OS === 'ios') {
          // iOS恢复
          await apiClient.post('/subscriptions/restore/apple', {
            receipt_data: purchase.transactionReceipt,
          });
        } else {
          // Android恢复
          await apiClient.post('/subscriptions/verify/google', {
            purchase_token: purchase.purchaseToken,
            product_id: purchase.productId,
          });
        }
      }

      Alert.alert(
        'Success',
        'Your purchases have been restored.',
        [{ text: 'OK' }]
      );
      return true;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      Alert.alert(
        'Restore Failed',
        'Unable to restore purchases. Please try again.',
        [{ text: 'OK' }]
      );
      return false;
    }
  }

  /**
   * 获取产品价格字符串
   */
  getProductPriceString(subscriptionType: SubscriptionType): string {
    const product = this.getProduct(subscriptionType);
    if (!product) {
      // 返回默认价格
      return subscriptionType === SubscriptionType.MONTHLY ? '$39' : '$280.80';
    }
    
    // 处理不同平台的价格字段
    if (Platform.OS === 'ios') {
      // iOS使用localizedPrice
      return (product as any).localizedPrice || '$39';
    } else {
      // Android使用oneTimePurchaseOfferDetails或subscriptionOfferDetails
      const androidProduct = product as Subscription;
      if ('subscriptionOfferDetails' in androidProduct && androidProduct.subscriptionOfferDetails?.length) {
        const offer = androidProduct.subscriptionOfferDetails[0];
        if ('pricingPhases' in offer && offer.pricingPhases?.pricingPhaseList?.length) {
          return offer.pricingPhases.pricingPhaseList[0].formattedPrice || '$39';
        }
      }
      // 旧版本Android API
      return (androidProduct as any).localizedPrice || '$39';
    }
  }

  /**
   * 检查是否有待处理的购买
   */
  async checkPendingPurchases(): Promise<void> {
    try {
      if (Platform.OS === 'android') {
        // Android检查待处理的购买
        await flushFailedPurchasesCachedAsPendingAndroid();
      }
    } catch (error) {
      console.error('Error checking pending purchases:', error);
    }
  }
}

// 创建单例
export const iapService = new IAPService();
export default iapService;