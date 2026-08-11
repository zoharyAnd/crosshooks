import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app';
import {
  getMessaging,
  isSupported,
  onRegistered,
  onUnregistered,
  register,
  unregister,
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
  // Firebase's FID-based messaging identifies this installation with a Firebase
  // Installation ID (FID) — the value you send to your server to target push,
  // just like the legacy FCM token it replaces.
  let fid: string | null = null;
  let listenersBound = false;

  const getMessagingInstance = () => {
    if (!messaging) {
      const app = getApps().length > 0 ? getApp() : initializeApp(config.firebaseConfig);
      messaging = getMessaging(app);
    }
    // The FID arrives through callbacks rather than a return value, and
    // `register()` throws unless an `onRegistered` handler is already attached —
    // so bind both listeners once, up front.
    if (!listenersBound) {
      onRegistered(messaging, (id) => {
        fid = id;
      });
      onUnregistered(messaging, () => {
        fid = null;
      });
      listenersBound = true;
    }
    return messaging;
  };

  const asSubscription = (id: string) =>
    ({ provider: 'firebase', platform: 'web' as const, token: id }) as const;

  // Registers this installation with FCM and resolves the FID that
  // `onRegistered` reports. `register()` invokes the handler before its promise
  // settles, so the cached `fid` is populated by the time we read it.
  const fetchFid = async () => {
    await register(getMessagingInstance(), {
      vapidKey: config.vapidKey,
      ...(config.serviceWorkerRegistration
        ? { serviceWorkerRegistration: config.serviceWorkerRegistration }
        : {}),
    });
    return fid ? asSubscription(fid) : null;
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
    return fetchFid();
  };

  return {
    id: 'firebase',
    isSupported,
    getPermission,
    getSubscription: async () => {
      if (fid) return asSubscription(fid);
      // Re-hydrate the existing FID-based registration on load so the hook
      // reports the real subscription state after a reload. `register` reuses
      // the active registration and does not prompt when permission is granted.
      if (getPermission() !== 'granted') return null;
      return fetchFid();
    },
    requestPermission,
    subscribe,
    unsubscribe: async () => {
      if (!fid) return false;
      await unregister(getMessagingInstance());
      fid = null;
      return true;
    },
  };
}
