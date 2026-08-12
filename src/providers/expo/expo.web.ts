import {
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  unregisterForNotificationsAsync,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

export interface ExpoPushConfig {
  /**
   * EAS project ID, forwarded to `getExpoPushTokenAsync`. Expo's web push needs
   * a VAPID key configured in your app; the project ID ties the browser
   * subscription to the same Expo push service used on native.
   */
  projectId?: string;
}

/**
 * Maps Expo's web permission response onto our tri-state. On web there's no iOS
 * authorization enum, so this leans on `status` plus `canAskAgain` to separate
 * "never asked" (requestable) from a browser-level block.
 */
function toPermission(status: NotificationPermissionsStatus): PushPermission {
  if (status.granted) return 'granted';
  if (status.status === 'undetermined' || status.canAskAgain) return 'default';
  return 'denied';
}

/** Creates an Expo push adapter for the browser using `expo-notifications`. */
export function expoProvider(config: ExpoPushConfig = {}): PushProvider {
  // The Expo push token identifies this browser to Expo's push service — the
  // value you send to Expo's `/push/send` API. Cache it so `getSubscription`
  // and `unsubscribe` don't have to re-issue one.
  let token: string | null = null;

  const getPermission = async (): Promise<PushPermission> =>
    toPermission(await getPermissionsAsync());

  const requestPermission = async (): Promise<PushPermission> =>
    toPermission(await requestPermissionsAsync());

  const asSubscription = (value: string) =>
    ({ provider: 'expo', platform: 'web' as const, token: value }) as const;

  const fetchToken = async () => {
    const { data } = await getExpoPushTokenAsync(
      config.projectId ? { projectId: config.projectId } : undefined,
    );
    token = data;
    return asSubscription(data);
  };

  return {
    id: 'expo',
    // Expo web push rides on the browser's Push API + service worker.
    isSupported: () =>
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      'PushManager' in window,
    getPermission,
    getSubscription: async () => {
      if (token) return asSubscription(token);
      // Re-hydrate the existing registration on load so the hook reports the
      // real subscription state after a reload, without prompting.
      if ((await getPermission()) !== 'granted') return null;
      return fetchToken();
    },
    requestPermission,
    subscribe: async () => {
      const permission =
        (await getPermission()) === 'granted' ? 'granted' : await requestPermission();
      if (permission !== 'granted') return null;
      return fetchToken();
    },
    unsubscribe: async () => {
      if (!token) return false;
      await unregisterForNotificationsAsync();
      token = null;
      return true;
    },
  };
}
