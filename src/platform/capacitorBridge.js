import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Preferences } from '@capacitor/preferences';
import { Share } from '@capacitor/share';
import { unzipSync } from 'fflate';
import {
  buildRequestBody,
  parseSubscriptionInfo,
  NOVELAI_IMAGE_ENDPOINT,
  NOVELAI_SUBSCRIPTION_ENDPOINT,
} from '../../shared/novelai.mjs';

// Electron already defines window.api via preload.js's contextBridge before
// any page script runs, so this bridge only activates for Capacitor/web.
// Importing this module (from main.jsx, before rendering <App />) is what
// triggers the setup below — it must run before App can call window.api.
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

if (!window.api) {
  const SETTINGS_KEY = 'novelai_settings';
  const CHUNKS_KEY = 'novelai_chunks';
  const TEMPLATES_KEY = 'novelai_templates';
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
    const fileName = `${Date.now()}_${body.parameters.seed}.png`;
    const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
    const relativePath = safeBatchFolder
      ? `output/${safeBatchFolder}/${fileName}`
      : `output/${fileName}`;

    await Filesystem.writeFile({
      path: relativePath,
      data: base64,
      directory: Directory.Documents,
      recursive: true,
    });

    let filePath = relativePath;
    try {
      const uriResult = await Filesystem.getUri({
        path: relativePath,
        directory: Directory.Documents,
      });
      filePath = uriResult.uri;
      lastSavedUri = uriResult.uri;
    } catch {
      // getUri is best-effort; fall back to the relative path for display.
    }

    return {
      fileName,
      filePath,
      seed: body.parameters.seed,
      dataUrl: `data:image/png;base64,${base64}`,
    };
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
    // Capacitor has no arbitrary directory-picker API without an extra
    // native plugin; Android always saves under Documents/output.
    return null;
  }

  async function openOutputFolder() {
    if (!lastSavedUri) return;
    // Android has no general "open this app's folder" API for third-party apps,
    // so the closest equivalent is sharing the most recently saved image.
    await Share.share({ url: lastSavedUri });
  }

  const chunksApi = makeNamedListApi(CHUNKS_KEY);
  const templatesApi = makeNamedListApi(TEMPLATES_KEY);
  const favoritesApis = {
    artist: makeGenericListApi(FAVORITE_KEYS.artist),
    character: makeGenericListApi(FAVORITE_KEYS.character),
  };

  window.api = {
    loadSettings: () => loadJson(SETTINGS_KEY, {}),
    saveSettings: (settings) => saveJson(SETTINGS_KEY, settings),
    generateImage,
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
    loadFavorites: (kind) => favoritesApis[kind].load(),
    saveFavorite: (kind, item) => favoritesApis[kind].save(item),
    updateFavorite: (kind, item) => favoritesApis[kind].update(item),
    deleteFavorite: (kind, id) => favoritesApis[kind].remove(id),
  };

  window.isNativeApp = Capacitor.isNativePlatform();
}
