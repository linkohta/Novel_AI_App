import { useRef, useState } from 'react';
import ModelSection from './components/ModelSection';
import ResultPanel from './components/ResultPanel';
import AppModals from './components/AppModals';
import ManagementModal from './components/ManagementModal';
import TabBar from './components/TabBar';
import SettingsTab from './components/SettingsTab';
import PromptTab from './components/PromptTab';
import BatchTab from './components/BatchTab';
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
import { useModelParams } from './hooks/useModelParams';
import { useGeneration } from './hooks/useGeneration';
import { useSubscriptionInfo } from './hooks/useSubscriptionInfo';
import { favoriteArtistText, favoriteCharacterText } from './utils/favorites';
import type {
  FavoriteArtist,
  FavoriteCharacter,
  NamedItem,
  QueueTemplate,
  QueueTemplateDraftRow,
  SectionState,
  TemplateApplyState,
} from './types/domain';

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

// トップレベルコンポーネント。各機能のstate・ハンドラはsrc/hooks/のカスタム
// フックが持ち、ここではフック同士の配線と、左パネル（タブ）・結果パネル・
// モーダル群のJSXの組み立てだけを行う。
export default function App() {
  // 永続化される単純な入力値（まとまった機能を持たないものだけをここに置く）。
  const [apiKey, setApiKey] = useState('');
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [outputDir, setOutputDir] = useState('');
  const [sectionState, setSectionState] = useState<SectionState>(DEFAULT_SECTION_STATE);
  const [activeTab, setActiveTab] = useState('prompt');
  const modelParams = useModelParams();

  // 画面下部のステータス表示。ほぼすべてのフックがエラー・結果の通知に使う横断的な状態。
  const [status, setStatus] = useState('');

  // 使用頻度の低い管理系（チャンク／テンプレート／お気に入り編集）は左パネルを
  // 圧迫しないよう別モーダルへ切り出しており、開閉はここでのみ管理する
  // （永続化はしない。次回起動時は常に閉じた状態から始まる）。
  const [managementModalOpen, setManagementModalOpen] = useState(false);

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
  const [queueFolderName, setQueueFolderName] = useState('');
  const [queueRunning, setQueueRunning] = useState(false);

  const queueApi = useQueueItems(setStatus);
  const { queueItems, setQueueItems, updateQueueItemField, updateQueueItemCharacterField } =
    queueApi;

  const queueTemplateApi = useQueueTemplateDraft({
    queueItems,
    setQueueItems,
    queueTemplatesList,
    setStatus,
  });

  // useCharacters（キャラクター名で追加 でテンプレートを組み合わせられる）と
  // usePromptLibrary（プロンプトテンプレートの適用）の両方で共有される——
  // どちらも同じ変数入力モーダルを開くため、この1つの状態はどちらかの
  // フックではなくApp側が保持することで、両者の間の循環依存を避けている。
  const [templateApplyState, setTemplateApplyState] = useState<TemplateApplyState | null>(null);

  const charactersApi = useCharacters({
    chunksList,
    templatesList,
    setTemplateApplyState,
    setStatus,
  });
  const { characters, setCharacters, updateCharacterField } = charactersApi;

  const vibeApi = useVibeTransfer(setStatus);
  const { vibeTransferImages, setVibeTransferImages } = vibeApi;

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

  const promptLibrary = usePromptLibrary({
    prompt,
    chunksList,
    templatesList,
    resolveFocusedField,
    templateApplyState,
    setTemplateApplyState,
    setStatus,
  });

  const charNameByNameRef = useRef<HTMLInputElement>(null);

  const favorites = useFavoritesHandlers({
    favoriteArtists,
    favoriteCharacters,
    setStatus,
    setCharNameByName: charactersApi.setCharNameByName,
    setCharSeriesByName: charactersApi.setCharSeriesByName,
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
    ...modelParams,
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
    queueFolderName,
    setQueueFolderName,
    activeTab,
    setActiveTab,
  });

  const { handleLoadImageMetadata, handleLoadQueueItemImageMetadata } = useImageMetadataLoader({
    setPrompt,
    setNegativePrompt,
    setSteps: modelParams.setSteps,
    setScale: modelParams.setScale,
    setSampler: modelParams.setSampler,
    setSeed: modelParams.setSeed,
    setWidth: modelParams.setWidth,
    setHeight: modelParams.setHeight,
    setQualityToggle: modelParams.setQualityToggle,
    setCharacters,
    setQueueItems,
    setStatus,
  });

  const { subscriptionInfo, subscriptionStatus, handleCheckSubscription } = useSubscriptionInfo();

  const {
    resultImage,
    fileInfo,
    history,
    generating,
    buildGenerateParams,
    recordResult,
    handleGenerate,
    showHistoryItem,
  } = useGeneration({
    apiKey,
    prompt,
    negativePrompt,
    modelParams,
    characters,
    vibeTransferImages,
    encodeVibeImages,
    currentSettings,
    setStatus,
  });

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
    queueFolderName,
    setQueueRunning,
    batchRunning,
    buildGenerateParams,
    recordResult,
    currentSettings,
  });

  function handleSectionToggle(id: string, isOpen: boolean) {
    setSectionState((prev) => ({ ...prev, [id]: isOpen }));
  }

  return (
    <>
      <div className="panel left">
        {/* タブバーと管理ボタンはパネルをスクロールしても常に操作できるよう上端に固定する。 */}
        <div className="left-top-sticky">
          <TabBar items={TAB_ITEMS} activeKey={activeTab} onChange={setActiveTab} />
          <button
            type="button"
            className="secondary manage-open-button"
            onClick={() => setManagementModalOpen(true)}
          >
            チャンク・テンプレート・お気に入りを管理...
          </button>
        </div>

        <div className="tab-panel" hidden={activeTab !== 'settings'}>
          <SettingsTab
            apiKey={apiKey}
            setApiKey={setApiKey}
            onCheckSubscription={() => handleCheckSubscription(apiKey)}
            subscriptionStatus={subscriptionStatus}
            subscriptionInfo={subscriptionInfo}
            outputDir={outputDir}
            onChooseOutputDir={handleChooseOutputDir}
            onResetOutputDir={() => setOutputDir('')}
          />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'prompt'}>
          <PromptTab
            sectionState={sectionState}
            onSectionToggle={handleSectionToggle}
            prompt={prompt}
            setPrompt={setPrompt}
            negativePrompt={negativePrompt}
            setNegativePrompt={setNegativePrompt}
            seed={modelParams.seed}
            setSeed={modelParams.setSeed}
            onFocusField={setFocusedFieldKey}
            onLoadImageMetadata={handleLoadImageMetadata}
            charactersApi={charactersApi}
            chunks={chunksList.items}
            templates={templatesList.items}
            nameInputRef={charNameByNameRef}
            vibeApi={vibeApi}
          />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'model'}>
          <ModelSection open onToggle={() => {}} {...modelParams} />
        </div>

        <div className="tab-panel" hidden={activeTab !== 'batch'}>
          <BatchTab
            sectionState={sectionState}
            onSectionToggle={handleSectionToggle}
            batchCount={batchCount}
            setBatchCount={setBatchCount}
            batchInterval={batchInterval}
            setBatchInterval={setBatchInterval}
            batchRunning={batchRunning}
            batchStatus={batchStatus}
            onStartBatch={handleStartBatch}
            onStopBatch={handleStopBatch}
            queueApi={queueApi}
            queueTemplateApi={queueTemplateApi}
            queueTemplates={queueTemplatesList.items}
            onDeleteQueueTemplate={queueTemplatesList.removeItem}
            queueInterval={queueInterval}
            setQueueInterval={setQueueInterval}
            queueFolderName={queueFolderName}
            setQueueFolderName={setQueueFolderName}
            queueRunning={queueRunning}
            queueStatus={queueStatus}
            onStartQueue={handleStartQueue}
            onStopQueue={handleStopQueue}
            onFocusField={setFocusedFieldKey}
            onLoadQueueItemImageMetadata={handleLoadQueueItemImageMetadata}
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
            保存フォルダを開く
          </button>
          <div id="status">{status}</div>
        </div>
      </div>

      <ResultPanel
        resultImage={resultImage || ''}
        fileInfo={fileInfo}
        history={history}
        onSelectHistory={showHistoryItem}
      />

      <ManagementModal
        open={managementModalOpen}
        onClose={() => setManagementModalOpen(false)}
        chunks={chunksList.items}
        chunkNameInput={promptLibrary.chunkNameInput}
        setChunkNameInput={promptLibrary.setChunkNameInput}
        onSaveChunk={promptLibrary.handleSaveChunk}
        onInsertChunk={(chunk) => insertIntoFocused(chunk.text)}
        onEditChunk={(chunk) => promptLibrary.setChunkEditDraft({ ...chunk })}
        onDeleteChunk={(id) => chunksList.removeItem(id)}
        templates={templatesList.items}
        templateNameInput={promptLibrary.templateNameInput}
        setTemplateNameInput={promptLibrary.setTemplateNameInput}
        templateTextInput={promptLibrary.templateTextInput}
        setTemplateTextInput={promptLibrary.setTemplateTextInput}
        onSaveTemplate={promptLibrary.handleSaveTemplate}
        onApplyTemplate={promptLibrary.handleApplyTemplate}
        onEditTemplate={(template) => promptLibrary.setTemplateEditDraft({ ...template })}
        onDeleteTemplate={(id) => templatesList.removeItem(id)}
        onExportTemplate={promptLibrary.handleExportTemplate}
        onImportTemplateFiles={promptLibrary.handleImportTemplateFiles}
        favArtists={favoriteArtists.items}
        favArtistNameInput={favorites.favArtistNameInput}
        setFavArtistNameInput={favorites.setFavArtistNameInput}
        onSaveFavArtist={favorites.handleSaveFavArtist}
        onInsertFavArtist={(fav) => insertIntoFocused(favoriteArtistText(fav))}
        onEditFavArtist={(fav) => favorites.setFavArtistEditDraft({ ...fav })}
        onDeleteFavArtist={(id) => favoriteArtists.removeItem(id)}
        favChars={favoriteCharacters.items}
        favCharNameInput={favorites.favCharNameInput}
        setFavCharNameInput={favorites.setFavCharNameInput}
        favCharSeriesInput={favorites.favCharSeriesInput}
        setFavCharSeriesInput={favorites.setFavCharSeriesInput}
        onSaveFavChar={favorites.handleSaveFavChar}
        onInsertFavChar={(fav) => insertIntoFocused(favoriteCharacterText(fav))}
        onToTemplateFavChar={favorites.handleToTemplateFavChar}
        onEditFavChar={(fav) => favorites.setFavCharEditDraft({ ...fav })}
        onDeleteFavChar={(id) => favoriteCharacters.removeItem(id)}
      />

      <AppModals
        promptLibrary={promptLibrary}
        templateApplyState={templateApplyState}
        setTemplateApplyState={setTemplateApplyState}
        queueTemplateApi={queueTemplateApi}
        favorites={favorites}
      />
    </>
  );
}
