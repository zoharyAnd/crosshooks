import Link from 'next/link';
import { CodeBlock } from './components';

export default function Home() {
  return (
    <article className="rounded-[18px] border border-[#263050] bg-[#141a2e] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] sm:p-8">
      <header className="mb-8">
        <span className="mb-3 inline-block rounded-full border border-[#263050] px-2.5 py-1 text-xs uppercase tracking-[0.08em] text-[#6ea8fe]">
          Overview
        </span>
        <h1 className="mb-3 text-3xl font-bold">crosshooks</h1>
        <p className="max-w-2xl leading-6 text-[#93a0c4]">
          Typed React hooks for device features that normally behave differently on web,
          iOS, and Android. Each hook exposes one consistent API, so the same component
          can run everywhere without branching on the platform.
        </p>
      </header>

      <section className="border-t border-[#263050] py-6">
        <h2 className="mb-3 text-xl font-bold text-[#e8ecf8]">Install</h2>
        <p className="text-sm leading-6 text-[#93a0c4]">
          Requires React 16.8 or newer. Provider SDKs are optional and only installed when
          you choose that provider.
        </p>
        <CodeBlock
          lang="bash"
          code={`# if you use npm
npm install @zoharyandrianome/crosshooks

# if you use pnpm
pnpm add @zoharyandrianome/crosshooks`}
        />
      </section>

      <section className="border-t border-[#263050] py-6">
        <h2 className="mb-4 text-xl font-bold text-[#e8ecf8]">Why crosshooks</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-4">
            <h3 className="mb-1 text-sm font-semibold text-[#e8ecf8]">
              One API, every platform
            </h3>
            <p className="text-sm leading-6 text-[#93a0c4]">
              Write a feature once and reuse it across web and React Native. The return
              shape stays identical, so shared UI never has to know where it runs.
            </p>
          </div>
          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-4">
            <h3 className="mb-1 text-sm font-semibold text-[#e8ecf8]">Fully typed</h3>
            <p className="text-sm leading-6 text-[#93a0c4]">
              Every hook ships with TypeScript definitions, so states, options, and return
              values are checked as you write them.
            </p>
          </div>
          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-4">
            <h3 className="mb-1 text-sm font-semibold text-[#e8ecf8]">Standards first</h3>
            <p className="text-sm leading-6 text-[#93a0c4]">
              Browser features use native web platform APIs with no runtime dependencies.
              Optional provider adapters are only pulled in when you reach for them.
            </p>
          </div>
          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-4">
            <h3 className="mb-1 text-sm font-semibold text-[#e8ecf8]">
              Safe where unsupported
            </h3>
            <p className="text-sm leading-6 text-[#93a0c4]">
              On platforms that lack a capability, a hook returns a quiet no-op state you
              can read through <code className="font-mono">isSupported</code> and hide the
              related UI.
            </p>
          </div>
        </div>
      </section>

      <section className="border-t border-[#263050] py-6">
        <h2 className="mb-4 text-xl font-bold text-[#e8ecf8]">The hooks</h2>
        <div className="space-y-4">
          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="font-mono text-base font-semibold text-[#e8ecf8]">
                usePWAInstallPrompt
              </code>
              <span className="rounded-full border border-[#263050] px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] text-[#6ea8fe]">
                Web
              </span>
            </div>
            <p className="text-sm leading-6 text-[#93a0c4]">
              Drives the browser&apos;s &ldquo;Add to Home Screen&rdquo; flow so you can
              offer an install button at the right moment, know when the app is already
              installed, and read the user&apos;s choice after the prompt.
            </p>
            <Link
              href="/pwa-install"
              className="mt-3 inline-block text-sm font-semibold text-[#6ea8fe] hover:underline"
            >
              PWA install guide →
            </Link>
          </div>

          <div className="rounded-xl border border-[#263050] bg-[#0d1117] p-5">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <code className="font-mono text-base font-semibold text-[#e8ecf8]">
                usePushNotifications
              </code>
              <span className="rounded-full border border-[#263050] px-2 py-0.5 text-[11px] uppercase tracking-[0.08em] text-[#6ea8fe]">
                Web &amp; native
              </span>
            </div>
            <p className="text-sm leading-6 text-[#93a0c4]">
              Registers a device for push notifications and hands you the subscription to
              store on your backend. Standards-based Web Push works out of the box; native
              iOS and Android delivery is enabled through an optional provider adapter.
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm font-semibold">
              <Link href="/push-notifications" className="text-[#6ea8fe] hover:underline">
                Push notifications guide →
              </Link>
              <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[#93a0c4]">
                <span className="text-xs font-normal uppercase tracking-[0.08em]">
                  Providers
                </span>
                <Link
                  href="/provider/firebase"
                  className="text-[#6ea8fe] hover:underline"
                >
                  Firebase
                </Link>
                <Link
                  href="/provider/onesignal"
                  className="text-[#6ea8fe] hover:underline"
                >
                  OneSignal
                </Link>
                <Link href="/provider/expo" className="text-[#6ea8fe] hover:underline">
                  Expo
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>
    </article>
  );
}
