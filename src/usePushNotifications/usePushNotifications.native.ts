import { useCallback } from 'react';
import type {
  PushNotifications,
  PushPermission,
  PushSubscriptionInfo,
  UsePushNotificationsOptions,
} from './types';

/**
 * React Native implementation.
 *
 * Web Push (Notification API + PushManager) does not exist on React Native —
 * native push is delivered through platform services (APNs / FCM) via dedicated
 * native modules, which live outside crosshooks' zero-dependency scope. The hook
 * therefore reports an unsupported, no-op state so shared components still
 * compile and render on mobile. The `options` argument is accepted for API
 * parity and ignored.
 */
export function usePushNotifications(
  _options?: UsePushNotificationsOptions,
): PushNotifications {
  const requestPermission = useCallback(
    async (): Promise<PushPermission> => 'default',
    [],
  );
  const subscribe = useCallback(
    async (): Promise<PushSubscriptionInfo | null> => null,
    [],
  );
  const unsubscribe = useCallback(async (): Promise<boolean> => false, []);

  return {
    isSupported: false,
    permission: 'default',
    subscription: null,
    isSubscribed: false,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
