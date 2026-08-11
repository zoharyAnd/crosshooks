import { useCallback, useEffect, useState } from 'react';
import type {
  PushNotifications,
  PushPermission,
  PushSubscriptionInfo,
  UsePushNotificationsOptions,
} from './types';
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

function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'Notification' in window &&
    'serviceWorker' in navigator &&
    'PushManager' in window
  );
}

/** Convert a base64url VAPID key into the `Uint8Array` the Push API expects. */
function urlBase64ToUint8Array(base64: string) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const normalized = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(normalized);
  const output = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) {
    output[i] = raw.charCodeAt(i);
  }
  return output;
}

function toInfo(subscription: PushSubscription | null): PushSubscriptionInfo | null {
  if (!subscription) return null;
  const json = subscription.toJSON();
  return {
    endpoint: json.endpoint ?? subscription.endpoint,
    expirationTime: json.expirationTime ?? null,
    keys: {
      p256dh: json.keys?.p256dh ?? '',
      auth: json.keys?.auth ?? '',
    },
  };
}

/**
 * Manages the Web Push lifecycle — permission, subscription, and unsubscription
 * — behind one imperative API.
 *
 * Web implementation. Resolved on web bundlers via the default `exports`
 * condition; React Native bundlers resolve the `.native` counterpart instead.
 */
export function usePushNotifications(
  options: UsePushNotificationsOptions = {},
): PushNotifications {
  const { applicationServerKey, provider, userVisibleOnly = true } = options;
  const providerNotifications = useProviderPushNotifications(
    provider ?? unsupportedProvider,
  );

  const [isSupported, setIsSupported] = useState(false);
  // Start from SSR-safe defaults; the real values are resolved after mount so
  // the first client render matches the server render (no hydration mismatch).
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscriptionInfo | null>(null);

  useEffect(() => {
    if (!isPushSupported()) return;

    setIsSupported(true);
    setPermission(Notification.permission as PushPermission);

    let cancelled = false;
    navigator.serviceWorker.ready
      .then((registration) => registration.pushManager.getSubscription())
      .then((existing) => {
        if (!cancelled) setSubscription(toInfo(existing));
      })
      .catch(() => {
        // No ready registration yet — leave the subscription null.
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const requestPermission = useCallback(async (): Promise<PushPermission> => {
    if (!isPushSupported()) return 'default';
    const result = (await Notification.requestPermission()) as PushPermission;
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async (): Promise<PushSubscriptionInfo | null> => {
    if (!isPushSupported()) return null;

    let current = Notification.permission as PushPermission;
    if (current !== 'granted') {
      current = (await Notification.requestPermission()) as PushPermission;
      setPermission(current);
    }
    if (current !== 'granted') return null;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    const sub =
      existing ??
      (await registration.pushManager.subscribe({
        userVisibleOnly,
        ...(applicationServerKey
          ? { applicationServerKey: urlBase64ToUint8Array(applicationServerKey) }
          : {}),
      }));

    const info = toInfo(sub);
    setSubscription(info);
    return info;
  }, [applicationServerKey, userVisibleOnly]);

  const unsubscribe = useCallback(async (): Promise<boolean> => {
    if (!isPushSupported()) return false;

    const registration = await navigator.serviceWorker.ready;
    const existing = await registration.pushManager.getSubscription();
    if (!existing) {
      setSubscription(null);
      return false;
    }

    const removed = await existing.unsubscribe();
    if (removed) setSubscription(null);
    return removed;
  }, []);

  const webPushNotifications: PushNotifications = {
    isSupported,
    permission,
    subscription,
    isSubscribed: subscription !== null,
    requestPermission,
    subscribe,
    unsubscribe,
  };

  return provider ? providerNotifications : webPushNotifications;
}
