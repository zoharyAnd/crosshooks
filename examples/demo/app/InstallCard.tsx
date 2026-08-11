'use client';

import { useState } from 'react';
import { usePWAInstallPrompt } from '@zoharyandrianome/crosshooks';
import { StateRow } from './StateRow';

export function InstallCard() {
  const { canInstall, isInstalled, isSupported, promptInstall } = usePWAInstallPrompt();
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  async function handleInstall() {
    const { outcome } = await promptInstall();
    setLastOutcome(outcome);
  }

  return (
    <div className="card">
      <header className="header">
        <span className="badge">crosshooks</span>
        <h2 className="hook-name">
          <code>usePWAInstallPrompt</code>
        </h2>
        <p className="tagline">
          One cross-platform hook for the PWA install flow. The same code runs on React
          Native — where it simply reports “not supported”.
        </p>
      </header>

      <section className="state" aria-label="usePWAInstallPrompt state">
        <StateRow label="isSupported" value={isSupported} />
        <StateRow label="canInstall" value={canInstall} />
        <StateRow label="isInstalled" value={isInstalled} />
      </section>

      <section className="actions">
        <button className="install" onClick={handleInstall} disabled={!canInstall}>
          {isInstalled ? 'Already installed' : 'Install app'}
        </button>

        {lastOutcome && (
          <p className="outcome">
            Last <code>promptInstall()</code> outcome: <strong>{lastOutcome}</strong>
          </p>
        )}
      </section>

      <footer className="hint">
        {isInstalled ? (
          <p>You’re running the installed app. 🎉</p>
        ) : canInstall ? (
          <p>Your browser offered an install prompt — click the button above.</p>
        ) : (
          <p>
            No install prompt yet. On desktop Chrome/Edge, load this over HTTPS and wait a
            moment; on iOS Safari, use Share → “Add to Home Screen”.
          </p>
        )}
      </footer>
    </div>
  );
}
