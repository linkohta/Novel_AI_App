// Batch (連続生成) image generation: generates the same prompt N times with a
// wait between requests, and can be stopped mid-run. Reuses buildGenerateParams
// and addHistoryThumb from main.js — safe even though main.js loads after this
// file, since they are only referenced inside the click handler below.
const batchCountEl = document.getElementById('batchCount');
const batchIntervalEl = document.getElementById('batchInterval');
const batchGenerateBtn = document.getElementById('batchGenerateBtn');
const batchStopBtn = document.getElementById('batchStopBtn');
const batchStatusEl = document.getElementById('batchStatus');

let batchStopRequested = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

batchGenerateBtn.addEventListener('click', async () => {
  persistSettings();
  const count = Math.max(1, Math.min(100, parseInt(batchCountEl.value, 10) || 1));
  const intervalSec = Math.max(1, parseInt(batchIntervalEl.value, 10) || 5);
  const batchFolder = `batch_${Date.now()}`;

  batchStopRequested = false;
  batchGenerateBtn.disabled = true;
  generateBtn.disabled = true;
  batchStopBtn.disabled = false;

  for (let i = 1; i <= count; i += 1) {
    if (batchStopRequested) {
      batchStatusEl.textContent = `${i - 1}/${count} 枚生成後に中断しました（保存先: output/${batchFolder}）`;
      break;
    }
    batchStatusEl.textContent = `${i}/${count} 枚目を生成中...`;
    try {
      const result = await window.api.generateImage(buildGenerateParams({ batchFolder }));
      resultImageEl.src = result.dataUrl;
      resultImageEl.style.display = 'block';
      fileInfoEl.textContent = `${result.fileName} (seed: ${result.seed})`;
      addHistoryThumb(result.dataUrl, result.fileName);
      batchStatusEl.textContent = `${i}/${count} 枚生成しました（保存先: output/${batchFolder}）`;
    } catch (err) {
      batchStatusEl.textContent = `${i}/${count} 枚目でエラー: ${err.message}（中断しました）`;
      break;
    }
    if (i < count && !batchStopRequested) {
      for (let remaining = intervalSec; remaining > 0; remaining -= 1) {
        if (batchStopRequested) break;
        batchStatusEl.textContent = `次の生成まで ${remaining} 秒待機中...（${i}/${count} 枚完了）`;
        await sleep(1000);
      }
    }
  }

  batchGenerateBtn.disabled = false;
  generateBtn.disabled = false;
  batchStopBtn.disabled = true;
});

batchStopBtn.addEventListener('click', () => {
  batchStopRequested = true;
  batchStopBtn.disabled = true;
});
