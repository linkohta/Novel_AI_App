import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { waitWithCountdown } from '../utils/sleep';
import type { GenerateParamsExtra, QueueItem } from '../types/domain';
import type { GenerateImageParams, GenerateImageResult, Settings } from '../types/window-api';
import { errorMessage } from '../utils/errorMessage';
import { clampCount, parseIntervalSec } from '../utils/numbers';
import { activeCharacters } from '../utils/characters';

interface UseQueueGenerationParams {
  queueItems: QueueItem[];
  queueInterval: string;
  setQueueRunning: Dispatch<SetStateAction<boolean>>;
  batchRunning: boolean;
  buildGenerateParams: (extra?: GenerateParamsExtra) => Promise<GenerateImageParams>;
  recordResult: (result: GenerateImageResult) => void;
  currentSettings: () => Settings;
}

// 「複数プロンプト連続生成」のループ：queue-itemsのリストを上から順に走査し、
// 各行のプロンプトを`count`回、生成の間に待機を挟みながら生成し、
// （全行にわたる）すべての画像を1つの共有`queue_<timestamp>/`フォルダに
// 保存する。単一プロンプトの連続生成ループと同時実行されないようガードして
// いる（useBatchGeneration.ts参照）。
export function useQueueGeneration({
  queueItems,
  queueInterval,
  setQueueRunning,
  batchRunning,
  buildGenerateParams,
  recordResult,
  currentSettings,
}: UseQueueGenerationParams) {
  const [queueStatus, setQueueStatus] = useState('');
  const queueStopRef = useRef(false);

  async function handleStartQueue() {
    if (batchRunning) return;
    window.api.saveSettings(currentSettings());
    const intervalSec = parseIntervalSec(queueInterval);
    const items = queueItems
      .map((item) => ({ ...item, count: clampCount(item.count) }))
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
      const itemCharacterPrompts = activeCharacters(item.characters);
      const itemVibeTransferImages = item.vibeTransferImages || [];

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
            await buildGenerateParams({
              prompt: item.prompt,
              negativePrompt: item.negativePrompt,
              characterPrompts: itemCharacterPrompts,
              vibeTransferImages: itemVibeTransferImages,
              batchFolder: queueFolder,
              // 連続生成と同様、毎回ランダムなシードで生成する（0=ランダム）。
              seed: 0,
            })
          );
          recordResult(result);
          done += 1;
          setQueueStatus(`${done}/${totalCount} 枚生成しました（保存先: output/${queueFolder}）`);
        } catch (err) {
          setQueueStatus(
            `${done}/${totalCount} 枚完了後にエラー: ${errorMessage(err)}（中断しました）`
          );
          stopped = true;
          break;
        }
        if (!(itemIndex === items.length - 1 && i === item.count) && !queueStopRef.current) {
          await waitWithCountdown(intervalSec, {
            shouldStop: () => queueStopRef.current,
            onTick: (remaining) =>
              setQueueStatus(
                `次の生成まで ${remaining} 秒待機中...（${done}/${totalCount} 枚完了）`
              ),
          });
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

  return { queueStatus, handleStartQueue, handleStopQueue };
}
