import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The native adapter imports `react-native`, `@react-native-firebase/messaging`,
// and `react-native-permissions`, which are native modules that cannot execute
// under Node/jsdom. We replace all three with fakes so the test exercises the
// adapter's own logic — permission gating, token caching/hydration, and
// unsubscribe — not the real SDKs.

const firebase = vi.hoisted(() => ({
  getToken: vi.fn(),
  registerDeviceForRemoteMessages: vi.fn(),
  deleteToken: vi.fn(),
}));

const rn = vi.hoisted(() => ({
  Platform: { OS: 'ios' as string },
}));

const permissions = vi.hoisted(() => ({
  RESULTS: {
    UNAVAILABLE: 'unavailable',
    BLOCKED: 'blocked',
    DENIED: 'denied',
    GRANTED: 'granted',
    LIMITED: 'limited',
  } as const,
  checkNotifications: vi.fn(),
  requestNotifications: vi.fn(),
}));

vi.mock('@react-native-firebase/messaging', () => ({
  getMessaging: vi.fn(() => ({ __fake: 'messaging' })),
  getToken: firebase.getToken,
  registerDeviceForRemoteMessages: firebase.registerDeviceForRemoteMessages,
  deleteToken: firebase.deleteToken,
}));

vi.mock('react-native', () => ({
  Platform: rn.Platform,
}));

vi.mock('react-native-permissions', () => ({
  RESULTS: permissions.RESULTS,
  checkNotifications: permissions.checkNotifications,
  requestNotifications: permissions.requestNotifications,
}));

// Imported after the mocks are registered.
import { firebaseProvider } from './firebase.native';

const check = (status: string) => ({ status, settings: {} });

beforeEach(() => {
  vi.clearAllMocks();
  rn.Platform.OS = 'ios';
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('firebaseProvider (native)', () => {
  it('reports support only on iOS and Android', () => {
    rn.Platform.OS = 'ios';
    expect(firebaseProvider().isSupported()).toBe(true);
    rn.Platform.OS = 'android';
    expect(firebaseProvider().isSupported()).toBe(true);
    rn.Platform.OS = 'web';
    expect(firebaseProvider().isSupported()).toBe(false);
  });

  it('maps the notification permission status onto our tri-state', async () => {
    const provider = firebaseProvider();

    permissions.checkNotifications.mockResolvedValueOnce(check('granted'));
    expect(await provider.getPermission()).toBe('granted');

    // iOS provisional / ephemeral authorization.
    permissions.checkNotifications.mockResolvedValueOnce(check('limited'));
    expect(await provider.getPermission()).toBe('granted');

    // Blocked can't be re-prompted, so it surfaces as a hard denial.
    permissions.checkNotifications.mockResolvedValueOnce(check('blocked'));
    expect(await provider.getPermission()).toBe('denied');

    permissions.checkNotifications.mockResolvedValueOnce(check('unavailable'));
    expect(await provider.getPermission()).toBe('denied');

    // Not requested yet, but requestable.
    permissions.checkNotifications.mockResolvedValueOnce(check('denied'));
    expect(await provider.getPermission()).toBe('default');
  });

  it('requestPermission asks for alert/badge/sound and maps the result', async () => {
    permissions.requestNotifications.mockResolvedValue(check('granted'));

    const provider = firebaseProvider();
    expect(await provider.requestPermission()).toBe('granted');
    expect(permissions.requestNotifications).toHaveBeenCalledWith([
      'alert',
      'badge',
      'sound',
    ]);

    permissions.requestNotifications.mockResolvedValue(check('blocked'));
    expect(await provider.requestPermission()).toBe('denied');
  });

  it('subscribe registers the device and returns the FCM token when granted', async () => {
    permissions.checkNotifications.mockResolvedValue(check('granted'));
    firebase.getToken.mockResolvedValue('fcm-token-123');

    const provider = firebaseProvider();
    const subscription = await provider.subscribe();

    expect(firebase.registerDeviceForRemoteMessages).toHaveBeenCalledOnce();
    expect(permissions.requestNotifications).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'firebase',
      platform: 'ios',
      token: 'fcm-token-123',
    });
  });

  it('subscribe prompts when undetermined and returns null if refused', async () => {
    permissions.checkNotifications.mockResolvedValue(check('denied'));
    permissions.requestNotifications.mockResolvedValue(check('blocked'));

    const provider = firebaseProvider();
    const subscription = await provider.subscribe();

    expect(permissions.requestNotifications).toHaveBeenCalledOnce();
    expect(firebase.registerDeviceForRemoteMessages).not.toHaveBeenCalled();
    expect(firebase.getToken).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

  // Regression guard for the token-restore fix: a freshly created provider must
  // surface the device's existing token on load, without prompting the user.
  it('getSubscription re-hydrates the existing token when already granted', async () => {
    permissions.checkNotifications.mockResolvedValue(check('granted'));
    firebase.getToken.mockResolvedValue('existing-token');

    const provider = firebaseProvider();
    const subscription = await provider.getSubscription();

    expect(permissions.requestNotifications).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'firebase',
      platform: 'ios',
      token: 'existing-token',
    });
  });

  it('getSubscription returns null and skips getToken when not granted', async () => {
    permissions.checkNotifications.mockResolvedValue(check('denied'));

    const provider = firebaseProvider();

    expect(await provider.getSubscription()).toBeNull();
    expect(firebase.getToken).not.toHaveBeenCalled();
  });

  it('unsubscribe deletes the token and clears cached state', async () => {
    permissions.checkNotifications.mockResolvedValue(check('granted'));
    firebase.getToken.mockResolvedValue('fcm-token-123');

    const provider = firebaseProvider();

    // Nothing to remove before a subscription exists.
    expect(await provider.unsubscribe()).toBe(false);
    expect(firebase.deleteToken).not.toHaveBeenCalled();

    await provider.subscribe();
    expect(await provider.unsubscribe()).toBe(true);
    expect(firebase.deleteToken).toHaveBeenCalledOnce();
  });

  it('works the same on Android without any platform-specific branching', async () => {
    rn.Platform.OS = 'android';
    permissions.checkNotifications.mockResolvedValue(check('granted'));
    firebase.getToken.mockResolvedValue('android-token');

    const provider = firebaseProvider();
    const subscription = await provider.subscribe();

    expect(subscription).toEqual({
      provider: 'firebase',
      platform: 'android',
      token: 'android-token',
    });
  });
});
