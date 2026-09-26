import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';

// electron-vite dev はElectronの起動時、常にpackage.jsonの"main"フィールド
// （本番用のelectron-dist/main.js、tsc未実行だと存在しない）をエントリとして
// 検証・起動しようとする。本ファイルのbuild.outDirはあえて本番と異なる
// out-dev/main を使っているため、ELECTRON_ENTRYで明示的に上書きし、
// package.jsonのmainを見ずにout-dev/main/main.jsを起動させる。
process.env.ELECTRON_ENTRY = 'out-dev/main/main.js';

// `npm run dev`（electron-vite dev）専用: main.tsとpreload.tsをビルド+watchし、
// src/ 用のVite開発サーバーを起動して、それを指すElectronを起動する。
// 本番パイプライン（npm start / npm run build:web / npm run dist）は
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
        // rootを'src'にしているため、相対パスで'src/index.html'と書くとrootからの
        // 相対（src/src/index.html）として解決され、依存関係の事前バンドル時の
        // スキャンが「failed to resolve rolldownOptions.input」で失敗する。
        // 設定ファイルの場所を基準にした絶対パスで指定する。
        input: resolve(__dirname, 'src/index.html'),
      },
    },
  },
});
