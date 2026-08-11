/**
 * Notification permission state, mirroring the web `NotificationPermission`
 * values so the same union works on every platform.
 *
 * - `default` — the user hasn't been asked yet.
 * - `granted` — notifications are allowed.
 * - `denied`  — the user (or platform) has blocked notifications.
 */
export type PushPermission = 'default' | 'granted' | 'denied';

/**
 * The serializable shape of a push subscription — safe to send to your server
 * so it can deliver push messages. Mirrors `PushSubscription.toJSON()`.
 */
export interface PushSubscriptionInfo {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface UsePushNotificationsOptions {
  /**
   * VAPID public key (base64url) used to authenticate the push subscription.
   * Required by Chromium browsers to {@link PushNotifications.subscribe}.
   */
  applicationServerKey?: string;
  /**
   * Whether every push must result in a user-visible notification. Web Push
   * effectively mandates this, so it defaults to `true`.
   */
  userVisibleOnly?: boolean;
}

export interface PushNotifications {
  /**
   * `true` when Web Push is available (Notification + Service Worker +
   * PushManager). `false` on React Native, during SSR, and in browsers that
   * lack Push. Resolved after mount, so it's SSR-safe.
   */
  isSupported: boolean;

  /** Current notification permission. */
  permission: PushPermission;

  /** The active push subscription, or `null` when not subscribed. */
  subscription: PushSubscriptionInfo | null;

  /** Convenience flag: `true` when {@link PushNotifications.subscription} is set. */
  isSubscribed: boolean;

  /** Prompts the user for notification permission and returns the result. */
  requestPermission: () => Promise<PushPermission>;

  /**
   * Ensures permission, then creates (or reuses) a push subscription.
   * Resolves with the subscription info, or `null` if permission was refused
   * or the platform is unsupported.
   */
  subscribe: () => Promise<PushSubscriptionInfo | null>;

  /** Cancels the active subscription. Resolves `true` if one was removed. */
  unsubscribe: () => Promise<boolean>;
}
