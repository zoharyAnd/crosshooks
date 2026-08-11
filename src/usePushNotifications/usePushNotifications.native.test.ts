import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePushNotifications } from './usePushNotifications.native';

describe('usePushNotifications (native)', () => {
  it('reports an unsupported, no-op state and accepts options for API parity', async () => {
    const { result } = renderHook(() =>
      usePushNotifications({ applicationServerKey: 'ignored-on-native' }),
    );

    expect(result.current.isSupported).toBe(false);
    expect(result.current.permission).toBe('default');
    expect(result.current.subscription).toBeNull();
    expect(result.current.isSubscribed).toBe(false);

    await act(async () => {
      expect(await result.current.requestPermission()).toBe('default');
      expect(await result.current.subscribe()).toBeNull();
      expect(await result.current.unsubscribe()).toBe(false);
    });
  });
});
