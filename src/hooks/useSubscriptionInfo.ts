import { useState } from 'react';
import type { SubscriptionInfo } from '../types/window-api';
import { errorMessage } from '../utils/errorMessage';

// 「設定」タブの「Anlas / Opus残量を確認」。結果と確認中／エラーの表示文言を持つ。
export function useSubscriptionInfo() {
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');

  async function handleCheckSubscription(apiKey: string) {
    setSubscriptionStatus('確認中...');
    setSubscriptionInfo(null);
    try {
      const info = await window.api.getSubscriptionInfo(apiKey);
      setSubscriptionInfo(info);
      setSubscriptionStatus('');
    } catch (err) {
      setSubscriptionStatus(`エラー: ${errorMessage(err)}`);
    }
  }

  return { subscriptionInfo, subscriptionStatus, handleCheckSubscription };
}
