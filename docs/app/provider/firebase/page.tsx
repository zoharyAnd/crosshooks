import { CodeBlock, Step } from '../../components';

export default function FirebaseProviderDocumentation() {
  return (
    <article className="rounded-[18px] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          Provider guide
        </span>
        <h1 className="mb-3 text-3xl font-bold">Firebase push notifications</h1>
        <p className="leading-6 text-muted">
          Configure <code className="font-mono">usePushNotifications</code> with Firebase
          Cloud Messaging on the web, iOS, and Android. The hook handles asking for
          permission and getting a device token; the steps below are the one-time Firebase
          and native platform setup that has to exist before it can run.
        </p>
      </header>

      <Step number={1} title="Create the Firebase applications">
        <p>
          Create a Firebase project, then register a Web app, Android app, and iOS app for
          the platforms you support.
        </p>
        <p>
          In Firebase Console, open Project settings → Cloud Messaging and create a Web
          Push certificate to obtain the public VAPID key.
        </p>
      </Step>

      <Step number={2} title="Configure a web application">
        <p>Install the package and the optional Firebase Web SDK:</p>
        <CodeBlock lang="bash" code="pnpm add @zoharyandrianome/crosshooks firebase" />
        <p>
          Copy <code className="font-mono">examples/docs/.env.example</code> to{' '}
          <code className="font-mono">.env.local</code> and fill in the public values from
          Firebase Console:
        </p>
        <CodeBlock
          lang="dotenv"
          code={`NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_VAPID_KEY=`}
        />
        <p>
          Add <code className="font-mono">public/firebase-messaging-sw.js</code> so
          Firebase can create a background push subscription.
        </p>
        <p>
          It may initially be an empty service worker; add Firebase background-message
          handling when your application needs custom background behavior.
        </p>
        <CodeBlock
          lang="tsx"
          code={`import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { firebaseProvider } from '@zoharyandrianome/crosshooks/firebase';

const firebasePush = firebaseProvider({
  firebaseConfig: {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
  },
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
});

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: firebasePush });
  return <button onClick={() => notifications.subscribe()}>Enable notifications</button>;
}`}
        />
        <p>Keep the provider object outside the component so it stays stable.</p>
      </Step>

      <Step number={3} title="Configure React Native">
        <p>Install the package and the optional native Firebase SDKs:</p>
        <CodeBlock
          lang="bash"
          code={`pnpm add @zoharyandrianome/crosshooks \\
  @react-native-firebase/app \\
  @react-native-firebase/messaging \\
  react-native-permissions`}
        />
        <p>
          <code className="font-mono">react-native-permissions</code> handles the
          notification permission prompt on iOS and Android 13+. Follow its setup guide to
          declare the notification permission in your native projects.
        </p>
        <p>
          React Native configuration comes from native Firebase files, so the hook does
          not need Firebase environment variables.
        </p>
      </Step>

      <Step number={4} title="Add the Android configuration">
        <p>
          Download <code className="font-mono">google-services.json</code> from Firebase
          Console and place it at:
        </p>
        <CodeBlock lang="text" code="android/app/google-services.json" />
        <p>
          Configure the Google Services Gradle plugin as described by React Native
          Firebase, then rebuild the native application.
        </p>
      </Step>

      <Step number={5} title="Add the iOS configuration">
        <p>
          Apple requires every app that receives push notifications to be set up once at
          the native level. The hook consumes the credentials these steps produce — it
          cannot create them for you — so this part is manual. You need a Mac with Xcode
          installed. Do each action in the tool named below.
        </p>
        <ol className="list-decimal space-y-2 pl-5 marker:text-accent">
          <li>
            <span className="font-semibold text-fg">In Firebase Console:</span> download{' '}
            <code className="font-mono">GoogleService-Info.plist</code> from your iOS
            app&apos;s settings.
          </li>
          <li>
            <span className="font-semibold text-fg">In Xcode:</span> drag that file into
            the <code className="font-mono">ios</code> project, and confirm it appears
            under your app target&apos;s{' '}
            <span className="italic">Build Phases → Copy Bundle Resources</span> so it
            ships inside the app.
          </li>
          <li>
            <span className="font-semibold text-fg">In Xcode:</span> open{' '}
            <span className="italic">Signing &amp; Capabilities</span>, click{' '}
            <span className="italic">+ Capability</span>, and add{' '}
            <span className="italic">Push Notifications</span>. Then add{' '}
            <span className="italic">Background Modes</span> and tick{' '}
            <span className="italic">Remote notifications</span>.
          </li>
          <li>
            <span className="font-semibold text-fg">In the Apple Developer portal:</span>{' '}
            under <span className="italic">Keys</span>, create an APNs authentication key
            and download the <code className="font-mono">.p8</code> file.
          </li>
          <li>
            <span className="font-semibold text-fg">In Firebase Console:</span> upload
            that <code className="font-mono">.p8</code> key under{' '}
            <span className="italic">
              Project settings → Cloud Messaging → Apple app configuration
            </span>
            . This is what lets Firebase hand your messages to Apple&apos;s servers.
          </li>
          <li>
            <span className="font-semibold text-fg">In a terminal:</span> install the
            native pods and rebuild the app.
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
import { firebaseProvider } from '@zoharyandrianome/crosshooks/firebase';

const firebasePush = firebaseProvider();

function NotificationsButton() {
  const notifications = usePushNotifications({ provider: firebasePush });
  return <Button title="Enable notifications" onPress={notifications.subscribe} />;
}`}
        />
        <p>
          <code className="font-mono">subscribe()</code> requests permission and returns
          an FCM token. Send that token to your backend and associate it with the
          signed-in user.
        </p>
      </Step>

      <Step number={7} title="Send securely from a backend">
        <p>
          The hook registers the device; it does not embed Firebase server credentials or
          send privileged messages from the client. Use Firebase Admin SDK or the FCM HTTP
          v1 API in a trusted backend.
        </p>
        <p className="rounded-xl border border-warn-border bg-warn-bg p-4 text-warn-text">
          Never expose service-account credentials, APNs keys, FCM server credentials, or
          provider REST API keys through client environment variables. Only Firebase
          client configuration and the VAPID public key are public.
        </p>
      </Step>

      <footer className="border-t border-line pt-6 text-sm text-muted">
        Continue with the official{' '}
        <a
          className="text-accent hover:underline"
          href="https://rnfirebase.io/"
          target="_blank"
          rel="noopener noreferrer"
        >
          React Native Firebase setup guide
        </a>{' '}
        and{' '}
        <a
          className="text-accent hover:underline"
          href="https://firebase.google.com/docs/cloud-messaging"
          target="_blank"
          rel="noopener noreferrer"
        >
          Firebase Cloud Messaging documentation
        </a>
        .
      </footer>
    </article>
  );
}
