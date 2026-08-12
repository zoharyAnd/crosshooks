import type { Metadata, Viewport } from 'next';
import Link from 'next/link';
import { ServiceWorkerRegistrar } from './ServiceWorkerRegistrar';
import { ThemeToggle } from './ThemeToggle';
import './globals.css';

// Applied before paint to set the theme class and avoid a flash of the wrong theme.
const themeScript = `(function(){try{var t=localStorage.getItem('theme');if(!t){t=window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark';}if(t==='dark'){document.documentElement.classList.add('dark');}}catch(e){document.documentElement.classList.add('dark');}})();`;

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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="min-h-screen font-sans text-fg antialiased">
        <main className="mx-auto min-h-screen w-full max-w-6xl px-6 py-10">
          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <aside className="lg:sticky lg:top-10 lg:self-start">
              <nav
                aria-label="Documentation navigation"
                className="rounded-xl border border-line bg-surface p-4 text-sm"
              >
                <Link href="/" className="block font-semibold text-fg hover:text-accent">
                  Getting started
                </Link>
                <Link
                  href="/pwa-install"
                  className="block font-semibold text-fg hover:text-accent mt-4"
                >
                  PWA install
                </Link>
                <Link
                  href="/push-notifications"
                  className="block font-semibold text-fg hover:text-accent mt-4"
                >
                  Push notifications
                </Link>
                <div className="ml-2 flex flex-col gap-2 border-l border-line pl-3">
                  <p className="mb-2 mt-4 font-semibold text-fg">Providers</p>
                  <div className="ml-2 flex flex-col gap-2 border-l border-line pl-3">
                    <Link
                      href="/provider/firebase"
                      className="text-muted hover:text-accent"
                    >
                      Firebase provider
                    </Link>
                    <Link
                      href="/provider/onesignal"
                      className="text-muted hover:text-accent"
                    >
                      OneSignal provider
                    </Link>
                    <Link href="/provider/expo" className="text-muted hover:text-accent">
                      Expo provider
                    </Link>
                  </div>
                </div>

                <Link
                  href="/offline-sync"
                  className="block font-semibold text-fg hover:text-accent mt-4"
                >
                  Offline sync
                </Link>

                <Link
                  href="/demos"
                  className="block font-semibold text-fg hover:text-accent mt-4 mb-2"
                >
                  Demos
                </Link>
                <div className="ml-2 flex flex-col gap-2 border-l border-line pl-3">
                  <Link
                    href="/demos/pwa-install"
                    className="text-muted hover:text-accent"
                  >
                    PWA install
                  </Link>
                  <Link
                    href="/demos/push-notification"
                    className="text-muted hover:text-accent"
                  >
                    Push notifications
                  </Link>
                  <Link
                    href="/demos/offline-sync"
                    className="text-muted hover:text-accent"
                  >
                    Offline sync
                  </Link>
                </div>

                <div className="mt-6 border-t border-line pt-4">
                  <ThemeToggle />
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
