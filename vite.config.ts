import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// ElectronはビルドをVia file://で読み込み、Capacitorはローカルwebviewから配信する
// —— どちらも相対アセットURLが必要なため base: './' としている。
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
});
