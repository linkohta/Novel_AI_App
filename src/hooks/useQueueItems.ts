import { useState } from 'react';
import type { QueueCharacter, QueueItem } from '../types/domain';
import { parseNaiv4VibeFile } from '../utils/naiv4vibe';

function makeQueueItem(): QueueItem {
  return {
    id: window.crypto.randomUUID(),
    prompt: '',
    negativePrompt: '',
    count: '1',
    characters: [],
    vibeTransferImages: [],
  };
}

// 選択された画像ファイルをbase64文字列（data URLのprefixなし）に変換する
// （useVibeTransfer.tsのfileToBase64と同内容。行ごとのVibe Transferは
// このフックが自己完結してCRUDを持つ設計のため、あえて重複させている）。
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = String(reader.result || '');
      const commaIndex = result.indexOf(',');
      resolve(commaIndex >= 0 ? result.slice(commaIndex + 1) : result);
    };
    reader.onerror = () => reject(reader.error || new Error('画像の読み込みに失敗しました'));
    reader.readAsDataURL(file);
  });
}

type QueueItemField = 'prompt' | 'negativePrompt' | 'count';
type QueueCharacterField = keyof QueueCharacter;
type VibeTransferField = 'informationExtracted' | 'referenceStrength';

// 複数プロンプト連続生成（queue）リストのstate＋CRUD：各行の
// prompt/negativePrompt/count、およびその行専用のキャラクタープロンプトの
// 集合、加えて全行の枚数を一括で設定するための `bulkCount`/`applyBulkCount`。
// 自身を更新するのにApp.jsxの他のstateを必要としない自己完結したstateの
// かたまりであるため、App.jsxから切り出した。
// `setStatus`はファイル読み込み失敗時にエラー内容を画面上部のステータス表示へ
// 反映するために使う（渡さなくても動作するが、失敗が画面上に一切表示されず
// 「選択しても反映されない」ように見えてしまうため、App.tsxからは必ず渡すこと）。
export function useQueueItems(setStatus?: (status: string) => void) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([makeQueueItem()]);
  const [bulkCount, setBulkCount] = useState('1');

  function applyBulkCount() {
    const clamped = String(Math.max(1, Math.min(100, parseInt(bulkCount, 10) || 1)));
    setQueueItems((prev) => prev.map((item) => ({ ...item, count: clamped })));
  }

  function updateQueueItemField(index: number, field: QueueItemField, value: string) {
    setQueueItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addQueueItem() {
    setQueueItems((prev) => [...prev, makeQueueItem()]);
  }

  function removeQueueItem(index: number) {
    setQueueItems((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQueueItem(index: number, direction: number) {
    const target = index + direction;
    setQueueItems((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateQueueItemCharacterField(
    itemIndex: number,
    charIndex: number,
    field: QueueCharacterField,
    value: string | boolean
  ) {
    setQueueItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const characters = (item.characters || []).map((c, ci) =>
          ci === charIndex ? { ...c, [field]: value } : c
        );
        return { ...item, characters };
      })
    );
  }

  function addQueueItemCharacter(itemIndex: number) {
    setQueueItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              characters: [
                ...(item.characters || []),
                { id: window.crypto.randomUUID(), prompt: '', negativePrompt: '', enabled: true },
              ],
            }
          : item
      )
    );
  }

  function removeQueueItemCharacter(itemIndex: number, charIndex: number) {
    setQueueItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? { ...item, characters: (item.characters || []).filter((_, ci) => ci !== charIndex) }
          : item
      )
    );
  }

  // 行ごとのAIポーション（Vibe Transfer）参照画像のCRUD。
  // updateQueueItemCharacterField等と同じパターンで実装している。
  async function addQueueItemVibeTransferImage(itemIndex: number, file: File) {
    try {
      const image = await fileToBase64(file);
      setQueueItems((prev) =>
        prev.map((item, i) =>
          i === itemIndex
            ? {
                ...item,
                vibeTransferImages: [
                  ...(item.vibeTransferImages || []),
                  {
                    id: window.crypto.randomUUID(),
                    image,
                    informationExtracted: 1,
                    referenceStrength: 0.6,
                    source: 'image',
                  },
                ],
              }
            : item
        )
      );
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  // 行ごとにNovelAI公式サイトの「ポーションセット」ファイル（.naiv4vibe）を
  // 読み込み、含まれるvibeデータをすべてその行の参照画像一覧に追加する。
  async function addQueueItemVibeTransferSetFile(itemIndex: number, file: File) {
    try {
      const entries = await parseNaiv4VibeFile(file);
      setQueueItems((prev) =>
        prev.map((item, i) =>
          i === itemIndex
            ? {
                ...item,
                vibeTransferImages: [
                  ...(item.vibeTransferImages || []),
                  ...entries.map((entry) => ({
                    id: window.crypto.randomUUID(),
                    image: entry.encoding,
                    informationExtracted: entry.informationExtracted,
                    // ファイルに公式サイトでのReference Strength
                    // （importInfo.strength）が記録されていればそれを引き継ぐ。
                    referenceStrength: entry.referenceStrength ?? 0.6,
                    source: 'vibeFile' as const,
                  })),
                ],
              }
            : item
        )
      );
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  function removeQueueItemVibeTransferImage(itemIndex: number, vibeId: string) {
    setQueueItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              vibeTransferImages: (item.vibeTransferImages || []).filter((v) => v.id !== vibeId),
            }
          : item
      )
    );
  }

  // 選択した画像・ポーションセットファイルを全行の参照画像一覧にまとめて追加する。
  // bulkCount/applyBulkCountと同様「全行に反映」操作だが、既存の参照画像を
  // 上書きするのではなく追加する（行ごとに異なる参照画像を持たせたい場合に
  // 個別追加した分を消さないため）。行ごとに一意なidを新規採番するため、
  // 各行に同じ画像のコピーがそれぞれ独立して追加される。
  async function applyBulkVibeTransferImage(file: File) {
    try {
      const image = await fileToBase64(file);
      setQueueItems((prev) =>
        prev.map((item) => ({
          ...item,
          vibeTransferImages: [
            ...(item.vibeTransferImages || []),
            {
              id: window.crypto.randomUUID(),
              image,
              informationExtracted: 1,
              referenceStrength: 0.6,
              source: 'image' as const,
            },
          ],
        }))
      );
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  async function applyBulkVibeTransferSetFile(file: File) {
    try {
      const entries = await parseNaiv4VibeFile(file);
      setQueueItems((prev) =>
        prev.map((item) => ({
          ...item,
          vibeTransferImages: [
            ...(item.vibeTransferImages || []),
            ...entries.map((entry) => ({
              id: window.crypto.randomUUID(),
              image: entry.encoding,
              informationExtracted: entry.informationExtracted,
              referenceStrength: entry.referenceStrength ?? 0.6,
              source: 'vibeFile' as const,
            })),
          ],
        }))
      );
    } catch (err) {
      setStatus?.(`エラー: ${(err as Error).message}`);
    }
  }

  function updateQueueItemVibeTransferField(
    itemIndex: number,
    vibeId: string,
    field: VibeTransferField,
    value: number
  ) {
    setQueueItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const vibeTransferImages = (item.vibeTransferImages || []).map((v) =>
          v.id === vibeId ? { ...v, [field]: value } : v
        );
        return { ...item, vibeTransferImages };
      })
    );
  }

  return {
    queueItems,
    setQueueItems,
    bulkCount,
    setBulkCount,
    applyBulkCount,
    updateQueueItemField,
    addQueueItem,
    removeQueueItem,
    moveQueueItem,
    updateQueueItemCharacterField,
    addQueueItemCharacter,
    removeQueueItemCharacter,
    addQueueItemVibeTransferImage,
    addQueueItemVibeTransferSetFile,
    removeQueueItemVibeTransferImage,
    updateQueueItemVibeTransferField,
    applyBulkVibeTransferImage,
    applyBulkVibeTransferSetFile,
  };
}
