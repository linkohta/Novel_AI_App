import { BrowserWindow } from 'electron';
import path from 'path';

// `npm run dev`（electron-vite dev）はこのファイルを out-dev/main/main.js に
// ビルドし、ELECTRON_RENDERER_URL をViteの開発サーバーに設定する。その場合
// preloadのビルドは1つ上のディレクトリの out-dev/preload/preload.js に置かれる。
// それ以外（npm start、パッケージ化されたビルド）ではこのファイルは
// プロジェクトルートから未バンドルのまま実行され、__dirname/preload.js が
// 正しいパスとなり、ELECTRON_RENDERER_URL は未設定になる。
// electron-vite dev はmain.js/electron/配下を1つのファイルにバンドルするため、
// バンドル後は __dirname がどのソースファイル由来のコードからでも
// 出力先（out-dev/main/）を指す。そのため devServerUrl 使用時は元のmain.jsと
// 同じ相対パス（'../preload/preload.js'）のままでよい。
const devServerUrl = process.env.ELECTRON_RENDERER_URL;
const preloadPath = devServerUrl
  ? path.join(__dirname, '../preload/preload.js')
  : path.join(__dirname, '..', 'preload.js');

export function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      // 連続生成・複数プロンプト連続生成の待機カウントダウンはレンダラー側の
      // setTimeoutに依存しているため、既定のtrue（ウィンドウが最小化/非表示
      // の間タイマーを大幅に間引く）のままだと非アクティブ時にカウントが
      // 進まなくなる。バックグラウンドでも生成ループを正常に進行させるため
      // 無効化する。
      backgroundThrottling: false,
    },
  });
  win.once('ready-to-show', () => {
    win.maximize();
    win.show();
  });
  if (devServerUrl) {
    win.loadURL(devServerUrl);
  } else {
    win.loadFile('www/index.html');
  }
}
