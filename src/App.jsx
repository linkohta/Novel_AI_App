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
import { useQueueItems } from './hooks/useQueueItems.js';
import { useQueueTemplateDraft } from './hooks/useQueueTemplateDraft.js';
import { useCharacters } from './hooks/useCharacters.js';
import { useFocusedField } from './hooks/useFocusedField.js';
import { usePromptLibrary } from './hooks/usePromptLibrary.js';
import { useFavoritesHandlers } from './hooks/useFavoritesHandlers.js';
import { useBatchGeneration } from './hooks/useBatchGeneration.js';
import { useQueueGeneration } from './hooks/useQueueGeneration.js';

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

  // Generation state.
  const [status, setStatus] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [resultImage, setResultImage] = useState(null);
  const [fileInfo, setFileInfo] = useState('');
  const [history, setHistory] = useState([]);
  const [generating, setGenerating] = useState(false);

  // Trivial persisted primitives kept here (rather than inside the
  // generation hooks below) because currentSettings() needs to read them and
  // handleStartBatch/handleStartQueue each need to guard on the other loop's
  // running flag — lifting just these few values avoids a circular
  // dependency between useBatchGeneration and useQueueGeneration.
  const [batchCount, setBatchCount] = useState('1');
  const [batchInterval, setBatchInterval] = useState('5');
  const [batchRunning, setBatchRunning] = useState(false);
  const [queueInterval, setQueueInterval] = useState('5');
  const [queueRunning, setQueueRunning] = useState(false);

  const {
    queueItems,
    setQueueItems,
    updateQueueItemField,
    addQueueItem,
    removeQueueItem,
    moveQueueItem,
    updateQueueItemCharacterField,
    addQueueItemCharacter,
    removeQueueItemCharacter,
  } = useQueueItems();

  const {
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
  } = useQueueTemplateDraft({ queueItems, setQueueItems, queueTemplatesList, setStatus });

  // Shared by useCharacters (キャラクター名で追加 can combine a template) and
  // usePromptLibrary (プロンプトテンプレートの適用) — both open the same
  // variable-input modal, so this one piece of state is owned by App rather
  // than either hook to avoid a circular dependency between them.
  const [templateApplyState, setTemplateApplyState] = useState(null);

  const {
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
  } = useCharacters({ chunksList, templatesList, setTemplateApplyState, setStatus });

  const { setFocusedFieldKey, resolveFocusedField, insertIntoFocused } = useFocusedField({
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    characters,
    updateCharacterField,
    queueItems,
    updateQueueItemField,
    updateQueueItemCharacterField,
  });

  const {
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
  } = usePromptLibrary({
    prompt,
    chunksList,
    templatesList,
    resolveFocusedField,
    templateApplyState,
    setTemplateApplyState,
    setStatus,
  });

  const charNameByNameRef = useRef(null);

  const {
    favArtistNameInput,
    setFavArtistNameInput,
    handleSaveFavArtist,
    favArtistEditDraft,
    setFavArtistEditDraft,
    handleSaveFavArtistEdit,
    favCharNameInput,
    setFavCharNameInput,
    favCharSeriesInput,
    setFavCharSeriesInput,
    handleSaveFavChar,
    handleToTemplateFavChar,
    favCharEditDraft,
    setFavCharEditDraft,
    handleSaveFavCharEdit,
  } = useFavoritesHandlers({
    favoriteArtists,
    favoriteCharacters,
    setStatus,
    setCharNameByName,
    setCharSeriesByName,
    setSectionState,
    charNameByNameRef,
  });

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
  }, [setQueueItems, setCharacters]);

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

  const { batchStatus, handleStartBatch, handleStopBatch } = useBatchGeneration({
    batchCount,
    batchInterval,
    batchRunning,
    setBatchRunning,
    queueRunning,
    buildGenerateParams,
    recordResult,
    currentSettings,
  });

  const { queueStatus, handleStartQueue, handleStopQueue } = useQueueGeneration({
    queueItems,
    queueInterval,
    queueRunning,
    setQueueRunning,
    batchRunning,
    buildGenerateParams,
    recordResult,
    currentSettings,
  });

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
