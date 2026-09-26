import { useRef, useState } from 'react';
import PromptSection from './components/PromptSection';
import CharactersSection from './components/CharactersSection';
import VibeTransferSection from './components/VibeTransferSection';
import ModelSection from './components/ModelSection';
import BatchSection from './components/BatchSection';
import PromptQueueSection from './components/PromptQueueSection';
import ResultPanel from './components/ResultPanel';
import AppModals from './components/AppModals';
import ManagementModal from './components/ManagementModal';
import TabBar from './components/TabBar';
import SettingsTab from './components/SettingsTab';
import { useNamedList } from './hooks/useNamedList';
import { useFavoritesList } from './hooks/useFavoritesList';
import { useQueueItems } from './hooks/useQueueItems';
import { useQueueTemplateDraft } from './hooks/useQueueTemplateDraft';
import { useCharacters } from './hooks/useCharacters';
import { useVibeTransfer } from './hooks/useVibeTransfer';
import { useVibeEncoding } from './hooks/useVibeEncoding';
import { useFocusedField } from './hooks/useFocusedField';
import { usePromptLibrary } from './hooks/usePromptLibrary';
import { useFavoritesHandlers } from './hooks/useFavoritesHandlers';
import { useBatchGeneration } from './hooks/useBatchGeneration';
import { useQueueGeneration } from './hooks/useQueueGeneration';
import { useSettingsPersistence } from './hooks/useSettingsPersistence';
import { useImageMetadataLoader } from './hooks/useImageMetadataLoader';
import { errorMessage } from './utils/errorMessage';
import { handleSingleFile } from './utils/fileInput';
import type {
  FavoriteArtist,
  FavoriteCharacter,
  GenerateParamsExtra,
  HistoryItem,
  NamedItem,
  QueueTemplate,
  QueueTemplateDraftRow,
  SectionState,
  TemplateApplyState,
} from './types/domain';
import type {
  GenerateImageParams,
  GenerateImageResult,
  SubscriptionInfo,
} from './types/window-api';

const DEFAULT_SECTION_STATE: SectionState = {
  promptSection: true,
  characterSection: true,
  batchSection: false,
  promptQueueSection: false,
  vibeSection: false,
};

const TAB_ITEMS = [
  { key: 'settings', label: '設定' },
  { key: 'prompt', label: 'プロンプト' },
  { key: 'model', label: 'モデル' },
  { key: 'batch', label: '連続生成' },
];

export default function App() {
  // 永続化される設定。
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
  const [varietyPlus, setVarietyPlus] = useState(false);
  const [outputDir, setOutputDir] = useState('');
  const [sectionState, setSectionState] = useState<SectionState>(DEFAULT_SECTION_STATE);
  const [activeTab, setActiveTab] = useState('prompt');

  // 使用頻度の低い管理系（チャンク／テンプレート／お気に入り編集）は左パネルを
  // 圧迫しないよう別モーダルへ切り出しており、開閉はここでのみ管理する
  // （永続化はしない。次回起動時は常に閉じた状態から始まる）。
  const [managementModalOpen, setManagementModalOpen] = useState(false);

  // 永続化しない（旧アプリと同様、シードは常に0/ランダムから開始する）。
  const [seed, setSeed] = useState('0');

  // プロンプトチャンク／テンプレート／お気に入りのリスト。
  const chunksList = useNamedList<NamedItem, { name: string; text: string }>({
    load: window.api.loadChunks,
    save: window.api.saveChunk,
    update: window.api.updateChunk,
    remove: window.api.deleteChunk,
  });
  const templatesList = useNamedList<NamedItem, { name: string; text: string }>({
    load: window.api.loadTemplates,
    save: window.api.saveTemplate,
    update: window.api.updateTemplate,
    remove: window.api.deleteTemplate,
  });

  // window.apiの複数プロンプトテンプレートCRUDは項目形式が可変な緩い型
  // （GenericListItem）を返すため、ここ（IPC境界）でUI側の型へ読み替える。
  const queueTemplatesList = useNamedList<
    QueueTemplate,
    { name: string; rows: QueueTemplateDraftRow[] }
  >({
    load: window.api.loadQueueTemplates as () => Promise<QueueTemplate[]>,
    save: window.api.saveQueueTemplate as (item: {
      name: string;
      rows: QueueTemplateDraftRow[];
    }) => Promise<QueueTemplate[]>,
    update: window.api.updateQueueTemplate as (item: QueueTemplate) => Promise<QueueTemplate[]>,
    remove: window.api.deleteQueueTemplate as (id: string) => Promise<QueueTemplate[]>,
  });
  const favoriteArtists = useFavoritesList<FavoriteArtist>('artist');
  const favoriteCharacters = useFavoritesList<FavoriteCharacter>('character');

  // 生成の状態。
  const [status, setStatus] = useState('');
  const [subscriptionInfo, setSubscriptionInfo] = useState<SubscriptionInfo | null>(null);
  const [subscriptionStatus, setSubscriptionStatus] = useState('');
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generating, setGenerating] = useState(false);

  // 単純で永続化される値は（以下の生成用フックの中ではなく）ここに保持
  // している。currentSettings() がこれらを読み取る必要があり、かつ
  // handleStartBatch/handleStartQueue はそれぞれもう一方のループの
  // runningフラグを見てガードする必要があるため——これら少数の値だけを
  // 引き上げておくことで、useBatchGeneration と useQueueGeneration の間の
  // 循環依存を避けている。
  const [batchCount, setBatchCount] = useState('1');
  const [batchInterval, setBatchInterval] = useState('5');
  const [batchRunning, setBatchRunning] = useState(false);
  const [queueInterval, setQueueInterval] = useState('5');
  const [queueRunning, setQueueRunning] = useState(false);

  const {
    queueItems,
    setQueueItems,
    bulkCount,
    setBulkCount,
    applyBulkCount,
    updateQueueItemField,
    addQueueItem,
    removeQueueItem,
    clearQueueItems,
    moveQueueItem,
    updateQueueItemCharacterField,
    addQueueItemCharacter,
    removeQueueItemCharacter,
    addQueueItemVibeTransferImage,
    addQueueItemVibeTransferSetFile,
    removeQueueItemVibeTransferImage,
    balanceQueueItemVibeTransferStrengths,
    updateQueueItemVibeTransferField,
    applyBulkVibeTransferImage,
    applyBulkVibeTransferSetFile,
  } = useQueueItems(setStatus);

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
    handleExportQueueTemplate,
    handleImportQueueTemplateFiles,
    handleApplyQueueTemplate,
    handleQueueTemplateApplyConfirm,
  } = useQueueTemplateDraft({ queueItems, setQueueItems, queueTemplatesList, setStatus });

  // useCharacters（キャラクター名で追加 でテンプレートを組み合わせられる）と
  // usePromptLibrary（プロンプトテンプレートの適用）の両方で共有される——
  // どちらも同じ変数入力モーダルを開くため、この1つの状態はどちらかの
  // フックではなくApp側が保持することで、両者の間の循環依存を避けている。
  const [templateApplyState, setTemplateApplyState] = useState<TemplateApplyState | null>(null);

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

  const {
    vibeTransferImages,
    setVibeTransferImages,
    addVibeTransferImage,
    addVibeTransferSetFile,
    removeVibeTransferImage,
    updateVibeTransferImageField,
    balanceVibeTransferStrengths,
  } = useVibeTransfer(setStatus);

  const { encodeVibeImages } = useVibeEncoding(setStatus);

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
    handleExportTemplate,
    handleImportTemplateFiles,
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

  const charNameByNameRef = useRef<HTMLInputElement>(null);

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
    onNavigateToCharacters: () => {
      setActiveTab('prompt');
      setManagementModalOpen(false);
    },
  });

  const { currentSettings, handleChooseOutputDir } = useSettingsPersistence({
    apiKey,
    setApiKey,
    prompt,
    setPrompt,
    negativePrompt,
    setNegativePrompt,
    model,
    setModel,
    width,
    setWidth,
    height,
    setHeight,
    steps,
    setSteps,
    scale,
    setScale,
    sampler,
    setSampler,
    qualityToggle,
    setQualityToggle,
    varietyPlus,
    setVarietyPlus,
    outputDir,
    setOutputDir,
    characters,
    setCharacters,
    vibeTransferImages,
    setVibeTransferImages,
    sectionState,
    setSectionState,
    queueItems,
    setQueueItems,
    batchCount,
    setBatchCount,
    batchInterval,
    setBatchInterval,
    queueInterval,
    setQueueInterval,
    activeTab,
    setActiveTab,
  });

  const { handleLoadImageMetadata, handleLoadQueueItemImageMetadata } = useImageMetadataLoader({
    setPrompt,
    setNegativePrompt,
    setSteps,
    setScale,
    setSampler,
    setSeed,
    setWidth,
    setHeight,
    setQualityToggle,
    setCharacters,
    setQueueItems,
    setStatus,
  });

  async function handleCheckSubscription() {
    setSubscriptionStatus('確認中...');
    setSubscriptionInfo(null);
    try {
      const info = await window.api.getSubscriptionInfo(apiKey);
      setSubscriptionInfo(info);
      setSubscriptionStatus('');
    } catch (err) {
      setSubscriptionStatus(`エラー: ${errorMessage(err)}`);
    }
  }

  function handleSectionToggle(id: string, isOpen: boolean) {
    setSectionState((prev) => ({ ...prev, [id]: isOpen }));
  }

  async function buildGenerateParams(extra?: GenerateParamsExtra): Promise<GenerateImageParams> {
    const { vibeTransferImages: extraVibeTransferImages, ...restExtra } = extra || {};
    const targetModel = restExtra.model ?? model;
    const encodedVibeImages = await encodeVibeImages(
      extraVibeTransferImages ?? vibeTransferImages,
      apiKey,
      targetModel
    );
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
      varietyPlus,
      characterPrompts: characters.filter((c) => c.enabled !== false && c.prompt?.trim()),
      vibeTransferImages: encodedVibeImages,
      ...restExtra,
    };
  }

  function recordResult(result: GenerateImageResult) {
    setResultImage(result.dataUrl);
    setFileInfo(`${result.fileName} (seed: ${result.seed})`);
    setHistory((prev) => [result, ...prev]);
  }

  async function handleGenerate() {
    window.api.saveSettings(currentSettings());
    setGenerating(true);
    setStatus('生成中...');
    try {
      const result = await window.api.generateImage(await buildGenerateParams());
      recordResult(result);
      setStatus(`保存しました: ${result.filePath}`);
    } catch (err) {
      setStatus(`エラー: ${errorMessage(err)}`);
    } finally {
      setGenerating(false);
    }
  }

  const { batchStatus, handleStartBatch, handleStopBatch } = useBatchGeneration({
    batchCount,
    batchInterval,
    setBatchRunning,
    queueRunning,
    buildGenerateParams,
    recordResult,
    currentSettings,
  });

  const { queueStatus, handleStartQueue, handleStopQueue } = useQueueGeneration({
    queueItems,
    queueInterval,
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
        <TabBar items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />

        <button
          type="button"
          className="secondary manage-open-button"
          onClick={() => setManagementModalOpen(true)}
        >
          チャンク・テンプレート・お気に入りを管理...
        </button>

        <div className="tab-panel" hidden={activeTab !== 'settings'}>
          <SettingsTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            onCheckSubscription={handleCheckSubscription}
            subscriptionStatus={subscriptionStatus}
            subscriptionInfo={subscriptionInfo}
            outputDir={outputDir}
            onChooseOutputDir={handleChooseOutputDir}
            onResetOutputDir={() => setOutputDir('')}
            onLoadImageMetadata={handleLoadImageMetadata}
          />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'prompt'}>
          <PromptSection
            open={!!sectionState.promptSection}
            onToggle={handleSectionToggle}
            prompt={prompt}
            setPrompt={setPrompt}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
            onFocusField={setFocusedFieldKey}
          />

          <CharactersSection
            open={!!sectionState.characterSection}
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

          <VibeTransferSection
            open={!!sectionState.vibeSection}
            onToggle={handleSectionToggle}
            vibeTransferImages={vibeTransferImages}
            onAddImage={(e) => handleSingleFile(e, addVibeTransferImage)}
            onAddSetFile={(e) => handleSingleFile(e, addVibeTransferSetFile)}
            onRemoveImage={removeVibeTransferImage}
            onChangeImageField={updateVibeTransferImageField}
            onBalanceStrengths={balanceVibeTransferStrengths}
          />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'model'}>
          <ModelSection
            open
            onToggle={() => {}}
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
            varietyPlus={varietyPlus}
            setVarietyPlus={setVarietyPlus}
          />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'batch'}>
          <BatchSection
            open={!!sectionState.batchSection}
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
            open={!!sectionState.promptQueueSection}
            onToggle={handleSectionToggle}
            queueItems={queueItems}
            bulkCount={bulkCount}
            setBulkCount={setBulkCount}
            onApplyBulkCount={applyBulkCount}
            onApplyBulkVibeTransferImage={(e) => handleSingleFile(e, applyBulkVibeTransferImage)}
            onApplyBulkVibeTransferSetFile={(e) =>
              handleSingleFile(e, applyBulkVibeTransferSetFile)
            }
            onChangeItem={updateQueueItemField}
            onRemoveItem={removeQueueItem}
            onMoveItemUp={(index) => moveQueueItem(index, -1)}
            onMoveItemDown={(index) => moveQueueItem(index, 1)}
            onAddItem={addQueueItem}
            onClearItems={() => {
              if (window.confirm('複数プロンプト連続生成のリストをすべて削除しますか？')) {
                clearQueueItems();
              }
            }}
            onAddItemCharacter={addQueueItemCharacter}
            onRemoveItemCharacter={removeQueueItemCharacter}
            onChangeItemCharacter={updateQueueItemCharacterField}
            onLoadItemImageMetadata={handleLoadQueueItemImageMetadata}
            onAddItemVibeTransferImage={(index, e) =>
              handleSingleFile(e, (file) => addQueueItemVibeTransferImage(index, file))
            }
            onAddItemVibeTransferSetFile={(index, e) =>
              handleSingleFile(e, (file) => addQueueItemVibeTransferSetFile(index, file))
            }
            onRemoveItemVibeTransferImage={removeQueueItemVibeTransferImage}
            onBalanceItemVibeTransferStrengths={balanceQueueItemVibeTransferStrengths}
            onChangeItemVibeTransferField={updateQueueItemVibeTransferField}
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
            onExportQueueTemplate={handleExportQueueTemplate}
            onImportQueueTemplateFiles={handleImportQueueTemplateFiles}
          />
        </div>

        <div className="generate-sticky">
          <button
            onClick={handleGenerate}
            disabled={generating || batchRunning || queueRunning}
            hidden={activeTab !== 'prompt'}
          >
            生成する
          </button>
          <button className="secondary" onClick={() => window.api.openOutputFolder()}>
            {openFolderLabel}
          </button>
          <div id="status">{status}</div>
        </div>
      </div>

      <ResultPanel
        resultImage={resultImage || ''}
        fileInfo={fileInfo}
        history={history}
        onSelectHistory={(item) => {
          setResultImage(item.dataUrl);
          setFileInfo(item.fileName);
        }}
      />

      <ManagementModal
        open={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
        chunks={chunksList.items}
        chunkNameInput={chunkNameInput}
        setChunkNameInput={setChunkNameInput}
        onSaveChunk={handleSaveChunk}
        onInsertChunk={(chunk) => insertIntoFocused(chunk.text)}
        onEditChunk={(chunk) => setChunkEditDraft({ ...chunk })}
        onDeleteChunk={(id) => chunksList.removeItem(id)}
        templates={templatesList.items}
        templateNameInput={templateNameInput}
        setTemplateNameInput={setTemplateNameInput}
        templateTextInput={templateTextInput}
        setTemplateTextInput={setTemplateTextInput}
        onSaveTemplate={handleSaveTemplate}
        onApplyTemplate={handleApplyTemplate}
        onEditTemplate={(template) => setTemplateEditDraft({ ...template })}
        onDeleteTemplate={(id) => templatesList.removeItem(id)}
        onExportTemplate={handleExportTemplate}
        onImportTemplateFiles={handleImportTemplateFiles}
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

      <AppModals
        chunkEditDraft={chunkEditDraft}
        setChunkEditDraft={setChunkEditDraft}
        handleSaveChunkEdit={handleSaveChunkEdit}
        templateEditDraft={templateEditDraft}
        setTemplateEditDraft={setTemplateEditDraft}
        handleSaveTemplateEdit={handleSaveTemplateEdit}
        templateApplyState={templateApplyState}
        setTemplateApplyState={setTemplateApplyState}
        handleTemplateApplyConfirm={handleTemplateApplyConfirm}
        queueTemplateDraft={queueTemplateDraft}
        setQueueTemplateDraft={setQueueTemplateDraft}
        updateQueueTemplateDraftRow={updateQueueTemplateDraftRow}
        updateQueueTemplateDraftCharacter={updateQueueTemplateDraftCharacter}
        addQueueTemplateDraftRow={addQueueTemplateDraftRow}
        removeQueueTemplateDraftRow={removeQueueTemplateDraftRow}
        addQueueTemplateDraftCharacter={addQueueTemplateDraftCharacter}
        removeQueueTemplateDraftCharacter={removeQueueTemplateDraftCharacter}
        handleSaveQueueTemplate={handleSaveQueueTemplate}
        queueTemplateApplyState={queueTemplateApplyState}
        setQueueTemplateApplyState={setQueueTemplateApplyState}
        handleQueueTemplateApplyConfirm={handleQueueTemplateApplyConfirm}
        favArtistEditDraft={favArtistEditDraft}
        setFavArtistEditDraft={setFavArtistEditDraft}
        handleSaveFavArtistEdit={handleSaveFavArtistEdit}
        favCharEditDraft={favCharEditDraft}
        setFavCharEditDraft={setFavCharEditDraft}
        handleSaveFavCharEdit={handleSaveFavCharEdit}
      />
    </>
  );
}
