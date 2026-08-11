import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { usePWAInstallPrompt } from './usePWAInstallPrompt.web';

type Outcome = 'accepted' | 'dismissed';

/**
 * Builds a synthetic `beforeinstallprompt` event whose `userChoice` resolves
 * with the given outcome, mirroring the real browser event surface.
 */
function createInstallPromptEvent(outcome: Outcome) {
  const prompt = vi.fn().mockResolvedValue(undefined);
  const event = new Event('beforeinstallprompt') as Event & {
    prompt: typeof prompt;
    userChoice: Promise<{ outcome: Outcome; platform: string }>;
    platforms: string[];
  };
  event.prompt = prompt;
  event.userChoice = Promise.resolve({ outcome, platform: 'web' });
  event.platforms = ['web'];
  return { event, prompt };
}

function fireBeforeInstallPrompt(outcome: Outcome = 'accepted') {
  const { event, prompt } = createInstallPromptEvent(outcome);
  act(() => {
    window.dispatchEvent(event);
  });
  return { event, prompt };
}

beforeEach(() => {
  // Default: not running as an installed PWA.
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (query: string) =>
      ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList,
  );
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('usePWAInstallPrompt (web)', () => {
  it('reports supported but not installable before any prompt event', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    expect(result.current.isSupported).toBe(true);
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);
  });

  it('becomes installable after beforeinstallprompt fires', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    fireBeforeInstallPrompt();

    expect(result.current.canInstall).toBe(true);
  });

  it('shows the prompt and returns the accepted outcome', async () => {
    const { result } = renderHook(() => usePWAInstallPrompt());
    const { prompt } = fireBeforeInstallPrompt('accepted');

    let outcome: string | undefined;
    await act(async () => {
      outcome = (await result.current.promptInstall()).outcome;
    });

    expect(prompt).toHaveBeenCalledOnce();
    expect(outcome).toBe('accepted');
    expect(result.current.isInstalled).toBe(true);
    // The deferred prompt is single-use.
    expect(result.current.canInstall).toBe(false);
  });

  it('returns the dismissed outcome without marking as installed', async () => {
    const { result } = renderHook(() => usePWAInstallPrompt());
    fireBeforeInstallPrompt('dismissed');

    let outcome: string | undefined;
    await act(async () => {
      outcome = (await result.current.promptInstall()).outcome;
    });

    expect(outcome).toBe('dismissed');
    expect(result.current.isInstalled).toBe(false);
    expect(result.current.canInstall).toBe(false);
  });

  it('resolves as unavailable when there is no prompt to show', async () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    let outcome: string | undefined;
    await act(async () => {
      outcome = (await result.current.promptInstall()).outcome;
    });

    expect(outcome).toBe('unavailable');
  });

  it('marks as installed when the appinstalled event fires', () => {
    const { result } = renderHook(() => usePWAInstallPrompt());
    fireBeforeInstallPrompt();

    act(() => {
      window.dispatchEvent(new Event('appinstalled'));
    });

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('detects an already-installed app via standalone display mode', () => {
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (query: string) =>
        ({
          matches: query === '(display-mode: standalone)',
          media: query,
          onchange: null,
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          addListener: vi.fn(),
          removeListener: vi.fn(),
          dispatchEvent: vi.fn(),
        }) as unknown as MediaQueryList,
    );

    const { result } = renderHook(() => usePWAInstallPrompt());

    expect(result.current.isInstalled).toBe(true);
    expect(result.current.canInstall).toBe(false);
  });

  it('removes its event listeners on unmount', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    const { unmount } = renderHook(() => usePWAInstallPrompt());

    unmount();

    expect(removeSpy).toHaveBeenCalledWith('beforeinstallprompt', expect.any(Function));
    expect(removeSpy).toHaveBeenCalledWith('appinstalled', expect.any(Function));
  });
});
