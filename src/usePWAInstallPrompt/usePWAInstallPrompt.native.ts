import { useCallback } from 'react';
import type { PWAInstallPrompt, PromptInstallResult } from './types';

/**
 * React Native implementation.
 *
 * PWA install prompts are a web-only concept, so on native the hook reports
 * an unsupported state and a no-op {@link PWAInstallPrompt.promptInstall}.
 * This keeps call sites identical across platforms — the same component can
 * render an install button that simply stays hidden on mobile.
 */
export function usePWAInstallPrompt(): PWAInstallPrompt {
  const promptInstall = useCallback(
    async (): Promise<PromptInstallResult> => ({ outcome: 'unavailable' }),
    [],
  );

  return {
    canInstall: false,
    isInstalled: false,
    isSupported: false,
    promptInstall,
  };
}
