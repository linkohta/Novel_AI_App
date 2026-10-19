import { ChangeEvent, Dispatch, SetStateAction } from 'react';
import {
  extractNovelAiMetadata,
  type ExtractedNovelAiMetadata as NovelAiMetadata,
} from '../utils/pngMetadata';
import type { Character, QueueItem } from '../types/domain';
import { errorMessage } from '../utils/errorMessage';
import { makeCharacter } from '../utils/characters';
import { handleSingleFile } from '../utils/fileInput';

interface UseImageMetadataLoaderParams {
  setPrompt: Dispatch<SetStateAction<string>>;
  setNegativePrompt: Dispatch<SetStateAction<string>>;
  setSteps: Dispatch<SetStateAction<string>>;
  setScale: Dispatch<SetStateAction<string>>;
  setSampler: Dispatch<SetStateAction<string>>;
  setSeed: Dispatch<SetStateAction<string>>;
  setWidth: Dispatch<SetStateAction<string>>;
  setHeight: Dispatch<SetStateAction<string>>;
  setQualityToggle: Dispatch<SetStateAction<boolean>>;
  setCharacters: Dispatch<SetStateAction<Character[]>>;
  setQueueItems: Dispatch<SetStateAction<QueueItem[]>>;
  setStatus: (status: string) => void;
}

// 「プロンプト」セクションおよび「複数プロンプト連続生成」の各行にある、NovelAI
// 生成PNGからのプロンプト読み込みハンドラ。抽出したプロンプト・ネガティブ
// プロンプトは実際の生成で送信された値であり、自動追加されたQuality Tags
// が含まれている場合はすでにそれを含んでいるため、いずれのハンドラも
// 読み込み後にQuality Tagsの自動追加トグルをOFFにする。
export function useImageMetadataLoader({
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
}: UseImageMetadataLoaderParams) {
  // 読み込み結果のステータス文言。Sourceチャンクのモデル情報は参考表示のみ
  // （full/curated等を正確に判別できないためモデルは自動設定しない）。
  function loadedMessage(prefix: string, meta: NovelAiMetadata): string {
    return meta.sourceInfo
      ? `${prefix}画像からプロンプト情報を読み込みました（元モデル情報: ${meta.sourceInfo}。モデルの種類はこの情報からは正確に判別できないため、必要に応じて「モデル」セクションで選び直してください）`
      : `${prefix}画像からプロンプト情報を読み込みました`;
  }

  // 選択されたPNGから生成情報を取り出してapplyに渡し、結果（または失敗）を
  // ステータスに表示する。2つのハンドラで共通の、ファイル取り出し・解析・
  // エラー処理をまとめたもの。
  function loadMetadataFrom(
    e: ChangeEvent<HTMLInputElement>,
    apply: (meta: NovelAiMetadata) => string
  ) {
    handleSingleFile(e, async (file) => {
      try {
        const meta = await extractNovelAiMetadata(file);
        if (!meta) {
          setStatus('この画像からNovelAIの生成情報を読み取れませんでした');
          return;
        }
        setStatus(apply(meta));
      } catch (err) {
        setStatus(`画像の読み込みに失敗しました: ${errorMessage(err)}`);
      }
    });
  }

  function handleLoadImageMetadata(e: ChangeEvent<HTMLInputElement>) {
    loadMetadataFrom(e, (meta) => {
      setPrompt(meta.prompt);
      setNegativePrompt(meta.negativePrompt);
      if (meta.steps) setSteps(meta.steps);
      if (meta.scale) setScale(meta.scale);
      if (meta.sampler) setSampler(meta.sampler);
      if (meta.seed) setSeed(meta.seed);
      if (meta.width) setWidth(String(meta.width));
      if (meta.height) setHeight(String(meta.height));
      setQualityToggle(false);
      if (meta.characters.length > 0) {
        setCharacters(meta.characters.map((c) => makeCharacter(c)));
      }
      return loadedMessage('', meta);
    });
  }

  function handleLoadQueueItemImageMetadata(index: number, e: ChangeEvent<HTMLInputElement>) {
    loadMetadataFrom(e, (meta) => {
      setQueueItems((prev) =>
        prev.map((item, i) =>
          i === index
            ? {
                ...item,
                prompt: meta.prompt,
                negativePrompt: meta.negativePrompt,
                characters: meta.characters.map((c) => makeCharacter(c)),
              }
            : item
        )
      );
      // モデル・サイズ・Quality Tagsの自動追加設定は行ごとではなく共通設定
      // （左パネルの「モデル」セクション）を使うため、単一プロンプト用の読み
      // 込みと同様にここでもQuality Tagsの自動追加をOFFにしておく。
      setQualityToggle(false);
      return loadedMessage(`${index + 1}行目に`, meta);
    });
  }

  return { handleLoadImageMetadata, handleLoadQueueItemImageMetadata };
}
