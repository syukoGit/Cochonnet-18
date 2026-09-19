import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const TOLERATED_COMMENTS = /^\s*(eslint-|prettier-|@ts-|\/\s*<reference)/;

const cochonnet = {
  rules: {
    'no-comments': {
      meta: {
        type: 'problem',
        messages: {
          forbidden:
            'No comments: the code must describe itself. Extract a well-named function or constant instead. See CLAUDE.md, Conventions.',
        },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            for (const comment of context.sourceCode.getAllComments()) {
              if (TOLERATED_COMMENTS.test(comment.value)) {
                continue;
              }
              context.report({ loc: comment.loc, messageId: 'forbidden' });
            }
          },
        };
      },
    },
  },
};

const FORBIDDEN_IN_DOMAIN = [
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
  globalIgnores(['out', 'release', 'dist', 'node_modules', 'build', 'coverage']),

  {
    files: ['**/*.{js,mjs,ts,tsx}'],
    plugins: { cochonnet },
    extends: [js.configs.recommended],
    rules: {
      'cochonnet/no-comments': 'error',
      eqeqeq: ['error', 'always'],
      'no-console': ['error', { allow: ['error', 'warn'] }],
      'no-param-reassign': 'error',
      'prefer-const': 'error',
      'object-shorthand': 'error',
    },
  },

  {
    files: ['**/*.{ts,tsx}'],
    extends: [tseslint.configs.strictTypeChecked, tseslint.configs.stylisticTypeChecked],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.web.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { fixStyle: 'separate-type-imports' },
      ],
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/switch-exhaustiveness-check': 'error',
      '@typescript-eslint/restrict-template-expressions': ['error', { allowNumber: true }],
    },
  },

  {
    files: ['src/**/*.{ts,tsx}'],
    extends: [reactHooks.configs['recommended-latest'], reactRefresh.configs.vite],
    languageOptions: { globals: globals.browser },
  },

  {
    files: [
      'electron/**/*.ts',
      'e2e/**/*.ts',
      'electron.vite.config.ts',
      'vitest.config.ts',
      'playwright.config.ts',
    ],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.test.ts', 'e2e/**/*.ts'],
    rules: { '@typescript-eslint/no-unnecessary-condition': 'off' },
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
              group: FORBIDDEN_IN_DOMAIN,
              message:
                'src/domain is pure: no framework, no Electron, no Node module. See CLAUDE.md, golden rule.',
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
          message: 'Randomness enters through a seed passed as an argument (R4.7).',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Time enters through an argument, never through a direct read.',
        },
      ],
    },
  },

  {
    files: ['eslint.config.js', 'scripts/**/*.mjs'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
    rules: { 'no-console': 'off' },
  },
]);
