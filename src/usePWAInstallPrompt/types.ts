/**
 * The result of a user's response to the install prompt.
 *
 * - `accepted`  — the user chose to install the app.
 * - `dismissed` — the user dismissed the prompt without installing.
 * - `unavailable` — there was no prompt to show (already installed, unsupported
 *   platform, or the browser never offered one).
 */
export type PromptInstallOutcome = 'accepted' | 'dismissed' | 'unavailable';

export interface PromptInstallResult {
  outcome: PromptInstallOutcome;
}

export interface PWAInstallPrompt {
  /**
   * `true` when the browser has offered a deferrable install prompt that is
   * ready to be shown via {@link PWAInstallPrompt.promptInstall}.
   */
  canInstall: boolean;

  /**
   * `true` when the app is already running as an installed PWA
   * (standalone display mode, or iOS "Add to Home Screen").
   */
  isInstalled: boolean;

  /**
   * `true` when the current platform can, in principle, install a PWA.
   * `false` on React Native, during SSR, and in browsers that never fire
   * `beforeinstallprompt` (e.g. iOS Safari relies on manual installation).
   */
  isSupported: boolean;

  /**
   * Shows the browser's native install prompt, if one is available.
   * Safe to call at any time — resolves with `{ outcome: 'unavailable' }`
   * when there is nothing to show.
   */
  promptInstall: () => Promise<PromptInstallResult>;
}
