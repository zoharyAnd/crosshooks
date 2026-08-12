'use client';

import { useState } from 'react';
import { usePWAInstallPrompt } from '@zoharyandrianome/crosshooks';
import { StateRow } from '../StateRow';

export default function Page() {
  const { canInstall, isInstalled, isSupported, promptInstall } = usePWAInstallPrompt();
  const [lastOutcome, setLastOutcome] = useState<string | null>(null);

  async function handleInstall() {
    const { outcome } = await promptInstall();
    setLastOutcome(outcome);
  }

  return (
    <div className="w-full max-w-[520px] rounded-[18px] border border-line bg-surface p-8 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
      <header className="mb-6">
        <span className="mb-3.5 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          crosshooks
        </span>
        <h2 className="mb-2.5 text-[26px] font-bold">
          <code className="font-mono">usePWAInstallPrompt</code>
        </h2>
        <p className="leading-6 text-muted">
          One cross-platform hook for the PWA install flow. The same code runs on React
          Native — where it simply reports “not supported”.
        </p>
      </header>

      <section
        className="mb-6 flex flex-col gap-2"
        aria-label="usePWAInstallPrompt state"
      >
        <StateRow label="isSupported" value={isSupported} />
        <StateRow label="canInstall" value={canInstall} />
        <StateRow label="isInstalled" value={isInstalled} />
      </section>

      <section className="flex flex-col gap-3">
        <button
          className="w-full cursor-pointer rounded-xl bg-accent px-[18px] py-3.5 font-semibold text-on-accent transition-[transform,opacity] duration-200 enabled:hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.45]"
          onClick={handleInstall}
          disabled={!canInstall}
        >
          {isInstalled ? 'Already installed' : 'Install app'}
        </button>

        {lastOutcome && (
          <p className="text-sm text-muted">
            Last <code>promptInstall()</code> outcome: <strong>{lastOutcome}</strong>
          </p>
        )}
      </section>

      <footer className="mt-[22px] border-t border-line pt-[18px] text-sm leading-6 text-muted [&_p]:m-0">
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
