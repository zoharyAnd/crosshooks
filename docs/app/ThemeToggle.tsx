'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    setMounted(true);
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    try {
      localStorage.setItem('theme', next);
    } catch {
      // ignore storage failures (private mode, etc.)
    }
  }

  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-inset px-3 py-2 text-xs font-semibold text-muted transition-colors hover:text-accent"
    >
      {/* Avoid a hydration mismatch: render neutral label until mounted. */}
      <span suppressHydrationWarning>
        {!mounted ? '' : isDark ? '☀️ Light mode' : '🌙 Dark mode'}
      </span>
    </button>
  );
}
