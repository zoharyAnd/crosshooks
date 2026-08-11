import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { usePushNotifications } from './usePushNotifications.web';
import type { PushPermission } from './types';

function makeFakeSubscription() {
  return {
    endpoint: 'https://push.example.com/abc123',
    unsubscribe: vi.fn().mockResolvedValue(true),
    toJSON: () => ({
      endpoint: 'https://push.example.com/abc123',
      expirationTime: null,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    }),
  };
}

interface EnvOptions {
  permission?: PushPermission;
  requestResult?: PushPermission;
  existing?: ReturnType<typeof makeFakeSubscription> | null;
}

/**
 * Installs a fake Web Push environment (Notification + serviceWorker +
 * PushManager) onto the jsdom globals so the web hook has something to drive.
 */
function setupSupportedEnv(options: EnvOptions = {}) {
  const { permission = 'default', requestResult = 'granted', existing = null } = options;

  const newSubscription = makeFakeSubscription();
  const pushManager = {
    getSubscription: vi.fn().mockResolvedValue(existing),
    subscribe: vi.fn().mockResolvedValue(newSubscription),
  };
  const requestPermission = vi.fn().mockResolvedValue(requestResult);

  vi.stubGlobal('Notification', { permission, requestPermission });
  vi.stubGlobal('PushManager', function PushManager() {});
  Object.defineProperty(navigator, 'serviceWorker', {
    value: { ready: Promise.resolve({ pushManager }) },
    configurable: true,
    writable: true,
  });

  return { pushManager, requestPermission, newSubscription, existing };
}

afterEach(() => {
  vi.unstubAllGlobals();
  Reflect.deleteProperty(navigator, 'serviceWorker');
  vi.restoreAllMocks();
});

describe('usePushNotifications (web)', () => {
  it('reports unsupported when Web Push APIs are absent', () => {
    const { result } = renderHook(() => usePushNotifications());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('default');
    expect(result.current.subscription).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });

  it('reflects support and the current permission after mount', async () => {
    setupSupportedEnv({ permission: 'granted' });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => expect(result.current.isSupported).toBe(true));
    expect(result.current.permission).toBe('granted');
  });

  it('reads an existing subscription on mount', async () => {
    const existing = makeFakeSubscription();
    setupSupportedEnv({ permission: 'granted', existing });

    const { result } = renderHook(() => usePushNotifications());

    await waitFor(() => expect(result.current.isSubscribed).toBe(true));
    expect(result.current.subscription).toEqual({
      endpoint: 'https://push.example.com/abc123',
      expirationTime: null,
      keys: { p256dh: 'p256dh-key', auth: 'auth-key' },
    });
  });

  it('requestPermission prompts and updates state', async () => {
    const { requestPermission } = setupSupportedEnv({
      permission: 'default',
      requestResult: 'granted',
    });

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.isSupported).toBe(true));

    let returned: PushPermission | undefined;
    await act(async () => {
      returned = await result.current.requestPermission();
    });

    expect(requestPermission).toHaveBeenCalledOnce();
    expect(returned).toBe('granted');
    expect(result.current.permission).toBe('granted');
  });

  it('subscribe requests permission, subscribes, and returns the info', async () => {
    const { pushManager } = setupSupportedEnv({
      permission: 'default',
      requestResult: 'granted',
    });

    const { result } = renderHook(() =>
      usePushNotifications({ applicationServerKey: 'dGVzdC1rZXk' }),
    );
    await waitFor(() => expect(result.current.isSupported).toBe(true));

    let info: unknown;
    await act(async () => {
      info = await result.current.subscribe();
    });

    expect(pushManager.subscribe).toHaveBeenCalledWith(
      expect.objectContaining({
        userVisibleOnly: true,
        applicationServerKey: expect.any(Uint8Array),
      }),
    );
    expect(info).toMatchObject({ endpoint: 'https://push.example.com/abc123' });
    expect(result.current.isSubscribed).toBe(true);
  });

  it('subscribe returns null when permission is refused', async () => {
    const { pushManager } = setupSupportedEnv({
      permission: 'default',
      requestResult: 'denied',
    });

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.isSupported).toBe(true));

    let info: unknown = 'unset';
    await act(async () => {
      info = await result.current.subscribe();
    });

    expect(info).toBeNull();
    expect(pushManager.subscribe).not.toHaveBeenCalled();
    expect(result.current.permission).toBe('denied');
  });

  it('unsubscribe cancels the active subscription', async () => {
    const existing = makeFakeSubscription();
    setupSupportedEnv({ permission: 'granted', existing });

    const { result } = renderHook(() => usePushNotifications());
    await waitFor(() => expect(result.current.isSubscribed).toBe(true));

    let removed: boolean | undefined;
    await act(async () => {
      removed = await result.current.unsubscribe();
    });

    expect(existing.unsubscribe).toHaveBeenCalledOnce();
    expect(removed).toBe(true);
    expect(result.current.subscription).toBeNull();
    expect(result.current.isSubscribed).toBe(false);
  });
});
