import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// `npm run dev`（electron-vite dev）専用: main.tsとpreload.tsをビルド+watchし、
// src/ 用のVite開発サーバーを起動して、それを指すElectronを起動する。
// 本番パイプライン（npm start / npm run build:web / npm run cap:sync）は
// このファイルを使わない —— 本番は `tsc -p tsconfig.electron.json` で
// main.ts/electron/**/*.ts/shared/novelai.mts を electron-dist/ にコンパイルし、
// バンドルされていない状態のまま読み込む（package.jsonの"main"を参照）。
export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: 'main.ts' },
      outDir: 'out-dev/main',
      rollupOptions: { external: ['electron'] },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      lib: { entry: 'preload.ts' },
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
