import {
  getExpoPushTokenAsync,
  getPermissionsAsync,
  requestPermissionsAsync,
  unregisterForNotificationsAsync,
  IosAuthorizationStatus,
  type NotificationPermissionsStatus,
} from 'expo-notifications';
import { Platform } from 'react-native';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

export interface ExpoPushConfig {
  /**
   * EAS project ID, forwarded to `getExpoPushTokenAsync`. Required in bare and
   * production builds where Expo can't infer it from the manifest; optional in
   * managed development where it's read from `app.json` automatically.
   */
  projectId?: string;
}

/**
 * Maps Expo's permission response onto our tri-state. `expo-notifications`
 * models both a coarse `status` and the finer iOS authorization enum, so this
 * reads both to tell "never asked" (requestable) apart from a hard denial and
 * to treat iOS provisional/ephemeral authorization as granted.
 */
function toPermission(status: NotificationPermissionsStatus): PushPermission {
  if (status.granted) return 'granted';

  // iOS provisional / ephemeral authorization still deliver notifications, even
  // though the coarse `status` isn't `granted`.
  const iosStatus = status.ios?.status;
  if (
    iosStatus === IosAuthorizationStatus.PROVISIONAL ||
    iosStatus === IosAuthorizationStatus.EPHEMERAL
  ) {
    return 'granted';
  }

  // `undetermined`, or a soft `denied` that can still be re-requested (Android
  // before a permanent block), is "not asked yet, but requestable".
  if (status.status === 'undetermined' || status.canAskAgain) return 'default';
  return 'denied';
}

/** Creates an Expo push adapter for iOS and Android using `expo-notifications`. */
export function expoProvider(config: ExpoPushConfig = {}): PushProvider {
  // The Expo push token identifies this device to Expo's push service — the
  // value you send to Expo's `/push/send` API. Cache it so `getSubscription`
  // and `unsubscribe` don't have to re-issue one.
  let token: string | null = null;

  const getPermission = async (): Promise<PushPermission> =>
    toPermission(await getPermissionsAsync());

  const requestPermission = async (): Promise<PushPermission> =>
    toPermission(await requestPermissionsAsync());

  const asSubscription = (value: string) => ({
    provider: 'expo',
    platform: Platform.OS as 'ios' | 'android',
    token: value,
  });

  const fetchToken = async () => {
    const { data } = await getExpoPushTokenAsync(
      config.projectId ? { projectId: config.projectId } : undefined,
    );
    token = data;
    return asSubscription(data);
  };

  return {
    id: 'expo',
    isSupported: () => Platform.OS === 'ios' || Platform.OS === 'android',
    getPermission,
    getSubscription: async () => {
      if (token) return asSubscription(token);
      // Re-hydrate the device's existing token on load so the hook reports the
      // real subscription state after an app restart, without prompting.
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
      // Unregister the device from APNs/FCM so Expo stops delivering to it.
      await unregisterForNotificationsAsync();
      token = null;
      return true;
    },
  };
}
