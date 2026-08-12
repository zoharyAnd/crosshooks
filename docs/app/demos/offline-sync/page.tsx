'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { useOfflineSync } from '@zoharyandrianome/crosshooks';
import type { ConnectivitySource } from '@zoharyandrianome/crosshooks';
import { StateRow } from '../StateRow';

export default function Page() {
  // A connectivity source we drive from a button, so you can simulate going
  // offline in the browser without actually dropping your network.
  const onlineRef = useRef(true);
  const listenersRef = useRef(new Set<(online: boolean) => void>());
  const connectivity = useMemo<ConnectivitySource>(
    () => ({
      getSnapshot: () => onlineRef.current,
      subscribe: (onChange) => {
        listenersRef.current.add(onChange);
        return () => listenersRef.current.delete(onChange);
      },
    }),
    [],
  );

  const [online, setOnline] = useState(true);
  const [synced, setSynced] = useState<string[]>([]);
  const [failNext, setFailNext] = useState(false);
  const failNextRef = useRef(false);
  failNextRef.current = failNext;

  // Simulate a network write with latency, optionally failing once.
  const onSync = useCallback(async (payload: string) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    if (failNextRef.current) {
      setFailNext(false);
      throw new Error('Simulated server error');
    }
    setSynced((prev) => [payload, ...prev]);
  }, []);

  const sync = useOfflineSync<string>({
    onSync,
    connectivity,
    storageKey: 'crosshooks:demo-offline-sync',
  });

  function toggleConnectivity() {
    const next = !onlineRef.current;
    onlineRef.current = next;
    setOnline(next);
    listenersRef.current.forEach((listener) => listener(next));
  }

  const [draft, setDraft] = useState('');
  function add() {
    const value = draft.trim() || `change #${sync.pending.length + synced.length + 1}`;
    sync.enqueue(value);
    setDraft('');
  }

  return (
    <div className="w-full max-w-[520px] rounded-[18px] border border-line bg-surface p-8 shadow-[0_20px_60px_rgba(0,0,0,0.10)]">
      <header className="mb-6">
        <span className="mb-3.5 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          crosshooks
        </span>
        <h2 className="mb-2.5 text-[26px] font-bold">
          <code className="font-mono">useOfflineSync</code>
        </h2>
        <h3 className="text-[20px] font-bold">Web demo</h3>
        <p className="leading-6 text-muted">
          Queue changes while &ldquo;offline,&rdquo; then flip back online and watch them
          drain in order. The queue is persisted, so it survives a reload.
        </p>
      </header>

      <section className="mb-6 flex flex-col gap-2" aria-label="useOfflineSync state">
        <StateRow label="isOnline" value={sync.isOnline} />
        <StateRow label="isSyncing" value={sync.isSyncing} />
        <StateRow label="pending" value={String(sync.pending.length)} />
        <StateRow label="error" value={sync.error ? sync.error.message : 'none'} />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && add()}
            placeholder="Describe a change…"
            className="min-w-0 flex-1 rounded-xl border border-line bg-inset px-3.5 py-3 text-sm outline-none focus:border-accent"
          />
          <button
            className="shrink-0 cursor-pointer rounded-xl bg-accent px-[18px] py-3.5 font-semibold text-on-accent transition-transform duration-200 hover:-translate-y-px"
            onClick={add}
          >
            Enqueue
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            className={`flex-1 cursor-pointer rounded-xl border px-[18px] py-3 font-semibold transition-transform duration-200 hover:-translate-y-px ${
              online
                ? 'border-line bg-inset text-fg'
                : 'border-accent bg-accent text-on-accent'
            }`}
            onClick={toggleConnectivity}
          >
            {online ? 'Go offline' : 'Go online'}
          </button>
          <button
            className="flex-1 cursor-pointer rounded-xl border border-line bg-inset px-[18px] py-3 font-semibold text-fg transition-transform duration-200 hover:-translate-y-px disabled:cursor-not-allowed disabled:opacity-[0.45]"
            onClick={() => sync.flush()}
            disabled={!sync.isOnline || sync.pending.length === 0}
          >
            Flush now
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={failNext}
            onChange={(event) => setFailNext(event.target.checked)}
            className="accent-[var(--accent)]"
          />
          Make the next sync fail once
        </label>
      </section>

      {sync.pending.length > 0 && (
        <section className="mt-6" aria-label="Pending queue">
          <div className="mb-2 flex items-center justify-between">
            <h4 className="text-sm font-semibold text-fg">
              Pending ({sync.pending.length})
            </h4>
            <button
              className="cursor-pointer text-xs font-semibold text-danger hover:underline"
              onClick={() => sync.clear()}
            >
              Clear all
            </button>
          </div>
          <ul className="flex flex-col gap-2">
            {sync.pending.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-line bg-inset px-3.5 py-2.5 text-sm"
              >
                <span className="min-w-0 flex-1 truncate">{item.payload}</span>
                {item.attempts > 0 && (
                  <span className="shrink-0 rounded-full bg-accent/15 px-2 py-[2px] text-xs font-semibold text-accent">
                    {item.attempts} {item.attempts === 1 ? 'try' : 'tries'}
                  </span>
                )}
                <button
                  className="shrink-0 cursor-pointer text-xs font-semibold text-muted hover:text-danger"
                  onClick={() => sync.remove(item.id)}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {synced.length > 0 && (
        <section className="mt-6" aria-label="Synced log">
          <h4 className="mb-2 text-sm font-semibold text-fg">Synced ({synced.length})</h4>
          <ul className="flex flex-col gap-1.5 text-sm text-muted">
            {synced.slice(0, 6).map((item, index) => (
              <li key={`${item}-${index}`} className="flex items-center gap-2">
                <span className="text-success">✓</span>
                <span className="min-w-0 flex-1 truncate">{item}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-[22px] border-t border-line pt-[18px] text-sm leading-6 text-muted [&_p]:m-0">
        {!sync.isOnline ? (
          <p>
            You are offline. Enqueue a few changes — they are stored locally and stay put
            until you go back online.
          </p>
        ) : sync.pending.length > 0 ? (
          <p>Draining the queue in order through your real onSync handler…</p>
        ) : (
          <p>
            Online and in sync. Toggle offline, queue changes, then reconnect to watch
            them flush automatically.
          </p>
        )}
      </footer>
    </div>
  );
}
