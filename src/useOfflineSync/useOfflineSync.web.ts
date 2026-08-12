import { useMemo } from 'react';
import type {
  ConnectivitySource,
  OfflineSync,
  SyncStorage,
  UseOfflineSyncOptions,
} from './types';
import { alwaysOnline, useOfflineSyncCore } from './useOfflineSyncCore';

/** `localStorage`, wrapped so a missing or throwing store degrades gracefully. */
function getWebStorage(): SyncStorage | null {
  if (typeof window === 'undefined' || !window.localStorage) return null;
  const store = window.localStorage;
  return {
    getItem: (key) => {
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: (key, value) => {
      try {
        store.setItem(key, value);
      } catch {
        // Quota exceeded or private mode — persistence is best-effort.
      }
    },
    removeItem: (key) => {
      try {
        store.removeItem(key);
      } catch {
        // Ignore.
      }
    },
  };
}

/** Connectivity backed by `navigator.onLine` and the `online`/`offline` events. */
function getWebConnectivity(): ConnectivitySource {
  if (typeof window === 'undefined' || typeof navigator === 'undefined') {
    return alwaysOnline;
  }
  return {
    getSnapshot: () => navigator.onLine,
    subscribe: (onChange) => {
      const handleOnline = () => onChange(true);
      const handleOffline = () => onChange(false);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    },
  };
}

/**
 * A persistent, connectivity-aware queue for mutations made while offline.
 * Enqueue writes as they happen; they are stored and automatically drained
 * through `onSync` when the browser regains connectivity.
 *
 * Web implementation. Resolved on web bundlers via the default `exports`
 * condition; React Native bundlers resolve the `.native` counterpart instead.
 */
export function useOfflineSync<T>(options: UseOfflineSyncOptions<T>): OfflineSync<T> {
  // `null` on the server so the first render is window-free and SSR-safe.
  const storage = useMemo(() => options.storage ?? getWebStorage(), [options.storage]);
  const connectivity = useMemo(
    () => options.connectivity ?? getWebConnectivity(),
    [options.connectivity],
  );

  return useOfflineSyncCore(options, storage, connectivity);
}
