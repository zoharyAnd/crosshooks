import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The native adapter imports `react-native` and `@react-native-firebase/messaging`,
// which are native modules that cannot execute under Node/jsdom. We replace both
// with fakes so the test exercises the adapter's own logic — permission gating,
// token caching/hydration, and unsubscribe — not the real Firebase SDK.

const firebase = vi.hoisted(() => ({
  // Mirrors @react-native-firebase/messaging's AuthorizationStatus enum values.
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
    EPHEMERAL: 3,
  },
  getToken: vi.fn(),
  hasPermission: vi.fn(),
  requestPermission: vi.fn(),
  registerDeviceForRemoteMessages: vi.fn(),
  deleteToken: vi.fn(),
}));

const { AuthorizationStatus } = firebase;

const rn = vi.hoisted(() => ({
  Platform: { OS: 'ios' as string, Version: 17 as number },
  PermissionsAndroid: {
    PERMISSIONS: { POST_NOTIFICATIONS: 'android.permission.POST_NOTIFICATIONS' },
    RESULTS: { GRANTED: 'granted', DENIED: 'denied', NEVER_ASK_AGAIN: 'never_ask_again' },
    check: vi.fn(),
    request: vi.fn(),
  },
}));

vi.mock('@react-native-firebase/messaging', () => ({
  AuthorizationStatus: firebase.AuthorizationStatus,
  getMessaging: vi.fn(() => ({ __fake: 'messaging' })),
  getToken: firebase.getToken,
  hasPermission: firebase.hasPermission,
  requestPermission: firebase.requestPermission,
  registerDeviceForRemoteMessages: firebase.registerDeviceForRemoteMessages,
  deleteToken: firebase.deleteToken,
}));

vi.mock('react-native', () => ({
  Platform: rn.Platform,
  PermissionsAndroid: rn.PermissionsAndroid,
}));

// Imported after the mocks are registered.
import { firebaseProvider } from './firebase.native';

beforeEach(() => {
  vi.clearAllMocks();
  rn.Platform.OS = 'ios';
  rn.Platform.Version = 17;
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

  describe('iOS', () => {
    it('maps the APNs authorization status to a permission', async () => {
      const provider = firebaseProvider();

      firebase.hasPermission.mockResolvedValueOnce(AuthorizationStatus.AUTHORIZED);
      expect(await provider.getPermission()).toBe('granted');

      firebase.hasPermission.mockResolvedValueOnce(AuthorizationStatus.PROVISIONAL);
      expect(await provider.getPermission()).toBe('granted');

      firebase.hasPermission.mockResolvedValueOnce(AuthorizationStatus.DENIED);
      expect(await provider.getPermission()).toBe('denied');

      firebase.hasPermission.mockResolvedValueOnce(AuthorizationStatus.NOT_DETERMINED);
      expect(await provider.getPermission()).toBe('default');
    });

    it('subscribe registers the device and returns the FCM token when granted', async () => {
      firebase.hasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      firebase.getToken.mockResolvedValue('fcm-token-123');

      const provider = firebaseProvider();
      const subscription = await provider.subscribe();

      expect(firebase.registerDeviceForRemoteMessages).toHaveBeenCalledOnce();
      expect(firebase.requestPermission).not.toHaveBeenCalled();
      expect(subscription).toEqual({
        provider: 'firebase',
        platform: 'ios',
        token: 'fcm-token-123',
      });
    });

    it('subscribe prompts when undetermined and returns null if refused', async () => {
      firebase.hasPermission.mockResolvedValue(AuthorizationStatus.NOT_DETERMINED);
      firebase.requestPermission.mockResolvedValue(AuthorizationStatus.DENIED);

      const provider = firebaseProvider();
      const subscription = await provider.subscribe();

      expect(firebase.requestPermission).toHaveBeenCalledOnce();
      expect(firebase.registerDeviceForRemoteMessages).not.toHaveBeenCalled();
      expect(firebase.getToken).not.toHaveBeenCalled();
      expect(subscription).toBeNull();
    });

    // Regression guard for the token-restore fix: a freshly created provider must
    // surface the device's existing token on load, without prompting the user.
    it('getSubscription re-hydrates the existing token when already granted', async () => {
      firebase.hasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      firebase.getToken.mockResolvedValue('existing-token');

      const provider = firebaseProvider();
      const subscription = await provider.getSubscription();

      expect(firebase.requestPermission).not.toHaveBeenCalled();
      expect(subscription).toEqual({
        provider: 'firebase',
        platform: 'ios',
        token: 'existing-token',
      });
    });

    it('getSubscription returns null and skips getToken when not granted', async () => {
      firebase.hasPermission.mockResolvedValue(AuthorizationStatus.DENIED);

      const provider = firebaseProvider();

      expect(await provider.getSubscription()).toBeNull();
      expect(firebase.getToken).not.toHaveBeenCalled();
    });

    it('unsubscribe deletes the token and clears cached state', async () => {
      firebase.hasPermission.mockResolvedValue(AuthorizationStatus.AUTHORIZED);
      firebase.getToken.mockResolvedValue('fcm-token-123');

      const provider = firebaseProvider();

      // Nothing to remove before a subscription exists.
      expect(await provider.unsubscribe()).toBe(false);
      expect(firebase.deleteToken).not.toHaveBeenCalled();

      await provider.subscribe();
      expect(await provider.unsubscribe()).toBe(true);
      expect(firebase.deleteToken).toHaveBeenCalledOnce();
    });
  });

  describe('Android', () => {
    beforeEach(() => {
      rn.Platform.OS = 'android';
    });

    it('checks POST_NOTIFICATIONS on Android 13+ without touching Firebase permission', async () => {
      rn.Platform.Version = 33;
      rn.PermissionsAndroid.check.mockResolvedValue(true);

      const provider = firebaseProvider();

      expect(await provider.getPermission()).toBe('granted');
      expect(rn.PermissionsAndroid.check).toHaveBeenCalledWith(
        rn.PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
      );
      expect(firebase.hasPermission).not.toHaveBeenCalled();
    });

    it('requestPermission maps the POST_NOTIFICATIONS result on Android 13+', async () => {
      rn.Platform.Version = 33;
      rn.PermissionsAndroid.request.mockResolvedValue(rn.PermissionsAndroid.RESULTS.GRANTED);

      const provider = firebaseProvider();
      expect(await provider.requestPermission()).toBe('granted');

      rn.PermissionsAndroid.request.mockResolvedValue(rn.PermissionsAndroid.RESULTS.DENIED);
      expect(await provider.requestPermission()).toBe('denied');
    });

    it('treats pre-Android-13 as granted without a runtime prompt', async () => {
      rn.Platform.Version = 32;

      const provider = firebaseProvider();

      expect(await provider.getPermission()).toBe('granted');
      expect(rn.PermissionsAndroid.check).not.toHaveBeenCalled();
    });
  });
});
