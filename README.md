# crosshooks

> Typed React hooks with platform adapters for web, React Native iOS, and Android.

[![CI](https://github.com/zoharyAnd/crosshooks/actions/workflows/ci.yml/badge.svg)](https://github.com/zoharyAnd/crosshooks/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@zoharyandrianome/crosshooks.svg)](https://www.npmjs.com/package/@zoharyandrianome/crosshooks)
[![live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://crosshooks-demo.vercel.app)
[![license](https://img.shields.io/npm/l/@zoharyandrianome/crosshooks.svg)](./LICENSE)

[Browse the full documentation](https://crosshooks-demo.vercel.app)

[Try the live demo](https://crosshooks-demo.vercel.app/demos)

`crosshooks` provides consistent typed APIs across web and React Native.  
Browser
features use standards-based web implementations.  
Native push notifications can be enabled through optional provider adapters; unsupported browser-only features return a safe no-op state so shared components can check `isSupported`.

## Install

```bash
pnpm add @zoharyandrianome/crosshooks
# or: npm install @zoharyandrianome/crosshooks
```

React 16.8+ is a peer dependency.

## Hooks

### `usePWAInstallPrompt`

Manage the browser's "Add to Home Screen" flow with a clean, imperative API —
and a safe no-op on React Native, so the same install button just stays hidden
on mobile.

```tsx
import { usePWAInstallPrompt } from '@zoharyandrianome/crosshooks';

function InstallButton() {
  const { canInstall, isInstalled, promptInstall } = usePWAInstallPrompt();

  if (isInstalled || !canInstall) return null;

  return (
    <button
      onClick={async () => {
        const { outcome } = await promptInstall();
        if (outcome === 'accepted') {
          // user installed the app
        }
      }}
    >
      Install app
    </button>
  );
}
```

#### Returns

| Field           | Type                         | Description                                                                     |
| --------------- | ---------------------------- | ------------------------------------------------------------------------------- |
| `canInstall`    | `boolean`                    | The browser offered an install prompt and it's ready to show.                   |
| `isInstalled`   | `boolean`                    | The app is already running as an installed PWA.                                 |
| `isSupported`   | `boolean`                    | `false` on React Native, during SSR, and where install prompts don't exist.     |
| `promptInstall` | `() => Promise<{ outcome }>` | Shows the native prompt. `outcome` is `accepted` / `dismissed` / `unavailable`. |

### `usePushNotifications`

### Web push notifications

Drive the Web Push lifecycle — permission, subscription, and unsubscription —
from one hook, and get a serializable subscription to send to your server. On
React Native it's a safe no-op (native push rides on APNs/FCM via platform SDKs),
so the same UI compiles everywhere.

> **This hook subscribes; it does not send.** It runs on the client and only
> manages permission and the device subscription (`subscribe`, `unsubscribe`,
> `requestPermission`). Actually delivering a notification happens from your
> **backend** — persist the subscription this hook returns, then push to it
> server-side (e.g. with [`web-push`](https://github.com/web-push-libs/web-push),
> or via a provider's servers such as Firebase/OneSignal). Sending requires your
> VAPID **private** key, which must never ship to the browser.

```tsx
import { usePushNotifications } from '@zoharyandrianome/crosshooks';

function NotificationsToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications({
    applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
  });

  if (!isSupported) return null;

  return (
    <button
      onClick={async () => {
        if (isSubscribed) {
          await unsubscribe();
        } else {
          const sub = await subscribe();
          if (sub)
            await fetch('/api/push/register', {
              method: 'POST',
              body: JSON.stringify(sub),
            });
        }
      }}
    >
      {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
    </button>
  );
}
```

Requires an active service worker (for `PushManager`). Pass your VAPID public key
as `applicationServerKey` — Chromium browsers require it to subscribe.

---

### Native push notifications

For the React Native implementation, you can opt for one of the providers below:

- Firebase
- OneSignal
- Expo (coming soon)

#### Firebase provider

Firebase is an optional provider for web, React Native iOS, and Android.  
Follow the [step-by-step Firebase setup guide](https://crosshooks-demo.vercel.app/docs/provider/firebase) for SDK installation, environment variables, service workers, and native files.

Import the provider from the `/firebase` subpath and pass it to
`usePushNotifications`. The bundler picks the web or native adapter
automatically — on native, config comes from `google-services.json` /
`GoogleService-Info.plist`, so `firebaseProvider()` takes no arguments there.

```tsx
import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { firebaseProvider } from '@zoharyandrianome/crosshooks/firebase';

// Web: pass your Firebase config and VAPID key.
// React Native: call firebaseProvider() with no arguments.
const provider = firebaseProvider({
  firebaseConfig: {/* apiKey, projectId, messagingSenderId, appId, … */},
  vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY!,
});

function NotificationsToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications({
    provider,
  });

  if (!isSupported) return null;

  return (
    <button onClick={() => (isSubscribed ? unsubscribe() : subscribe())}>
      {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
    </button>
  );
}
```

#### OneSignal provider

OneSignal is an optional provider for web, React Native iOS, and Android.
Follow the [step-by-step OneSignal setup guide](https://crosshooks-demo.vercel.app/docs/provider/onesignal)
for SDK installation, the App ID, service workers, and native files.

Import the provider from the `/onesignal` subpath and pass it to
`usePushNotifications`. The bundler picks the web or native adapter
automatically; both take the same `{ appId }` config, and OneSignal manages the
subscription (opt-in / opt-out) and reports its subscription ID as the token.

```tsx
import { usePushNotifications } from '@zoharyandrianome/crosshooks';
import { oneSignalProvider } from '@zoharyandrianome/crosshooks/onesignal';

const provider = oneSignalProvider({
  appId: process.env.NEXT_PUBLIC_ONESIGNAL_APP_ID!,
});

function NotificationsToggle() {
  const { isSupported, isSubscribed, subscribe, unsubscribe } = usePushNotifications({
    provider,
  });

  if (!isSupported) return null;

  return (
    <button onClick={() => (isSubscribed ? unsubscribe() : subscribe())}>
      {isSubscribed ? 'Disable notifications' : 'Enable notifications'}
    </button>
  );
}
```

#### Returns

| Field               | Type                                    | Description                                                                                                                        |
| ------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| `isSupported`       | `boolean`                               | On web, `true` when the browser supports FCM (Service Worker, PushManager, IndexedDB); on React Native, `true` on iOS and Android. |
| `permission`        | `'default' \| 'granted' \| 'denied'`    | Current notification permission.                                                                                                   |
| `subscription`      | `PushSubscription \| null`              | Serializable endpoint or provider token, or `null`.                                                                                |
| `isSubscribed`      | `boolean`                               | Whether a subscription is active.                                                                                                  |
| `requestPermission` | `() => Promise<PushPermission>`         | Prompts for permission and returns the result.                                                                                     |
| `subscribe`         | `() => Promise<PushSubscription\|null>` | Ensures permission, then subscribes. `null` if refused/unsupported.                                                                |
| `unsubscribe`       | `() => Promise<boolean>`                | Cancels the active subscription.                                                                                                   |

## How the cross-platform build works

Each hook has two source implementations — `*.web.ts` and `*.native.ts` —
sharing one type definition. The package exposes two entry points and lets the
consumer's bundler pick:

```jsonc
"exports": {
  ".": {
    "react-native": "./dist/index.native.js", // Metro resolves this
    "import":       "./dist/index.js",         // web (ESM)
    "require":      "./dist/index.cjs"          // web (CJS)
  }
}
```

The public type surface is identical on both platforms, so TypeScript catches
misuse the same way everywhere.

## Development

```bash
pnpm install
pnpm test           # vitest (jsdom), incl. an SSR render test
pnpm typecheck      # tsc --noEmit
pnpm lint           # eslint (typescript-eslint + react-hooks)
pnpm format         # prettier --write .
pnpm build          # tsup → dual ESM/CJS + .d.ts
pnpm check:package  # publint + are-the-types-wrong (validates the exports map)
pnpm size           # size-limit (per-hook, tree-shaken)
```

CI runs every one of these on push and PR, so the exports map, type
resolution across ESM/CJS, and bundle size are all guarded automatically.

Releases are automated with [changesets](https://github.com/changesets/changesets):
run `pnpm changeset` to record a change; merging the generated "Version Packages"
PR publishes to npm.

## License

[MIT](./LICENSE) © zohary
