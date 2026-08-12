import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The web adapter drives `expo-notifications`' web build, which needs a browser
// service worker and push service. We fake the module so the test exercises the
// adapter's own logic — permission gating, token caching/hydration, and
// unsubscribe — without a real Expo project or a browser push service.

const expo = vi.hoisted(() => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn(),
  unregisterForNotificationsAsync: vi.fn(),
}));

vi.mock('expo-notifications', () => ({
  getPermissionsAsync: expo.getPermissionsAsync,
  requestPermissionsAsync: expo.requestPermissionsAsync,
  getExpoPushTokenAsync: expo.getExpoPushTokenAsync,
  unregisterForNotificationsAsync: expo.unregisterForNotificationsAsync,
}));

// Imported after the mock is registered.
import { expoProvider } from './expo.web';

// Builds a web permission response like `expo-notifications` returns (no iOS
// authorization field on the web).
const perm = (
  status: 'granted' | 'undetermined' | 'denied',
  canAskAgain = status !== 'denied',
): unknown => ({
  status,
  granted: status === 'granted',
  canAskAgain,
  expires: 'never',
});

const config = { projectId: 'project-123' };

// jsdom exposes neither of these by default, so the adapter's feature check
// reports unsupported until we stand them in.
const enablePushSupport = () => {
  vi.stubGlobal('navigator', { serviceWorker: {} });
  vi.stubGlobal('PushManager', function PushManager() {});
};

beforeEach(() => {
  vi.clearAllMocks();
  enablePushSupport();
});

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe('expoProvider (web)', () => {
  it('reports support when the browser exposes push + service worker', () => {
    expect(expoProvider(config).isSupported()).toBe(true);
  });

  it('reports unsupported when the browser lacks the Push API', () => {
    vi.stubGlobal('navigator', {});
    expect(expoProvider(config).isSupported()).toBe(false);
  });

  it('maps the permission response onto our tri-state', async () => {
    const provider = expoProvider(config);

    expo.getPermissionsAsync.mockResolvedValueOnce(perm('granted'));
    expect(await provider.getPermission()).toBe('granted');

    expo.getPermissionsAsync.mockResolvedValueOnce(perm('undetermined'));
    expect(await provider.getPermission()).toBe('default');

    // A browser-level block can't be re-prompted.
    expo.getPermissionsAsync.mockResolvedValueOnce(perm('denied', false));
    expect(await provider.getPermission()).toBe('denied');
  });

  it('subscribe returns the Expo push token when granted', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('granted'));
    expo.getExpoPushTokenAsync.mockResolvedValue({
      type: 'expo',
      data: 'ExponentPushToken[web]',
    });

    const provider = expoProvider(config);
    const subscription = await provider.subscribe();

    expect(expo.requestPermissionsAsync).not.toHaveBeenCalled();
    expect(expo.getExpoPushTokenAsync).toHaveBeenCalledWith({
      projectId: 'project-123',
    });
    expect(subscription).toEqual({
      provider: 'expo',
      platform: 'web',
      token: 'ExponentPushToken[web]',
    });
  });

  it('subscribe prompts when undetermined and returns null if refused', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('undetermined'));
    expo.requestPermissionsAsync.mockResolvedValue(perm('denied', false));

    const provider = expoProvider(config);
    const subscription = await provider.subscribe();

    expect(expo.requestPermissionsAsync).toHaveBeenCalledOnce();
    expect(expo.getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

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
      platform: 'web',
      token: 'existing-token',
    });
  });

  it('getSubscription returns null and skips getExpoPushTokenAsync when not granted', async () => {
    expo.getPermissionsAsync.mockResolvedValue(perm('undetermined'));

    const provider = expoProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(expo.getExpoPushTokenAsync).not.toHaveBeenCalled();
  });

  it('unsubscribe unregisters and clears cached state', async () => {
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
});
