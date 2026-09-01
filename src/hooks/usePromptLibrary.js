import { useState } from 'react';

// 「プロンプトチャンク」「プロンプトテンプレート」セクションのハンドラ:
// 現在のプロンプトをチャンクとして保存する処理、チャンク／テンプレートの
// 編集・保存ドラフト、およびテンプレートの適用（変数入力モーダルを開き、
// 確定後にresolveFocusedField経由でその時点でフォーカスされているフィールド
// へ結果を書き込む）。`templateApplyState`/`setTemplateApplyState` はこの
// フックではなくApp.jsxが所有している。useCharacters側の「テンプレ
// ートで組み合わせる」の組み合わせ元も同じモーダルを開くため——この状態が
// どちらのフックにも属さない理由についてはuseCharacters.jsを参照。
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
