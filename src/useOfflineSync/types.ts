/**
 * A single queued mutation waiting to be synced with your server.
 *
 * @typeParam T - the shape of the payload you enqueue.
 */
export interface SyncItem<T> {
  /** Stable, unique id assigned when the item is enqueued. */
  id: string;
  /** The payload you passed to {@link OfflineSync.enqueue}. */
  payload: T;
  /** Epoch milliseconds at which the item was enqueued. */
  createdAt: number;
  /** How many times {@link UseOfflineSyncOptions.onSync} has failed for this item. */
  attempts: number;
  /** Message of the most recent sync failure, if any. */
  lastError?: string;
}

/**
 * Minimal key/value persistence contract. Values are opaque JSON strings.
 *
 * On web this is satisfied by `localStorage`; on React Native you pass
 * `@react-native-async-storage/async-storage`, which matches this shape.
 * Every method may be sync or async.
 */
export interface SyncStorage {
  getItem: (key: string) => string | null | Promise<string | null>;
  setItem: (key: string, value: string) => void | Promise<void>;
  removeItem: (key: string) => void | Promise<void>;
}

/**
 * A source of online/offline state. Web resolves this from `navigator.onLine`
 * and the `online`/`offline` events; on native you can supply one backed by
 * `@react-native-community/netinfo`.
 */
export interface ConnectivitySource {
  /** Current connectivity. Called during effects, never during SSR render. */
  getSnapshot: () => boolean;
  /**
   * Subscribe to connectivity changes. Returns an unsubscribe function.
   * The callback receives the new online state.
   */
  subscribe: (onChange: (online: boolean) => void) => () => void;
}

/** Outcome of a {@link OfflineSync.flush} pass. */
export interface SyncResult {
  /** Number of items successfully synced and removed from the queue. */
  synced: number;
  /** Number of items still queued after the pass. */
  remaining: number;
  /** `true` when the whole queue drained without a failure or a skip. */
  ok: boolean;
}

export interface UseOfflineSyncOptions<T> {
  /**
   * Processes one queued item — typically the network write that was
   * unavailable offline. Resolve to mark the item synced; throw (or reject)
   * to keep it queued and stop the pass so ordering is preserved.
   */
  onSync: (payload: T, item: SyncItem<T>) => unknown | Promise<unknown>;

  /**
   * Storage key under which the queue is persisted.
   * Defaults to `crosshooks:offline-sync`. Use distinct keys for distinct queues.
   */
  storageKey?: string;

  /**
   * Persistence adapter. Defaults to `localStorage` on web. On React Native
   * pass AsyncStorage; omit it to keep the queue in memory only (lost on reload).
   */
  storage?: SyncStorage;

  /**
   * Connectivity source. Defaults to the browser's `navigator.onLine` on web.
   * On React Native, omit it to assume always-online, or pass a NetInfo-backed
   * source.
   */
  connectivity?: ConnectivitySource;

  /**
   * Whether to automatically {@link OfflineSync.flush} when connectivity is
   * regained. Defaults to `true`.
   */
  autoFlushOnReconnect?: boolean;
}

export interface OfflineSync<T> {
  /**
   * `true` when the device is online. Optimistically `true` during SSR and the
   * first client render, then resolved from the connectivity source after mount.
   */
  isOnline: boolean;

  /** The queued items still awaiting sync, in enqueue order. */
  pending: ReadonlyArray<SyncItem<T>>;

  /** `true` while a {@link OfflineSync.flush} pass is running. */
  isSyncing: boolean;

  /** The most recent sync error, cleared once the queue fully drains. */
  error: Error | null;

  /**
   * Queue a payload for syncing. Returns the created {@link SyncItem}.
   * If online, a flush is scheduled automatically.
   */
  enqueue: (payload: T) => SyncItem<T>;

  /**
   * Attempt to drain the queue through {@link UseOfflineSyncOptions.onSync}.
   * No-ops while offline or already syncing. Safe to call at any time.
   */
  flush: () => Promise<SyncResult>;

  /** Remove a single queued item by id without syncing it. */
  remove: (id: string) => void;

  /** Discard every queued item without syncing. */
  clear: () => void;
}
