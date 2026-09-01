const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// ElectronはビルドをVia file://で読み込み、Capacitorはローカルwebviewから配信する
// —— どちらも相対アセットURLが必要なため base: './' としている。
module.exports = defineConfig({
  root: 'src',
  base: './',
  plugins: [react()],
  build: {
    outDir: '../www',
    emptyOutDir: true,
  },
});
