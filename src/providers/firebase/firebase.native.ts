import {
  deleteToken,
  getMessaging,
  getToken,
  registerDeviceForRemoteMessages,
} from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import {
  checkNotifications,
  requestNotifications,
  RESULTS,
  type PermissionStatus,
} from 'react-native-permissions';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

/**
 * Native Firebase reads its configuration from the platform's
 * `google-services.json` / `GoogleService-Info.plist`, so no options are
 * required. The parameter exists only for API parity with the web adapter.
 */
export type FirebasePushConfig = Record<string, never>;

/**
 * Maps a `react-native-permissions` status to our tri-state permission. It
 * handles iOS and Android (including the Android 13+ `POST_NOTIFICATIONS`
 * runtime permission) uniformly, replacing Firebase's deprecated
 * `hasPermission` / `requestPermission` / `AuthorizationStatus` APIs.
 */
function toPermission(status: PermissionStatus): PushPermission {
  switch (status) {
    // `LIMITED` covers iOS provisional/ephemeral authorization.
    case RESULTS.GRANTED:
    case RESULTS.LIMITED:
      return 'granted';
    // `BLOCKED` (and an unavailable feature) can't be prompted for again.
    case RESULTS.BLOCKED:
    case RESULTS.UNAVAILABLE:
      return 'denied';
    // `DENIED` means "not requested yet, but requestable".
    default:
      return 'default';
  }
}

/** Creates a Firebase Cloud Messaging adapter for iOS and Android. */
export function firebaseProvider(_config: FirebasePushConfig = {}): PushProvider {
  const messaging = getMessaging();
  let token: string | null = null;

  const getPermission = async (): Promise<PushPermission> => {
    const { status } = await checkNotifications();
    return toPermission(status);
  };

  const requestPermission = async (): Promise<PushPermission> => {
    const { status } = await requestNotifications(['alert', 'badge', 'sound']);
    return toPermission(status);
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
        (await getPermission()) === 'granted' ? 'granted' : await requestPermission();
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
