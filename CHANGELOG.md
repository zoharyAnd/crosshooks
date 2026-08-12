# @zoharyandrianome/crosshooks

## 0.4.0

### Minor Changes

- 79d1b3c: Add `useOfflineSync` — a persistent, connectivity-aware queue for mutations made
  while offline. Enqueue writes as they happen; they are stored and automatically
  drained through your `onSync` handler when the device regains connectivity, with
  per-item attempt tracking and order-preserving retries. On web it uses
  `navigator.onLine` and `localStorage` out of the box; on React Native you inject
  `storage` (e.g. AsyncStorage) and `connectivity` (e.g. a NetInfo-backed source),
  keeping crosshooks dependency-free while sharing one API across platforms.

## 0.3.0

### Minor Changes

- 57986e7: Add an Expo push provider. Import `expoProvider` from
  `@zoharyandrianome/crosshooks/expo` and pass it to `usePushNotifications` on
  iOS, Android, and the web. Both platforms take the same `{ projectId }` config;
  the adapter drives `expo-notifications` — requesting permission, registering the
  device, and reporting the Expo push token (`ExponentPushToken[…]`) as the push
  token. `expo-notifications` is an optional peer dependency.
- bd1a487: Add a OneSignal push provider. Import `oneSignalProvider` from
  `@zoharyandrianome/crosshooks/onesignal` and pass it to `usePushNotifications`
  on web, iOS, and Android. Both platforms take the same `{ appId }` config; the
  adapter drives OneSignal's opt-in / opt-out subscription model and reports the
  OneSignal subscription ID as the push token. `react-onesignal` (web) and
  `react-native-onesignal` (native) are optional peer dependencies.

## 0.2.0

### Minor Changes

- a6cf673: Add `usePushNotifications`: a cross-platform hook for the Web Push lifecycle —
  notification permission, subscribe, and unsubscribe — with a real web adapter
  and a no-op React Native adapter sharing one typed, SSR-safe API.

## 0.1.0

### Minor Changes

- d52437e: Initial release: `usePWAInstallPrompt`, a cross-platform hook for the PWA
  install flow with web and React Native adapters.
