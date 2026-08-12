import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  ConnectivitySource,
  OfflineSync,
  SyncItem,
  SyncResult,
  SyncStorage,
  UseOfflineSyncOptions,
} from './types';

export const DEFAULT_STORAGE_KEY = 'crosshooks:offline-sync';

/** A connectivity source that always reports online and never changes. */
export const alwaysOnline: ConnectivitySource = {
  getSnapshot: () => true,
  subscribe: () => () => {},
};

let counter = 0;
/** Generate a unique id, preferring `crypto.randomUUID` when available. */
function createId(): string {
  const cryptoObj =
    typeof globalThis !== 'undefined'
      ? (globalThis.crypto as Crypto | undefined)
      : undefined;
  if (cryptoObj && typeof cryptoObj.randomUUID === 'function') {
    return cryptoObj.randomUUID();
  }
  counter += 1;
  return `${Date.now().toString(36)}-${counter.toString(36)}`;
}

function toError(value: unknown): Error {
  return value instanceof Error ? value : new Error(String(value));
}

/**
 * Platform-agnostic offline mutation queue. The `.web` and `.native` adapters
 * resolve a {@link SyncStorage} and {@link ConnectivitySource} and delegate all
 * queueing, persistence, and draining logic here.
 */
export function useOfflineSyncCore<T>(
  options: UseOfflineSyncOptions<T>,
  storage: SyncStorage | null,
  connectivity: ConnectivitySource,
): OfflineSync<T> {
  const {
    onSync,
    storageKey = DEFAULT_STORAGE_KEY,
    autoFlushOnReconnect = true,
  } = options;

  // Start from SSR-safe defaults; both are resolved after mount so the first
  // client render matches the server render (no hydration mismatch).
  const [isOnline, setIsOnline] = useState(true);
  const [pending, setPending] = useState<ReadonlyArray<SyncItem<T>>>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs hold the latest values so `flush` and the reconnect handler can read
  // fresh state without being recreated on every change.
  const pendingRef = useRef(pending);
  pendingRef.current = pending;
  const onSyncRef = useRef(onSync);
  onSyncRef.current = onSync;
  const isSyncingRef = useRef(false);

  const persist = useCallback(
    (items: ReadonlyArray<SyncItem<T>>) => {
      if (!storage) return;
      try {
        void Promise.resolve(storage.setItem(storageKey, JSON.stringify(items))).catch(
          () => {},
        );
      } catch {
        // Ignore storage write failures (quota, private mode, etc.).
      }
    },
    [storage, storageKey],
  );

  const setQueue = useCallback(
    (items: ReadonlyArray<SyncItem<T>>) => {
      pendingRef.current = items;
      setPending(items);
      persist(items);
    },
    [persist],
  );

  const flush = useCallback(async (): Promise<SyncResult> => {
    if (isSyncingRef.current || !connectivity.getSnapshot()) {
      return { synced: 0, remaining: pendingRef.current.length, ok: false };
    }

    isSyncingRef.current = true;
    setIsSyncing(true);

    const snapshot = pendingRef.current;
    let remaining: SyncItem<T>[] = [...snapshot];
    let synced = 0;
    let failed = false;

    for (const item of snapshot) {
      try {
        await onSyncRef.current(item.payload, item);
        remaining = remaining.filter((entry) => entry.id !== item.id);
        setQueue(remaining);
        synced += 1;
      } catch (caught) {
        // Keep the failed item (with a bumped attempt count) and stop draining
        // so queue ordering is preserved for the caller's next flush.
        remaining = remaining.map((entry) =>
          entry.id === item.id
            ? {
                ...entry,
                attempts: entry.attempts + 1,
                lastError: toError(caught).message,
              }
            : entry,
        );
        setQueue(remaining);
        setError(toError(caught));
        failed = true;
        break;
      }
    }

    if (!failed) setError(null);
    isSyncingRef.current = false;
    setIsSyncing(false);

    return { synced, remaining: remaining.length, ok: !failed };
  }, [connectivity, setQueue]);

  const flushRef = useRef(flush);
  flushRef.current = flush;

  const enqueue = useCallback(
    (payload: T): SyncItem<T> => {
      const item: SyncItem<T> = {
        id: createId(),
        payload,
        createdAt: Date.now(),
        attempts: 0,
      };
      setQueue([...pendingRef.current, item]);
      if (connectivity.getSnapshot()) {
        // Fire-and-forget; failures surface via `error`/item state.
        void flushRef.current();
      }
      return item;
    },
    [connectivity, setQueue],
  );

  const remove = useCallback(
    (id: string) => {
      setQueue(pendingRef.current.filter((entry) => entry.id !== id));
    },
    [setQueue],
  );

  const clear = useCallback(() => {
    setQueue([]);
    setError(null);
  }, [setQueue]);

  // Hydrate the persisted queue and resolve real connectivity after mount.
  useEffect(() => {
    let cancelled = false;

    setIsOnline(connectivity.getSnapshot());

    if (storage) {
      Promise.resolve(storage.getItem(storageKey))
        .then((raw) => {
          if (cancelled || !raw) return;
          const parsed = JSON.parse(raw) as SyncItem<T>[];
          if (Array.isArray(parsed) && parsed.length > 0) {
            setQueue(parsed);
          }
        })
        .catch(() => {
          // Corrupt or unreadable storage — start from an empty queue.
        });
    }

    const unsubscribe = connectivity.subscribe((online) => {
      if (cancelled) return;
      setIsOnline(online);
      if (online && autoFlushOnReconnect) {
        void flushRef.current();
      }
    });

    return () => {
      cancelled = true;
      unsubscribe();
    };
    // Intentionally run once on mount; `connectivity`/`storage` identity is
    // stable per platform adapter and options are read via refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    isOnline,
    pending,
    isSyncing,
    error,
    enqueue,
    flush,
    remove,
    clear,
  };
}
