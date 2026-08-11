import Link from 'next/link';
import { CodeBlock, Step } from './components';

export default function GettingStarted() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Documentation
        </span>
        <h1 className="mb-3 text-3xl font-bold">Getting started</h1>
        <p className="leading-6 text-[#93a0c4]">
          Install <code className="font-mono">crosshooks</code>, choose a push
          transport, register the device, and send its subscription to your backend.
        </p>
      </header>

      <Step number={1} title="Install the package">
        <CodeBlock
          lang="bash"
          code="pnpm add @zoharyandrianome/crosshooks"
        />
        <p>
          React 16.8 or newer is required. Provider SDKs are optional and are only
          installed when your application chooses that provider.
        </p>
      </Step>

      <Step number={2} title="Choose how push subscriptions are created">
        <p>You have two options:</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#263050] bg-[#0f1526] p-4">
            <h3 className="font-semibold text-[#e8ecf8]">Standards-based Web Push</h3>
            <p className="mt-2">
              Built in and dependency-free. It works in supported browsers and
              returns a Web Push endpoint plus encryption keys. On React Native it is
              a safe no-op.
            </p>
          </div>
          <div className="rounded-xl border border-[#263050] bg-[#0f1526] p-4">
            <h3 className="font-semibold text-[#e8ecf8]">Provider adapter</h3>
            <p className="mt-2">
              Use Firebase for web, iOS, and Android. It returns a provider token and
              requires the optional provider SDK and platform configuration.
            </p>
          </div>
        </div>
        <p>
          If you need React Native support, choose a provider. The default Web Push
          implementation cannot register with APNs or FCM on its own.
        </p>
      </Step>

      <Step number={3} title="Prepare Web Push">
        <p>
          Skip this step if you are using a provider adapter. The default hook needs
          a secure origin, an active service worker, and a VAPID public key.
          Localhost is treated as secure during development.
        </p>
        <p>
          Register your service worker once near the root of the web application:
        </p>
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

      <Step number={4} title="Create the hook">
        <p>For standards-based Web Push:</p>
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
          The VAPID public key is safe to expose. Its matching private key must remain
          on the server.
        </p>
        <p>For Firebase, pass the Firebase adapter instead:</p>
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { firebaseProvider } from '@zoharyandrianome/crosshooks/firebase';

const firebasePush = firebaseProvider({ /* Firebase Web configuration */ });

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: firebasePush });
}`}
        />
        <p>
          Follow the{' '}
          <Link
            href="/docs/provider/firebase"
            className="text-[#6ea8fe] hover:underline"
          >
            Firebase provider guide
          </Link>{' '}
          before using this version.
        </p>
      </Step>

      <Step number={5} title="Handle unsupported platforms">
        <p>
          Read <code className="font-mono">isSupported</code> before showing the
          subscription controls. It remains false during server rendering and on
          platforms that cannot use the selected transport.
        </p>
        <CodeBlock
          lang="tsx"
          code={`if (!notifications.isSupported) {
  return <p>Push notifications are not available on this device.</p>;
}`}
        />
      </Step>

      <Step number={6} title="Subscribe and store the result">
        <p>
          Call <code className="font-mono">subscribe()</code> from a direct user
          action. The browser or operating system may show a permission prompt.
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
        <p>The result has one of these serializable shapes:</p>
        <CodeBlock
          lang="ts"
          code={`// Standards-based Web Push
{
  endpoint: string;
  expirationTime: number | null;
  keys: { p256dh: string; auth: string };
}

// Firebase or another token provider
{
  provider: string;
  platform: 'web' | 'ios' | 'android';
  token: string;
}`}
        />
        <p>
          Store the subscription with the authenticated user and its provider. A user
          may have several subscriptions across multiple browsers and devices.
        </p>
      </Step>

      <Step number={7} title="Render the controls">
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
          If unsubscribing succeeds, also remove or deactivate that subscription in
          your backend.
        </p>
      </Step>

      <Step number={8} title="Send notifications from a trusted backend">
        <p>
          This client hook registers and unregisters devices. It does not securely
          send privileged push messages. Your backend must select the stored provider
          and send through Web Push, Firebase Admin SDK, or that provider&apos;s server
          API.
        </p>
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
          Never expose VAPID private keys, Firebase service accounts, APNs keys, or
          provider REST API keys in a browser bundle, React Native bundle, public
          repository, or <code className="font-mono">NEXT_PUBLIC_*</code> variable.
        </p>
      </Step>

      <Step number={9} title="Test the complete lifecycle">
        <ol className="list-decimal space-y-2 pl-5">
          <li>Open the application through HTTPS or localhost.</li>
          <li>Enable notifications from a user-initiated button.</li>
          <li>Confirm that permission becomes granted.</li>
          <li>Confirm that a subscription or token reaches your backend.</li>
          <li>Send a test message from your backend or provider console.</li>
          <li>Test foreground, background, and closed application states.</li>
          <li>Unsubscribe and confirm the backend record is removed.</li>
        </ol>
      </Step>
    </article>
  );
}
