import { useRef, useState } from 'react';
import { waitWithCountdown } from '../utils/sleep.js';

// The "連続生成" loop: generates `batchCount` images of the same prompt with
// a wait between each, saving all of them under one `batch_<timestamp>/`
// folder. Guards against running at the same time as the prompt-queue
// generation loop (they share the "生成する" button's disabled state and
// can't safely run concurrently).
export function useBatchGeneration({
  batchCount,
  batchInterval,
  setBatchRunning,
  queueRunning,
  buildGenerateParams,
  recordResult,
  currentSettings,
}) {
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
        const result = await window.api.generateImage(buildGenerateParams({ batchFolder }));
        recordResult(result);
        setBatchStatus(`${i}/${count} 枚生成しました（保存先: output/${batchFolder}）`);
      } catch (err) {
        setBatchStatus(`${i}/${count} 枚目でエラー: ${err.message}（中断しました）`);
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
