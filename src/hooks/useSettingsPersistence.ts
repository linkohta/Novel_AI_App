import { Dispatch, SetStateAction, useCallback, useEffect, useState } from 'react';
import type { Character, QueueItem, SectionState } from '../types/domain';

interface UseSettingsPersistenceParams {
  apiKey: string;
  setApiKey: Dispatch<SetStateAction<string>>;
  prompt: string;
  setPrompt: Dispatch<SetStateAction<string>>;
  negativePrompt: string;
  setNegativePrompt: Dispatch<SetStateAction<string>>;
  model: string;
  setModel: Dispatch<SetStateAction<string>>;
  width: string;
  setWidth: Dispatch<SetStateAction<string>>;
  height: string;
  setHeight: Dispatch<SetStateAction<string>>;
  steps: string;
  setSteps: Dispatch<SetStateAction<string>>;
  scale: string;
  setScale: Dispatch<SetStateAction<string>>;
  sampler: string;
  setSampler: Dispatch<SetStateAction<string>>;
  qualityToggle: boolean;
  setQualityToggle: Dispatch<SetStateAction<boolean>>;
  outputDir: string;
  setOutputDir: Dispatch<SetStateAction<string>>;
  characters: Character[];
  setCharacters: Dispatch<SetStateAction<Character[]>>;
  sectionState: SectionState;
  setSectionState: Dispatch<SetStateAction<SectionState>>;
  queueItems: QueueItem[];
  setQueueItems: Dispatch<SetStateAction<QueueItem[]>>;
  batchCount: string;
  setBatchCount: Dispatch<SetStateAction<string>>;
  batchInterval: string;
  setBatchInterval: Dispatch<SetStateAction<string>>;
  queueInterval: string;
  setQueueInterval: Dispatch<SetStateAction<string>>;
}

// 画面に表示されているフォーム入力全般（APIキー・プロンプト・モデル設定・
// キャラクタープロンプト・複数プロンプト連続生成のリスト・各セクションの
// 折りたたみ状態など）を起動時に settings.json から読み込み、変更のたびに
// デバウンスして自動保存するロジック。旧アプリの「ユーザーが編集をやめて
// から少し経ったら保存する」という挙動を、各フィールドごとに保存呼び出しを
// 配線することなく再現している。
export function useSettingsPersistence({
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
  outputDir,
  setOutputDir,
  characters,
  setCharacters,
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
}: UseSettingsPersistenceParams) {
  const [settingsLoaded, setSettingsLoaded] = useState(false);

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
        // 古い保存済み設定はキャラクターごとのid（Reactのリストキーとして
        // 使用）より前のものなので、既存のキャラクターにも安定したキーが
        // つくように補完する。
        setCharacters(
          settings.characters.map((c: Character) =>
            c.id ? c : { ...c, id: window.crypto.randomUUID() }
          )
        );
      }
      if (Array.isArray(settings.queueItems) && settings.queueItems.length > 0) {
        // 古い保存済み設定は行ごと/キャラクターごとのidより前のものなので、
        // 既存の行にも安定したキーがつくように補完する。
        setQueueItems(
          settings.queueItems.map((item: QueueItem) => ({
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
    // 起動時に1回だけ読み込む処理であり、setXxx群はすべてApp.jsx側の
    // useStateが返す安定した関数（呼び出し元をまたいでも同一性が変わらない）
    // なので依存配列には含めない。setQueueItems/setCharactersのみ、その値を
    // 読み込み後の補完処理内で直接参照しているため明示している。
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  useEffect(() => {
    if (!settingsLoaded) return undefined;
    const id = setTimeout(() => window.api.saveSettings(currentSettings()), 300);
    return () => clearTimeout(id);
  }, [settingsLoaded, currentSettings]);

  async function handleChooseOutputDir() {
    const dir = await window.api.chooseOutputFolder();
    if (dir) setOutputDir(dir);
  }

  return { settingsLoaded, currentSettings, handleChooseOutputDir };
}
