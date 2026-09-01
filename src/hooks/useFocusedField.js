import { useState } from 'react';

// チャンク／お気に入り／テンプレートの挿入・置換先となる、プロンプト系
// フィールド（"prompt" / "negativePrompt" / "char:<i>:prompt" /
// `queue:<id>:prompt` / `queue:<id>:char:<i>:prompt` 等）のキーを追跡し、
// そのキーをその都度フィールドの現在値＋setterに解決する（フォーカスした
// 時点の古いスナップショットではなく、常に最新の値を反映するため）。
export function useFocusedField({
  prompt,
  setPrompt,
  negativePrompt,
  setNegativePrompt,
  characters,
  updateCharacterField,
  queueItems,
  updateQueueItemField,
  updateQueueItemCharacterField,
}) {
  const [focusedFieldKey, setFocusedFieldKey] = useState('prompt');

  function resolveFocusedField() {
    if (focusedFieldKey === 'prompt') return { value: prompt, set: setPrompt };
    if (focusedFieldKey === 'negativePrompt') {
      return { value: negativePrompt, set: setNegativePrompt };
    }
    const charMatch = /^char:(\d+):(prompt|negativePrompt)$/.exec(focusedFieldKey);
    if (charMatch) {
      const index = Number(charMatch[1]);
      const field = charMatch[2];
      return {
        value: characters[index]?.[field] || '',
        set: (value) => updateCharacterField(index, field, value),
      };
    }
    const queueCharMatch = /^queue:([^:]+):char:(\d+):(prompt|negativePrompt)$/.exec(
      focusedFieldKey
    );
    if (queueCharMatch) {
      const id = queueCharMatch[1];
      const charIndex = Number(queueCharMatch[2]);
      const field = queueCharMatch[3];
      const itemIndex = queueItems.findIndex((item) => item.id === id);
      return {
        value: itemIndex >= 0 ? queueItems[itemIndex].characters?.[charIndex]?.[field] || '' : '',
        set: (value) => updateQueueItemCharacterField(itemIndex, charIndex, field, value),
      };
    }
    const queueMatch = /^queue:([^:]+):(prompt|negativePrompt)$/.exec(focusedFieldKey);
    if (queueMatch) {
      const id = queueMatch[1];
      const field = queueMatch[2];
      const index = queueItems.findIndex((item) => item.id === id);
      return {
        value: index >= 0 ? queueItems[index][field] || '' : '',
        set: (value) => updateQueueItemField(index, field, value),
      };
    }
    return { value: prompt, set: setPrompt };
  }

  function insertIntoFocused(text) {
    const { value, set } = resolveFocusedField();
    const sep = value.trim() ? ', ' : '';
    set(`${value}${sep}${text}`);
  }

  return { focusedFieldKey, setFocusedFieldKey, resolveFocusedField, insertIntoFocused };
}
