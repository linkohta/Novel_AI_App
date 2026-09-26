// preload.ts が contextBridge で公開する window.api のインターフェース。
// electron/*-handlers.ts のIPCハンドラの戻り値と一致させる（IPC境界のため、
// 細部は意図的に緩め=anyを許容している箇所がある）。

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
  // 公式サイトの「Variety+」トグル相当（V4系・V5系のみ有効）。
  varietyPlus?: boolean;
  characterPrompts?: { prompt?: string; negativePrompt?: string; enabled?: boolean }[];
  vibeTransferImages?: {
    image: string;
    informationExtracted?: number;
    referenceStrength?: number;
  }[];
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
  // 保存先フォルダをOS標準のファイルマネージャーで開く。shell.openPathの結果
  // （失敗時はエラー文字列、成功時は空文字列）を返す。
  openOutputFolder(): Promise<string>;
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
  // AIポーション（Vibe Transfer）の参照画像1枚をNovelAI側の専用APIで事前
  // エンコードし、エンコード済みデータをbase64文字列で返す（V4系・V5系モデル
  // で`reference_image_multiple`に渡す前に必要。1回の呼び出しにつき2 Anlas
  // 消費するため、呼び出し側でキャッシュして使い回すこと）。
  encodeVibe(
    apiKey: string,
    image: string,
    model: string,
    informationExtracted: number
  ): Promise<string>;
  // テンプレート等のテキストをtxtファイルとして書き出す。保存先を選ぶダイアログを
  // 表示し、保存したファイルのパス（キャンセル時はnull）を返す。
  exportTextFile(fileName: string, text: string): Promise<string | null>;
}

declare global {
  interface Window {
    api: WindowApi;
  }
}
