import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// `npm run dev`（electron-vite dev）専用: main.jsとpreload.jsをビルド+watchし、
// src/ 用のVite開発サーバーを起動して、それを指すElectronを起動する。
// 本番パイプライン（npm start / npm run build:web / npm run cap:sync）は
// このファイルを使わない —— 従来通り通常の `vite build`（vite.config.js）で
// www/ にビルドし、バンドルされていないmain.js/preload.jsから読み込む。
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
