import { useCallback, useEffect, useRef, useState } from 'react';
import PromptSection from './components/PromptSection.jsx';
import TemplatesSection from './components/TemplatesSection.jsx';
import FavoritesSection from './components/FavoritesSection.jsx';
import CharactersSection from './components/CharactersSection.jsx';
import ModelSection from './components/ModelSection.jsx';
import BatchSection from './components/BatchSection.jsx';
import PromptQueueSection from './components/PromptQueueSection.jsx';
import Section from './components/Section.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import ChunkEditModal from './components/modals/ChunkEditModal.jsx';
import TemplateEditModal from './components/modals/TemplateEditModal.jsx';
import TemplateApplyModal from './components/modals/TemplateApplyModal.jsx';
import QueueTemplateEditModal from './components/modals/QueueTemplateEditModal.jsx';
import QueueTemplateApplyModal from './components/modals/QueueTemplateApplyModal.jsx';
import FavArtistEditModal from './components/modals/FavArtistEditModal.jsx';
import FavCharEditModal from './components/modals/FavCharEditModal.jsx';
import { useNamedList } from './hooks/useNamedList.js';
import { useFavoritesList } from './hooks/useFavoritesList.js';

const DEFAULT_SECTION_STATE = {
  settingsSection: true,
  promptSection: true,
  templateSection: false,
  favoritesSection: false,
  characterSection: true,
  modelSection: true,
  batchSection: false,
  promptQueueSection: false,
};

function makeQueueItem() {
  return {
    id: window.crypto.randomUUID(),
    prompt: '',
    negativePrompt: '',
    count: '1',
    characters: [],
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export default function App() {
  // Persisted settings.
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [model, setModel] = useState('nai-diffusion-5-full');
  const [width, setWidth] = useState('1216');
  const [height, setHeight] = useState('832');
  const [steps, setSteps] = useState('28');
  const [scale, setScale] = useState('5');
  const [sampler, setSampler] = useState('k_euler_ancestral');
  const [qualityToggle, setQualityToggle] = useState(true);
  const [outputDir, setOutputDir] = useState('');
  const [characters, setCharacters] = useState([]);
  const [sectionState, setSectionState] = useState(DEFAULT_SECTION_STATE);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Not persisted (matches the old app: seed always starts at 0/random).
  const [seed, setSeed] = useState('0');

  // Prompt-chunk / template / favorite lists.
  const chunksList = useNamedList({
    load: window.api.loadChunks,
    save: window.api.saveChunk,
    update: window.api.updateChunk,
    remove: window.api.deleteChunk,
  });
  const templatesList = useNamedList({
    load: window.api.loadTemplates,
    save: window.api.saveTemplate,
    update: window.api.updateTemplate,
    remove: window.api.deleteTemplate,
  });
  const queueTemplatesList = useNamedList({
    load: window.api.loadQueueTemplates,
    save: window.api.saveQueueTemplate,
    update: window.api.updateQueueTemplate,
    remove: window.api.deleteQueueTemplate,
  });
  const favoriteArtists = useFavoritesList('artist');
  const favoriteCharacters = useFavoritesList('character');

  // Form inputs that aren't part of persisted settings.
  const [chunkNameInput, setChunkNameInput] = useState('');
  const [templateNameInput, setTemplateNameInput] = useState('');
  const [templateTextInput, setTemplateTextInput] = useState('');
  const [favArtistNameInput, setFavArtistNameInput] = useState('');
  const [favCharNameInput, setFavCharNameInput] = useState('');
  const [favCharSeriesInput, setFavCharSeriesInput] = useState('');
  const [charNameByName, setCharNameByName] = useState('');
  const [charSeriesByName, setCharSeriesByName] = useState('');
  const [charNameSource, setCharNameSource] = useState('');
  const [charNameNegativeSource, setCharNameNegativeSource] = useState('');

  // Modal drafts.
  const [chunkEditDraft, setChunkEditDraft] = useState(null);
  const [templateEditDraft, setTemplateEditDraft] = useState(null);
  const [favArtistEditDraft, setFavArtistEditDraft] = useState(null);
  const [favCharEditDraft, setFavCharEditDraft] = useState(null);
  const [templateApplyState, setTemplateApplyState] = useState(null);
  const [queueTemplateDraft, setQueueTemplateDraft] = useState(null);
  const [queueTemplateApplyState, setQueueTemplateApplyState] = useState(null);

  // Which prompt-like field ("prompt" / "negativePrompt" / "char:<i>:prompt" /
  // "char:<i>:negativePrompt") a chunk/favorite/template should be inserted
  // into. Resolved lazily so it always reflects the latest field value.
  const [focusedFieldKey, setFocusedFieldKey] = useState('prompt');
  const charNameByNameRef = useRef(null);

  // Generation state.
  const [status, setStatus] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [fileInfo, setFileInfo] = useState('');
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [batchCount, setBatchCount] = useState('1');
  const [batchInterval, setBatchInterval] = useState('5');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const batchStopRef = useRef(false);
  const [queueItems, setQueueItems] = useState([makeQueueItem()]);
  const [queueInterval, setQueueInterval] = useState('5');
  const [queueRunning, setQueueRunning] = useState(false);
  const [queueStatus, setQueueStatus] = useState('');
  const queueStopRef = useRef(false);

  useEffect(() => {
    (async () => {
      const settings = await window.api.loadSettings();
      if (settings.apiKey) setApiKey(settings.apiKey);
      if (settings.prompt) setPrompt(settings.prompt);
      if (settings.negativePrompt) setNegativePrompt(settings.negativePrompt);
      if (settings.model) setModel(settings.model);
      if (settings.width) setWidth(settings.width);
      if (settings.height) setHeight(settings.height);
      if (settings.steps) setSteps(settings.steps);
      if (settings.scale) setScale(settings.scale);
      if (settings.sampler) setSampler(settings.sampler);
      if (typeof settings.qualityToggle === 'boolean') setQualityToggle(settings.qualityToggle);
      if (settings.outputDir) setOutputDir(settings.outputDir);
      if (Array.isArray(settings.characters)) {
        // Older saved settings predate per-character ids (used as the React
        // list key); backfill them so existing characters get a stable key too.
        setCharacters(
          settings.characters.map((c) => (c.id ? c : { ...c, id: window.crypto.randomUUID() }))
        );
      }
      if (Array.isArray(settings.queueItems) && settings.queueItems.length > 0) {
        // Older saved settings predate per-item/per-character ids; backfill
        // them so existing rows get stable keys too.
        setQueueItems(
          settings.queueItems.map((item) => ({
            ...item,
            id: item.id || window.crypto.randomUUID(),
            characters: (item.characters || []).map((c) =>
              c.id ? c : { ...c, id: window.crypto.randomUUID() }
            ),
          }))
        );
      }
      if (settings.sectionState) {
        setSectionState((prev) => ({ ...prev, ...settings.sectionState }));
      }
      if (settings.batchCount) setBatchCount(settings.batchCount);
      if (settings.batchInterval) setBatchInterval(settings.batchInterval);
      if (settings.queueInterval) setQueueInterval(settings.queueInterval);
      setSettingsLoaded(true);
    })();
  }, []);

  const currentSettings = useCallback(
    () => ({
      apiKey,
      prompt,
      negativePrompt,
      model,
      width,
      height,
      steps,
      scale,
      sampler,
      qualityToggle,
      outputDir,
      characters,
      sectionState,
      queueItems,
      batchCount,
      batchInterval,
      queueInterval,
    }),
    [
      apiKey,
      prompt,
      negativePrompt,
      model,
      width,
      height,
      steps,
      scale,
      sampler,
      qualityToggle,
      outputDir,
      characters,
      sectionState,
      queueItems,
      batchCount,
      batchInterval,
      queueInterval,
    ]
  );

  // Debounced autosave, mirroring the old app's "save shortly after the user
  // stops editing" behavior without wiring a persist call to every field.
  useEffect(() => {
    if (!settingsLoaded) return undefined;
    const id = setTimeout(() => window.api.saveSettings(currentSettings()), 300);
    return () => clearTimeout(id);
  }, [settingsLoaded, currentSettings]);

  async function handleChooseOutputDir() {
    const dir = await window.api.chooseOutputFolder();
    if (dir) setOutputDir(dir);
  }

  async function handleCheckSubscription() {
    setSubscriptionStatus('確認中...');
    setSubscriptionInfo(null);
    try {
      const info = await window.api.getSubscriptionInfo(apiKey);
      setSubscriptionInfo(info);
      setSubscriptionStatus('');
    } catch (err) {
      setSubscriptionStatus(`エラー: ${err.message}`);
    }
  }

  function handleSectionToggle(id, isOpen) {
    setSectionState((prev) => ({ ...prev, [id]: isOpen }));
  }

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

  function updateCharacterField(index, field, value) {
    setCharacters((prev) => prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)));
  }

  function removeCharacter(index) {
    setCharacters((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQueueItemField(index, field, value) {
    setQueueItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  }

  function addQueueItem() {
    setQueueItems((prev) => [...prev, makeQueueItem()]);
  }

  function removeQueueItem(index) {
    setQueueItems((prev) => prev.filter((_, i) => i !== index));
  }

  function updateQueueItemCharacterField(itemIndex, charIndex, field, value) {
    setQueueItems((prev) =>
      prev.map((item, i) => {
        if (i !== itemIndex) return item;
        const characters = (item.characters || []).map((c, ci) =>
          ci === charIndex ? { ...c, [field]: value } : c
        );
        return { ...item, characters };
      })
    );
  }

  function addQueueItemCharacter(itemIndex) {
    setQueueItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? {
              ...item,
              characters: [
                ...(item.characters || []),
                { id: window.crypto.randomUUID(), prompt: '', negativePrompt: '', enabled: true },
              ],
            }
          : item
      )
    );
  }

  function removeQueueItemCharacter(itemIndex, charIndex) {
    setQueueItems((prev) =>
      prev.map((item, i) =>
        i === itemIndex
          ? { ...item, characters: (item.characters || []).filter((_, ci) => ci !== charIndex) }
          : item
      )
    );
  }

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

  function moveQueueItem(index, direction) {
    const target = index + direction;
    setQueueItems((prev) => {
      if (target < 0 || target >= prev.length) return prev;
      const next = [...prev];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
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

  async function handleSaveFavArtist() {
    const name = favArtistNameInput.trim();
    if (!name) {
      setStatus('アーティスト名を入力してください');
      return;
    }
    await favoriteArtists.addItem({ name });
    setFavArtistNameInput('');
  }

  async function handleSaveFavArtistEdit() {
    const name = favArtistEditDraft.name.trim();
    if (!name) {
      setStatus('アーティスト名を入力してください');
      return;
    }
    await favoriteArtists.editItem({ id: favArtistEditDraft.id, name });
    setFavArtistEditDraft(null);
  }

  async function handleSaveFavChar() {
    const name = favCharNameInput.trim();
    const series = favCharSeriesInput.trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    await favoriteCharacters.addItem({ name, series });
    setFavCharNameInput('');
    setFavCharSeriesInput('');
  }

  function handleToTemplateFavChar(favorite) {
    setCharNameByName(favorite.name);
    setCharSeriesByName(favorite.series || '');
    setSectionState((prev) => ({ ...prev, characterSection: true }));
    charNameByNameRef.current?.focus();
  }

  async function handleSaveFavCharEdit() {
    const name = favCharEditDraft.name.trim();
    const series = (favCharEditDraft.series || '').trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    await favoriteCharacters.editItem({ id: favCharEditDraft.id, name, series });
    setFavCharEditDraft(null);
  }

  function buildGenerateParams(extra) {
    return {
      apiKey,
      prompt,
      negativePrompt,
      model,
      width,
      height,
      steps,
      scale,
      sampler,
      seed,
      qualityToggle,
      characterPrompts: characters.filter((c) => c.enabled !== false && c.prompt?.trim()),
      ...extra,
    };
  }

  function recordResult(result) {
    setResultImage(result.dataUrl);
    setFileInfo(`${result.fileName} (seed: ${result.seed})`);
    setHistory((prev) => [{ dataUrl: result.dataUrl, fileName: result.fileName }, ...prev]);
  }

  async function handleGenerate() {
    window.api.saveSettings(currentSettings());
    setGenerating(true);
    setStatus('生成中...');
    try {
      const result = await window.api.generateImage(buildGenerateParams());
      recordResult(result);
      setStatus(`保存しました: ${result.filePath}`);
    } catch (err) {
      setStatus(`エラー: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  }

  async function handleStartBatch() {
    if (queueRunning) return;
    window.api.saveSettings(currentSettings());
    const count = Math.max(1, Math.min(100, parseInt(batchCount, 10) || 1));
    const intervalSec = Math.max(1, parseInt(batchInterval, 10) || 5);
    const batchFolder = `batch_${Date.now()}`;

    batchStopRef.current = false;
    setBatchRunning(true);

    for (let i = 1; i <= count; i += 1) {
      if (batchStopRef.current) {
        setBatchStatus(`${i - 1}/${count} 枚生成後に中断しました（保存先: output/${batchFolder}）`);
        break;
      }
      setBatchStatus(`${i}/${count} 枚目を生成中...`);
      try {
        const result = await window.api.generateImage(buildGenerateParams({ batchFolder }));
        recordResult(result);
        setBatchStatus(`${i}/${count} 枚生成しました（保存先: output/${batchFolder}）`);
      } catch (err) {
        setBatchStatus(`${i}/${count} 枚目でエラー: ${err.message}（中断しました）`);
        break;
      }
      if (i < count && !batchStopRef.current) {
        for (let remaining = intervalSec; remaining > 0; remaining -= 1) {
          if (batchStopRef.current) break;
          setBatchStatus(`次の生成まで ${remaining} 秒待機中...（${i}/${count} 枚完了）`);
          await sleep(1000);
        }
      }
    }

    setBatchRunning(false);
  }

  function handleStopBatch() {
    batchStopRef.current = true;
  }

  async function handleStartQueue() {
    if (batchRunning) return;
    window.api.saveSettings(currentSettings());
    const intervalSec = Math.max(1, parseInt(queueInterval, 10) || 5);
    const items = queueItems
      .map((item) => ({
        ...item,
        count: Math.max(1, Math.min(100, parseInt(item.count, 10) || 1)),
      }))
      .filter((item) => item.prompt.trim());
    if (!items.length) return;
    const queueFolder = `queue_${Date.now()}`;
    const totalCount = items.reduce((sum, item) => sum + item.count, 0);

    queueStopRef.current = false;
    setQueueRunning(true);

    let done = 0;
    let stopped = false;
    for (let itemIndex = 0; itemIndex < items.length && !stopped; itemIndex += 1) {
      const item = items[itemIndex];
      const itemFolder = `${queueFolder}/prompt${itemIndex + 1}`;
      for (let i = 1; i <= item.count; i += 1) {
        if (queueStopRef.current) {
          stopped = true;
          break;
        }
        setQueueStatus(
          `${done}/${totalCount} 枚完了（プロンプト${itemIndex + 1}: ${i}/${item.count} 枚目を生成中...）`
        );
        try {
          const result = await window.api.generateImage(
            buildGenerateParams({
              prompt: item.prompt,
              negativePrompt: item.negativePrompt,
              characterPrompts: (item.characters || []).filter(
                (c) => c.enabled !== false && c.prompt?.trim()
              ),
              batchFolder: itemFolder,
            })
          );
          recordResult(result);
          done += 1;
          setQueueStatus(`${done}/${totalCount} 枚生成しました（保存先: output/${itemFolder}）`);
        } catch (err) {
          setQueueStatus(`${done}/${totalCount} 枚完了後にエラー: ${err.message}（中断しました）`);
          stopped = true;
          break;
        }
        if (!(itemIndex === items.length - 1 && i === item.count) && !queueStopRef.current) {
          for (let remaining = intervalSec; remaining > 0; remaining -= 1) {
            if (queueStopRef.current) break;
            setQueueStatus(`次の生成まで ${remaining} 秒待機中...（${done}/${totalCount} 枚完了）`);
            await sleep(1000);
          }
        }
      }
    }

    if (queueStopRef.current) {
      setQueueStatus(
        `${done}/${totalCount} 枚生成後に中断しました（保存先: output/${queueFolder}）`
      );
    }

    setQueueRunning(false);
  }

  function handleStopQueue() {
    queueStopRef.current = true;
  }

  const openFolderLabel = window.isNativeApp ? '最新の画像を共有' : '保存フォルダを開く';

  return (
    <>
      <div className="panel left">
        <Section
          id="settingsSection"
          title="設定"
          open={sectionState.settingsSection}
          onToggle={handleSectionToggle}
        >
          <label>NovelAI API キー (persistent token)</label>
          <input
            type="password"
            placeholder="pst-..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <button type="button" onClick={handleCheckSubscription}>
            Anlas / Opus残量を確認
          </button>
          {subscriptionStatus && <p className="hint">{subscriptionStatus}</p>}
          {subscriptionInfo && (
            <p className="hint">
              Anlas残量: {subscriptionInfo.anlas}
              {subscriptionInfo.opusPerks.length > 0 && (
                <>
                  <br />
                  Opus無料生成枠:{' '}
                  {subscriptionInfo.opusPerks
                    .map(
                      (p) =>
                        `解像度${p.resolution}以下 ${p.maxPrompts}回まで（${Math.round(p.resetAfter / 3600)}時間ごとにリセット）`
                    )
                    .join(' / ')}
                </>
              )}
            </p>
          )}

          <label>画像の保存先フォルダ</label>
          {window.isNativeApp ? (
            <p className="hint">
              Android版では保存先は端末内のドキュメントフォルダに固定されています。
            </p>
          ) : (
            <div className="output-dir-row">
              <input type="text" readOnly value={outputDir || '（既定のフォルダを使用）'} />
              <button type="button" onClick={handleChooseOutputDir}>
                参照...
              </button>
              {outputDir && (
                <button type="button" onClick={() => setOutputDir('')}>
                  既定に戻す
                </button>
              )}
            </div>
          )}
        </Section>

        <PromptSection
          open={sectionState.promptSection}
          onToggle={handleSectionToggle}
          prompt={prompt}
          setPrompt={setPrompt}
          negativePrompt={negativePrompt}
          setNegativePrompt={setNegativePrompt}
          onFocusField={setFocusedFieldKey}
          chunks={chunksList.items}
          chunkNameInput={chunkNameInput}
          setChunkNameInput={setChunkNameInput}
          onSaveChunk={handleSaveChunk}
          onInsertChunk={(chunk) => insertIntoFocused(chunk.text)}
          onEditChunk={(chunk) => setChunkEditDraft({ ...chunk })}
          onDeleteChunk={(id) => chunksList.removeItem(id)}
        />

        <TemplatesSection
          open={sectionState.templateSection}
          onToggle={handleSectionToggle}
          templates={templatesList.items}
          templateNameInput={templateNameInput}
          setTemplateNameInput={setTemplateNameInput}
          templateTextInput={templateTextInput}
          setTemplateTextInput={setTemplateTextInput}
          onSaveTemplate={handleSaveTemplate}
          onApplyTemplate={handleApplyTemplate}
          onEditTemplate={(template) => setTemplateEditDraft({ ...template })}
          onDeleteTemplate={(id) => templatesList.removeItem(id)}
        />

        <FavoritesSection
          open={sectionState.favoritesSection}
          onToggle={handleSectionToggle}
          favArtists={favoriteArtists.items}
          favArtistNameInput={favArtistNameInput}
          setFavArtistNameInput={setFavArtistNameInput}
          onSaveFavArtist={handleSaveFavArtist}
          onInsertFavArtist={(fav) => insertIntoFocused(`artist:${fav.name}`)}
          onEditFavArtist={(fav) => setFavArtistEditDraft({ ...fav })}
          onDeleteFavArtist={(id) => favoriteArtists.removeItem(id)}
          favChars={favoriteCharacters.items}
          favCharNameInput={favCharNameInput}
          setFavCharNameInput={setFavCharNameInput}
          favCharSeriesInput={favCharSeriesInput}
          setFavCharSeriesInput={setFavCharSeriesInput}
          onSaveFavChar={handleSaveFavChar}
          onInsertFavChar={(fav) =>
            insertIntoFocused(fav.series ? `${fav.name} (${fav.series})` : fav.name)
          }
          onToTemplateFavChar={handleToTemplateFavChar}
          onEditFavChar={(fav) => setFavCharEditDraft({ ...fav })}
          onDeleteFavChar={(id) => favoriteCharacters.removeItem(id)}
        />

        <CharactersSection
          open={sectionState.characterSection}
          onToggle={handleSectionToggle}
          characters={characters}
          onChangeCharacter={updateCharacterField}
          onRemoveCharacter={removeCharacter}
          onAddBlankCharacter={addBlankCharacter}
          onFocusField={setFocusedFieldKey}
          chunks={chunksList.items}
          templates={templatesList.items}
          charNameByName={charNameByName}
          setCharNameByName={setCharNameByName}
          charSeriesByName={charSeriesByName}
          setCharSeriesByName={setCharSeriesByName}
          charNameSource={charNameSource}
          setCharNameSource={setCharNameSource}
          charNameNegativeSource={charNameNegativeSource}
          setCharNameNegativeSource={setCharNameNegativeSource}
          onAddByName={handleAddByName}
          nameInputRef={charNameByNameRef}
        />

        <ModelSection
          open={sectionState.modelSection}
          onToggle={handleSectionToggle}
          model={model}
          setModel={setModel}
          width={width}
          setWidth={setWidth}
          height={height}
          setHeight={setHeight}
          steps={steps}
          setSteps={setSteps}
          scale={scale}
          setScale={setScale}
          sampler={sampler}
          setSampler={setSampler}
          seed={seed}
          setSeed={setSeed}
          qualityToggle={qualityToggle}
          setQualityToggle={setQualityToggle}
        />

        <div className="generate-sticky">
          <button onClick={handleGenerate} disabled={generating || batchRunning || queueRunning}>
            生成する
          </button>
        </div>

        <BatchSection
          open={sectionState.batchSection}
          onToggle={handleSectionToggle}
          batchCount={batchCount}
          setBatchCount={setBatchCount}
          batchInterval={batchInterval}
          setBatchInterval={setBatchInterval}
          onStartBatch={handleStartBatch}
          onStopBatch={handleStopBatch}
          batchRunning={batchRunning}
          batchStatus={batchStatus}
        />

        <PromptQueueSection
          open={sectionState.promptQueueSection}
          onToggle={handleSectionToggle}
          queueItems={queueItems}
          onChangeItem={updateQueueItemField}
          onRemoveItem={removeQueueItem}
          onMoveItemUp={(index) => moveQueueItem(index, -1)}
          onMoveItemDown={(index) => moveQueueItem(index, 1)}
          onAddItem={addQueueItem}
          onAddItemCharacter={addQueueItemCharacter}
          onRemoveItemCharacter={removeQueueItemCharacter}
          onChangeItemCharacter={updateQueueItemCharacterField}
          onFocusField={setFocusedFieldKey}
          queueInterval={queueInterval}
          setQueueInterval={setQueueInterval}
          onStartQueue={handleStartQueue}
          onStopQueue={handleStopQueue}
          queueRunning={queueRunning}
          queueStatus={queueStatus}
          queueTemplates={queueTemplatesList.items}
          onSaveAsQueueTemplate={openQueueTemplateSaveDialog}
          onApplyQueueTemplate={handleApplyQueueTemplate}
          onEditQueueTemplate={openQueueTemplateEditDialog}
          onDeleteQueueTemplate={queueTemplatesList.removeItem}
        />

        <button className="secondary" onClick={() => window.api.openOutputFolder()}>
          {openFolderLabel}
        </button>
        <div id="status">{status}</div>
      </div>

      <ResultPanel
        resultImage={resultImage}
        fileInfo={fileInfo}
        history={history}
        onSelectHistory={(item) => {
          setResultImage(item.dataUrl);
          setFileInfo(item.fileName);
        }}
      />

      <ChunkEditModal
        draft={chunkEditDraft}
        onChange={setChunkEditDraft}
        onCancel={() => setChunkEditDraft(null)}
        onSave={handleSaveChunkEdit}
      />
      <TemplateEditModal
        draft={templateEditDraft}
        onChange={setTemplateEditDraft}
        onCancel={() => setTemplateEditDraft(null)}
        onSave={handleSaveTemplateEdit}
      />
      <TemplateApplyModal
        applyState={templateApplyState}
        onCancel={() => setTemplateApplyState(null)}
        onConfirm={handleTemplateApplyConfirm}
      />
      <QueueTemplateEditModal
        draft={queueTemplateDraft}
        onChange={setQueueTemplateDraft}
        onChangeRow={updateQueueTemplateDraftRow}
        onChangeCharacter={updateQueueTemplateDraftCharacter}
        onAddRow={addQueueTemplateDraftRow}
        onRemoveRow={removeQueueTemplateDraftRow}
        onAddCharacter={addQueueTemplateDraftCharacter}
        onRemoveCharacter={removeQueueTemplateDraftCharacter}
        onCancel={() => setQueueTemplateDraft(null)}
        onSave={handleSaveQueueTemplate}
      />
      <QueueTemplateApplyModal
        applyState={queueTemplateApplyState}
        onCancel={() => setQueueTemplateApplyState(null)}
        onConfirm={handleQueueTemplateApplyConfirm}
      />
      <FavArtistEditModal
        draft={favArtistEditDraft}
        onChange={setFavArtistEditDraft}
        onCancel={() => setFavArtistEditDraft(null)}
        onSave={handleSaveFavArtistEdit}
      />
      <FavCharEditModal
        draft={favCharEditDraft}
        onChange={setFavCharEditDraft}
        onCancel={() => setFavCharEditDraft(null)}
        onSave={handleSaveFavCharEdit}
      />
    </>
  );
}
