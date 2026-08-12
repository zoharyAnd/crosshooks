import OneSignal, {
  type IInitObject,
  type SubscriptionChangeEvent,
} from 'react-onesignal';
import type { PushPermission, PushProvider } from '../../usePushNotifications/types';

/**
 * How long {@link waitForSubscriptionId} waits for OneSignal to assign a
 * subscription ID before giving up. A fresh browser needs a round-trip to the
 * OneSignal backend after opt-in, so an immediate read can miss it.
 */
const SUBSCRIPTION_ID_TIMEOUT_MS = 5000;

/**
 * Resolves with the push subscription ID once OneSignal reports one — via the
 * `change` event or an already-populated value — or `null` if the timeout
 * elapses first. This keeps a first-ever `subscribe()` from resolving `null`
 * while the SDK is still registering the browser.
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
      OneSignal.User.PushSubscription.removeEventListener('change', onChange);
      resolve(id);
    };

    const onChange = (change: SubscriptionChangeEvent) => {
      if (change.current.id) finish(change.current.id);
    };

    // Attach the listener before reading so a change that lands in between is
    // not missed.
    const timer = setTimeout(() => finish(null), timeoutMs);
    OneSignal.User.PushSubscription.addEventListener('change', onChange);
    const current = OneSignal.User.PushSubscription.id;
    if (current) finish(current);
  });
}

export interface OneSignalPushConfig {
  /** The OneSignal App ID from your OneSignal dashboard. */
  appId: string;
  /**
   * Extra options forwarded verbatim to `OneSignal.init` (e.g. `safari_web_id`,
   * `serviceWorkerParam`, `serviceWorkerPath`, `promptOptions`). `appId` is set
   * from {@link OneSignalPushConfig.appId} and cannot be overridden here.
   */
  initOptions?: Omit<IInitObject, 'appId'>;
}

/** Creates a OneSignal Web SDK adapter for browser push notifications. */
export function oneSignalProvider(config: OneSignalPushConfig): PushProvider {
  // `OneSignal.init` throws if called more than once, so share a single promise
  // across every method and await it before touching the User/Notifications
  // namespaces (which are only populated once the SDK has initialized).
  let initPromise: Promise<void> | null = null;
  const ensureInit = () => {
    if (!initPromise) {
      initPromise = OneSignal.init({ appId: config.appId, ...config.initOptions });
    }
    return initPromise;
  };

  const asSubscription = (id: string) =>
    ({ provider: 'onesignal', platform: 'web' as const, token: id }) as const;

  // The subscription ID is what you send to OneSignal's REST API to target this
  // browser. It only exists once the user is opted in with a valid push token.
  const currentSubscription = () => {
    const { id, optedIn } = OneSignal.User.PushSubscription;
    return optedIn && id ? asSubscription(id) : null;
  };

  const getPermission = (): PushPermission => {
    if (typeof Notification === 'undefined') return 'default';
    return Notification.permission as PushPermission;
  };

  const requestPermission = async (): Promise<PushPermission> => {
    await ensureInit();
    await OneSignal.Notifications.requestPermission();
    return getPermission();
  };

  return {
    id: 'onesignal',
    // A static browser feature check that is safe to call before init.
    isSupported: () =>
      typeof window !== 'undefined' && OneSignal.Notifications.isPushSupported(),
    getPermission,
    getSubscription: async () => {
      if (getPermission() !== 'granted') return null;
      // Re-hydrate the SDK's persisted subscription on load so the hook reports
      // the real state after a reload, without prompting.
      await ensureInit();
      return currentSubscription();
    },
    requestPermission,
    subscribe: async () => {
      const permission =
        getPermission() === 'granted' ? 'granted' : await requestPermission();
      if (permission !== 'granted') return null;

      await ensureInit();
      // `optIn` registers a push token and flips the subscription to subscribed.
      // Its promise can resolve before the subscription ID is published, so wait
      // for the SDK to actually report one.
      await OneSignal.User.PushSubscription.optIn();
      const id = await waitForSubscriptionId();
      return id ? asSubscription(id) : null;
    },
    unsubscribe: async () => {
      await ensureInit();
      if (!OneSignal.User.PushSubscription.optedIn) return false;
      await OneSignal.User.PushSubscription.optOut();
      return true;
    },
  };
}
