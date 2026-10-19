import { Dispatch, SetStateAction, useRef, useState } from 'react';
import { waitWithCountdown } from '../utils/sleep';
import type { GenerateParamsExtra } from '../types/domain';
import type { GenerateImageParams, GenerateImageResult, Settings } from '../types/window-api';
import { errorMessage } from '../utils/errorMessage';

interface UseBatchGenerationParams {
  batchCount: string;
  batchInterval: string;
  setBatchRunning: Dispatch<SetStateAction<boolean>>;
  queueRunning: boolean;
  buildGenerateParams: (extra?: GenerateParamsExtra) => Promise<GenerateImageParams>;
  recordResult: (result: GenerateImageResult) => void;
  currentSettings: () => Settings;
}

// 「連続生成」のループ：同一プロンプトの画像を`batchCount`枚、各生成の間に
// 待機を挟みながら生成し、すべて1つの`batch_<timestamp>/`フォルダに保存する。
// 複数プロンプト連続生成のループと同時実行されないようガードしている
// （両者は「生成する」ボタンの無効化状態を共有しており、同時に安全に
// 実行することはできない）。
export function useBatchGeneration({
  batchCount,
  batchInterval,
  setBatchRunning,
  queueRunning,
  buildGenerateParams,
  recordResult,
  currentSettings,
}: UseBatchGenerationParams) {
  const [batchStatus, setBatchStatus] = useState('');
  const batchStopRef = useRef(false);

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
        // 連続生成では「モデル」タブのシード値によらず毎回ランダムなシードで
        // 生成する（同じシードで同じ画像が何枚も生成されるのを防ぐため。
        // seed: 0 はbuildRequestBodyでランダムを意味する）。
        const result = await window.api.generateImage(
          await buildGenerateParams({ batchFolder, seed: 0 })
        );
        recordResult(result);
        setBatchStatus(`${i}/${count} 枚生成しました（保存先: output/${batchFolder}）`);
      } catch (err) {
        setBatchStatus(`${i}/${count} 枚目でエラー: ${errorMessage(err)}（中断しました）`);
        break;
      }
      if (i < count && !batchStopRef.current) {
        await waitWithCountdown(intervalSec, {
          shouldStop: () => batchStopRef.current,
          onTick: (remaining) =>
            setBatchStatus(`次の生成まで ${remaining} 秒待機中...（${i}/${count} 枚完了）`),
        });
      }
    }

    setBatchRunning(false);
  }

  function handleStopBatch() {
    batchStopRef.current = true;
  }

  return { batchStatus, handleStartBatch, handleStopBatch };
}
