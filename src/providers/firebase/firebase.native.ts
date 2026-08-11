import {
  AuthorizationStatus,
  deleteToken,
  getMessaging,
  getToken,
  hasPermission,
  registerDeviceForRemoteMessages,
  requestPermission as requestFirebasePermission,
} from '@react-native-firebase/messaging';
import { PermissionsAndroid, Platform } from 'react-native';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

/**
 * Native Firebase reads its configuration from the platform's
 * `google-services.json` / `GoogleService-Info.plist`, so no options are
 * required. The parameter exists only for API parity with the web adapter.
 */
export type FirebasePushConfig = Record<string, never>;

function toPermission(status: number): PushPermission {
  if (
    status === AuthorizationStatus.AUTHORIZED ||
    status === AuthorizationStatus.PROVISIONAL ||
    status === AuthorizationStatus.EPHEMERAL
  ) {
    return 'granted';
  }
  if (status === AuthorizationStatus.DENIED) return 'denied';
  return 'default';
}

/** Creates a Firebase Cloud Messaging adapter for iOS and Android. */
export function firebaseProvider(_config: FirebasePushConfig = {}): PushProvider {
  const messaging = getMessaging();
  let token: string | null = null;

  const getPermission = async (): Promise<PushPermission> => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 33) return 'granted';
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!permission) return 'granted';
      return (await PermissionsAndroid.check(permission))
        ? 'granted'
        : 'default';
    }
    return toPermission(await hasPermission(messaging));
  };

  const requestPermission = async (): Promise<PushPermission> => {
    if (Platform.OS === 'android') {
      if (Platform.Version < 33) return 'granted';
      const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
      if (!permission) return 'granted';
      const result = await PermissionsAndroid.request(permission);
      return result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : 'denied';
    }
    return toPermission(await requestFirebasePermission(messaging));
  };

  const asSubscription = (value: string) => ({
    provider: 'firebase',
    platform: Platform.OS as 'ios' | 'android',
    token: value,
  });

  return {
    id: 'firebase',
    isSupported: () => Platform.OS === 'ios' || Platform.OS === 'android',
    getPermission,
    getSubscription: async () => {
      if (token) return asSubscription(token);
      // Re-hydrate the device's existing FCM token on load so the hook reports
      // the real subscription state after an app restart, without prompting.
      if ((await getPermission()) !== 'granted') return null;
      await registerDeviceForRemoteMessages(messaging);
      token = await getToken(messaging);
      return token ? asSubscription(token) : null;
    },
    requestPermission,
    subscribe: async () => {
      const permission =
        (await getPermission()) === 'granted'
          ? 'granted'
          : await requestPermission();
      if (permission !== 'granted') return null;

      await registerDeviceForRemoteMessages(messaging);
      token = await getToken(messaging);
      return asSubscription(token);
    },
    unsubscribe: async () => {
      if (!token) return false;
      await deleteToken(messaging);
      token = null;
      return true;
    },
  };
}
