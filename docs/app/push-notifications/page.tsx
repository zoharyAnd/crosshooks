import Link from 'next/link';
import { CodeBlock, Step } from '../components';

export default function PushNotifications() {
  return (
    <article className="rounded-[18px] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          Push notifications
        </span>
        <h1 className="mb-3 text-3xl font-bold">Push notifications</h1>
        <p className="text-sm leading-6 text-muted">
          These steps cover standards-based Web Push, which is built in and
          dependency-free. For native iOS and Android delivery, use a{' '}
          <a href="#ios-android" className="text-accent hover:underline">
            provider
          </a>{' '}
          instead.
        </p>
      </header>

      <section id="ios-android" className="border-t border-line py-6">
        <h2 className="mb-3 text-xl font-bold text-fg">iOS and Android</h2>
        <div className="space-y-3 text-sm leading-6 text-muted">
          <p>
            Web Push cannot register with APNs or FCM on its own. For native iOS and
            Android delivery, use a provider adapter and follow its guide:
          </p>
          <ul className="space-y-2">
            <li>
              <Link href="/provider/firebase" className="text-accent hover:underline">
                Firebase provider
              </Link>
            </li>
            <li>
              <Link href="/provider/onesignal" className="text-accent hover:underline">
                OneSignal provider
              </Link>
            </li>
            <li>
              <Link href="/provider/expo" className="text-accent hover:underline">
                Expo provider
              </Link>
            </li>
          </ul>
        </div>
      </section>

      <Step number={1} title="Prepare Web Push">
        <p>
          The hook needs a secure origin, an active service worker, and a VAPID public
          key. Localhost is treated as secure during development.
        </p>
        <p>Register your service worker once near the root of the web application:</p>
        <CodeBlock
          lang="tsx"
          code={`useEffect(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }
}, []);`}
        />
        <p>
          Place the worker at <code className="font-mono">public/sw.js</code>. It must
          listen for incoming push events and display a notification for production
          delivery.
        </p>
      </Step>

      <Step number={2} title="Create the hook">
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';

function NotificationsButton() {
  const notifications = usePushNotifications({
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
  });

  // Render your UI here.
}`}
        />
        <p>
          The VAPID public key is safe to expose. Its matching private key must remain on
          the server.
        </p>
      </Step>

      <Step number={3} title="Handle unsupported platforms">
        <p>
          Read <code className="font-mono">isSupported</code> before showing the
          subscription controls. It remains false during server rendering and on platforms
          that cannot use Web Push.
        </p>
        <CodeBlock
          lang="tsx"
          code={`if (!notifications.isSupported) {
  return <p>Push notifications are not available on this device.</p>;
}`}
        />
      </Step>

      <Step number={4} title="Subscribe and store the result">
        <p>
          Call <code className="font-mono">subscribe()</code> from a direct user action.
          The browser or operating system may show a permission prompt.
        </p>
        <CodeBlock
          lang="tsx"
          code={`async function enableNotifications() {
  const subscription = await notifications.subscribe();
  if (!subscription) return;

  await fetch('/api/push/subscriptions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(subscription),
  });
}`}
        />
        <p>The Web Push subscription is a serializable object:</p>
        <CodeBlock
          lang="ts"
          code={`{
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}`}
        />
        <p>
          Store the subscription with the authenticated user. A user may have several
          subscriptions across multiple browsers and devices.
        </p>
      </Step>

      <Step number={5} title="Render the controls">
        <CodeBlock
          lang="tsx"
          code={`return (
  <button
    disabled={!notifications.isSupported}
    onClick={async () => {
      if (notifications.isSubscribed) {
        await notifications.unsubscribe();
      } else {
        await enableNotifications();
      }
    }}
  >
    {notifications.isSubscribed
      ? 'Disable notifications'
      : 'Enable notifications'}
  </button>
);`}
        />
        <p>
          If unsubscribing succeeds, also remove or deactivate that subscription in your
          backend.
        </p>
      </Step>

      <Step number={6} title="Send notifications from a trusted backend">
        <p>
          This client hook registers and unregisters devices. It does not securely send
          privileged push messages. Your backend must send through Web Push using the
          stored subscription and your VAPID key pair.
        </p>
        <p className="rounded-xl border border-warn-border bg-warn-bg p-4 text-warn-text">
          Never expose VAPID private keys in a browser bundle, public repository, or{' '}
          <code className="font-mono">NEXT_PUBLIC_*</code> variable.
        </p>
      </Step>

      <Step number={7} title="Test the complete lifecycle">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open the application through HTTPS or localhost.</li>
          <li>Enable notifications from a user-initiated button.</li>
          <li>Confirm that permission becomes granted.</li>
          <li>Confirm that a subscription reaches your backend.</li>
          <li>Send a test message from your backend.</li>
          <li>Test foreground, background, and closed application states.</li>
          <li>Unsubscribe and confirm the backend record is removed.</li>
        </ol>
      </Step>
    </article>
  );
}
