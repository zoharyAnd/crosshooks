import { useCallback, useEffect, useState } from 'react';
import type { PWAInstallPrompt, PromptInstallResult } from './types';

/**
 * The `beforeinstallprompt` event is not part of the standard DOM typings,
 * so we describe the shape we rely on here.
 */
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt: () => Promise<void>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  const displayModeStandalone =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches;
  // iOS Safari exposes `navigator.standalone` instead of a display-mode query.
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  return displayModeStandalone || iosStandalone;
}

/**
 * Tracks the browser's PWA install prompt and exposes an imperative
 * {@link PWAInstallPrompt.promptInstall} trigger.
 *
 * Web implementation. Resolved on web bundlers via the default `exports`
 * condition; React Native bundlers resolve the `.native` counterpart instead.
 */
export function usePWAInstallPrompt(): PWAInstallPrompt {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  // Start `false` so the first client render matches the server render (which
  // has no `window`), then resolve the real value after mount — this keeps the
  // hook safe to use in SSR frameworks like Next.js without hydration errors.
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsSupported(true);
    setIsInstalled(isStandalone());

    const handleBeforeInstallPrompt = (event: Event) => {
      // Prevent the mini-infobar (Chrome) so we control when the prompt shows.
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const promptInstall = useCallback(async (): Promise<PromptInstallResult> => {
    if (!deferredPrompt) return { outcome: 'unavailable' };

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    // A deferred prompt can only be used once.
    setDeferredPrompt(null);
    if (outcome === 'accepted') setIsInstalled(true);

    return { outcome };
  }, [deferredPrompt]);

  return {
    canInstall: deferredPrompt !== null && !isInstalled,
    isInstalled,
    isSupported,
    promptInstall,
  };
}
