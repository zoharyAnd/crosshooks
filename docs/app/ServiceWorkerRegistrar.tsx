'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker. A PWA needs an active service worker (with a
 * fetch handler) and a valid manifest before the browser will fire
 * `beforeinstallprompt` — which is what makes the demo's install button light up.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof navigator === 'undefined' || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Registration can fail on unsupported/insecure origins — the hook simply
      // stays in its "can't install" state, which is the point of the demo.
    });
  }, []);

  return null;
}
