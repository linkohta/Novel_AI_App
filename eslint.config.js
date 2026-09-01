const js = require('@eslint/js');
const reactHooks = require('eslint-plugin-react-hooks');
const tsParser = require('@typescript-eslint/parser');
const tsPlugin = require('@typescript-eslint/eslint-plugin');

const commonRules = {
  'no-unused-vars': 'warn',
  'no-var': 'error',
  'prefer-const': 'error',
};

const tsRules = {
  'no-unused-vars': 'off',
  '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
  'no-var': 'error',
  'prefer-const': 'error',
};

module.exports = [
  js.configs.recommended,
  {
    ignores: [
      'node_modules/**',
      'android/**',
      'dist/**',
      'output/**',
      'www/**',
      'out-dev/**',
      'electron-dist/**',
    ],
  },
  {
    // Electronメインプロセス + preload + 共有ロジック（Node.js環境、TypeScript）。
    files: ['main.ts', 'preload.ts', 'electron/**/*.ts', 'shared/**/*.mts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        sourceType: 'module',
      },
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'writable',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        Buffer: 'readonly',
        URL: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: tsRules,
  },
  {
    // React + Capacitorブリッジのソース。Viteでバンドルされる（ESM + ブラウザ環境、TypeScript）。
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        btoa: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        Event: 'readonly',
        Blob: 'readonly',
        Response: 'readonly',
        DecompressionStream: 'readonly',
        TextDecoder: 'readonly',
      },
    },
    plugins: { 'react-hooks': reactHooks, '@typescript-eslint': tsPlugin },
    rules: {
      ...tsRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
  {
    // 設定ファイル（vite.config.ts等）はNode環境のTypeScript。
    files: ['*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parser: tsParser,
      globals: {
        process: 'readonly',
        console: 'readonly',
        __dirname: 'readonly',
      },
    },
    plugins: { '@typescript-eslint': tsPlugin },
    rules: tsRules,
  },
];
