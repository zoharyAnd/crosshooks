import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { usePushNotifications } from './usePushNotifications.web';

/**
 * Like the rest of the library, the web hook must render on the server without
 * touching `window` — otherwise SSR frameworks throw a hydration mismatch.
 */
function Probe() {
  const { isSupported, permission, isSubscribed } = usePushNotifications();
  return createElement('output', null, `${isSupported}:${permission}:${isSubscribed}`);
}

describe('usePushNotifications (SSR)', () => {
  it('renders to string with SSR-safe defaults and does not throw', () => {
    const html = renderToString(createElement(Probe));
    expect(html).toContain('false:default:false');
  });
});
