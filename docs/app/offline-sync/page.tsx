import Link from 'next/link';
import { CodeBlock, Step } from '../components';

export default function OfflineSync() {
  return (
    <article className="rounded-[18px] border border-line bg-surface p-6 shadow-[0_20px_60px_rgba(0,0,0,0.10)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-line px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-accent">
          Offline sync
        </span>
        <h1 className="mb-3 text-3xl font-bold">Offline sync</h1>
        <p className="text-sm leading-6 text-muted">
          A persistent, connectivity-aware queue for mutations made while offline.
          Enqueue writes as they happen; they are stored locally and drained through
          your <code className="font-mono">onSync</code> handler when the device comes
          back online. On web, connectivity and persistence work out of the box; on
          React Native you inject them, keeping the same API on every platform.
        </p>
      </header>

      <Step number={1} title="Create the queue">
        <p>
          Give the hook an <code className="font-mono">onSync</code> handler — typically
          the network write that was unavailable offline. It receives one queued payload
          at a time.
        </p>
        <CodeBlock
          lang="tsx"
          code={`import { useOfflineSync } from '@zoharyandrianome/crosshooks';

function TodoComposer() {
  const sync = useOfflineSync<{ title: string }>({
    onSync: async (todo) => {
      await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(todo),
      });
    },
  });

  // Render your UI here.
}`}
        />
        <p>
          Resolve from <code className="font-mono">onSync</code> to mark an item synced;
          throw (or reject) to keep it queued for a later retry.
        </p>
      </Step>

      <Step number={2} title="Enqueue mutations">
        <p>
          Call <code className="font-mono">enqueue</code> whenever the user performs a
          write. If the device is online, a flush is scheduled automatically; if it is
          offline, the item waits in the persisted queue.
        </p>
        <CodeBlock
          lang="tsx"
          code={`<button onClick={() => sync.enqueue({ title: 'Buy milk' })}>
  Add todo
</button>`}
        />
        <p>
          <code className="font-mono">enqueue</code> returns the created item, including
          the id you can later pass to <code className="font-mono">remove</code>.
        </p>
      </Step>

      <Step number={3} title="Reflect connectivity and the pending queue">
        <p>
          Read <code className="font-mono">isOnline</code>,{' '}
          <code className="font-mono">pending</code>, and{' '}
          <code className="font-mono">isSyncing</code> to keep your UI honest about
          unsynced work. All three are SSR-safe: the first render is optimistically
          online with an empty queue, then resolves after mount.
        </p>
        <CodeBlock
          lang="tsx"
          code={`{!sync.isOnline && (
  <p>You are offline. {sync.pending.length} change(s) will sync when you reconnect.</p>
)}
{sync.isSyncing && <Spinner />}`}
        />
      </Step>

      <Step number={4} title="Handle failures and retries">
        <p>
          A flush processes items in enqueue order. When{' '}
          <code className="font-mono">onSync</code> throws, the item stays queued with a
          bumped <code className="font-mono">attempts</code> count and the pass{' '}
          <strong>stops</strong> — so a failed write never lets a later one jump ahead of
          it. The failure is exposed on <code className="font-mono">error</code> and
          cleared once the queue fully drains.
        </p>
        <CodeBlock
          lang="tsx"
          code={`{sync.error && (
  <button onClick={() => sync.flush()}>
    Retry ({sync.pending.length}) — {sync.error.message}
  </button>
)}`}
        />
        <p>
          A flush retries the whole queue from the head. Auto-flush on reconnect is on by
          default; pass <code className="font-mono">autoFlushOnReconnect: false</code> to
          drive it yourself.
        </p>
      </Step>

      <Step number={5} title="Persistence on web">
        <p>
          On web the queue is persisted to{' '}
          <code className="font-mono">localStorage</code> automatically, so it survives a
          reload or a closed tab. Set a <code className="font-mono">storageKey</code> to
          keep separate queues apart:
        </p>
        <CodeBlock
          lang="tsx"
          code={`const sync = useOfflineSync({
  onSync,
  storageKey: 'todos:pending', // defaults to 'crosshooks:offline-sync'
});`}
        />
        <p>
          Writes are best-effort — a full or unavailable store (private mode, quota)
          degrades to an in-memory queue rather than throwing.
        </p>
      </Step>

      <Step number={6} title="React Native setup">
        <p>
          React Native has no <code className="font-mono">localStorage</code> or{' '}
          <code className="font-mono">navigator.onLine</code>, and crosshooks stays
          dependency-free, so you inject both. Pass{' '}
          <code className="font-mono">storage</code> to persist across app launches and{' '}
          <code className="font-mono">connectivity</code> to react to the network.
          Omit them and the queue lives in memory with the device assumed online — the
          return shape is identical to web, so shared components work unchanged.
        </p>
        <CodeBlock
          lang="tsx"
          code={`import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import type { ConnectivitySource } from '@zoharyandrianome/crosshooks';

const netInfo: ConnectivitySource = {
  getSnapshot: () => lastKnownOnline, // seed from a NetInfo.fetch() at startup
  subscribe: (onChange) =>
    NetInfo.addEventListener((state) => onChange(state.isConnected ?? false)),
};

const sync = useOfflineSync({
  onSync,
  storage: AsyncStorage,
  connectivity: netInfo,
});`}
        />
        <p>
          <code className="font-mono">storage</code> only has to match a small{' '}
          <code className="font-mono">getItem</code> /{' '}
          <code className="font-mono">setItem</code> /{' '}
          <code className="font-mono">removeItem</code> shape (sync or async), which
          AsyncStorage already satisfies.
        </p>
      </Step>

      <section className="border-t border-line py-6">
        <h2 className="mb-3 text-xl font-bold text-fg">Options</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-4 font-semibold">Option</th>
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="align-top text-muted [&_td]:border-b [&_td]:border-line [&_td]:py-2.5 [&_td]:pr-4">
              <tr>
                <td className="font-mono text-fg">onSync</td>
                <td className="font-mono text-xs">(payload, item) =&gt; unknown</td>
                <td>Processes one queued item. Resolve to sync it; throw to retry later.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">storageKey</td>
                <td className="font-mono text-xs">string</td>
                <td>
                  Persistence key. Defaults to{' '}
                  <code className="font-mono">crosshooks:offline-sync</code>.
                </td>
              </tr>
              <tr>
                <td className="font-mono text-fg">storage</td>
                <td className="font-mono text-xs">SyncStorage</td>
                <td>Adapter. Defaults to localStorage on web; inject AsyncStorage on native.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">connectivity</td>
                <td className="font-mono text-xs">ConnectivitySource</td>
                <td>Online/offline source. Defaults to navigator.onLine on web.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">autoFlushOnReconnect</td>
                <td className="font-mono text-xs">boolean</td>
                <td>Flush automatically when connectivity returns. Defaults to true.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-line py-6">
        <h2 className="mb-3 text-xl font-bold text-fg">Returns</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-line text-muted">
                <th className="py-2 pr-4 font-semibold">Field</th>
                <th className="py-2 pr-4 font-semibold">Type</th>
                <th className="py-2 font-semibold">Description</th>
              </tr>
            </thead>
            <tbody className="align-top text-muted [&_td]:border-b [&_td]:border-line [&_td]:py-2.5 [&_td]:pr-4">
              <tr>
                <td className="font-mono text-fg">isOnline</td>
                <td className="font-mono text-xs">boolean</td>
                <td>Whether the device is online. Optimistically true during SSR.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">pending</td>
                <td className="font-mono text-xs">SyncItem[]</td>
                <td>Queued items awaiting sync, in enqueue order.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">isSyncing</td>
                <td className="font-mono text-xs">boolean</td>
                <td>True while a flush pass is running.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">error</td>
                <td className="font-mono text-xs">Error | null</td>
                <td>The most recent sync error, cleared once the queue drains.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">enqueue</td>
                <td className="font-mono text-xs">(payload) =&gt; SyncItem</td>
                <td>Queue a payload; schedules a flush when online.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">flush</td>
                <td className="font-mono text-xs">() =&gt; Promise&lt;SyncResult&gt;</td>
                <td>Drain the queue now. No-ops while offline or already syncing.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">remove</td>
                <td className="font-mono text-xs">(id) =&gt; void</td>
                <td>Drop a single queued item without syncing it.</td>
              </tr>
              <tr>
                <td className="font-mono text-fg">clear</td>
                <td className="font-mono text-xs">() =&gt; void</td>
                <td>Discard every queued item without syncing.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section className="border-t border-line py-6">
        <p className="text-sm leading-6 text-muted">
          Want to see it move?{' '}
          <Link href="/demos/offline-sync" className="text-accent hover:underline">
            Open the live offline-sync demo
          </Link>{' '}
          — toggle offline, queue changes, and watch them drain on reconnect.
        </p>
      </section>
    </article>
  );
}
