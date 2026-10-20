// キャラクタープロンプト1件分の生成・絞り込みの共通処理。左パネルの
// キャラクター一覧（useCharacters）・複数プロンプト連続生成の行ごとの
// キャラクター（useQueueItems）・画像からの読み込み（useImageMetadataLoader）
// の3か所で同じオブジェクトリテラルが繰り返されていたためまとめた。
import type { Character } from '../types/domain';

// 新しいidを採番した空のキャラクター（有効）を作る。initでプロンプト等を上書きできる。
export function makeCharacter(init: Partial<Omit<Character, 'id'>> = {}): Character {
  return {
    id: window.crypto.randomUUID(),
    prompt: '',
    negativePrompt: '',
    enabled: true,
    ...init,
  };
}

// 生成リクエストに含めるキャラクターだけを残す（無効化されたもの・プロンプトが空のものを除外）。
export function activeCharacters<T extends { enabled?: boolean; prompt?: string }>(
  characters: T[] | undefined
): T[] {
  return (characters || []).filter((c) => c.enabled !== false && !!c.prompt?.trim());
}
