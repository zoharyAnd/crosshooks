import type { Metadata, Viewport } from 'next';
import { ServiceWorkerRegistrar } from './ServiceWorkerRegistrar';
import './globals.css';

export const metadata: Metadata = {
  title: 'crosshooks — live React hook demos',
  description:
    'Live demos of crosshooks: usePWAInstallPrompt and usePushNotifications — cross-platform React hooks for web and React Native.',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'crosshooks',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  themeColor: '#0b1020',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
