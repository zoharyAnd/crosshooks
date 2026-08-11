'use client';

import { useState } from 'react';
import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { StateRow } from './StateRow';
import { VAPID_PUBLIC_KEY } from './vapid';

export function PushCard() {
  const { isSupported, permission, subscription, isSubscribed, subscribe, unsubscribe } =
    usePushNotifications({ applicationServerKey: VAPID_PUBLIC_KEY });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    setBusy(true);
    setError(null);
    try {
      if (isSubscribed) {
        await unsubscribe();
      } else {
        await subscribe();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  async function sendTestPush() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification('👋 Hello there! ');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  const disabled = !isSupported || permission === 'denied' || busy;

  return (
    <div className="card">
      <header className="header">
        <span className="badge">crosshooks</span>
        <h2 className="hook-name">
          <code>usePushNotifications</code>
        </h2>
        <p className="tagline">
          One cross-platform hook for the Web Push lifecycle — permission, subscribe,
          unsubscribe. A safe no-op on React Native.
        </p>
      </header>

      <section className="state" aria-label="usePushNotifications state">
        <StateRow label="isSupported" value={isSupported} />
        <StateRow label="permission" value={permission} />
        <StateRow label="isSubscribed" value={isSubscribed} />
      </section>

      <section className="actions">
        <button className="install" onClick={toggle} disabled={disabled}>
          {busy
            ? 'Working…'
            : isSubscribed
              ? 'Disable notifications'
              : 'Enable notifications'}
        </button>

        {isSubscribed && (
          <button className="install" onClick={sendTestPush} disabled={busy}>
            {busy ? 'Working…' : 'Send test push'}
          </button>
        )}

        {subscription && (
          <p className="outcome">
            Subscribed. Endpoint:
            <code className="endpoint">{subscription.endpoint}</code>
          </p>
        )}
        {error && <p className="outcome error">⚠ {error}</p>}
      </section>

      <footer className="hint">
        {permission === 'denied' ? (
          <p>Notifications are blocked for this site in your browser settings.</p>
        ) : !isSupported ? (
          <p>
            Web Push isn’t available here — it needs Notification + Service Worker +
            PushManager over HTTPS.
          </p>
        ) : isSubscribed ? (
          <p>
            You have an active push subscription. In a real app, the endpoint above is
            sent to your server, which uses it to deliver pushes.
          </p>
        ) : (
          <p>
            Click to grant permission and create a real push subscription against your
            browser’s push service.
          </p>
        )}
      </footer>
    </div>
  );
}
