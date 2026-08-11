'use client';

import { useState } from 'react';
import { usePWAInstallPrompt } from 'crosshooks';

export default function Home() {
  const { canInstall, isInstalled, isSupported, promptInstall } = usePWAInstallPrompt();
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  async function handleInstall() {
    const { outcome } = await promptInstall();
    setLastOutcome(outcome);
  }

  return (
    <main className="page">
      <div className="card">
        <header className="header">
          <span className="badge">crosshooks</span>
          <h1>
            <code>usePWAInstallPrompt</code>
          </h1>
          <p className="tagline">
            One cross-platform hook for the PWA install flow. The same code runs on
            React Native — where it simply reports “not supported”.
          </p>
        </header>

        <section className="state" aria-label="Hook state">
          <StateRow label="isSupported" value={isSupported} />
          <StateRow label="canInstall" value={canInstall} />
          <StateRow label="isInstalled" value={isInstalled} />
        </section>

        <section className="actions">
          <button
            className="install"
            onClick={handleInstall}
            disabled={!canInstall}
          >
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
              No install prompt yet. On desktop Chrome/Edge, load this over HTTPS and
              wait a moment; on iOS Safari, use Share → “Add to Home Screen”.
            </p>
          )}
        </footer>
      </div>

      <a
        className="repo-link"
        href="https://github.com/zoharyAnd/crosshooks"
        target="_blank"
        rel="noreferrer"
      >
        View source on GitHub →
      </a>
    </main>
  );
}

function StateRow({ label, value }: { label: string; value: boolean }) {
  return (
    <div className="state-row">
      <code>{label}</code>
      <span className={`pill ${value ? 'pill-true' : 'pill-false'}`}>
        {String(value)}
      </span>
    </div>
  );
}
