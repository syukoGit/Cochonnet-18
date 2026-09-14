import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';
import { globalIgnores } from 'eslint/config';

const COMMENTAIRES_TOLERES = /^\s*(eslint-|prettier-|@ts-|\/\s*<reference)/;

const cochonnet = {
  rules: {
    'sans-commentaire': {
      meta: {
        type: 'problem',
        messages: {
          interdit:
            'Pas de commentaire : le code doit se décrire lui-même. Extrais une fonction ou une constante bien nommée. Voir CLAUDE.md, Conventions.',
        },
        schema: [],
      },
      create(context) {
        return {
          Program() {
            for (const commentaire of context.sourceCode.getAllComments()) {
              if (COMMENTAIRES_TOLERES.test(commentaire.value)) {
                continue;
              }
              context.report({ loc: commentaire.loc, messageId: 'interdit' });
            }
          },
        };
      },
    },
  },
};

const INTERDIT_DANS_LE_DOMAINE = [
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
    files: ['**/*.{js,ts,tsx}'],
    plugins: { cochonnet },
    extends: [js.configs.recommended],
    rules: {
      'cochonnet/sans-commentaire': 'error',
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
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
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
    files: ['electron/**/*.ts', 'electron.vite.config.ts', 'vitest.config.ts'],
    languageOptions: { globals: globals.node },
  },

  {
    files: ['**/*.test.ts'],
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
              group: INTERDIT_DANS_LE_DOMAINE,
              message:
                "src/domain est pur : ni framework, ni Electron, ni module Node. Voir CLAUDE.md, règle d'or.",
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
          message: 'Le hasard entre par une graine passée en argument (R4.7).',
        },
        {
          object: 'Date',
          property: 'now',
          message: 'Le temps entre par un argument, jamais par une lecture directe.',
        },
      ],
    },
  },

  {
    files: ['eslint.config.js'],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: { globals: globals.node },
  },
]);
