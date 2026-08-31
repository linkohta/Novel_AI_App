import { useRef, useState } from 'react';
import { waitWithCountdown } from '../utils/sleep.js';

// The "複数プロンプト連続生成" loop: walks the queue-items list top to
// bottom, generating each row's prompt `count` times with a wait between
// generations, saving everything under `queue_<timestamp>/prompt<n>/`
// folders. Guards against running at the same time as the single-prompt
// batch generation loop (see useBatchGeneration.js).
export function useQueueGeneration({
  queueItems,
  queueInterval,
  setQueueRunning,
  batchRunning,
  buildGenerateParams,
  recordResult,
  currentSettings,
}) {
  const [queueStatus, setQueueStatus] = useState('');
  const queueStopRef = useRef(false);

  async function handleStartQueue() {
    if (batchRunning) return;
    window.api.saveSettings(currentSettings());
    const intervalSec = Math.max(1, parseInt(queueInterval, 10) || 5);
    const items = queueItems
      .map((item) => ({
        ...item,
        count: Math.max(1, Math.min(100, parseInt(item.count, 10) || 1)),
      }))
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
      const itemFolder = `${queueFolder}/prompt${itemIndex + 1}`;
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
            buildGenerateParams({
              prompt: item.prompt,
              negativePrompt: item.negativePrompt,
              characterPrompts: (item.characters || []).filter(
                (c) => c.enabled !== false && c.prompt?.trim()
              ),
              batchFolder: itemFolder,
            })
          );
          recordResult(result);
          done += 1;
          setQueueStatus(`${done}/${totalCount} 枚生成しました（保存先: output/${itemFolder}）`);
        } catch (err) {
          setQueueStatus(`${done}/${totalCount} 枚完了後にエラー: ${err.message}（中断しました）`);
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
