# crosshooks

> Cross-platform React hooks that work on both web and React Native — typed, tested, zero-config.

[![CI](https://github.com/zoharyAnd/crosshooks/actions/workflows/ci.yml/badge.svg)](https://github.com/zoharyAnd/crosshooks/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@zoharyandrianome/crosshooks.svg)](https://www.npmjs.com/package/@zoharyandrianome/crosshooks)
[![live demo](https://img.shields.io/badge/demo-live-brightgreen)](https://crosshooks-demo.vercel.app)
[![license](https://img.shields.io/npm/l/@zoharyandrianome/crosshooks.svg)](./LICENSE)

**▶ [Try the live demo](https://crosshooks-demo.vercel.app)** — `usePWAInstallPrompt` and `usePushNotifications` running live.

One hook API, every platform. `crosshooks` ships a single set of typed React
hooks with **platform adapters** under the hood: web bundlers get the DOM
implementation, React Native bundlers get the native one — resolved
automatically through the package's `exports` map. Your components stay
identical across web and mobile.

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

Drive the Web Push lifecycle — permission, subscription, and unsubscription —
from one hook, and get a serializable subscription to send to your server. On
React Native it's a safe no-op (native push rides on APNs/FCM via platform SDKs),
so the same UI compiles everywhere.

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

#### Returns

| Field               | Type                                        | Description                                                         |
| ------------------- | ------------------------------------------- | ------------------------------------------------------------------- |
| `isSupported`       | `boolean`                                   | `true` when Notification + Service Worker + PushManager exist.      |
| `permission`        | `'default' \| 'granted' \| 'denied'`        | Current notification permission.                                    |
| `subscription`      | `PushSubscriptionInfo \| null`              | Serializable subscription to send to your server, or `null`.        |
| `isSubscribed`      | `boolean`                                   | Whether a subscription is active.                                   |
| `requestPermission` | `() => Promise<PushPermission>`             | Prompts for permission and returns the result.                      |
| `subscribe`         | `() => Promise<PushSubscriptionInfo\|null>` | Ensures permission, then subscribes. `null` if refused/unsupported. |
| `unsubscribe`       | `() => Promise<boolean>`                    | Cancels the active subscription.                                    |

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
