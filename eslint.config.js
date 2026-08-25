const js = require('@eslint/js');

const commonRules = {
  'no-unused-vars': 'warn',
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
      'www/capacitor-bridge.bundle.js',
    ],
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
    // Capacitor bridge, bundled with esbuild (ESM + browser environment).
    files: ['src/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: {
        window: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        btoa: 'readonly',
        console: 'readonly',
      },
    },
    rules: commonRules,
  },
  {
    // Plain browser scripts, no module system, loaded via multiple <script> tags
    // in a fixed order (see index.html) and sharing one global scope by design.
    // no-undef/no-unused-vars/prefer-const are disabled here because each file
    // is linted in isolation and cannot see that a `const`/`let`/`function` it
    // declares is read, called, or reassigned from a different www/js/*.js
    // file — that is expected, not a bug.
    files: ['www/**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'script',
      globals: {
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        Event: 'readonly',
      },
    },
    rules: {
      ...commonRules,
      'no-undef': 'off',
      'no-unused-vars': 'off',
      'prefer-const': 'off',
    },
  },
];
