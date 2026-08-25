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
    // Plain browser script, no module system, loaded directly via <script>.
    files: ['www/*.js'],
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
    rules: commonRules,
  },
];
