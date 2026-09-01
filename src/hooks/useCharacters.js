import { useState } from 'react';

// メインの「キャラクタープロンプト」セクションのstate＋ハンドラ：
// キャラクター一覧そのものと、「キャラクター名で追加」フォーム（名前・作品名
// の入力欄に加え、任意の組み合わせるチャンク／テンプレートのソース）。
// chunksList/templatesList（組み合わせるソースを解決するため）と
// setTemplateApplyStateに依存しており、これによって組み合わせるテンプレート
// ソースがusePromptLibraryと同じ変数入力モーダルを開けるようにしている——
// このstateはApp.jsxが持つ（このフックにもusePromptLibraryにも持たせない）
// のは、両者の間で循環依存になるのを避けるためである。
export function useCharacters({ chunksList, templatesList, setTemplateApplyState, setStatus }) {
  const [characters, setCharacters] = useState([]);
  const [charNameByName, setCharNameByName] = useState('');
  const [charSeriesByName, setCharSeriesByName] = useState('');
  const [charNameSource, setCharNameSource] = useState('');
  const [charNameNegativeSource, setCharNameNegativeSource] = useState('');

  function updateCharacterField(index, field, value) {
    setCharacters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function removeCharacter(index) {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  }

  function addBlankCharacter() {
    setCharacters((prev) => [
      ...prev,
      { id: window.crypto.randomUUID(), prompt: '', negativePrompt: '', enabled: true },
    ]);
  }

  function finishAddCharacterByName(promptText, negativePromptText) {
    setCharacters((prev) => [
      ...prev,
      {
        id: window.crypto.randomUUID(),
        prompt: promptText,
        negativePrompt: negativePromptText || '',
        enabled: true,
      },
    ]);
    setCharNameByName('');
    setCharSeriesByName('');
    setCharNameSource('');
    setCharNameNegativeSource('');
  }

  // 「組み合わせるチャンク／テンプレート」セレクターの値（例:
  // "chunk:<id>" / "template:<id>"）をそのテキストに解決し、onResolvedに
  // 渡す。チャンクは同期的に解決されるが、テンプレートは変数入力モーダルを
  // 開き、ユーザーが確定した時点で非同期に解決される。
  function resolveCombineSource(source, onResolved) {
    if (!source) {
      onResolved('');
      return;
    }
    const [sourceType, sourceId] = source.split(':');
    if (sourceType === 'chunk') {
      const chunk = chunksList.items.find((c) => c.id === sourceId);
      onResolved(chunk ? chunk.text : '');
      return;
    }
    if (sourceType === 'template') {
      const template = templatesList.items.find((t) => t.id === sourceId);
      if (!template) {
        onResolved('');
        return;
      }
      setTemplateApplyState({ template, onApply: onResolved });
    }
  }

  function handleAddByName() {
    const name = charNameByName.trim();
    const series = charSeriesByName.trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    const base = series ? `${name} (${series})` : name;

    resolveCombineSource(charNameSource, (promptExtra) => {
      resolveCombineSource(charNameNegativeSource, (negativeExtra) => {
        finishAddCharacterByName(promptExtra ? `${base}, ${promptExtra}` : base, negativeExtra);
      });
    });
  }

  return {
    characters,
    setCharacters,
    updateCharacterField,
    removeCharacter,
    addBlankCharacter,
    charNameByName,
    setCharNameByName,
    charSeriesByName,
    setCharSeriesByName,
    charNameSource,
    setCharNameSource,
    charNameNegativeSource,
    setCharNameNegativeSource,
    handleAddByName,
  };
}
