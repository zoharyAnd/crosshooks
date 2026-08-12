import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ServiceWorkerRegistrar } from './ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'crosshooks documentation',
  description: 'Documentation and live demos for crosshooks.',
  manifest: '/manifest.webmanifest',
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#0b1020] bg-[radial-gradient(1200px_600px_at_50%_-10%,#1b2547_0%,transparent_60%)] font-sans text-[#e8ecf8] antialiased [color-scheme:dark]">
        <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-10 lg:self-start">
              <nav
                aria-label="Documentation navigation"
                className="rounded-xl border border-[#263050] bg-[#141a2e] p-4 text-sm"
              >
                <Link
                  href="/"
                  className="block font-semibold text-[#e8ecf8] hover:text-[#6ea8fe]"
                >
                  Getting started
                </Link>
                <Link
                  href="/pwa-install"
                  className="block font-semibold text-[#e8ecf8] hover:text-[#6ea8fe] mt-4"
                >
                  PWA install
                </Link>
                <Link
                  href="/push-notifications"
                  className="block font-semibold text-[#e8ecf8] hover:text-[#6ea8fe] mt-4"
                >
                  Push notifications
                </Link>
                <div className="ml-2 flex flex-col gap-2 border-l border-[#263050] pl-3">
                  <p className="mb-2 mt-4 font-semibold text-[#e8ecf8]">Providers</p>
                  <div className="ml-2 flex flex-col gap-2 border-l border-[#263050] pl-3">
                    <Link
                      href="/provider/firebase"
                      className="text-[#93a0c4] hover:text-[#6ea8fe]"
                    >
                      Firebase provider
                    </Link>
                    <Link
                      href="/provider/onesignal"
                      className="text-[#93a0c4] hover:text-[#6ea8fe]"
                    >
                      OneSignal provider
                    </Link>
                    <Link
                      href="/provider/expo"
                      className="text-[#93a0c4] hover:text-[#6ea8fe]"
                    >
                      Expo provider
                    </Link>
                  </div>
                </div>

                <Link
                  href="/demos"
                  className="block font-semibold text-[#e8ecf8] hover:text-[#6ea8fe] mt-4 mb-2"
                >
                  Demos
                </Link>
                <div className="ml-2 flex flex-col gap-2 border-l border-[#263050] pl-3">
                  <Link
                    href="/demos/pwa-install"
                    className="text-[#93a0c4] hover:text-[#6ea8fe]"
                  >
                    PWA install
                  </Link>
                  <Link
                    href="/demos/push-notification"
                    className="text-[#93a0c4] hover:text-[#6ea8fe]"
                  >
                    Push notifications
                  </Link>
                </div>
              </nav>
            </aside>

            <div className="min-w-0">{children}</div>
          </div>
        </main>
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
