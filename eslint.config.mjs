import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: [
      '**/dist/**',
      '**/coverage/**',
      'examples/**/.next/**',
      'examples/**/next-env.d.ts',
      'examples/**/public/**',
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      // The two rules that matter most for a hooks library.
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // TypeScript's compiler handles undefined identifiers; the core rule
      // produces false positives on type-only references.
      'no-undef': 'off',
    },
  },
  // Keep ESLint out of Prettier's lane — must stay last.
  prettier,
);
