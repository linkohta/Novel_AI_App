import { Dispatch, SetStateAction, useState } from 'react';
import type { Character, QueueItem } from '../types/domain';

type PromptField = 'prompt' | 'negativePrompt';

interface UseFocusedFieldParams {
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  negativePrompt: string;
  setNegativePrompt: Dispatch<SetStateAction<string>>;
  characters: Character[];
  updateCharacterField: (index: number, field: PromptField, value: string) => void;
  queueItems: QueueItem[];
  updateQueueItemField: (index: number, field: PromptField, value: string) => void;
  updateQueueItemCharacterField: (
    itemIndex: number,
    charIndex: number,
    field: PromptField,
    value: string
  ) => void;
}

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
}: UseFocusedFieldParams) {
  const [focusedFieldKey, setFocusedFieldKey] = useState('prompt');

  function resolveFocusedField(): { value: string; set: (value: string) => void } {
    if (focusedFieldKey === 'prompt') return { value: prompt, set: setPrompt };
    if (focusedFieldKey === 'negativePrompt') {
      return { value: negativePrompt, set: setNegativePrompt };
    }
    const charMatch = /^char:(\d+):(prompt|negativePrompt)$/.exec(focusedFieldKey);
    if (charMatch) {
      const index = Number(charMatch[1]);
      const field = charMatch[2] as PromptField;
      return {
        value: characters[index]?.[field] || '',
        set: (value: string) => updateCharacterField(index, field, value),
      };
    }
    const queueCharMatch = /^queue:([^:]+):char:(\d+):(prompt|negativePrompt)$/.exec(
      focusedFieldKey
    );
    if (queueCharMatch) {
      const id = queueCharMatch[1];
      const charIndex = Number(queueCharMatch[2]);
      const field = queueCharMatch[3] as PromptField;
      const itemIndex = queueItems.findIndex((item) => item.id === id);
      return {
        value: itemIndex >= 0 ? queueItems[itemIndex].characters?.[charIndex]?.[field] || '' : '',
        set: (value: string) => updateQueueItemCharacterField(itemIndex, charIndex, field, value),
      };
    }
    const queueMatch = /^queue:([^:]+):(prompt|negativePrompt)$/.exec(focusedFieldKey);
    if (queueMatch) {
      const id = queueMatch[1];
      const field = queueMatch[2] as PromptField;
      const index = queueItems.findIndex((item) => item.id === id);
      return {
        value: index >= 0 ? queueItems[index][field] || '' : '',
        set: (value: string) => updateQueueItemField(index, field, value),
      };
    }
    return { value: prompt, set: setPrompt };
  }

  function insertIntoFocused(text: string): void {
    const { value, set } = resolveFocusedField();
    const sep = value.trim() ? ', ' : '';
    set(`${value}${sep}${text}`);
  }

  return { focusedFieldKey, setFocusedFieldKey, resolveFocusedField, insertIntoFocused };
}
