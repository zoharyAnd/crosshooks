import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The native adapter imports `expo-notifications` and `react-native`, which are
// native modules that cannot execute under Node/jsdom. We replace both with
// fakes so the test exercises the adapter's own logic — the permission mapping,
// token caching/hydration, and unsubscribe — not the real SDK.

// Mirrors expo-notifications' IosAuthorizationStatus enum values.
const IosStatus = {
  NOT_DETERMINED: 0,
  DENIED: 1,
  AUTHORIZED: 2,
  PROVISIONAL: 3,
  EPHEMERAL: 4,
} as const;

const expo = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  unregisterForNotificationsAsync: vi.fn(),
}));

const rn = vi.hoisted(() => ({
  Platform: { OS: 'ios' as string },
}));

vi.mock('expo-notifications', () => ({
  IosAuthorizationStatus: {
    NOT_DETERMINED: 0,
    DENIED: 1,
    AUTHORIZED: 2,
    PROVISIONAL: 3,
    EPHEMERAL: 4,
  },
  getPermissionsAsync: expo.getPermissionsAsync,
  requestPermissionsAsync: expo.requestPermissionsAsync,
  getExpoPushTokenAsync: expo.getExpoPushTokenAsync,
  unregisterForNotificationsAsync: expo.unregisterForNotificationsAsync,
}));

vi.mock('react-native', () => ({
  Platform: rn.Platform,
}));

// Imported after the mocks are registered.
import { expoProvider } from './expo.native';

// Builds a permission response like `expo-notifications` returns.
const perm = (
  status: 'granted' | 'undetermined' | 'denied',
  {
    canAskAgain = status !== 'denied',
    ios,
  }: { canAskAgain?: boolean; ios?: number } = {},
): unknown => ({
  status,
  granted: status === 'granted',
  canAskAgain,
  expires: 'never',
  ...(ios !== undefined ? { ios: { status: ios } } : {}),
});

const config = { projectId: 'project-123' };

beforeEach(() => {
  vi.clearAllMocks();
  rn.Platform.OS = 'ios';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('expoProvider (native)', () => {
  it('reports support only on iOS and Android', () => {
    rn.Platform.OS = 'ios';
    expect(expoProvider(config).isSupported()).toBe(true);
    rn.Platform.OS = 'android';
    expect(expoProvider(config).isSupported()).toBe(true);
    rn.Platform.OS = 'web';
    expect(expoProvider(config).isSupported()).toBe(false);
  });

  it('maps the permission response onto our tri-state', async () => {
    const provider = expoProvider(config);

    expo.getPermissionsAsync.mockResolvedValueOnce(perm('granted'));
    expect(await provider.getPermission()).toBe('granted');

    // iOS provisional / ephemeral authorization still deliver notifications.
    expo.getPermissionsAsync.mockResolvedValueOnce(
      perm('denied', { canAskAgain: false, ios: IosStatus.PROVISIONAL }),
    );
    expect(await provider.getPermission()).toBe('granted');
    expo.getPermissionsAsync.mockResolvedValueOnce(
      perm('denied', { canAskAgain: false, ios: IosStatus.EPHEMERAL }),
    );
    expect(await provider.getPermission()).toBe('granted');

    // Never asked — requestable.
    expo.getPermissionsAsync.mockResolvedValueOnce(perm('undetermined'));
    expect(await provider.getPermission()).toBe('default');

    // Soft denial that can still be re-requested (Android).
    expo.getPermissionsAsync.mockResolvedValueOnce(perm('denied', { canAskAgain: true }));
    expect(await provider.getPermission()).toBe('default');

    // Permanent block — can't be re-prompted.
    expo.getPermissionsAsync.mockResolvedValueOnce(
      perm('denied', { canAskAgain: false }),
    );
    expect(await provider.getPermission()).toBe('denied');
  });

  it('subscribe returns the Expo push token when granted', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({
      type: 'expo',
      data: 'ExponentPushToken[abc]',
    });

    const provider = expoProvider(config);
    const subscription = await provider.subscribe();

    expect(expo.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(expo.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-123',
    });
    expect(subscription).toEqual({
      provider: 'expo',
      platform: 'ios',
      token: 'ExponentPushToken[abc]',
    });
  });

  it('subscribe prompts when undetermined and returns null if refused', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('undetermined'));
    expo.requestPermissionsAsync.mockResolvedValue(
      perm('denied', { canAskAgain: false }),
    );

    const provider = expoProvider(config);
    const subscription = await provider.subscribe();

    expect(expo.requestPermissionsAsync).toHaveBeenCalledOnce();
    expect(expo.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

  it('omits projectId from getExpoPushTokenAsync when not configured', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: 'tok' });

    await expoProvider().subscribe();

    expect(expo.getExpoPushTokenAsync).toHaveBeenCalledWith(undefined);
  });

  // Regression guard: a freshly created provider must surface the device's
  // existing token on load, without prompting the user.
  it('getSubscription re-hydrates the existing token when already granted', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({
      type: 'expo',
      data: 'existing-token',
    });

    const provider = expoProvider(config);
    const subscription = await provider.getSubscription();

    expect(expo.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'expo',
      platform: 'ios',
      token: 'existing-token',
    });
  });

  it('getSubscription returns null and skips getExpoPushTokenAsync when not granted', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('undetermined'));

    const provider = expoProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(expo.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('unsubscribe unregisters the device and clears cached state', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({ type: 'expo', data: 'tok' });

    const provider = expoProvider(config);

    // Nothing to remove before a subscription exists.
    expect(await provider.unsubscribe()).toBe(false);
    expect(expo.unregisterForNotificationsAsync).not.toHaveBeenCalled();

    await provider.subscribe();
    expect(await provider.unsubscribe()).toBe(true);
    expect(expo.unregisterForNotificationsAsync).toHaveBeenCalledOnce();
  });

  it('works the same on Android without any platform-specific branching', async () => {
    rn.Platform.OS = 'android';
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({
      type: 'expo',
      data: 'android-token',
    });

    const provider = expoProvider(config);
    const subscription = await provider.subscribe();

    expect(subscription).toEqual({
      provider: 'expo',
      platform: 'android',
      token: 'android-token',
    });
  });
});
