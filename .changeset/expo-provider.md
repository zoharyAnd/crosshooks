---
'@zoharyandrianome/crosshooks': minor
---

Add an Expo push provider. Import `expoProvider` from
`@zoharyandrianome/crosshooks/expo` and pass it to `usePushNotifications` on
iOS, Android, and the web. Both platforms take the same `{ projectId }` config;
the adapter drives `expo-notifications` — requesting permission, registering the
device, and reporting the Expo push token (`ExponentPushToken[…]`) as the push
token. `expo-notifications` is an optional peer dependency.
