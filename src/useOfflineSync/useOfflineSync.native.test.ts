import { act, renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { useOfflineSync } from './useOfflineSync.native';
import type { ConnectivitySource, SyncStorage } from './types';

/** An async in-memory store mirroring AsyncStorage's shape. */
function createMemoryStorage(initial: Record<string, string> = {}): SyncStorage {
  const map = new Map(Object.entries(initial));
  return {
    getItem: async (key) => map.get(key) ?? null,
    setItem: async (key, value) => {
      map.set(key, value);
    },
    removeItem: async (key) => {
      map.delete(key);
    },
  };
}

/** A controllable connectivity source for driving reconnect behavior. */
function createConnectivity(initial: boolean) {
  let online = initial;
  const listeners = new Set<(online: boolean) => void>();
  const source: ConnectivitySource = {
    getSnapshot: () => online,
    subscribe: (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
  };
  const set = (value: boolean) => {
    online = value;
    act(() => {
      listeners.forEach((l) => l(value));
    });
  };
  return { source, set };
}

describe('useOfflineSync (native)', () => {
  it('defaults to always-online, in-memory behavior with no adapters', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOfflineSync<string>({ onSync }));

    await waitFor(() => expect(result.current.isOnline).toBe(true));

    await act(async () => {
      result.current.enqueue('hello');
    });

    await waitFor(() => expect(onSync).toHaveBeenCalledWith('hello', expect.anything()));
    expect(result.current.pending).toHaveLength(0);
  });

  it('uses an injected connectivity source and storage to queue and drain', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const storage = createMemoryStorage();
    const { source, set } = createConnectivity(false);

    const { result } = renderHook(() =>
      useOfflineSync<string>({ onSync, storage, connectivity: source }),
    );

    await waitFor(() => expect(result.current.isOnline).toBe(false));
    act(() => {
      result.current.enqueue('queued');
    });
    expect(onSync).not.toHaveBeenCalled();

    set(true);

    await waitFor(() => expect(result.current.pending).toHaveLength(0));
    expect(onSync).toHaveBeenCalledWith('queued', expect.anything());
    expect(await storage.getItem('crosshooks:offline-sync')).toBe('[]');
  });

  it('restores a persisted queue from injected storage on mount', async () => {
    const seeded = createMemoryStorage({
      'crosshooks:offline-sync': JSON.stringify([
        { id: '1', payload: 'restored', createdAt: 0, attempts: 0 },
      ]),
    });
    const { source } = createConnectivity(false);

    const { result } = renderHook(() =>
      useOfflineSync<string>({ onSync: vi.fn(), storage: seeded, connectivity: source }),
    );

    await waitFor(() => expect(result.current.pending).toHaveLength(1));
    expect(result.current.pending[0]?.payload).toBe('restored');
  });
});
