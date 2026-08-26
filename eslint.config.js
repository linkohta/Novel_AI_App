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
    // Electron main process + preload + shared CommonJS logic (Node.js environment).
    files: ['main.js', 'preload.js', 'shared/**/*.js'],
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
    // Shared request-building logic: native ESM so it can be `import`ed directly
    // by both the browser (via Vite) and main.js (via dynamic import()).
    files: ['shared/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
    },
    rules: commonRules,
  },
  {
    // React + Capacitor bridge source, bundled by Vite (ESM + browser environment).
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
