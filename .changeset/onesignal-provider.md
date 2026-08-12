---
'@zoharyandrianome/crosshooks': minor
---

Add a OneSignal push provider. Import `oneSignalProvider` from
`@zoharyandrianome/crosshooks/onesignal` and pass it to `usePushNotifications`
on web, iOS, and Android. Both platforms take the same `{ appId }` config; the
adapter drives OneSignal's opt-in / opt-out subscription model and reports the
OneSignal subscription ID as the push token. `react-onesignal` (web) and
`react-native-onesignal` (native) are optional peer dependencies.
