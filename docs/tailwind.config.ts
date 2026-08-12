import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: ['./app/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        glow: 'var(--glow)',
        fg: 'var(--fg)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        surface: 'var(--surface)',
        inset: 'var(--inset)',
        accent: 'var(--accent)',
        'on-accent': 'var(--on-accent)',
        success: 'var(--success)',
        danger: 'var(--danger)',
        neutral: 'var(--neutral)',
        'warn-bg': 'var(--warn-bg)',
        'warn-border': 'var(--warn-border)',
        'warn-text': 'var(--warn-text)',
      },
    },
  },
  plugins: [],
};

export default config;
