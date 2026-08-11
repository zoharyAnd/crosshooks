import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  deleteToken,
  getMessaging,
  getToken,
  isSupported,
  type Messaging,
} from 'firebase/messaging';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

export interface FirebasePushConfig {
  firebaseConfig: FirebaseOptions;
  vapidKey: string;
  serviceWorkerRegistration?: ServiceWorkerRegistration;
}

/** Creates a Firebase Cloud Messaging adapter for browser push notifications. */
export function firebaseProvider(config: FirebasePushConfig): PushProvider {
  let messaging: Messaging | null = null;
  let token: string | null = null;

  const getMessagingInstance = () => {
    if (!messaging) {
      const app = getApps().length > 0 ? getApp() : initializeApp(config.firebaseConfig);
      messaging = getMessaging(app);
    }
    return messaging;
  };

  const getPermission = (): PushPermission => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission as PushPermission;
  };

  const requestPermission = async (): Promise<PushPermission> => {
    if (typeof Notification === 'undefined') return 'default';
    return (await Notification.requestPermission()) as PushPermission;
  };

  const subscribe = async () => {
    const permission =
      getPermission() === 'granted' ? 'granted' : await requestPermission();
    if (permission !== 'granted') return null;

    token = await getToken(getMessagingInstance(), {
      vapidKey: config.vapidKey,
      ...(config.serviceWorkerRegistration
        ? { serviceWorkerRegistration: config.serviceWorkerRegistration }
        : {}),
    });

    return token ? { provider: 'firebase', platform: 'web' as const, token } : null;
  };

  return {
    id: 'firebase',
    isSupported,
    getPermission,
    getSubscription: () =>
      token ? { provider: 'firebase', platform: 'web' as const, token } : null,
    requestPermission,
    subscribe,
    unsubscribe: async () => {
      if (!token) return false;
      const removed = await deleteToken(getMessagingInstance());
      token = null;
      return removed;
    },
  };
}
