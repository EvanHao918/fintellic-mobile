// src/services/ShareService.ts
// 分享服务：封装 Filing 分享逻辑
// Phase 1: 基础分享功能（原生分享面板）

import { Share, Platform } from 'react-native';
import { Filing } from '../types';
import { Singular } from 'singular-react-native';

// 分享链接基础 URL
const SHARE_BASE_URL = 'https://allsight.app/r';

// 开发模式日志
const DEBUG_MODE = __DEV__;

// 分享结果类型
export interface ShareResult {
  success: boolean;
  action?: 'shared' | 'dismissed';
  error?: string;
}

// 生成分享链接
export const generateShareUrl = (filingId: number): string => {
  return `${SHARE_BASE_URL}/${filingId}`;
};

// 生成分享文本内容
export const generateShareContent = (filing: Filing): { title: string; message: string; url: string } => {
  const ticker = filing.company_ticker || 'Unknown';
  const formType = filing.form_type || 'Filing';
  const companyName = filing.company_name || '';
  
  // 使用 AI 生成的分享内容（如果有），否则用 feed_summary
  const metrics = (filing as any).share_metrics || '';
  const hook = (filing as any).share_hook || '';
  
  // 构建标题
  const title = `${ticker} · ${formType}${companyName ? ` | ${companyName}` : ''}`;
  
  // 构建消息内容
  let message = '';
  
  if (metrics) {
    message += `${metrics}\n\n`;
  }
  
  if (hook) {
    message += `${hook}\n\n`;
  } else if (filing.unified_feed_summary) {
    // Fallback: 使用 feed_summary 的第一句话
    const firstSentence = filing.unified_feed_summary.split('.')[0];
    if (firstSentence) {
      message += `${firstSentence}.\n\n`;
    }
  }
  
  const url = generateShareUrl(filing.id);
  
  return { title, message, url };
};

// 埋点辅助函数
const trackShareEvent = (eventName: string, data: Record<string, string | number | boolean>): void => {
  try {
    Singular.eventWithArgs(eventName, data);
    if (DEBUG_MODE) {
      console.log(`[Share] 📊 ${eventName} tracked:`, data);
    }
  } catch (error) {
    console.error(`[Share] Error tracking ${eventName}:`, error);
  }
};

// 执行分享
export const shareFiling = async (filing: Filing): Promise<ShareResult> => {
  try {
    const { title, message, url } = generateShareContent(filing);
    
    // 构建分享内容
    const shareContent = {
      title,
      message: Platform.OS === 'ios' 
        ? `${message}${url}`  // iOS: message 包含 URL
        : message,            // Android: URL 单独传
      url: Platform.OS === 'android' ? url : undefined,
    };
    
    // 调用原生分享
    const result = await Share.share(shareContent, {
      dialogTitle: `Share ${filing.company_ticker} ${filing.form_type}`,
      subject: title, // Email subject
    });
    
    // 处理结果
    if (result.action === Share.sharedAction) {
      // 分享成功，记录埋点
      trackShareEvent('ShareCompleted', {
        filing_id: filing.id,
        ticker: filing.company_ticker || '',
        form_type: filing.form_type || '',
        share_method: result.activityType || 'unknown',
      });
      
      return { success: true, action: 'shared' };
    } else if (result.action === Share.dismissedAction) {
      // 用户取消分享
      trackShareEvent('ShareDismissed', {
        filing_id: filing.id,
        ticker: filing.company_ticker || '',
        form_type: filing.form_type || '',
      });
      
      return { success: true, action: 'dismissed' };
    }
    
    return { success: true };
  } catch (error: any) {
    console.error('Share error:', error);
    
    // 记录错误埋点
    trackShareEvent('ShareError', {
      filing_id: filing.id,
      error: error.message || 'Unknown error',
    });
    
    return { 
      success: false, 
      error: error.message || 'Failed to share' 
    };
  }
};

// 记录分享意图（用户点击分享按钮）
export const trackShareIntent = (filing: Filing, source: 'card' | 'detail'): void => {
  trackShareEvent('ShareInitiated', {
    filing_id: filing.id,
    ticker: filing.company_ticker || '',
    form_type: filing.form_type || '',
    source,
  });
};

// 默认导出
const ShareService = {
  generateShareUrl,
  generateShareContent,
  shareFiling,
  trackShareIntent,
};

export default ShareService;