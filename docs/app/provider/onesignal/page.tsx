import { CodeBlock, Step } from '../../components';

export default function OneSignalProviderDocumentation() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Provider guide
        </span>
        <h1 className="mb-3 text-3xl font-bold">OneSignal push notifications</h1>
        <p className="leading-6 text-[#93a0c4]">
          Configure <code className="font-mono">usePushNotifications</code> with OneSignal
          on the web, iOS, and Android. The hook asks for permission and opts the device
          in; OneSignal manages the subscription and returns a subscription ID as the
          token. The steps below are the one-time OneSignal and native platform setup that
          has to exist before it can run.
        </p>
      </header>

      <Step number={1} title="Create the OneSignal app">
        <p>
          Create a OneSignal account, then add an app and configure the platforms you
          support (Web, Apple iOS, Google Android). Copy the{' '}
          <span className="italic">App ID</span> from{' '}
          <span className="italic">Settings → Keys &amp; IDs</span> — the hook takes the
          same App ID on every platform.
        </p>
      </Step>

      <Step number={2} title="Configure a web application">
        <p>Install the package and the optional OneSignal Web SDK:</p>
        <CodeBlock
          lang="bash"
          code="pnpm add @zoharyandrianome/crosshooks react-onesignal"
        />
        <p>
          Copy <code className="font-mono">examples/docs/.env.example</code> to{' '}
          <code className="font-mono">.env.local</code> and add your App ID:
        </p>
        <CodeBlock lang="dotenv" code={`NEXT_PUBLIC_ONESIGNAL_APP_ID=`} />
        <p>
          Add the OneSignal service worker at{' '}
          <code className="font-mono">public/OneSignalSDKWorker.js</code> so OneSignal can
          create a background push subscription:
        </p>
        <CodeBlock
          lang="js"
          code={`importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');`}
        />
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { oneSignalProvider } from '@zoharyandrianome/crosshooks/onesignal';

const oneSignalPush = oneSignalProvider({
  appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
  // initOptions is forwarded to OneSignal.init, e.g. { safari_web_id, allowLocalhostAsSecureOrigin: true }
});

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: oneSignalPush });
  return <button onClick={() => notifications.subscribe()}>Enable notifications</button>;
}`}
        />
        <p>Keep the provider object outside the component so it stays stable.</p>
      </Step>

      <Step number={3} title="Configure React Native">
        <p>Install the package and the optional native OneSignal SDK:</p>
        <CodeBlock
          lang="bash"
          code={`pnpm add @zoharyandrianome/crosshooks react-native-onesignal`}
        />
        <p>
          The provider calls <code className="font-mono">OneSignal.initialize()</code>{' '}
          with your App ID and manages permission and opt-in, so the hook needs no
          OneSignal environment variables on native — pass the same{' '}
          <code className="font-mono">{'{ appId }'}</code> config on every platform.
        </p>
      </Step>

      <Step number={4} title="Add the Android configuration">
        <p>
          OneSignal delivers to Android through Firebase Cloud Messaging. In the OneSignal
          dashboard, open{' '}
          <span className="italic">
            Settings → Push &amp; In-App → Google Android (FCM)
          </span>{' '}
          and upload your Firebase service account JSON (FCM v1) so OneSignal can send on
          your behalf.
        </p>
        <p>
          Follow the React Native OneSignal Android setup to add the required Gradle
          configuration, then rebuild the native application.
        </p>
      </Step>

      <Step number={5} title="Add the iOS configuration">
        <p>
          Apple requires every app that receives push notifications to be set up once at
          the native level. You need a Mac with Xcode installed. Do each action in the
          tool named below.
        </p>
        <ol className="list-decimal space-y-2 pl-5 marker:text-[#6ea8fe]">
          <li>
            <span className="font-semibold text-[#e8ecf8]">
              In the Apple Developer portal:
            </span>{' '}
            under <span className="italic">Keys</span>, create an APNs authentication key
            and download the <code className="font-mono">.p8</code> file.
          </li>
          <li>
            <span className="font-semibold text-[#e8ecf8]">
              In the OneSignal dashboard:
            </span>{' '}
            upload that <code className="font-mono">.p8</code> key under{' '}
            <span className="italic">
              Settings → Push &amp; In-App → Apple iOS (APNs)
            </span>
            . This is what lets OneSignal hand your messages to Apple&apos;s servers.
          </li>
          <li>
            <span className="font-semibold text-[#e8ecf8]">In Xcode:</span> open{' '}
            <span className="italic">Signing &amp; Capabilities</span>, click{' '}
            <span className="italic">+ Capability</span>, and add{' '}
            <span className="italic">Push Notifications</span>. Then add{' '}
            <span className="italic">Background Modes</span> and tick{' '}
            <span className="italic">Remote notifications</span>.
          </li>
          <li>
            <span className="font-semibold text-[#e8ecf8]">In Xcode:</span> add a{' '}
            <span className="italic">Notification Service Extension</span> and the
            OneSignal App Group, as described by the React Native OneSignal iOS setup, so
            rich notifications and confirmed delivery work.
          </li>
          <li>
            <span className="font-semibold text-[#e8ecf8]">In a terminal:</span> install
            the native pods and rebuild the app.
          </li>
        </ol>
        <CodeBlock lang="bash" code={`cd ios && pod install`} />
        <p>
          Rebuild from Xcode (or your usual React Native run command) after{' '}
          <code className="font-mono">pod install</code>. Push notifications only arrive
          on a real device — the iOS Simulator cannot receive them.
        </p>
      </Step>

      <Step number={6} title="Use the hook on iOS and Android">
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { oneSignalProvider } from '@zoharyandrianome/crosshooks/onesignal';

const oneSignalPush = oneSignalProvider({ appId: 'your-onesignal-app-id' });

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: oneSignalPush });
  return <Button title="Enable notifications" onPress={notifications.subscribe} />;
}`}
        />
        <p>
          <code className="font-mono">subscribe()</code> requests permission, opts the
          device in, and returns the OneSignal subscription ID. Send that ID to your
          backend and associate it with the signed-in user, or call{' '}
          <code className="font-mono">OneSignal.login()</code> with your own external ID
          to target the user directly.
        </p>
      </Step>

      <Step number={7} title="Send securely from a backend">
        <p>
          The hook registers the device; it does not embed OneSignal server credentials or
          send privileged messages from the client. Send from a trusted backend with the
          OneSignal REST API, targeting the stored subscription ID or external ID.
        </p>
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
          Never expose your OneSignal REST API key, APNs keys, or FCM service-account
          credentials through client environment variables. Only the OneSignal App ID is
          public.
        </p>
      </Step>

      <footer className="border-t border-[#263050] pt-6 text-sm text-[#93a0c4]">
        Continue with the official{' '}
        <a
          className="text-[#6ea8fe] hover:underline"
          href="https://documentation.onesignal.com/docs/react-native-sdk-setup"
          target="_blank"
          rel="noopener noreferrer"
        >
          React Native OneSignal setup guide
        </a>{' '}
        and{' '}
        <a
          className="text-[#6ea8fe] hover:underline"
          href="https://documentation.onesignal.com/docs/web-push-quickstart"
          target="_blank"
          rel="noopener noreferrer"
        >
          OneSignal Web Push documentation
        </a>
        .
      </footer>
    </article>
  );
}
