import Link from 'next/link';

export default function Demos() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Demos
        </span>
        <h1 className="mb-3 text-3xl font-bold">Live demos</h1>
        <p className="max-w-2xl text-sm leading-6 text-[#93a0c4]">
          Each demo runs the real hook in your browser so you can watch its state change as
          you interact. Open one on desktop Chrome or Edge, or on a mobile browser, to see
          how the same code behaves across platforms.
        </p>
      </header>

      <section className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/demos/pwa-install"
          className="group rounded-xl border border-[#263050] bg-[#0d1117] p-5 transition-colors hover:border-[#6ea8fe]"
        >
          <code className="font-mono text-base font-semibold text-[#e8ecf8]">
            usePWAInstallPrompt
          </code>
          <p className="mt-2 text-sm leading-6 text-[#93a0c4]">
            Trigger the &ldquo;Add to Home Screen&rdquo; flow from your own button and watch{' '}
            <code className="font-mono">canInstall</code> and{' '}
            <code className="font-mono">isInstalled</code> update live.
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-[#6ea8fe] group-hover:underline">
            Open PWA install demo →
          </span>
        </Link>

        <Link
          href="/demos/push-notification"
          className="group rounded-xl border border-[#263050] bg-[#0d1117] p-5 transition-colors hover:border-[#6ea8fe]"
        >
          <code className="font-mono text-base font-semibold text-[#e8ecf8]">
            usePushNotifications
          </code>
          <p className="mt-2 text-sm leading-6 text-[#93a0c4]">
            Grant permission, create a real Web Push subscription, and fire a test
            notification — then unsubscribe, all from the live hook state.
          </p>
          <span className="mt-3 inline-block text-sm font-semibold text-[#6ea8fe] group-hover:underline">
            Open push notification demo →
          </span>
        </Link>
      </section>
    </article>
  );
}
