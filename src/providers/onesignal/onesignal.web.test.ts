import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The web adapter drives the OneSignal Web SDK (the `react-onesignal` default
// export). We fake it so the test exercises the adapter's own logic —
// permission gating, one-time init, opt-in/opt-out, and subscription-ID
// hydration — without a real OneSignal app or a browser push service.

const os = vi.hoisted(() => {
  // Lets each test control what a fresh opt-in reports as its subscription ID
  // (or `null` to simulate an opt-in that never yields one) and whether the
  // browser advertises push support.
  const control = { nextId: 'sub-123' as string | null, pushSupported: true };
  // Mutable subscription state the fake SDK reads back through getters.
  const sub = { id: null as string | null, optedIn: false };
  // Captures the `change` listener the adapter attaches so tests can simulate
  // OneSignal assigning a subscription ID asynchronously.
  let changeListener: ((change: { current: { id: string | null } }) => void) | null =
    null;

  return {
    control,
    sub,
    emitChange: (id: string | null) => changeListener?.({ current: { id } }),
    default: {
      init: vi.fn(async () => {}),
      Notifications: {
        isPushSupported: vi.fn(() => control.pushSupported),
        requestPermission: vi.fn(async () => true),
      },
      User: {
        PushSubscription: {
          get id() {
            return sub.id;
          },
          get optedIn() {
            return sub.optedIn;
          },
          optIn: vi.fn(async () => {
            sub.optedIn = true;
            sub.id = control.nextId;
          }),
          optOut: vi.fn(async () => {
            sub.optedIn = false;
          }),
          addEventListener: vi.fn((_event: 'change', cb) => {
            changeListener = cb;
          }),
          removeEventListener: vi.fn(() => {
            changeListener = null;
          }),
        },
      },
    },
  };
});

vi.mock('react-onesignal', () => ({ default: os.default }));

// Imported after the mock is registered.
import { oneSignalProvider } from './onesignal.web';

const config = { appId: 'app-id-123' };

const requestNotificationPermission = vi.fn(async () => 'granted');

const setPermission = (permission: NotificationPermission) => {
  globalThis.Notification = {
    permission,
    requestPermission: requestNotificationPermission,
  } as unknown as typeof Notification;
};

beforeEach(() => {
  vi.clearAllMocks();
  os.control.nextId = 'sub-123';
  os.control.pushSupported = true;
  os.sub.id = null;
  os.sub.optedIn = false;
  setPermission('granted');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('oneSignalProvider (web)', () => {
  it('delegates isSupported to the OneSignal push feature check', () => {
    expect(oneSignalProvider(config).isSupported()).toBe(true);
    expect(os.default.Notifications.isPushSupported).toHaveBeenCalledOnce();

    os.control.pushSupported = false;
    expect(oneSignalProvider(config).isSupported()).toBe(false);
  });

  it('reflects the browser Notification permission', () => {
    setPermission('denied');
    expect(oneSignalProvider(config).getPermission()).toBe('denied');
  });

  it('subscribe opts in and returns the subscription ID as the token', async () => {
    const provider = oneSignalProvider(config);
    const subscription = await provider.subscribe();

    expect(os.default.init).toHaveBeenCalledOnce();
    expect(os.default.User.PushSubscription.optIn).toHaveBeenCalledOnce();
    expect(os.default.Notifications.requestPermission).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'onesignal',
      platform: 'web',
      token: 'sub-123',
    });
  });

  it('subscribe prompts when permission is default and returns null if refused', async () => {
    setPermission('default');

    const provider = oneSignalProvider(config);
    const subscription = await provider.subscribe();

    expect(os.default.Notifications.requestPermission).toHaveBeenCalledOnce();
    // Permission never became granted, so no opt-in was attempted.
    expect(os.default.User.PushSubscription.optIn).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

  it('resolves with the subscription ID delivered by a later change event', async () => {
    // Opt-in leaves the ID unset, mimicking a fresh browser still registering.
    os.control.nextId = null;

    const provider = oneSignalProvider(config);
    const pending = provider.subscribe();

    // Once the adapter is waiting, simulate OneSignal publishing the ID.
    await vi.waitFor(() =>
      expect(os.default.User.PushSubscription.addEventListener).toHaveBeenCalled(),
    );
    os.emitChange('async-sub');

    expect(await pending).toEqual({
      provider: 'onesignal',
      platform: 'web',
      token: 'async-sub',
    });
    // The listener is cleaned up once resolved.
    expect(os.default.User.PushSubscription.removeEventListener).toHaveBeenCalledOnce();
  });

  it('returns null when no subscription ID arrives before the timeout', async () => {
    vi.useFakeTimers();
    os.control.nextId = null;

    const provider = oneSignalProvider(config);
    const pending = provider.subscribe();

    // Drain the opt-in microtasks, then let the wait time out with no event.
    await vi.advanceTimersByTimeAsync(6000);

    expect(await pending).toBeNull();
    expect(os.default.User.PushSubscription.optIn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('getSubscription re-hydrates the existing subscription when opted in', async () => {
    os.sub.id = 'existing-sub';
    os.sub.optedIn = true;

    const provider = oneSignalProvider(config);
    const subscription = await provider.getSubscription();

    expect(os.default.Notifications.requestPermission).not.toHaveBeenCalled();
    expect(os.default.User.PushSubscription.optIn).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'onesignal',
      platform: 'web',
      token: 'existing-sub',
    });
  });

  it('getSubscription returns null when granted but not opted in', async () => {
    os.sub.optedIn = false;

    const provider = oneSignalProvider(config);

    expect(await provider.getSubscription()).toBeNull();
  });

  it('getSubscription returns null and skips init when not granted', async () => {
    setPermission('denied');

    const provider = oneSignalProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(os.default.init).not.toHaveBeenCalled();
  });

  it('unsubscribe opts out only when currently opted in', async () => {
    const provider = oneSignalProvider(config);

    // Nothing to remove before a subscription exists.
    expect(await provider.unsubscribe()).toBe(false);
    expect(os.default.User.PushSubscription.optOut).not.toHaveBeenCalled();

    await provider.subscribe();
    expect(await provider.unsubscribe()).toBe(true);
    expect(os.default.User.PushSubscription.optOut).toHaveBeenCalledOnce();

    // State cleared: a second unsubscribe is a no-op.
    expect(await provider.unsubscribe()).toBe(false);
  });
});
