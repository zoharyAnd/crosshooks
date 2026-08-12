import {
  OneSignal,
  OSNotificationPermission,
  type PushSubscriptionChangedState,
} from 'react-native-onesignal';
import { Platform } from 'react-native';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

export interface OneSignalPushConfig {
  /** The OneSignal App ID from your OneSignal dashboard. */
  appId: string;
}

/**
 * How long {@link waitForSubscriptionId} waits for OneSignal to assign a
 * subscription ID before giving up. A fresh install needs a round-trip to the
 * OneSignal backend after opt-in, so an immediate read can miss it.
 */
const SUBSCRIPTION_ID_TIMEOUT_MS = 5000;

/**
 * Resolves with the push subscription ID once OneSignal reports one — via the
 * `change` event or an already-stored value — or `null` if the timeout elapses
 * first. `optIn()` is fire-and-forget on native, so a first-ever `subscribe()`
 * would otherwise resolve `null` while the SDK is still registering the device.
 */
function waitForSubscriptionId(
  timeoutMs = SUBSCRIPTION_ID_TIMEOUT_MS,
): Promise<string | null> {
  return new Promise((resolve) => {
    let settled = false;

    const finish = (id: string | null) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      OneSignal.User.pushSubscription.removeEventListener('change', onChange);
      resolve(id);
    };

    const onChange = (event: PushSubscriptionChangedState) => {
      if (event.current.id) finish(event.current.id);
    };

    // Attach the listener before reading so a change that lands in between is
    // not missed.
    const timer = setTimeout(() => finish(null), timeoutMs);
    OneSignal.User.pushSubscription.addEventListener('change', onChange);
    void OneSignal.User.pushSubscription.getIdAsync().then((id) => {
      if (id) finish(id);
    });
  });
}

/**
 * Maps OneSignal's native permission enum onto our tri-state. Unlike the boolean
 * `getPermissionAsync`, this distinguishes "never asked" (requestable) from a
 * hard denial, so the hook doesn't re-prompt a user who already said no.
 */
function toPermission(status: OSNotificationPermission): PushPermission {
  switch (status) {
    // iOS provisional/ephemeral authorization both deliver notifications.
    case OSNotificationPermission.Authorized:
    case OSNotificationPermission.Provisional:
    case OSNotificationPermission.Ephemeral:
      return 'granted';
    case OSNotificationPermission.Denied:
      return 'denied';
    // NotDetermined — not requested yet, but requestable.
    default:
      return 'default';
  }
}

/** Creates a OneSignal adapter for iOS and Android push notifications. */
export function oneSignalProvider(config: OneSignalPushConfig): PushProvider {
  // `initialize` is idempotent on the native side, but guard it anyway so the
  // adapter can be constructed once and reused.
  let initialized = false;
  const ensureInit = () => {
    if (!initialized) {
      OneSignal.initialize(config.appId);
      initialized = true;
    }
  };

  const asSubscription = (id: string) => ({
    provider: 'onesignal',
    platform: Platform.OS as 'ios' | 'android',
    token: id,
  });

  const getPermission = async (): Promise<PushPermission> => {
    ensureInit();
    return toPermission(await OneSignal.Notifications.permissionNative());
  };

  const requestPermission = async (): Promise<PushPermission> => {
    ensureInit();
    // `false` keeps a declined prompt from bouncing the user out to Settings.
    await OneSignal.Notifications.requestPermission(false);
    // Re-read the native status rather than trusting the boolean return value,
    // which is unreliable across platforms in the current SDK.
    return getPermission();
  };

  return {
    id: 'onesignal',
    isSupported: () => Platform.OS === 'ios' || Platform.OS === 'android',
    getPermission,
    getSubscription: async () => {
      if ((await getPermission()) !== 'granted') return null;
      // Re-hydrate the device's existing subscription on load so the hook
      // reports the real state after an app restart, without prompting.
      if (!(await OneSignal.User.pushSubscription.getOptedInAsync())) return null;
      const id = await OneSignal.User.pushSubscription.getIdAsync();
      return id ? asSubscription(id) : null;
    },
    requestPermission,
    subscribe: async () => {
      const permission =
        (await getPermission()) === 'granted' ? 'granted' : await requestPermission();
      if (permission !== 'granted') return null;

      // `optIn` is fire-and-forget on native; the subscription ID becomes
      // available once the device registers with OneSignal, so wait for the SDK
      // to report one rather than reading immediately.
      OneSignal.User.pushSubscription.optIn();
      const id = await waitForSubscriptionId();
      return id ? asSubscription(id) : null;
    },
    unsubscribe: async () => {
      if (!(await OneSignal.User.pushSubscription.getOptedInAsync())) return false;
      OneSignal.User.pushSubscription.optOut();
      return true;
    },
  };
}
