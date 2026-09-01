import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { unzipSync } from 'fflate';
import {
  buildRequestBody,
  parseSubscriptionInfo,
  sanitizeBatchFolder,
  NOVELAI_IMAGE_ENDPOINT,
  NOVELAI_SUBSCRIPTION_ENDPOINT,
} from '../../shared/novelai.mjs';

// Electronではページ内の他のスクリプトが実行される前に、preload.jsの
// contextBridgeによってすでにwindow.apiが定義されているため、このブリッジは
// Capacitor/Web環境でのみ有効化される。このモジュールをimportすること
// （main.jsxで<App />をレンダリングする前）が以下のセットアップの起点となる
// ——Appがwindow.apiを呼び出せるようになる前に必ず実行されている必要がある。
if (!window.api) {
  const SETTINGS_KEY = 'novelai_settings';
  const CHUNKS_KEY = 'novelai_chunks';
  const TEMPLATES_KEY = 'novelai_templates';
  const QUEUE_TEMPLATES_KEY = 'novelai_queue_templates';
  const FAVORITE_KEYS = {
    artist: 'novelai_favorite_artists',
    character: 'novelai_favorite_characters',
  };

  let lastSavedUri = null;

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function bytesToBase64(bytes) {
    let binary = '';
    const chunkSize = 0x8000;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
    }
    return btoa(binary);
  }

  async function loadJson(key, fallback) {
    const { value } = await Preferences.get({ key });
    if (!value) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function saveJson(key, data) {
    return Preferences.set({ key, value: JSON.stringify(data) });
  }

  function makeNamedListApi(key) {
    return {
      load: () => loadJson(key, []),
      save: async (item) => {
        const list = await loadJson(key, []);
        list.push({ id: uuid(), name: item.name, text: item.text });
        await saveJson(key, list);
        return list;
      },
      update: async (item) => {
        const list = await loadJson(key, []);
        const target = list.find((i) => i.id === item.id);
        if (target) {
          target.name = item.name;
          target.text = item.text;
          await saveJson(key, list);
        }
        return list;
      },
      remove: async (id) => {
        const list = (await loadJson(key, [])).filter((i) => i.id !== id);
        await saveJson(key, list);
        return list;
      },
    };
  }

  function makeGenericListApi(key) {
    return {
      load: () => loadJson(key, []),
      save: async (item) => {
        const list = await loadJson(key, []);
        list.push({ id: uuid(), ...item });
        await saveJson(key, list);
        return list;
      },
      update: async (item) => {
        const list = await loadJson(key, []);
        const target = list.find((i) => i.id === item.id);
        if (target) {
          Object.assign(target, item);
          await saveJson(key, list);
        }
        return list;
      },
      remove: async (id) => {
        const list = (await loadJson(key, [])).filter((i) => i.id !== id);
        await saveJson(key, list);
        return list;
      },
    };
  }

  async function generateImage(params) {
    if (!params.apiKey) throw new Error('APIキーを入力してください');
    if (!params.prompt) throw new Error('プロンプトを入力してください');

    const body = buildRequestBody(params);

    const res = await fetch(NOVELAI_IMAGE_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/x-zip-compressed',
        Authorization: `Bearer ${params.apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API エラー (${res.status}): ${text}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const unzipped = unzipSync(new Uint8Array(arrayBuffer));
    const entryNames = Object.keys(unzipped);
    if (!entryNames.length) throw new Error('画像データを取得できませんでした');

    const imageBytes = unzipped[entryNames[0]];
    const base64 = bytesToBase64(imageBytes);
    const baseName = `${Date.now()}_${body.parameters.seed}`;
    const fileName = `${baseName}.png`;
    const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
    const relativeDir = safeBatchFolder ? `output/${safeBatchFolder}` : 'output';
    const relativePath = `${relativeDir}/${fileName}`;

    await Filesystem.writeFile({
      path: relativePath,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });
    // 単発生成では画像1枚がそのままプロンプト1件に対応するため、ここでリク
    // エスト内容を保存する。連続生成・複数プロンプト連続生成はプロンプト単位
    // でまとめて savePromptInfo 経由で1個だけ保存するため、それらの呼び出し
    // では params.skipJsonOutput が立てられ、ここでは保存しない。
    if (!params.skipJsonOutput) {
      await Filesystem.writeFile({
        path: `${relativeDir}/${baseName}.json`,
        data: JSON.stringify(body, null, 2),
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
        recursive: true,
      });
    }

    let filePath = relativePath;
    try {
      const uriResult = await Filesystem.getUri({
        path: relativePath,
        directory: Directory.Documents,
      });
      filePath = uriResult.uri;
      lastSavedUri = uriResult.uri;
    } catch {
      // getUriはベストエフォートであり、失敗した場合は表示用に相対パスへフォールバックする。
    }

    return {
      fileName,
      filePath,
      seed: body.parameters.seed,
      dataUrl: `data:image/png;base64,${base64}`,
    };
  }

  // 連続生成・複数プロンプト連続生成が、同じプロンプトで複数枚生成する前後
  // に1回だけ呼び出し、そのプロンプトのリクエスト内容をプロンプト単位で1つ
  // のJSONファイルとして保存する（main.jsのsave-prompt-infoハンドラと同じ
  // 役割）。生成される各画像の実際のシード値は毎回異なりうるため、ここでは
  // 元のリクエストで指定した値（未指定/0なら0のまま）を記録する。
  async function savePromptInfo(params) {
    const body = buildRequestBody(params);
    body.parameters.seed = Number(params.seed) > 0 ? Number(params.seed) : 0;
    const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
    const relativeDir = safeBatchFolder ? `output/${safeBatchFolder}` : 'output';
    await Filesystem.writeFile({
      path: `${relativeDir}/${params.fileName}.json`,
      data: JSON.stringify(body, null, 2),
      directory: Directory.Documents,
      encoding: Encoding.UTF8,
      recursive: true,
    });
    return true;
  }

  async function getSubscriptionInfo(apiKey) {
    if (!apiKey) throw new Error('APIキーを入力してください');
    const res = await fetch(NOVELAI_SUBSCRIPTION_ENDPOINT, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      throw new Error(`API エラー (${res.status}): ${text}`);
    }
    const data = await res.json();
    return parseSubscriptionInfo(data);
  }

  async function chooseOutputFolder() {
    // Capacitorには追加のネイティブプラグイン無しで任意のフォルダを選択できる
    // APIが無いため、Androidでは常にDocuments/output配下に保存する。
    return null;
  }

  async function openOutputFolder() {
    if (!lastSavedUri) return;
    // Androidにはサードパーティアプリ向けの「このアプリのフォルダを開く」汎用APIが
    // 無いため、最も近い代替手段として直近に保存した画像を共有する。
    await Share.share({ url: lastSavedUri });
  }

  const chunksApi = makeNamedListApi(CHUNKS_KEY);
  const templatesApi = makeNamedListApi(TEMPLATES_KEY);
  const queueTemplatesApi = makeGenericListApi(QUEUE_TEMPLATES_KEY);
  const favoritesApis = {
    artist: makeGenericListApi(FAVORITE_KEYS.artist),
    character: makeGenericListApi(FAVORITE_KEYS.character),
  };

  window.api = {
    loadSettings: () => loadJson(SETTINGS_KEY, {}),
    saveSettings: (settings) => saveJson(SETTINGS_KEY, settings),
    generateImage,
    savePromptInfo,
    getSubscriptionInfo,
    openOutputFolder,
    chooseOutputFolder,
    loadChunks: chunksApi.load,
    saveChunk: chunksApi.save,
    updateChunk: chunksApi.update,
    deleteChunk: chunksApi.remove,
    loadTemplates: templatesApi.load,
    saveTemplate: templatesApi.save,
    updateTemplate: templatesApi.update,
    deleteTemplate: templatesApi.remove,
    loadQueueTemplates: queueTemplatesApi.load,
    saveQueueTemplate: queueTemplatesApi.save,
    updateQueueTemplate: queueTemplatesApi.update,
    deleteQueueTemplate: queueTemplatesApi.remove,
    loadFavorites: (kind) => favoritesApis[kind].load(),
    saveFavorite: (kind, item) => favoritesApis[kind].save(item),
    updateFavorite: (kind, item) => favoritesApis[kind].update(item),
    deleteFavorite: (kind, id) => favoritesApis[kind].remove(id),
  };

  window.isNativeApp = Capacitor.isNativePlatform();
}
