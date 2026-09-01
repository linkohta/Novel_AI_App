import { Dispatch, SetStateAction, useState } from 'react';
import type {
  NamedListApi,
  QueueItem,
  QueueTemplate,
  QueueTemplateApplyState,
  QueueTemplateDraft,
  QueueTemplateDraftCharacter,
} from '../types/domain';

interface UseQueueTemplateDraftParams {
  queueItems: QueueItem[];
  setQueueItems: Dispatch<SetStateAction<QueueItem[]>>;
  queueTemplatesList: NamedListApi<QueueTemplate, { name: string; rows: unknown }>;
  setStatus: (status: string) => void;
}

type DraftField = 'prompt' | 'negativePrompt' | 'count';
type DraftCharacterField = keyof QueueTemplateDraftCharacter;

// 複数プロンプトテンプレート（queue templates）の保存・編集ダイアログの
// ドラフトと適用ダイアログの状態、およびそれらを操作する全ハンドラをまとめる。
// キューアイテムのstateと、App.jsxから渡される queueTemplatesList のCRUD
// （useNamedList）、バリデーションメッセージ用の setStatus に依存している——
// これらは再導出せずpropsとして渡すことで、このフックが既存ロジックを
// そのまま切り出した純粋な抽出にとどまるようにしている（挙動の変更なし）。
export function useQueueTemplateDraft({
  queueItems,
  setQueueItems,
  queueTemplatesList,
  setStatus,
}: UseQueueTemplateDraftParams) {
  const [queueTemplateDraft, setQueueTemplateDraft] = useState<QueueTemplateDraft | null>(null);
  const [queueTemplateApplyState, setQueueTemplateApplyState] =
    useState<QueueTemplateApplyState | null>(null);

  function openQueueTemplateSaveDialog() {
    setQueueTemplateDraft({
      id: null,
      name: '',
      rows: queueItems.map((item) => ({
        prompt: item.prompt,
        negativePrompt: item.negativePrompt,
        count: item.count,
        characters: (item.characters || []).map((c) => ({
          prompt: c.prompt || '',
          negativePrompt: c.negativePrompt || '',
          enabled: c.enabled !== false,
        })),
      })),
    });
  }

  function openQueueTemplateEditDialog(template: QueueTemplate) {
    setQueueTemplateDraft({
      id: template.id,
      name: template.name,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      rows: template.rows as any,
    });
  }

  function updateQueueTemplateDraftRow(rowIndex: number, field: DraftField, value: string) {
    setQueueTemplateDraft((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row)),
          }
        : prev
    );
  }

  function updateQueueTemplateDraftCharacter(
    rowIndex: number,
    charIndex: number,
    field: DraftCharacterField,
    value: string | boolean
  ) {
    setQueueTemplateDraft((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row, i) => {
              if (i !== rowIndex) return row;
              const characters = (row.characters || []).map((c, ci) =>
                ci === charIndex ? { ...c, [field]: value } : c
              );
              return { ...row, characters };
            }),
          }
        : prev
    );
  }

  function addQueueTemplateDraftRow() {
    setQueueTemplateDraft((prev) =>
      prev
        ? {
            ...prev,
            rows: [...prev.rows, { prompt: '', negativePrompt: '', count: '1', characters: [] }],
          }
        : prev
    );
  }

  function removeQueueTemplateDraftRow(rowIndex: number) {
    setQueueTemplateDraft((prev) =>
      prev ? { ...prev, rows: prev.rows.filter((_, i) => i !== rowIndex) } : prev
    );
  }

  function addQueueTemplateDraftCharacter(rowIndex: number) {
    setQueueTemplateDraft((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row, i) =>
              i === rowIndex
                ? {
                    ...row,
                    characters: [
                      ...(row.characters || []),
                      { prompt: '', negativePrompt: '', enabled: true },
                    ],
                  }
                : row
            ),
          }
        : prev
    );
  }

  function removeQueueTemplateDraftCharacter(rowIndex: number, charIndex: number) {
    setQueueTemplateDraft((prev) =>
      prev
        ? {
            ...prev,
            rows: prev.rows.map((row, i) =>
              i === rowIndex
                ? { ...row, characters: (row.characters || []).filter((_, ci) => ci !== charIndex) }
                : row
            ),
          }
        : prev
    );
  }

  async function handleSaveQueueTemplate() {
    if (!queueTemplateDraft) return;
    const name = queueTemplateDraft.name.trim();
    if (!name) {
      setStatus('テンプレート名を入力してください');
      return;
    }
    if (queueTemplateDraft.id) {
      await queueTemplatesList.editItem({
        id: queueTemplateDraft.id,
        name,
        rows: queueTemplateDraft.rows,
      });
    } else {
      await queueTemplatesList.addItem({ name, rows: queueTemplateDraft.rows });
    }
    setQueueTemplateDraft(null);
  }

  function handleApplyQueueTemplate(template: QueueTemplate) {
    setQueueTemplateApplyState({ template });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function handleQueueTemplateApplyConfirm(rows: any[]) {
    setQueueItems(
      rows.map((row) => ({
        id: window.crypto.randomUUID(),
        prompt: row.prompt || '',
        negativePrompt: row.negativePrompt || '',
        count: row.count || '1',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        characters: (row.characters || []).map((c: any) => ({
          id: window.crypto.randomUUID(),
          prompt: c.prompt || '',
          negativePrompt: c.negativePrompt || '',
          enabled: c.enabled !== false,
        })),
      }))
    );
    setQueueTemplateApplyState(null);
  }

  return {
    queueTemplateDraft,
    setQueueTemplateDraft,
    queueTemplateApplyState,
    setQueueTemplateApplyState,
    openQueueTemplateSaveDialog,
    openQueueTemplateEditDialog,
    updateQueueTemplateDraftRow,
    updateQueueTemplateDraftCharacter,
    addQueueTemplateDraftRow,
    removeQueueTemplateDraftRow,
    addQueueTemplateDraftCharacter,
    removeQueueTemplateDraftCharacter,
    handleSaveQueueTemplate,
    handleApplyQueueTemplate,
    handleQueueTemplateApplyConfirm,
  };
}
