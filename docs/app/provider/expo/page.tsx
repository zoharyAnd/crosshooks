import { CodeBlock, Step } from '../../components';

export default function ExpoProviderDocumentation() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Provider guide
        </span>
        <h1 className="mb-3 text-3xl font-bold">Expo push notifications</h1>
        <p className="leading-6 text-[#93a0c4]">
          Configure <code className="font-mono">usePushNotifications</code> with Expo on
          iOS, Android, and the web. The hook asks for permission and registers the
          device; <code className="font-mono">expo-notifications</code> returns an Expo
          push token (<code className="font-mono">ExponentPushToken[…]</code>) that you
          send to Expo&apos;s push service to target the device. The steps below are the
          one-time Expo and native platform setup that has to exist before it can run.
        </p>
      </header>

      <Step number={1} title="Create the Expo project">
        <p>
          Sign in to Expo (EAS) and create a project, or reuse an existing one. Copy the{' '}
          <span className="italic">project ID</span> from the project dashboard — the
          provider forwards it to <code className="font-mono">getExpoPushTokenAsync</code>{' '}
          so the token is tied to your Expo push credentials. In a managed development
          build Expo can read it from <code className="font-mono">app.json</code>, but
          bare and production builds need it passed explicitly.
        </p>
      </Step>

      <Step number={2} title="Install the package">
        <p>Install the package and the optional Expo Notifications SDK:</p>
        <CodeBlock
          lang="bash"
          code="pnpm add @zoharyandrianome/crosshooks expo-notifications"
        />
        <p>
          Add the <code className="font-mono">expo-notifications</code> config plugin to{' '}
          <code className="font-mono">app.json</code> so the native projects are
          configured during prebuild:
        </p>
        <CodeBlock
          lang="json"
          code={`{
  "expo": {
    "plugins": ["expo-notifications"]
  }
}`}
        />
      </Step>

      <Step number={3} title="Use the hook on iOS and Android">
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { expoProvider } from '@zoharyandrianome/crosshooks/expo';

const expoPush = expoProvider({ projectId: 'your-eas-project-id' });

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: expoPush });
  return <Button title="Enable notifications" onPress={notifications.subscribe} />;
}`}
        />
        <p>
          Keep the provider object outside the component so it stays stable.{' '}
          <code className="font-mono">subscribe()</code> requests permission, registers
          the device, and returns the Expo push token. Send that token to your backend and
          associate it with the signed-in user.
        </p>
      </Step>

      <Step number={4} title="Add the Android credentials">
        <p>
          Expo delivers to Android through Firebase Cloud Messaging. Create a Firebase
          project, download the <code className="font-mono">google-services.json</code>,
          and upload the FCM v1 service-account key to your Expo project so Expo can send
          on your behalf. EAS can manage this for you:
        </p>
        <CodeBlock lang="bash" code={`eas credentials`} />
        <p>
          Then build a development or production client — push notifications don&apos;t
          work in Expo Go for FCM v1, so use a{' '}
          <code className="font-mono">development build</code>.
        </p>
      </Step>

      <Step number={5} title="Add the iOS credentials">
        <p>
          Apple requires every app that receives push notifications to hold a valid APNs
          key. EAS can generate and manage the APNs key and the Push Notifications
          entitlement for you:
        </p>
        <CodeBlock lang="bash" code={`eas credentials`} />
        <p>
          Build the app with EAS and install it on a real device — the iOS Simulator
          cannot receive remote push notifications.
        </p>
      </Step>

      <Step number={6} title="Configure the web (optional)">
        <p>
          On the web the provider rides on the browser&apos;s Push API and service worker.
          Configure a VAPID key for Expo&apos;s web push and register the service worker
          per the Expo web notifications guide, then reuse the same provider — it reports
          the browser subscription with{' '}
          <code className="font-mono">platform: &apos;web&apos;</code>. If you&apos;d
          rather use standards-based Web Push directly, omit the provider and{' '}
          <code className="font-mono">usePushNotifications</code> falls back to the
          browser PushManager.
        </p>
      </Step>

      <Step number={7} title="Send securely from a backend">
        <p>
          The hook registers the device; it does not send messages from the client. Send
          from a trusted backend by POSTing the stored Expo push token to Expo&apos;s push
          API:
        </p>
        <CodeBlock
          lang="bash"
          code={`curl -X POST https://exp.host/--/api/v2/push/send \\
  -H 'Content-Type: application/json' \\
  -d '{ "to": "ExponentPushToken[…]", "title": "Hello", "body": "World" }'`}
        />
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
          Never expose your APNs keys or FCM service-account credentials through client
          environment variables. Only the Expo project ID is safe to ship in the app.
        </p>
      </Step>

      <footer className="border-t border-[#263050] pt-6 text-sm text-[#93a0c4]">
        Continue with the official{' '}
        <a
          className="text-[#6ea8fe] hover:underline"
          href="https://docs.expo.dev/push-notifications/push-notifications-setup/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Expo push notifications setup guide
        </a>{' '}
        and the{' '}
        <a
          className="text-[#6ea8fe] hover:underline"
          href="https://docs.expo.dev/push-notifications/sending-notifications/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Expo push API reference
        </a>
        .
      </footer>
    </article>
  );
}
