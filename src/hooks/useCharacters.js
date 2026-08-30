import { useState } from 'react';

// State + handlers for the main "キャラクタープロンプト" section: the
// character list itself, and the "キャラクター名で追加" form (name/series
// inputs plus optional chunk/template combine sources). Depends on
// chunksList/templatesList (to resolve a combine source) and on
// setTemplateApplyState so a template combine source can open the same
// variable-input modal usePromptLibrary uses — that piece of state is owned
// by App.jsx (not by this hook or usePromptLibrary) specifically to avoid a
// circular dependency between the two.
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

  // Resolves a "組み合わせるチャンク／テンプレート" selector value (e.g.
  // "chunk:<id>" / "template:<id>") to its text and passes it to onResolved.
  // Chunks resolve synchronously; templates open the variable-input modal and
  // resolve asynchronously once the user confirms it.
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
