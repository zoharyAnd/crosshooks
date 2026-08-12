import { useMemo } from 'react';
import type { OfflineSync, UseOfflineSyncOptions } from './types';
import { alwaysOnline, useOfflineSyncCore } from './useOfflineSyncCore';

/**
 * React Native implementation.
 *
 * React Native has no `localStorage` or `navigator.onLine`, and crosshooks
 * stays dependency-free, so persistence and connectivity are injected: pass
 * `storage` (e.g. AsyncStorage) to survive reloads and `connectivity` (e.g. a
 * NetInfo-backed source) to react to the network. With neither, the queue lives
 * in memory and the device is assumed online — the API stays identical to web,
 * so shared components work unchanged on mobile.
 */
export function useOfflineSync<T>(options: UseOfflineSyncOptions<T>): OfflineSync<T> {
  const storage = useMemo(() => options.storage ?? null, [options.storage]);
  const connectivity = useMemo(
    () => options.connectivity ?? alwaysOnline,
    [options.connectivity],
  );

  return useOfflineSyncCore(options, storage, connectivity);
}
