import { useState } from 'react';

function makeQueueItem() {
  return {
    id: window.crypto.randomUUID(),
    prompt: '',
    negativePrompt: '',
    count: '1',
    characters: [],
  };
}

// State + CRUD for the 複数プロンプト連続生成 (queue) list: each row's
// prompt/negativePrompt/count plus its own set of character prompts.
// Extracted out of App.jsx since it's a self-contained slice of state that
// doesn't need any of App's other state to update itself.
export function useQueueItems() {
  const [queueItems, setQueueItems] = useState([makeQueueItem()]);

  function updateQueueItemField(index, field, value) {
    setQueueItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addQueueItem() {
    setQueueItems((prev) => [...prev, makeQueueItem()]);
  }

  function removeQueueItem(index) {
    setQueueItems((prev) => prev.filter((_, i) => i !== index));
  }

  function moveQueueItem(index, direction) {
    const target = index + direction;
    setQueueItems((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function updateQueueItemCharacterField(itemIndex, charIndex, field, value) {
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

  function addQueueItemCharacter(itemIndex) {
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

  function removeQueueItemCharacter(itemIndex, charIndex) {
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
    updateQueueItemField,
    addQueueItem,
    removeQueueItem,
    moveQueueItem,
    updateQueueItemCharacterField,
    addQueueItemCharacter,
    removeQueueItemCharacter,
  };
}
