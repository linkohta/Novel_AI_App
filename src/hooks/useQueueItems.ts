import { useState } from 'react';
import type { QueueCharacter, QueueItem, VibeTransferImage } from '../types/domain';
import { balanceVibeTransferImages } from '../utils/vibeBalance';
import {
  readVibeTransferImageFile,
  readVibeTransferSetFile,
  withNewIds,
} from '../utils/vibeTransferFiles';
import { errorMessage } from '../utils/errorMessage';

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

type QueueItemField = 'prompt' | 'negativePrompt' | 'count';
type QueueCharacterField = keyof QueueCharacter;
type VibeTransferField = 'informationExtracted' | 'referenceStrength';

// 複数プロンプト連続生成（queue）リストのstate＋CRUD：各行の
// prompt/negativePrompt/count、およびその行専用のキャラクタープロンプト・
// AIポーション参照画像の集合、加えて全行の枚数・参照画像を一括で設定する操作。
// 自身を更新するのにApp.tsxの他のstateを必要としない自己完結したstateの
// かたまりであるため、App.tsxから切り出した。
// `setStatus`はファイル読み込み失敗時にエラー内容を画面上部のステータス表示へ
// 反映するために使う（渡さなくても動作するが、失敗が画面上に一切表示されず
// 「選択しても反映されない」ように見えてしまうため、App.tsxからは必ず渡すこと）。
export function useQueueItems(setStatus?: (status: string) => void) {
  const [queueItems, setQueueItems] = useState<QueueItem[]>([makeQueueItem()]);
  const [bulkCount, setBulkCount] = useState('1');

  // 指定した行だけをupdaterで更新する（他の行はそのまま）。
  function updateItemAt(index: number, updater: (item: QueueItem) => QueueItem) {
    setQueueItems((prev) => prev.map((item, i) => (i === index ? updater(item) : item)));
  }

  // 行の参照画像一覧の末尾にimagesを追加したコピーを返す。
  function appendVibes(item: QueueItem, images: VibeTransferImage[]): QueueItem {
    return { ...item, vibeTransferImages: [...(item.vibeTransferImages || []), ...images] };
  }

  // ファイルを読み込んでからapplyで反映する。読み込み失敗時はステータスに表示する。
  async function readThen(
    read: () => Promise<VibeTransferImage[]>,
    apply: (images: VibeTransferImage[]) => void
  ) {
    try {
      apply(await read());
    } catch (err) {
      setStatus?.(`エラー: ${errorMessage(err)}`);
    }
  }

  function applyBulkCount() {
    const clamped = String(Math.max(1, Math.min(100, parseInt(bulkCount, 10) || 1)));
    setQueueItems((prev) => prev.map((item) => ({ ...item, count: clamped })));
  }

  function updateQueueItemField(index: number, field: QueueItemField, value: string) {
    updateItemAt(index, (item) => ({ ...item, [field]: value }));
  }

  function addQueueItem() {
    setQueueItems((prev) => [...prev, makeQueueItem()]);
  }

  function removeQueueItem(index: number) {
    setQueueItems((prev) => prev.filter((_, i) => i !== index));
  }

  // リストを空のプロンプト1件のみの初期状態に戻す（一括削除）。
  function clearQueueItems() {
    setQueueItems([makeQueueItem()]);
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
    updateItemAt(itemIndex, (item) => ({
      ...item,
      characters: (item.characters || []).map((c, ci) =>
        ci === charIndex ? { ...c, [field]: value } : c
      ),
    }));
  }

  function addQueueItemCharacter(itemIndex: number) {
    updateItemAt(itemIndex, (item) => ({
      ...item,
      characters: [
        ...(item.characters || []),
        { id: window.crypto.randomUUID(), prompt: '', negativePrompt: '', enabled: true },
      ],
    }));
  }

  function removeQueueItemCharacter(itemIndex: number, charIndex: number) {
    updateItemAt(itemIndex, (item) => ({
      ...item,
      characters: (item.characters || []).filter((_, ci) => ci !== charIndex),
    }));
  }

  // 行ごとのAIポーション（Vibe Transfer）参照画像のCRUD。
  function addQueueItemVibeTransferImage(itemIndex: number, file: File) {
    return readThen(
      async () => [await readVibeTransferImageFile(file)],
      (images) => updateItemAt(itemIndex, (item) => appendVibes(item, images))
    );
  }

  // 行ごとにポーションセットファイル（.naiv4vibe / .naiv4vibeBundle）を読み込み、
  // 含まれるvibeデータをすべてその行の参照画像一覧に追加する。
  function addQueueItemVibeTransferSetFile(itemIndex: number, file: File) {
    return readThen(
      () => readVibeTransferSetFile(file),
      (images) => updateItemAt(itemIndex, (item) => appendVibes(item, images))
    );
  }

  function removeQueueItemVibeTransferImage(itemIndex: number, vibeId: string) {
    updateItemAt(itemIndex, (item) => ({
      ...item,
      vibeTransferImages: (item.vibeTransferImages || []).filter((v) => v.id !== vibeId),
    }));
  }

  // 選択した画像・ポーションセットファイルを全行の参照画像一覧にまとめて追加する。
  // bulkCount/applyBulkCountと同様「全行に反映」操作だが、既存の参照画像を
  // 上書きするのではなく追加する（行ごとに異なる参照画像を持たせたい場合に
  // 個別追加した分を消さないため）。行ごとに一意なidを新規採番するため、
  // 各行に同じ画像のコピーがそれぞれ独立して追加される。
  function appendVibesToAllRows(images: VibeTransferImage[]) {
    setQueueItems((prev) => prev.map((item) => appendVibes(item, withNewIds(images))));
  }

  function applyBulkVibeTransferImage(file: File) {
    return readThen(async () => [await readVibeTransferImageFile(file)], appendVibesToAllRows);
  }

  function applyBulkVibeTransferSetFile(file: File) {
    return readThen(() => readVibeTransferSetFile(file), appendVibesToAllRows);
  }

  // 行ごとに「参照強度をバランス調整」を行う（useVibeTransfer.tsの
  // balanceVibeTransferStrengthsと同じ処理を、その行のvibeTransferImagesにのみ適用）。
  function balanceQueueItemVibeTransferStrengths(itemIndex: number) {
    updateItemAt(itemIndex, (item) => ({
      ...item,
      vibeTransferImages: balanceVibeTransferImages(item.vibeTransferImages || []),
    }));
  }

  function updateQueueItemVibeTransferField(
    itemIndex: number,
    vibeId: string,
    field: VibeTransferField,
    value: number
  ) {
    updateItemAt(itemIndex, (item) => ({
      ...item,
      vibeTransferImages: (item.vibeTransferImages || []).map((v) =>
        v.id === vibeId ? { ...v, [field]: value } : v
      ),
    }));
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
    clearQueueItems,
    moveQueueItem,
    updateQueueItemCharacterField,
    addQueueItemCharacter,
    removeQueueItemCharacter,
    addQueueItemVibeTransferImage,
    addQueueItemVibeTransferSetFile,
    removeQueueItemVibeTransferImage,
    balanceQueueItemVibeTransferStrengths,
    updateQueueItemVibeTransferField,
    applyBulkVibeTransferImage,
    applyBulkVibeTransferSetFile,
  };
}
