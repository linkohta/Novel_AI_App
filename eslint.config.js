const js = require('@eslint/js');
const reactHooks = require('eslint-plugin-react-hooks');

const commonRules = {
  'no-unused-vars': 'warn',
  'no-var': 'error',
  'prefer-const': 'error',
};

module.exports = [
  js.configs.recommended,
  {
    ignores: ['node_modules/**', 'android/**', 'dist/**', 'output/**', 'www/**'],
  },
  {
    // Electronメインプロセス + preload + 共有CommonJSロジック（Node.js環境）。
    files: ['main.js', 'preload.js', 'electron/**/*.js', 'shared/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
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
    rules: commonRules,
  },
  {
    // 共有のリクエスト組み立てロジック: ネイティブESMとして書かれており、
    // ブラウザ側（Vite経由）とmain.js（動的import()経由）の両方から直接importできる。
    files: ['shared/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: commonRules,
  },
  {
    // React + Capacitorブリッジのソース。Viteでバンドルされる（ESM + ブラウザ環境）。
    files: ['src/**/*.js', 'src/**/*.jsx'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
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
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...commonRules,
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
