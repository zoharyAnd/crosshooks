import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// The web adapter drives Firebase's FID-based messaging API. We fake
// `firebase/app` and `firebase/messaging` so the test exercises the adapter's
// own logic — permission gating, the onRegistered callback bridge, FID caching,
// and unregister — without a real Firebase project or a browser push service.

const fb = vi.hoisted(() => {
  let registeredHandler: ((id: string) => void) | null = null;
  let unregisteredHandler: ((id: string) => void) | null = null;
  // Lets each test control the FID that `register()` reports (or `null` to
  // simulate a registration that never yields one).
  const control = { nextFid: 'fid-abc' as string | null };

  return {
    control,
    getApp: vi.fn(() => ({ __fake: 'app' })),
    getApps: vi.fn(() => [] as unknown[]),
    initializeApp: vi.fn(() => ({ __fake: 'app' })),
    getMessaging: vi.fn(() => ({ __fake: 'messaging' })),
    isSupported: vi.fn(async () => true),
    onRegistered: vi.fn((_m: unknown, cb: (id: string) => void) => {
      registeredHandler = cb;
      return () => {
        registeredHandler = null;
      };
    }),
    onUnregistered: vi.fn((_m: unknown, cb: (id: string) => void) => {
      unregisteredHandler = cb;
      return () => {
        unregisteredHandler = null;
      };
    }),
    // Mirrors the real SDK: the onRegistered handler fires with the FID before
    // `register()`'s promise settles.
    register: vi.fn(async () => {
      if (registeredHandler && control.nextFid != null) {
        registeredHandler(control.nextFid);
      }
    }),
    unregister: vi.fn(async () => {
      if (unregisteredHandler && control.nextFid != null) {
        unregisteredHandler(control.nextFid);
      }
    }),
  };
});

vi.mock('firebase/app', () => ({
  getApp: fb.getApp,
  getApps: fb.getApps,
  initializeApp: fb.initializeApp,
}));

vi.mock('firebase/messaging', () => ({
  getMessaging: fb.getMessaging,
  isSupported: fb.isSupported,
  onRegistered: fb.onRegistered,
  onUnregistered: fb.onUnregistered,
  register: fb.register,
  unregister: fb.unregister,
}));

// Imported after the mocks are registered.
import { firebaseProvider } from './firebase.web';

const config = {
  firebaseConfig: { apiKey: 'test' },
  vapidKey: 'vapid-key',
};

const requestPermission = vi.fn(async () => 'granted');

const setPermission = (permission: NotificationPermission) => {
  globalThis.Notification = {
    permission,
    requestPermission,
  } as unknown as typeof Notification;
};

beforeEach(() => {
  vi.clearAllMocks();
  fb.control.nextFid = 'fid-abc';
  requestPermission.mockResolvedValue('granted');
  setPermission('granted');
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('firebaseProvider (web)', () => {
  it('delegates isSupported to the Firebase messaging SDK', async () => {
    expect(await firebaseProvider(config).isSupported()).toBe(true);
    expect(fb.isSupported).toHaveBeenCalledOnce();
  });

  it('reflects the browser Notification permission', () => {
    setPermission('denied');
    expect(firebaseProvider(config).getPermission()).toBe('denied');
  });

  it('subscribe registers and returns the FID as the subscription token', async () => {
    const provider = firebaseProvider(config);
    const subscription = await provider.subscribe();

    expect(fb.register).toHaveBeenCalledOnce();
    expect(fb.register).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ vapidKey: 'vapid-key' }),
    );
    // The onRegistered handler must be attached before register() runs.
    expect(fb.onRegistered).toHaveBeenCalled();
    expect(requestPermission).not.toHaveBeenCalled();
    expect(subscription).toEqual({
      provider: 'firebase',
      platform: 'web',
      token: 'fid-abc',
    });
  });

  it('subscribe prompts when permission is default and returns null if refused', async () => {
    setPermission('default');
    requestPermission.mockResolvedValue('denied');

    const provider = firebaseProvider(config);
    const subscription = await provider.subscribe();

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(fb.register).not.toHaveBeenCalled();
    expect(subscription).toBeNull();
  });

  it('getSubscription re-hydrates the existing FID when already granted', async () => {
    const provider = firebaseProvider(config);
    const subscription = await provider.getSubscription();

    expect(requestPermission).not.toHaveBeenCalled();
    expect(fb.register).toHaveBeenCalledOnce();
    expect(subscription).toEqual({
      provider: 'firebase',
      platform: 'web',
      token: 'fid-abc',
    });
  });

  it('getSubscription returns null and skips register when not granted', async () => {
    setPermission('denied');

    const provider = firebaseProvider(config);

    expect(await provider.getSubscription()).toBeNull();
    expect(fb.register).not.toHaveBeenCalled();
  });

  it('returns null when registration yields no FID', async () => {
    fb.control.nextFid = null;

    const provider = firebaseProvider(config);

    expect(await provider.subscribe()).toBeNull();
  });

  it('unsubscribe unregisters and clears the cached FID', async () => {
    const provider = firebaseProvider(config);

    // Nothing to remove before a subscription exists.
    expect(await provider.unsubscribe()).toBe(false);
    expect(fb.unregister).not.toHaveBeenCalled();

    await provider.subscribe();
    expect(await provider.unsubscribe()).toBe(true);
    expect(fb.unregister).toHaveBeenCalledOnce();

    // Cache cleared: a second unsubscribe is a no-op.
    expect(await provider.unsubscribe()).toBe(false);
  });
});
