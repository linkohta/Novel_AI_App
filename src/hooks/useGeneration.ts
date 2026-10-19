import { useState } from 'react';
import type {
  Character,
  GenerateParamsExtra,
  HistoryItem,
  VibeTransferImage,
} from '../types/domain';
import type { GenerateImageParams, GenerateImageResult, Settings } from '../types/window-api';
import type { ModelParams } from './useModelParams';
import type { VibeTransferImageInput } from './useVibeEncoding';
import { activeCharacters } from '../utils/characters';
import { errorMessage } from '../utils/errorMessage';

interface UseGenerationParams {
  apiKey: string;
  prompt: string;
  negativePrompt: string;
  modelParams: ModelParams;
  characters: Character[];
  vibeTransferImages: VibeTransferImage[];
  encodeVibeImages: (
    images: VibeTransferImage[],
    apiKey: string,
    model: string
  ) => Promise<VibeTransferImageInput[]>;
  currentSettings: () => Settings;
  setStatus: (status: string) => void;
}

// 生成リクエストの組み立て（buildGenerateParams）・生成結果の表示と履歴
// （recordResult）・「生成する」ボタンの単発生成（handleGenerate）。
// 連続生成・複数プロンプト連続生成のフックも buildGenerateParams /
// recordResult を共有するため、両者から参照できる形で返す。
export function useGeneration({
  apiKey,
  prompt,
  negativePrompt,
  modelParams,
  characters,
  vibeTransferImages,
  encodeVibeImages,
  currentSettings,
  setStatus,
}: UseGenerationParams) {
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [fileInfo, setFileInfo] = useState('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [generating, setGenerating] = useState(false);

  // extraで上書きされた項目（複数プロンプト連続生成の行ごとのプロンプト等）を
  // 反映しつつ、AIポーションの参照画像は送信直前にモデルに応じてエンコードする。
  async function buildGenerateParams(extra?: GenerateParamsExtra): Promise<GenerateImageParams> {
    const { vibeTransferImages: extraVibeTransferImages, ...restExtra } = extra || {};
    const targetModel = restExtra.model ?? modelParams.model;
    const encodedVibeImages = await encodeVibeImages(
      extraVibeTransferImages ?? vibeTransferImages,
      apiKey,
      targetModel
    );
    return {
      apiKey,
      prompt,
      negativePrompt,
      model: modelParams.model,
      width: modelParams.width,
      height: modelParams.height,
      steps: modelParams.steps,
      scale: modelParams.scale,
      sampler: modelParams.sampler,
      seed: modelParams.seed,
      qualityToggle: modelParams.qualityToggle,
      varietyPlus: modelParams.varietyPlus,
      characterPrompts: activeCharacters(characters),
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

  // 生成履歴のサムネイルをクリックしたときの再表示。
  function showHistoryItem(item: HistoryItem) {
    setResultImage(item.dataUrl);
    setFileInfo(item.fileName);
  }

  return {
    resultImage,
    fileInfo,
    history,
    generating,
    buildGenerateParams,
    recordResult,
    handleGenerate,
    showHistoryItem,
  };
}
