'use client';

import { useState } from 'react';
import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { StateRow } from '../StateRow';
import { VAPID_PUBLIC_KEY } from '../vapid';

export default function Page() {
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
    <div className="w-full max-w-[520px] rounded-[18px] border border-line bg-surface p-8 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
      <header className="mb-6">
        <span className="mb-3.5 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          crosshooks
        </span>
        <h2 className="mb-2.5 text-[26px] font-bold">
          <code className="font-mono">usePushNotifications</code>
        </h2>
        <h3 className="text-[20px] font-bold">Web demo</h3>
        <p className="leading-6 text-muted">
          One cross-platform hook for the Web Push lifecycle — permission, subscribe,
          unsubscribe. A safe no-op on React Native.
        </p>
      </header>

      <section
        className="mb-6 flex flex-col gap-2"
        aria-label="usePushNotifications state"
      >
        <StateRow label="isSupported" value={isSupported} />
        <StateRow label="permission" value={permission} />
        <StateRow label="isSubscribed" value={isSubscribed} />
      </section>

      <section className="flex flex-col gap-3">
        <button
          className="w-full cursor-pointer rounded-xl bg-accent px-[18px] py-3.5 font-semibold text-on-accent transition-[transform,opacity] duration-200 enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.45]"
          onClick={toggle}
          disabled={disabled}
        >
          {busy
            ? 'Working…'
            : isSubscribed
              ? 'Disable notifications'
              : 'Enable notifications'}
        </button>

        {isSubscribed && (
          <button
            className="w-full cursor-pointer rounded-xl bg-accent px-[18px] py-3.5 font-semibold text-on-accent transition-[transform,opacity] duration-200 enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.45]"
            onClick={sendTestPush}
            disabled={busy}
          >
            {busy ? 'Working…' : 'Send test push'}
          </button>
        )}

        {subscription && (
          <p className="text-sm text-muted">
            Subscribed. {'endpoint' in subscription ? 'Endpoint:' : 'Token:'}
            <code className="mt-1.5 block break-all font-mono text-[11px] text-muted">
              {'endpoint' in subscription ? subscription.endpoint : subscription.token}
            </code>
          </p>
        )}
        {error && <p className="text-sm text-danger">⚠ {error}</p>}
      </section>

      <footer className="mt-[22px] border-t border-line pt-[18px] text-sm leading-6 text-muted [&_p]:m-0">
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
