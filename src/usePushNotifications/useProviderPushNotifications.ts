import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  PushNotifications,
  PushPermission,
  PushProvider,
  PushSubscription,
} from './types';

export function useProviderPushNotifications(provider: PushProvider): PushNotifications {
  const providerRef = useRef(provider);
  providerRef.current = provider;

  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      provider.isSupported(),
      provider.getPermission(),
      provider.getSubscription(),
    ])
      .then(([supported, currentPermission, currentSubscription]) => {
        if (cancelled) return;
        setIsSupported(supported);
        setPermission(currentPermission);
        setSubscription(currentSubscription);
      })
      .catch(() => {
        if (!cancelled) setIsSupported(false);
      });

    return () => {
      cancelled = true;
    };
  }, [provider.id]);

  const requestPermission = useCallback(async () => {
    const result = await providerRef.current.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const subscribe = useCallback(async () => {
    const result = await providerRef.current.subscribe();
    setPermission(await providerRef.current.getPermission());
    setSubscription(result);
    return result;
  }, []);

  const unsubscribe = useCallback(async () => {
    const result = await providerRef.current.unsubscribe();
    if (result) setSubscription(null);
    return result;
  }, []);

  return {
    isSupported,
    permission,
    subscription,
    isSubscribed: subscription !== null,
    requestPermission,
    subscribe,
    unsubscribe,
  };
}
