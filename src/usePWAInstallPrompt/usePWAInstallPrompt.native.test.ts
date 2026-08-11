import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePWAInstallPrompt } from './usePWAInstallPrompt.native';

describe('usePWAInstallPrompt (native)', () => {
  it('reports an unsupported, no-op state', async () => {
    const { result } = renderHook(() => usePWAInstallPrompt());

    expect(result.current.isSupported).toBe(false);
    expect(result.current.canInstall).toBe(false);
    expect(result.current.isInstalled).toBe(false);

    let outcome: string | undefined;
    await act(async () => {
      outcome = (await result.current.promptInstall()).outcome;
    });
    expect(outcome).toBe('unavailable');
  });
});
