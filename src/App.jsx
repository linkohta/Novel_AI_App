import { useEffect, useRef, useState } from 'react';
import PromptSection from './components/PromptSection.jsx';
import TemplatesSection from './components/TemplatesSection.jsx';
import FavoritesSection from './components/FavoritesSection.jsx';
import CharactersSection from './components/CharactersSection.jsx';
import ModelSection from './components/ModelSection.jsx';
import BatchSection from './components/BatchSection.jsx';
import Section from './components/Section.jsx';
import ResultPanel from './components/ResultPanel.jsx';
import ChunkEditModal from './components/modals/ChunkEditModal.jsx';
import TemplateEditModal from './components/modals/TemplateEditModal.jsx';
import TemplateApplyModal from './components/modals/TemplateApplyModal.jsx';
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
};

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

  // Modal drafts.
  const [chunkEditDraft, setChunkEditDraft] = useState(null);
  const [templateEditDraft, setTemplateEditDraft] = useState(null);
  const [favArtistEditDraft, setFavArtistEditDraft] = useState(null);
  const [favCharEditDraft, setFavCharEditDraft] = useState(null);
  const [templateApplyState, setTemplateApplyState] = useState(null);

  // Which prompt-like field ("prompt" / "negativePrompt" / "char:<i>:prompt" /
  // "char:<i>:negativePrompt") a chunk/favorite/template should be inserted
  // into. Resolved lazily so it always reflects the latest field value.
  const [focusedFieldKey, setFocusedFieldKey] = useState('prompt');
  const charNameByNameRef = useRef(null);

  // Generation state.
  const [status, setStatus] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [fileInfo, setFileInfo] = useState('');
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [batchCount, setBatchCount] = useState('1');
  const [batchInterval, setBatchInterval] = useState('5');
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const batchStopRef = useRef(false);

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
      if (Array.isArray(settings.characters)) setCharacters(settings.characters);
      if (settings.sectionState) {
        setSectionState((prev) => ({ ...prev, ...settings.sectionState }));
      }
      setSettingsLoaded(true);
    })();
  }, []);

  function currentSettings() {
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
      characters,
      sectionState,
    };
  }

  // Debounced autosave, mirroring the old app's "save shortly after the user
  // stops editing" behavior without wiring a persist call to every field.
  useEffect(() => {
    if (!settingsLoaded) return undefined;
    const id = setTimeout(() => window.api.saveSettings(currentSettings()), 300);
    return () => clearTimeout(id);
  }, [
    settingsLoaded,
    apiKey,
    prompt,
    negativePrompt,
    model,
    width,
    height,
    steps,
    scale,
    sampler,
    characters,
    sectionState,
  ]);

  function handleSectionToggle(id, isOpen) {
    setSectionState((prev) => ({ ...prev, [id]: isOpen }));
  }

  function resolveFocusedField() {
    if (focusedFieldKey === 'prompt') return { value: prompt, set: setPrompt };
    if (focusedFieldKey === 'negativePrompt') {
      return { value: negativePrompt, set: setNegativePrompt };
    }
    const match = /^char:(\d+):(prompt|negativePrompt)$/.exec(focusedFieldKey);
    if (match) {
      const index = Number(match[1]);
      const field = match[2];
      return {
        value: characters[index]?.[field] || '',
        set: (value) => updateCharacterField(index, field, value),
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

  function addBlankCharacter() {
    setCharacters((prev) => [...prev, { prompt: '', negativePrompt: '', enabled: true }]);
  }

  function finishAddCharacterByName(promptText) {
    setCharacters((prev) => [...prev, { prompt: promptText, negativePrompt: '', enabled: true }]);
    setCharNameByName('');
    setCharSeriesByName('');
    setCharNameSource('');
  }

  function handleAddByName() {
    const name = charNameByName.trim();
    const series = charSeriesByName.trim();
    if (!name) {
      setStatus('キャラクター名を入力してください');
      return;
    }
    const base = series ? `${name} (${series})` : name;

    if (!charNameSource) {
      finishAddCharacterByName(base);
      return;
    }

    const [sourceType, sourceId] = charNameSource.split(':');
    if (sourceType === 'chunk') {
      const chunk = chunksList.items.find((c) => c.id === sourceId);
      finishAddCharacterByName(chunk ? `${base}, ${chunk.text}` : base);
      return;
    }

    if (sourceType === 'template') {
      const template = templatesList.items.find((t) => t.id === sourceId);
      if (!template) {
        finishAddCharacterByName(base);
        return;
      }
      setTemplateApplyState({
        template,
        onApply: (result) => finishAddCharacterByName(`${base}, ${result}`),
      });
    }
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
        />

        <div className="generate-sticky">
          <button onClick={handleGenerate} disabled={generating || batchRunning}>
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
