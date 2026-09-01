// アプリのUI層（src/）全体で共有するドメイン型。
// プロンプトチャンク・テンプレート・お気に入り・キャラクター・複数プロンプト
// 連続生成のリストなど、settings.json / *.json に永続化される形をおおむね
// そのまま反映している。IPC境界の緩い型（src/types/window-api.ts）を再利用する。

export interface Character {
  id: string;
  prompt: string;
  negativePrompt: string;
  enabled: boolean;
}

export interface QueueCharacter extends Character {}

export interface QueueItem {
  id: string;
  prompt: string;
  negativePrompt: string;
  count: number | string;
  characters: QueueCharacter[];
}

export interface NamedItem {
  id: string;
  name: string;
  text: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonValue = any;

export interface FavoriteArtist {
  id: string;
  name: string;
  [key: string]: JsonValue;
}

export interface FavoriteCharacter {
  id: string;
  name: string;
  series?: string;
  [key: string]: JsonValue;
}

export interface QueueTemplateRow {
  prompt: string;
  negativePrompt: string;
  characters: { prompt: string; negativePrompt: string }[];
}

export interface QueueTemplate {
  id: string;
  name: string;
  rows: QueueTemplateRow[];
}

export interface QueueTemplateDraftCharacter {
  prompt: string;
  negativePrompt: string;
  enabled: boolean;
}

export interface QueueTemplateDraftRow {
  prompt: string;
  negativePrompt: string;
  count: number | string;
  characters: QueueTemplateDraftCharacter[];
}

export interface QueueTemplateDraft {
  id: string | null;
  name: string;
  rows: QueueTemplateDraftRow[];
}

export interface QueueTemplateApplyState {
  template: QueueTemplate;
}

export interface TemplateApplyState {
  template: NamedItem;
  onApply: (value: string) => void;
}

// 左パネルの各<details>セクションの開閉状態（App.jsxのDEFAULT_SECTION_STATE
// を参照）。将来セクションが増える可能性があるためインデックスシグネチャも許容する。
export interface SectionState {
  settingsSection?: boolean;
  promptSection?: boolean;
  templateSection?: boolean;
  favoritesSection?: boolean;
  characterSection?: boolean;
  modelSection?: boolean;
  batchSection?: boolean;
  promptQueueSection?: boolean;
  [key: string]: boolean | undefined;
}

// useNamedList / useFavoritesListの戻り値の形（フック定義から`ReturnType`で
// 導出すると循環参照になりやすいため、ここで明示的な型として定義しておく）。
export interface NamedListApi<TItem, TNewItem = TItem> {
  items: TItem[];
  addItem: (item: TNewItem) => Promise<void>;
  editItem: (item: TItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}
