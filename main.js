const { app, BrowserWindow, Menu, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const crypto = require('crypto');
const { unzipSync } = require('fflate');

// shared/novelai.mjs is a native ESM module (it's also imported directly by
// the browser-side src/platform/capacitorBridge.js via Vite), so it can't be
// loaded with require() from this CommonJS file — use a cached dynamic import.
let novelaiModulePromise;
function loadNovelaiModule() {
  if (!novelaiModulePromise) novelaiModulePromise = import('./shared/novelai.mjs');
  return novelaiModulePromise;
}

const userDataDir = app.getPath('userData');
const settingsPath = path.join(userDataDir, 'settings.json');
const chunksPath = path.join(userDataDir, 'chunks.json');
const templatesPath = path.join(userDataDir, 'templates.json');
const FAVORITE_PATHS = {
  artist: path.join(userDataDir, 'favorite-artists.json'),
  character: path.join(userDataDir, 'favorite-characters.json'),
};
// Packaged builds install into a read-only location (e.g. Program Files), so
// generated images must live under a writable, per-user directory instead of
// alongside the app itself. The user can override this via settings.outputDir
// (set through the "保存先フォルダ" picker in the UI); an empty/missing value
// falls back to this default.
const defaultOutputDir = path.join(app.getPath('documents'), 'NovelAI', 'output');

function getOutputDir() {
  const settings = readJson(settingsPath, {});
  return typeof settings.outputDir === 'string' && settings.outputDir.trim()
    ? settings.outputDir
    : defaultOutputDir;
}

// Sanitizes a batch-folder path made of one or more "/"-separated segments
// (e.g. "queue_123/prompt1"), stripping unsafe characters from each segment
// individually so nested subfolders keep working.
function sanitizeBatchFolder(batchFolder) {
  if (!batchFolder) return '';
  return String(batchFolder)
    .split('/')
    .map((segment) => segment.replace(/[^a-zA-Z0-9_-]/g, ''))
    .filter(Boolean)
    .join('/');
}

function readJson(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return fallback;
  }
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

function buildMenu() {
  const template = [
    {
      label: 'ファイル',
      submenu: [
        {
          label: '保存フォルダを開く',
          click: () => shell.openPath(getOutputDir()),
        },
        { type: 'separator' },
        { role: 'quit', label: '終了' },
      ],
    },
    {
      label: '編集',
      submenu: [
        { role: 'undo', label: '元に戻す' },
        { role: 'redo', label: 'やり直す' },
        { type: 'separator' },
        { role: 'cut', label: '切り取り' },
        { role: 'copy', label: 'コピー' },
        { role: 'paste', label: '貼り付け' },
        { role: 'selectAll', label: 'すべて選択' },
      ],
    },
    {
      label: '表示',
      submenu: [
        { role: 'reload', label: '再読み込み' },
        { role: 'forceReload', label: '強制再読み込み' },
        { role: 'toggleDevTools', label: '開発者ツール' },
        { type: 'separator' },
        { role: 'resetZoom', label: '実際のサイズ' },
        { role: 'zoomIn', label: '拡大' },
        { role: 'zoomOut', label: '縮小' },
        { type: 'separator' },
        { role: 'togglefullscreen', label: 'フルスクリーン切り替え' },
      ],
    },
    {
      label: 'ウィンドウ',
      submenu: [
        { role: 'minimize', label: '最小化' },
        { role: 'close', label: '閉じる' },
      ],
    },
    {
      label: 'ヘルプ',
      submenu: [
        {
          label: 'NovelAI を開く',
          click: () => shell.openExternal('https://novelai.net'),
        },
      ],
    },
  ];
  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// `npm run dev` (electron-vite dev) builds this file into out-dev/main/main.js
// and sets ELECTRON_RENDERER_URL to the Vite dev server; the preload build
// then lives at out-dev/preload/preload.js, one directory up. Everything else
// (npm start, packaged builds) runs this file unbundled from the project
// root, where __dirname/preload.js is correct and ELECTRON_RENDERER_URL is unset.
const devServerUrl = process.env.ELECTRON_RENDERER_URL;
const preloadPath = devServerUrl
  ? path.join(__dirname, '../preload/preload.js')
  : path.join(__dirname, 'preload.js');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
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

app.whenReady().then(() => {
  fs.mkdirSync(getOutputDir(), { recursive: true });
  buildMenu();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('load-settings', () => readJson(settingsPath, {}));

ipcMain.handle('save-settings', (event, settings) => {
  writeJson(settingsPath, settings);
  return true;
});

ipcMain.handle('load-chunks', () => readJson(chunksPath, []));

ipcMain.handle('save-chunk', (event, chunk) => {
  const chunks = readJson(chunksPath, []);
  chunks.push({ id: crypto.randomUUID(), name: chunk.name, text: chunk.text });
  writeJson(chunksPath, chunks);
  return chunks;
});

ipcMain.handle('update-chunk', (event, chunk) => {
  const chunks = readJson(chunksPath, []);
  const target = chunks.find((c) => c.id === chunk.id);
  if (target) {
    target.name = chunk.name;
    target.text = chunk.text;
    writeJson(chunksPath, chunks);
  }
  return chunks;
});

ipcMain.handle('delete-chunk', (event, id) => {
  const chunks = readJson(chunksPath, []).filter((c) => c.id !== id);
  writeJson(chunksPath, chunks);
  return chunks;
});

ipcMain.handle('load-templates', () => readJson(templatesPath, []));

ipcMain.handle('save-template', (event, template) => {
  const templates = readJson(templatesPath, []);
  templates.push({ id: crypto.randomUUID(), name: template.name, text: template.text });
  writeJson(templatesPath, templates);
  return templates;
});

ipcMain.handle('update-template', (event, template) => {
  const templates = readJson(templatesPath, []);
  const target = templates.find((t) => t.id === template.id);
  if (target) {
    target.name = template.name;
    target.text = template.text;
    writeJson(templatesPath, templates);
  }
  return templates;
});

ipcMain.handle('delete-template', (event, id) => {
  const templates = readJson(templatesPath, []).filter((t) => t.id !== id);
  writeJson(templatesPath, templates);
  return templates;
});

ipcMain.handle('load-favorites', (event, kind) => readJson(FAVORITE_PATHS[kind], []));

ipcMain.handle('save-favorite', (event, { kind, item }) => {
  const favoritesPath = FAVORITE_PATHS[kind];
  const favorites = readJson(favoritesPath, []);
  favorites.push({ id: crypto.randomUUID(), ...item });
  writeJson(favoritesPath, favorites);
  return favorites;
});

ipcMain.handle('update-favorite', (event, { kind, item }) => {
  const favoritesPath = FAVORITE_PATHS[kind];
  const favorites = readJson(favoritesPath, []);
  const target = favorites.find((f) => f.id === item.id);
  if (target) {
    Object.assign(target, item);
    writeJson(favoritesPath, favorites);
  }
  return favorites;
});

ipcMain.handle('delete-favorite', (event, { kind, id }) => {
  const favoritesPath = FAVORITE_PATHS[kind];
  const favorites = readJson(favoritesPath, []).filter((f) => f.id !== id);
  writeJson(favoritesPath, favorites);
  return favorites;
});

ipcMain.handle('open-output-folder', () => shell.openPath(getOutputDir()));

ipcMain.handle('choose-output-folder', async (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(win, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || !result.filePaths.length) return null;
  return result.filePaths[0];
});

function requestImage(apiKey, body, endpoint) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-zip-compressed',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`API エラー (${res.statusCode}): ${buffer.toString('utf-8')}`));
            return;
          }
          resolve(buffer);
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function requestSubscriptionInfo(apiKey, endpoint) {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`API エラー (${res.statusCode}): ${buffer.toString('utf-8')}`));
            return;
          }
          try {
            resolve(JSON.parse(buffer.toString('utf-8')));
          } catch {
            reject(new Error('残量情報の解析に失敗しました'));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

ipcMain.handle('get-subscription-info', async (event, apiKey) => {
  if (!apiKey) throw new Error('APIキーを入力してください');
  const { parseSubscriptionInfo, NOVELAI_SUBSCRIPTION_ENDPOINT } = await loadNovelaiModule();
  const data = await requestSubscriptionInfo(apiKey, NOVELAI_SUBSCRIPTION_ENDPOINT);
  return parseSubscriptionInfo(data);
});

ipcMain.handle('generate-image', async (event, params) => {
  if (!params.apiKey) throw new Error('APIキーを入力してください');
  if (!params.prompt) throw new Error('プロンプトを入力してください');

  const { buildRequestBody, NOVELAI_IMAGE_ENDPOINT } = await loadNovelaiModule();
  const body = buildRequestBody(params);
  const zipBuffer = await requestImage(params.apiKey, body, NOVELAI_IMAGE_ENDPOINT);

  const unzipped = unzipSync(new Uint8Array(zipBuffer));
  const entryNames = Object.keys(unzipped);
  if (!entryNames.length) throw new Error('画像データを取得できませんでした');

  const imageBuffer = Buffer.from(unzipped[entryNames[0]]);
  const fileName = `${Date.now()}_${body.parameters.seed}.png`;
  const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
  const outputDir = getOutputDir();
  const targetDir = safeBatchFolder ? path.join(outputDir, safeBatchFolder) : outputDir;
  fs.mkdirSync(targetDir, { recursive: true });
  const filePath = path.join(targetDir, fileName);
  fs.writeFileSync(filePath, imageBuffer);

  return {
    fileName,
    filePath,
    seed: body.parameters.seed,
    dataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`,
  };
});
