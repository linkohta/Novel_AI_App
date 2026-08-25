const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// Electron loads the build output via file://, and Capacitor serves it from a
// local webview — both need relative asset URLs, hence base: './'.
module.exports = defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
});
