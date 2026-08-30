import { useState } from 'react';

// Encapsulates the save/edit-dialog draft and apply-dialog state for 複数プロン
// プロンプトテンプレート (queue templates), plus every handler that mutates
// them. Depends on the queue-items state and the queueTemplatesList CRUD
// (useNamedList) from App.jsx, and on setStatus for validation messages —
// these are passed in rather than re-derived so this hook stays a pure
// extraction of the existing logic (no behavior change).
export function useQueueTemplateDraft({
  queueItems,
  setQueueItems,
  queueTemplatesList,
  setStatus,
}) {
  const [queueTemplateDraft, setQueueTemplateDraft] = useState(null);
  const [queueTemplateApplyState, setQueueTemplateApplyState] = useState(null);

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

  function openQueueTemplateEditDialog(template) {
    setQueueTemplateDraft({ id: template.id, name: template.name, rows: template.rows });
  }

  function updateQueueTemplateDraftRow(rowIndex, field, value) {
    setQueueTemplateDraft((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => (i === rowIndex ? { ...row, [field]: value } : row)),
    }));
  }

  function updateQueueTemplateDraftCharacter(rowIndex, charIndex, field, value) {
    setQueueTemplateDraft((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) => {
        if (i !== rowIndex) return row;
        const characters = (row.characters || []).map((c, ci) =>
          ci === charIndex ? { ...c, [field]: value } : c
        );
        return { ...row, characters };
      }),
    }));
  }

  function addQueueTemplateDraftRow() {
    setQueueTemplateDraft((prev) => ({
      ...prev,
      rows: [...prev.rows, { prompt: '', negativePrompt: '', count: '1', characters: [] }],
    }));
  }

  function removeQueueTemplateDraftRow(rowIndex) {
    setQueueTemplateDraft((prev) => ({
      ...prev,
      rows: prev.rows.filter((_, i) => i !== rowIndex),
    }));
  }

  function addQueueTemplateDraftCharacter(rowIndex) {
    setQueueTemplateDraft((prev) => ({
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
    }));
  }

  function removeQueueTemplateDraftCharacter(rowIndex, charIndex) {
    setQueueTemplateDraft((prev) => ({
      ...prev,
      rows: prev.rows.map((row, i) =>
        i === rowIndex
          ? { ...row, characters: (row.characters || []).filter((_, ci) => ci !== charIndex) }
          : row
      ),
    }));
  }

  async function handleSaveQueueTemplate() {
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

  function handleApplyQueueTemplate(template) {
    setQueueTemplateApplyState({ template });
  }

  function handleQueueTemplateApplyConfirm(rows) {
    setQueueItems(
      rows.map((row) => ({
        id: window.crypto.randomUUID(),
        prompt: row.prompt || '',
        negativePrompt: row.negativePrompt || '',
        count: row.count || '1',
        characters: (row.characters || []).map((c) => ({
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
