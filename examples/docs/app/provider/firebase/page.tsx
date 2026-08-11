import { CodeBlock, Step } from '../../components';

export default function FirebaseProviderDocumentation() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Provider guide
        </span>
        <h1 className="mb-3 text-3xl font-bold">Firebase push notifications</h1>
        <p className="leading-6 text-[#93a0c4]">
          Configure <code className="font-mono">usePushNotifications</code> with
          Firebase Cloud Messaging on the web, iOS, and Android.
        </p>
      </header>

      <Step number={1} title="Create the Firebase applications">
        <p>
          Create a Firebase project, then register a Web app, Android app, and iOS app
          for the platforms you support. In Firebase Console, open Project settings →
          Cloud Messaging and create a Web Push certificate to obtain the public VAPID
          key.
        </p>
      </Step>

      <Step number={2} title="Configure a web application">
        <p>Install the package and the optional Firebase Web SDK:</p>
        <CodeBlock
          lang="bash"
          code="pnpm add @zoharyandrianome/crosshooks firebase"
        />
        <p>
          Copy <code className="font-mono">examples/demo/.env.example</code> to{' '}
          <code className="font-mono">.env.local</code> and fill in the public values
          from Firebase Console:
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
          Firebase can create a background push subscription. It may initially be an
          empty service worker; add Firebase background-message handling when your
          application needs custom background behavior.
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
  @react-native-firebase/messaging`}
        />
        <p>
          React Native configuration comes from native Firebase files, so the hook
          does not need Firebase environment variables.
        </p>
      </Step>

      <Step number={4} title="Add the Android configuration">
        <p>
          Download <code className="font-mono">google-services.json</code> from
          Firebase Console and place it at:
        </p>
        <CodeBlock lang="text" code="android/app/google-services.json" />
        <p>
          Configure the Google Services Gradle plugin as described by React Native
          Firebase, then rebuild the native application.
        </p>
      </Step>

      <Step number={5} title="Add the iOS configuration">
        <p>
          Download <code className="font-mono">GoogleService-Info.plist</code>, add it
          to the <code className="font-mono">ios</code> project through Xcode, and
          ensure the application target includes it.
        </p>
        <p>
          Enable Push Notifications and Background Modes → Remote notifications in
          Xcode. Upload an APNs authentication key to Firebase Console, install
          CocoaPods, and rebuild the app.
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
          <code className="font-mono">subscribe()</code> requests permission and
          returns an FCM token. Send that token to your backend and associate it with
          the signed-in user.
        </p>
      </Step>

      <Step number={7} title="Send securely from a backend">
        <p>
          The hook registers the device; it does not embed Firebase server credentials
          or send privileged messages from the client. Use Firebase Admin SDK or the
          FCM HTTP v1 API in a trusted backend.
        </p>
        <p className="rounded-xl border border-amber-400/30 bg-amber-400/10 p-4 text-amber-200">
          Never expose service-account credentials, APNs keys, FCM server credentials,
          or provider REST API keys through client environment variables. Only
          Firebase client configuration and the VAPID public key are public.
        </p>
      </Step>

      <footer className="border-t border-[#263050] pt-6 text-sm text-[#93a0c4]">
        Continue with the official{' '}
        <a className="text-[#6ea8fe] hover:underline" href="https://rnfirebase.io/">
          React Native Firebase setup guide
        </a>{' '}
        and{' '}
        <a
          className="text-[#6ea8fe] hover:underline"
          href="https://firebase.google.com/docs/cloud-messaging"
        >
          Firebase Cloud Messaging documentation
        </a>
        .
      </footer>
    </article>
  );
}
