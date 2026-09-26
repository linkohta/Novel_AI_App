import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Electronはビルド成果物（www/index.html）を file:// で読み込むため、
// 相対アセットURLになるよう base: './' としている。
export default defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
});
