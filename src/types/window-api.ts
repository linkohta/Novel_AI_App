// preload.js（Electron）と src/platform/capacitorBridge.js（Android）の
// 両実装が満たすべき window.api の共通インターフェース。
// main.js側のIPCハンドラの戻り値と一致させる（IPC境界のため、細部は
// 意図的に緩め=anyを許容している箇所がある）。

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonValue = any;

export interface Settings {
  [key: string]: JsonValue;
}

export interface NamedListItem {
  id: string;
  name: string;
  text: string;
}

// お気に入り・複数プロンプトテンプレートは項目形式が可変なため緩く型付けする。
export interface GenericListItem {
  id: string;
  [key: string]: JsonValue;
}

export interface GenerateImageParams {
  apiKey: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number | string;
  height: number | string;
  steps: number | string;
  scale: number | string;
  sampler: string;
  seed?: number | string;
  qualityToggle?: boolean;
  characterPrompts?: { prompt?: string; negativePrompt?: string; enabled?: boolean }[];
  batchFolder?: string;
  skipJsonOutput?: boolean;
  fileName?: string;
}

export interface GenerateImageResult {
  fileName: string;
  filePath: string;
  seed: number;
  dataUrl: string;
}

export interface SubscriptionOpusPerk {
  maxPrompts: number;
  resolution: number;
  resetAfter: number;
}

export interface SubscriptionInfo {
  anlas: number;
  opusPerks: SubscriptionOpusPerk[];
}

export type FavoriteKind = 'artist' | 'character';

export interface WindowApi {
  loadSettings(): Promise<Settings>;
  saveSettings(settings: Settings): Promise<boolean>;
  generateImage(params: GenerateImageParams): Promise<GenerateImageResult>;
  savePromptInfo(params: GenerateImageParams): Promise<boolean>;
  getSubscriptionInfo(apiKey: string): Promise<SubscriptionInfo>;
  // Electronでは保存先フォルダを開いた結果（エラー文字列 or 空文字列）を返すが、
  // Androidでは直近に保存した画像を共有するのみで戻り値を返さない実装になっている
  // （挙動差はTypeScript移行時に判明したもので本移行では変更していない。PR参照）。
  openOutputFolder(): Promise<string | void>;
  chooseOutputFolder(): Promise<string | null>;
  loadChunks(): Promise<NamedListItem[]>;
  saveChunk(chunk: { name: string; text: string }): Promise<NamedListItem[]>;
  updateChunk(chunk: NamedListItem): Promise<NamedListItem[]>;
  deleteChunk(id: string): Promise<NamedListItem[]>;
  loadTemplates(): Promise<NamedListItem[]>;
  saveTemplate(template: { name: string; text: string }): Promise<NamedListItem[]>;
  updateTemplate(template: NamedListItem): Promise<NamedListItem[]>;
  deleteTemplate(id: string): Promise<NamedListItem[]>;
  loadQueueTemplates(): Promise<GenericListItem[]>;
  saveQueueTemplate(template: { name: string; rows: JsonValue }): Promise<GenericListItem[]>;
  updateQueueTemplate(template: GenericListItem): Promise<GenericListItem[]>;
  deleteQueueTemplate(id: string): Promise<GenericListItem[]>;
  loadFavorites(kind: FavoriteKind): Promise<GenericListItem[]>;
  saveFavorite(kind: FavoriteKind, item: JsonValue): Promise<GenericListItem[]>;
  updateFavorite(kind: FavoriteKind, item: GenericListItem): Promise<GenericListItem[]>;
  deleteFavorite(kind: FavoriteKind, id: string): Promise<GenericListItem[]>;
}

declare global {
  interface Window {
    api: WindowApi;
    isNativeApp?: boolean;
  }
}
