import type { PushNotifications, UsePushNotificationsOptions } from './types';
import { useProviderPushNotifications } from './useProviderPushNotifications';

const unsupportedProvider = {
  id: 'unsupported',
  isSupported: () => false,
  getPermission: () => 'default' as const,
  getSubscription: () => null,
  requestPermission: async () => 'default' as const,
  subscribe: async () => null,
  unsubscribe: async () => false,
};

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
  options: UsePushNotificationsOptions = {},
): PushNotifications {
  return useProviderPushNotifications(options.provider ?? unsupportedProvider);
}
