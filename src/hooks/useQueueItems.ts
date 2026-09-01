import { useState } from 'react';
import type { QueueCharacter, QueueItem } from '../types/domain';

function makeQueueItem(): QueueItem {
  return {
    id: window.crypto.randomUUID(),
    prompt: '',
    negativePrompt: '',
    count: '1',
    characters: [],
  };
}

type QueueItemField = 'prompt' | 'negativePrompt' | 'count';
type QueueCharacterField = keyof QueueCharacter;

// 複数プロンプト連続生成（queue）リストのstate＋CRUD：各行の
// prompt/negativePrompt/count、およびその行専用のキャラクタープロンプトの
// 集合、加えて全行の枚数を一括で設定するための `bulkCount`/`applyBulkCount`。
// 自身を更新するのにApp.jsxの他のstateを必要としない自己完結したstateの
// かたまりであるため、App.jsxから切り出した。
export function useQueueItems() {
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
  };
}
