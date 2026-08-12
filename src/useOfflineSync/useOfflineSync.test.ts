import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useOfflineSync } from './useOfflineSync.web';
import { DEFAULT_STORAGE_KEY } from './useOfflineSyncCore';

/** Force `navigator.onLine` to a given value for the duration of a test. */
function setOnline(value: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    get: () => value,
  });
}

function goOffline() {
  setOnline(false);
  act(() => {
    window.dispatchEvent(new Event('offline'));
  });
}

function goOnline() {
  setOnline(true);
  act(() => {
    window.dispatchEvent(new Event('online'));
  });
}

beforeEach(() => {
  setOnline(true);
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
  window.localStorage.clear();
});

describe('useOfflineSync (web)', () => {
  it('resolves the online state after mount', async () => {
    const { result } = renderHook(() => useOfflineSync<string>({ onSync: vi.fn() }));

    await waitFor(() => expect(result.current.isOnline).toBe(true));
    expect(result.current.pending).toHaveLength(0);
  });

  it('syncs immediately when enqueuing while online', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOfflineSync<{ n: number }>({ onSync }));

    await act(async () => {
      result.current.enqueue({ n: 1 });
    });

    await waitFor(() => expect(onSync).toHaveBeenCalledOnce());
    expect(onSync).toHaveBeenCalledWith(
      { n: 1 },
      expect.objectContaining({ attempts: 0 }),
    );
    expect(result.current.pending).toHaveLength(0);
  });

  it('queues while offline and drains on reconnect', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    const { result } = renderHook(() => useOfflineSync<string>({ onSync }));

    goOffline();
    await waitFor(() => expect(result.current.isOnline).toBe(false));

    act(() => {
      result.current.enqueue('a');
      result.current.enqueue('b');
    });

    expect(onSync).not.toHaveBeenCalled();
    expect(result.current.pending).toHaveLength(2);

    goOnline();

    await waitFor(() => expect(result.current.pending).toHaveLength(0));
    expect(onSync).toHaveBeenCalledTimes(2);
    expect(onSync.mock.calls.map((c) => c[0])).toEqual(['a', 'b']);
  });

  it('keeps a failing item queued with a bumped attempt count and preserves order', async () => {
    const onSync = vi
      .fn()
      .mockRejectedValueOnce(new Error('boom'))
      .mockResolvedValue(undefined);
    const { result } = renderHook(() => useOfflineSync<string>({ onSync }));

    goOffline();
    await waitFor(() => expect(result.current.isOnline).toBe(false));
    act(() => {
      result.current.enqueue('first');
      result.current.enqueue('second');
    });

    goOnline();

    // First flush stops at the failing head item; second remains untouched.
    await waitFor(() => expect(result.current.error?.message).toBe('boom'));
    expect(result.current.pending).toHaveLength(2);
    expect(result.current.pending[0]).toMatchObject({ payload: 'first', attempts: 1 });

    // A manual retry drains both now that onSync resolves.
    await act(async () => {
      await result.current.flush();
    });
    expect(result.current.pending).toHaveLength(0);
    expect(result.current.error).toBeNull();
  });

  it('persists the queue to localStorage and restores it on remount', async () => {
    const onSync = vi.fn().mockResolvedValue(undefined);
    goOffline();

    const first = renderHook(() => useOfflineSync<string>({ onSync }));
    await waitFor(() => expect(first.result.current.isOnline).toBe(false));
    act(() => {
      first.result.current.enqueue('persisted');
    });
    expect(window.localStorage.getItem(DEFAULT_STORAGE_KEY)).toContain('persisted');
    first.unmount();

    const second = renderHook(() => useOfflineSync<string>({ onSync }));
    await waitFor(() => expect(second.result.current.pending).toHaveLength(1));
    expect(second.result.current.pending[0]?.payload).toBe('persisted');
  });

  it('removes and clears queued items', async () => {
    const { result } = renderHook(() => useOfflineSync<string>({ onSync: vi.fn() }));
    goOffline();
    await waitFor(() => expect(result.current.isOnline).toBe(false));

    let id = '';
    act(() => {
      id = result.current.enqueue('x').id;
      result.current.enqueue('y');
    });
    expect(result.current.pending).toHaveLength(2);

    act(() => result.current.remove(id));
    expect(result.current.pending).toEqual([expect.objectContaining({ payload: 'y' })]);

    act(() => result.current.clear());
    expect(result.current.pending).toHaveLength(0);
  });

  it('no-ops flush while offline', async () => {
    const onSync = vi.fn();
    const { result } = renderHook(() => useOfflineSync<string>({ onSync }));
    goOffline();
    await waitFor(() => expect(result.current.isOnline).toBe(false));
    act(() => {
      result.current.enqueue('z');
    });

    let outcome;
    await act(async () => {
      outcome = await result.current.flush();
    });

    expect(onSync).not.toHaveBeenCalled();
    expect(outcome).toEqual({ synced: 0, remaining: 1, ok: false });
  });
});
