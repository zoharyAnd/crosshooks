'use client';

import { useState } from 'react';
import { InstallCard } from './InstallCard';
import { PushCard } from './PushCard';

type Demo = 'install' | 'push';

export default function Home() {
  const [demo, setDemo] = useState<Demo>('install');

  const buttonClass = (value: Demo) =>
    `rounded-xl border px-4 py-3 text-sm font-semibold transition-colors ${demo === value
      ? 'border-[#6ea8fe] bg-[#6ea8fe] text-[#06122b]'
      : 'border-[#263050] bg-[#141a2e] text-[#93a0c4] hover:text-[#e8ecf8]'
    }`;

  return (
    <section className="flex min-h-screen flex-col justify-start gap-5 px-6 pyÍ-10">
      <h1 className="sr-only">crosshooks — live React hook demos</h1>

      <div className="grid w-full max-w-[520px] grid-cols-1 gap-3 sm:grid-cols-2">
        <button className={buttonClass('install')} onClick={() => setDemo('install')}>
          Test usePWAInstallPrompt
        </button>
        <button className={buttonClass('push')} onClick={() => setDemo('push')}>
          Test usePushNotifications web
        </button>
      </div>

      {demo === 'install' ? <InstallCard /> : <PushCard />}
    </section>
  );
}
