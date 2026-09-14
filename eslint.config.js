import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const forbiddenInDomain = [
  'react',
  'react/*',
  'react-dom',
  'react-dom/*',
  'react-router',
  'react-router-dom',
  'zustand',
  'zustand/*',
  'immer',
  'zod',
  'electron',
  'electron/*',
  'electron-vite',
  'node:*',
  'fs',
  'path',
  'os',
  'crypto',
];

export default tseslint.config([
  globalIgnores(['out', 'release', 'dist', 'node_modules', 'build']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: { ecmaVersion: 2022 },
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },
  {
    files: ['electron/**/*.ts', 'electron.vite.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    files: ['src/domain/**/*.ts'],
    languageOptions: { globals: {} },
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: forbiddenInDomain,
              message:
                'src/domain est pur : il n import ni framework, ni Electron, ni module Node. Voir CLAUDE.md, regle d or.',
            },
          ],
        },
      ],
      'no-restricted-globals': [
        'error',
        'window',
        'document',
        'localStorage',
        'sessionStorage',
        'navigator',
        'fetch',
        'process',
      ],
      'no-restricted-properties': [
        'error',
        {
          object: 'Math',
          property: 'random',
          message: 'Le hasard entre par une graine passee en argument (R4.7).',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Le temps entre par un argument, jamais par une lecture directe.',
        },
      ],
    },
  },
]);
