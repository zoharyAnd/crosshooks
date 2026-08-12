import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The native adapter imports `react-native-onesignal` and `react-native`, which
// are native modules that cannot execute under Node/jsdom. We replace both with
// fakes so the test exercises the adapter's own logic — the permission-enum
// mapping, opt-in/opt-out, and subscription-ID hydration — not the real SDK.

// Mirrors OneSignal's OSNotificationPermission enum values.
const Permission = {
  NotDetermined: 0,
  Denied: 1,
  Authorized: 2,
  Provisional: 3,
  Ephemeral: 4,
} as const;

const os = vi.hoisted(() => {
  // Captures the `change` listener the adapter attaches so tests can simulate
  // OneSignal assigning a subscription ID asynchronously.
  let changeListener: ((event: { current: { id?: string } }) => void) | null = null;
  return {
    initialize: vi.fn(),
    permissionNative: vi.fn(),
    requestPermission: vi.fn(),
    getOptedInAsync: vi.fn(),
    getIdAsync: vi.fn(),
    optIn: vi.fn(),
    optOut: vi.fn(),
    addEventListener: vi.fn((_event: 'change', cb) => {
      changeListener = cb;
    }),
    removeEventListener: vi.fn(() => {
      changeListener = null;
    }),
    emitChange: (id?: string) => changeListener?.({ current: { id } }),
  };
});

const rn = vi.hoisted(() => ({
  Platform: { OS: 'ios' as string },
}));

vi.mock('react-native-onesignal', () => ({
  OSNotificationPermission: {
    NotDetermined: 0,
    Denied: 1,
    Authorized: 2,
    Provisional: 3,
    Ephemeral: 4,
  },
  OneSignal: {
    initialize: os.initialize,
    Notifications: {
      permissionNative: os.permissionNative,
      requestPermission: os.requestPermission,
    },
    User: {
      pushSubscription: {
        getOptedInAsync: os.getOptedInAsync,
        getIdAsync: os.getIdAsync,
        optIn: os.optIn,
        optOut: os.optOut,
        addEventListener: os.addEventListener,
        removeEventListener: os.removeEventListener,
      },
    },
  },
}));

vi.mock('react-native', () => ({
  Platform: rn.Platform,
}));

// Imported after the mocks are registered.
import { oneSignalProvider } from './onesignal.native';

const config = { appId: 'app-id-123' };

beforeEach(() => {
  vi.clearAllMocks();
  rn.Platform.OS = 'ios';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('oneSignalProvider (native)', () => {
  it('reports support only on iOS and Android', () => {
    rn.Platform.OS = 'ios';
    expect(oneSignalProvider(config).isSupported()).toBe(true);
    rn.Platform.OS = 'android';
    expect(oneSignalProvider(config).isSupported()).toBe(true);
    rn.Platform.OS = 'web';
    expect(oneSignalProvider(config).isSupported()).toBe(false);
  });

  it('maps the native permission enum onto our tri-state', async () => {
    const provider = oneSignalProvider(config);

    os.permissionNative.mockResolvedValueOnce(Permission.Authorized);
    expect(await provider.getPermission()).toBe('granted');

    // iOS provisional / ephemeral authorization still deliver notifications.
    os.permissionNative.mockResolvedValueOnce(Permission.Provisional);
    expect(await provider.getPermission()).toBe('granted');
    os.permissionNative.mockResolvedValueOnce(Permission.Ephemeral);
    expect(await provider.getPermission()).toBe('granted');

    os.permissionNative.mockResolvedValueOnce(Permission.Denied);
    expect(await provider.getPermission()).toBe('denied');

    // Not requested yet, but requestable.
    os.permissionNative.mockResolvedValueOnce(Permission.NotDetermined);
    expect(await provider.getPermission()).toBe('default');
  });

  it('requestPermission prompts without settings fallback and re-reads the status', async () => {
    os.requestPermission.mockResolvedValue(true);
    os.permissionNative.mockResolvedValue(Permission.Authorized);

    const provider = oneSignalProvider(config);
    expect(await provider.requestPermission()).toBe('granted');
    expect(os.requestPermission).toHaveBeenCalledWith(false);
  });

  it('subscribe opts in and returns the subscription ID when granted', async () => {
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    os.getIdAsync.mockResolvedValue('sub-123');

    const provider = oneSignalProvider(config);
    const subscription = await provider.subscribe();

    expect(os.initialize).toHaveBeenCalled();
    expect(os.optIn).toHaveBeenCalledOnce();
    expect(os.requestPermission).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'onesignal',
      platform: 'ios',
      token: 'sub-123',
    });
  });

  it('subscribe prompts when undetermined and returns null if refused', async () => {
    os.permissionNative.mockResolvedValueOnce(Permission.NotDetermined); // initial check
    os.permissionNative.mockResolvedValueOnce(Permission.Denied); // after prompt
    os.requestPermission.mockResolvedValue(false);

    const provider = oneSignalProvider(config);
    const subscription = await provider.subscribe();

    expect(os.requestPermission).toHaveBeenCalledOnce();
    expect(os.optIn).not.toHaveBeenCalled();
    expect(os.getIdAsync).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

  it('resolves with the subscription ID delivered by a later change event', async () => {
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    // No ID stored yet, mimicking a fresh install still registering.
    os.getIdAsync.mockResolvedValue(null);

    const provider = oneSignalProvider(config);
    const pending = provider.subscribe();

    // Once the adapter is waiting, simulate OneSignal publishing the ID.
    await vi.waitFor(() => expect(os.addEventListener).toHaveBeenCalled());
    os.emitChange('async-sub');

    expect(await pending).toEqual({
      provider: 'onesignal',
      platform: 'ios',
      token: 'async-sub',
    });
    expect(os.optIn).toHaveBeenCalledOnce();
    // The listener is cleaned up once resolved.
    expect(os.removeEventListener).toHaveBeenCalledOnce();
  });

  it('returns null when no subscription ID arrives before the timeout', async () => {
    vi.useFakeTimers();
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    os.getIdAsync.mockResolvedValue(null);

    const provider = oneSignalProvider(config);
    const pending = provider.subscribe();

    await vi.advanceTimersByTimeAsync(6000);

    expect(await pending).toBeNull();
    expect(os.optIn).toHaveBeenCalledOnce();
    vi.useRealTimers();
  });

  it('getSubscription re-hydrates the existing subscription when opted in', async () => {
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    os.getOptedInAsync.mockResolvedValue(true);
    os.getIdAsync.mockResolvedValue('existing-sub');

    const provider = oneSignalProvider(config);
    const subscription = await provider.getSubscription();

    expect(os.requestPermission).not.toHaveBeenCalled();
    expect(os.optIn).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'onesignal',
      platform: 'ios',
      token: 'existing-sub',
    });
  });

  it('getSubscription returns null when granted but not opted in', async () => {
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    os.getOptedInAsync.mockResolvedValue(false);

    const provider = oneSignalProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(os.getIdAsync).not.toHaveBeenCalled();
  });

  it('getSubscription returns null when not granted', async () => {
    os.permissionNative.mockResolvedValue(Permission.Denied);

    const provider = oneSignalProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(os.getOptedInAsync).not.toHaveBeenCalled();
  });

  it('unsubscribe opts out only when currently opted in', async () => {
    const provider = oneSignalProvider(config);

    os.getOptedInAsync.mockResolvedValueOnce(false);
    expect(await provider.unsubscribe()).toBe(false);
    expect(os.optOut).not.toHaveBeenCalled();

    os.getOptedInAsync.mockResolvedValueOnce(true);
    expect(await provider.unsubscribe()).toBe(true);
    expect(os.optOut).toHaveBeenCalledOnce();
  });

  it('works the same on Android without any platform-specific branching', async () => {
    rn.Platform.OS = 'android';
    os.permissionNative.mockResolvedValue(Permission.Authorized);
    os.getIdAsync.mockResolvedValue('android-sub');

    const provider = oneSignalProvider(config);
    const subscription = await provider.subscribe();

    expect(subscription).toEqual({
      provider: 'onesignal',
      platform: 'android',
      token: 'android-sub',
    });
  });
});
