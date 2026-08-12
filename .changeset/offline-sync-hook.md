---
'@zoharyandrianome/crosshooks': minor
---

Add `useOfflineSync` — a persistent, connectivity-aware queue for mutations made
while offline. Enqueue writes as they happen; they are stored and automatically
drained through your `onSync` handler when the device regains connectivity, with
per-item attempt tracking and order-preserving retries. On web it uses
`navigator.onLine` and `localStorage` out of the box; on React Native you inject
`storage` (e.g. AsyncStorage) and `connectivity` (e.g. a NetInfo-backed source),
keeping crosshooks dependency-free while sharing one API across platforms.
