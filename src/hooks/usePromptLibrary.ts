import { Dispatch, SetStateAction, useState } from 'react';
import type { NamedItem, NamedListApi, TemplateApplyState } from '../types/domain';

interface UsePromptLibraryParams {
  prompt: string;
  chunksList: NamedListApi<NamedItem, { name: string; text: string }>;
  templatesList: NamedListApi<NamedItem, { name: string; text: string }>;
  resolveFocusedField: () => { value: string; set: (value: string) => void };
  templateApplyState: TemplateApplyState | null;
  setTemplateApplyState: Dispatch<SetStateAction<TemplateApplyState | null>>;
  setStatus: (status: string) => void;
}

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
}: UsePromptLibraryParams) {
  const [chunkNameInput, setChunkNameInput] = useState('');
  const [chunkEditDraft, setChunkEditDraft] = useState<NamedItem | null>(null);
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateTextInput, setTemplateTextInput] = useState('');
  const [templateEditDraft, setTemplateEditDraft] = useState<NamedItem | null>(null);

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
    if (!chunkEditDraft) return;
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
    if (!templateEditDraft) return;
    const name = templateEditDraft.name.trim();
    const text = templateEditDraft.text.trim();
    if (!name || !text) {
      setStatus('テンプレート名と本文を入力してください');
      return;
    }
    await templatesList.editItem({ id: templateEditDraft.id, name, text });
    setTemplateEditDraft(null);
  }

  function handleApplyTemplate(template: NamedItem) {
    setTemplateApplyState({
      template,
      onApply: (result: string) => {
        const { set } = resolveFocusedField();
        set(result);
      },
    });
  }

  function handleTemplateApplyConfirm(result: string) {
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
