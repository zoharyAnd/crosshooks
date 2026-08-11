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

export interface FirebasePushConfig {}

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

  return {
    id: 'firebase',
    isSupported: () => Platform.OS === 'ios' || Platform.OS === 'android',
    getPermission,
    getSubscription: () =>
      token
        ? {
            provider: 'firebase',
            platform: Platform.OS as 'ios' | 'android',
            token,
          }
        : null,
    requestPermission,
    subscribe: async () => {
      const permission =
        (await getPermission()) === 'granted'
          ? 'granted'
          : await requestPermission();
      if (permission !== 'granted') return null;

      await registerDeviceForRemoteMessages(messaging);
      token = await getToken(messaging);
      return {
        provider: 'firebase',
        platform: Platform.OS as 'ios' | 'android',
        token,
      };
    },
    unsubscribe: async () => {
      if (!token) return false;
      await deleteToken(messaging);
      token = null;
      return true;
    },
  };
}
