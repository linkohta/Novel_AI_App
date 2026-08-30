import { useState } from 'react';

// Handlers for the "プロンプトチャンク" and "プロンプトテンプレート" sections:
// saving the current prompt as a chunk, editing/saving chunk and template
// drafts, and applying a template (which opens a variable-input modal and,
// once confirmed, writes the result into whichever field currently has
// focus via resolveFocusedField). `templateApplyState`/`setTemplateApplyState`
// are owned by App.jsx rather than this hook because useCharacters' "テンプレ
// ートで組み合わせる" combine source also opens the same modal — see
// useCharacters.js for why that state isn't owned by either hook.
export function usePromptLibrary({
  prompt,
  chunksList,
  templatesList,
  resolveFocusedField,
  templateApplyState,
  setTemplateApplyState,
  setStatus,
}) {
  const [chunkNameInput, setChunkNameInput] = useState('');
  const [chunkEditDraft, setChunkEditDraft] = useState(null);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateTextInput, setTemplateTextInput] = useState('');
  const [templateEditDraft, setTemplateEditDraft] = useState(null);

  async function handleSaveChunk() {
    const name = chunkNameInput.trim();
    const text = prompt.trim();
    if (!name || !text) {
      setStatus('チャンク名とプロンプトを入力してください');
      return;
    }
    await chunksList.addItem({ name, text });
    setChunkNameInput('');
  }

  async function handleSaveChunkEdit() {
    const name = chunkEditDraft.name.trim();
    const text = chunkEditDraft.text.trim();
    if (!name || !text) {
      setStatus('チャンク名とプロンプトを入力してください');
      return;
    }
    await chunksList.editItem({ id: chunkEditDraft.id, name, text });
    setChunkEditDraft(null);
  }

  async function handleSaveTemplate() {
    const name = templateNameInput.trim();
    const text = templateTextInput.trim();
    if (!name || !text) {
      setStatus('テンプレート名と本文を入力してください');
      return;
    }
    await templatesList.addItem({ name, text });
    setTemplateNameInput('');
    setTemplateTextInput('');
  }

  async function handleSaveTemplateEdit() {
    const name = templateEditDraft.name.trim();
    const text = templateEditDraft.text.trim();
    if (!name || !text) {
      setStatus('テンプレート名と本文を入力してください');
      return;
    }
    await templatesList.editItem({ id: templateEditDraft.id, name, text });
    setTemplateEditDraft(null);
  }

  function handleApplyTemplate(template) {
    setTemplateApplyState({
      template,
      onApply: (result) => {
        const { set } = resolveFocusedField();
        set(result);
      },
    });
  }

  function handleTemplateApplyConfirm(result) {
    if (!templateApplyState) return;
    templateApplyState.onApply(result);
    setTemplateApplyState(null);
  }

  return {
    chunkNameInput,
    setChunkNameInput,
    handleSaveChunk,
    chunkEditDraft,
    setChunkEditDraft,
    handleSaveChunkEdit,
    templateNameInput,
    setTemplateNameInput,
    templateTextInput,
    setTemplateTextInput,
    handleSaveTemplate,
    templateEditDraft,
    setTemplateEditDraft,
    handleSaveTemplateEdit,
    handleApplyTemplate,
    handleTemplateApplyConfirm,
  };
}
