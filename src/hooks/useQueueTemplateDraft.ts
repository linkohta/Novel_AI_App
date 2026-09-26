import { Dispatch, SetStateAction, useState } from 'react';
import type {
  NamedListApi,
  QueueItem,
  QueueTemplate,
  QueueTemplateApplyState,
  QueueTemplateDraft,
  QueueTemplateDraftCharacter,
  QueueTemplateDraftRow,
  QueueTemplateRow,
} from '../types/domain';
import { parseQueueTemplate, serializeQueueTemplate } from '../utils/templateTextFormat';
import {
  exportTemplateFile,
  formatImportStatus,
  importTemplateFiles,
} from '../utils/templateFileIO';
import { errorMessage } from '../utils/errorMessage';

interface UseQueueTemplateDraftParams {
  queueItems: QueueItem[];
  setQueueItems: Dispatch<SetStateAction<QueueItem[]>>;
  queueTemplatesList: NamedListApi<QueueTemplate, { name: string; rows: QueueTemplateDraftRow[] }>;
  setStatus: (status: string) => void;
}

type DraftField = 'prompt' | 'negativePrompt' | 'count';
type DraftCharacterField = keyof QueueTemplateDraftCharacter;

// 保存済みテンプレートの行（count/enabledが欠けている可能性がある）を、編集
// ダイアログ・txtエクスポートで扱う完全な形に揃える（枚数1・有効を既定値とする）。
function toDraftRows(rows: QueueTemplateRow[]): QueueTemplateDraftRow[] {
  return (rows || []).map((row) => ({
    prompt: row.prompt || '',
    negativePrompt: row.negativePrompt || '',
    count: row.count || '1',
    characters: (row.characters || []).map((c) => ({
      prompt: c.prompt || '',
      negativePrompt: c.negativePrompt || '',
      enabled: c.enabled !== false,
    })),
  }));
}

// 複数プロンプトテンプレート（queue templates）の保存・編集ダイアログの
// ドラフトと適用ダイアログの状態、およびそれらを操作する全ハンドラをまとめる。
// キューアイテムのstateと、App.tsxから渡される queueTemplatesList のCRUD
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
      rows: toDraftRows(template.rows),
    });
  }

  // ダイアログが開いている間だけ、ドラフトの行配列をupdaterで更新する。
  function updateDraftRows(updater: (rows: QueueTemplateDraftRow[]) => QueueTemplateDraftRow[]) {
    setQueueTemplateDraft((prev) => (prev ? { ...prev, rows: updater(prev.rows) } : prev));
  }

  // 指定した行だけをupdaterで更新する。
  function updateDraftRowAt(
    rowIndex: number,
    updater: (row: QueueTemplateDraftRow) => QueueTemplateDraftRow
  ) {
    updateDraftRows((rows) => rows.map((row, i) => (i === rowIndex ? updater(row) : row)));
  }

  function updateQueueTemplateDraftRow(rowIndex: number, field: DraftField, value: string) {
    updateDraftRowAt(rowIndex, (row) => ({ ...row, [field]: value }));
  }

  function updateQueueTemplateDraftCharacter(
    rowIndex: number,
    charIndex: number,
    field: DraftCharacterField,
    value: string | boolean
  ) {
    updateDraftRowAt(rowIndex, (row) => ({
      ...row,
      characters: (row.characters || []).map((c, ci) =>
        ci === charIndex ? { ...c, [field]: value } : c
      ),
    }));
  }

  function addQueueTemplateDraftRow() {
    updateDraftRows((rows) => [
      ...rows,
      { prompt: '', negativePrompt: '', count: '1', characters: [] },
    ]);
  }

  function removeQueueTemplateDraftRow(rowIndex: number) {
    updateDraftRows((rows) => rows.filter((_, i) => i !== rowIndex));
  }

  function addQueueTemplateDraftCharacter(rowIndex: number) {
    updateDraftRowAt(rowIndex, (row) => ({
      ...row,
      characters: [...(row.characters || []), { prompt: '', negativePrompt: '', enabled: true }],
    }));
  }

  function removeQueueTemplateDraftCharacter(rowIndex: number, charIndex: number) {
    updateDraftRowAt(rowIndex, (row) => ({
      ...row,
      characters: (row.characters || []).filter((_, ci) => ci !== charIndex),
    }));
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

  async function handleExportQueueTemplate(template: QueueTemplate) {
    try {
      setStatus(
        await exportTemplateFile(
          template.name,
          serializeQueueTemplate({
            name: template.name,
            rows: toDraftRows(template.rows),
          })
        )
      );
    } catch (err) {
      setStatus(`エクスポートに失敗しました: ${errorMessage(err)}`);
    }
  }

  // 同名のテンプレートが既にある場合は内容を上書きする。
  async function handleImportQueueTemplateFiles(files: File[]) {
    if (!files.length) return;
    try {
      setStatus(
        formatImportStatus(await importTemplateFiles(files, parseQueueTemplate, queueTemplatesList))
      );
    } catch (err) {
      setStatus(`インポートに失敗しました: ${errorMessage(err)}`);
    }
  }

  function handleApplyQueueTemplate(template: QueueTemplate) {
    setQueueTemplateApplyState({ template });
  }

  function handleQueueTemplateApplyConfirm(rows: QueueTemplateRow[]) {
    setQueueItems(
      toDraftRows(rows).map((row) => ({
        id: window.crypto.randomUUID(),
        prompt: row.prompt,
        negativePrompt: row.negativePrompt,
        count: row.count,
        characters: row.characters.map((c) => ({ id: window.crypto.randomUUID(), ...c })),
        // 複数プロンプトテンプレートはAIポーション参照画像を保存対象に
        // 含めない（テンプレートは文字列プロンプトのみを対象とする設計の
        // ため）。適用時は常に空配列から開始する。
        vibeTransferImages: [],
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
    handleExportQueueTemplate,
    handleImportQueueTemplateFiles,
    handleApplyQueueTemplate,
    handleQueueTemplateApplyConfirm,
  };
}
