import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { usePWAInstallPrompt } from './usePWAInstallPrompt.web';

/**
 * The web hook must be safe to render on the server: its first render (server
 * and client alike) has to produce identical, `window`-free output, otherwise
 * SSR frameworks like Next.js throw a hydration mismatch. We assert the
 * server-rendered markup shows the SSR-safe defaults and never throws.
 */
function Probe() {
  const { isSupported, canInstall, isInstalled } = usePWAInstallPrompt();
  return createElement(
    'output',
    null,
    `${isSupported}:${canInstall}:${isInstalled}`,
  );
}

describe('usePWAInstallPrompt (SSR)', () => {
  it('renders to string with SSR-safe defaults and does not throw', () => {
    const html = renderToString(createElement(Probe));
    expect(html).toContain('false:false:false');
  });
});
