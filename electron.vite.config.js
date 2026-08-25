import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// Used only by `npm run dev` (electron-vite dev): builds+watches main.js and
// preload.js, starts the Vite dev server for src/, and launches Electron
// pointing at it. The production pipeline (npm start / npm run build:web /
// npm run cap:sync) does not use this file — it still runs plain `vite
// build` (vite.config.js) into www/, loaded by the unbundled main.js/preload.js
// exactly as before.
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: 'main.js' },
      outDir: 'out-dev/main',
      rollupOptions: { external: ['electron'] },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: 'preload.js' },
      outDir: 'out-dev/preload',
    },
  },
  renderer: {
    root: 'src',
    plugins: [react()],
    build: {
      outDir: '../out-dev/renderer',
      rollupOptions: {
        input: 'src/index.html',
      },
    },
  },
});
