const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const { unzipSync } = require('fflate');
const { writeJson, getOutputDir } = require('./settings-store');
const { loadNovelaiModule, requestImage, requestSubscriptionInfo } = require('./novelai-client');

function registerGenerationHandlers() {
  ipcMain.handle('get-subscription-info', async (event, apiKey) => {
    if (!apiKey) throw new Error('APIキーを入力してください');
    const { parseSubscriptionInfo, NOVELAI_SUBSCRIPTION_ENDPOINT } = await loadNovelaiModule();
    const data = await requestSubscriptionInfo(apiKey, NOVELAI_SUBSCRIPTION_ENDPOINT);
    return parseSubscriptionInfo(data);
  });

  ipcMain.handle('generate-image', async (event, params) => {
    if (!params.apiKey) throw new Error('APIキーを入力してください');
    if (!params.prompt) throw new Error('プロンプトを入力してください');

    const { buildRequestBody, sanitizeBatchFolder, NOVELAI_IMAGE_ENDPOINT } =
      await loadNovelaiModule();
    const body = buildRequestBody(params);
    const zipBuffer = await requestImage(params.apiKey, body, NOVELAI_IMAGE_ENDPOINT);

    const unzipped = unzipSync(new Uint8Array(zipBuffer));
    const entryNames = Object.keys(unzipped);
    if (!entryNames.length) throw new Error('画像データを取得できませんでした');

    const imageBuffer = Buffer.from(unzipped[entryNames[0]]);
    const baseName = `${Date.now()}_${body.parameters.seed}`;
    const fileName = `${baseName}.png`;
    const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
    const outputDir = getOutputDir();
    const targetDir = safeBatchFolder ? path.join(outputDir, safeBatchFolder) : outputDir;
    fs.mkdirSync(targetDir, { recursive: true });
    const filePath = path.join(targetDir, fileName);
    fs.writeFileSync(filePath, imageBuffer);
    // 単発生成では画像1枚がそのままプロンプト1件に対応するため、ここでリクエ
    // スト内容を保存する。連続生成・複数プロンプト連続生成はプロンプト単位で
    // まとめて `save-prompt-info` 経由で1個だけ保存するため、それらの呼び出し
    // では params.skipJsonOutput が立てられ、ここでは保存しない。
    if (!params.skipJsonOutput) {
      writeJson(path.join(targetDir, `${baseName}.json`), body);
    }

    return {
      fileName,
      filePath,
      seed: body.parameters.seed,
      dataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`,
    };
  });

  // 連続生成・複数プロンプト連続生成が、同じプロンプトで複数枚生成する前後に
  // 1回だけ呼び出し、そのプロンプトのリクエスト内容をプロンプト単位で1つの
  // JSONファイルとして保存する（画像ごとには保存しない）。生成される各画像の
  // 実際のシード値は毎回異なりうるため、ここでは元のリクエストで指定した値
  // （未指定/0なら0のまま）を記録し、個々の画像の実際のシードは記録しない。
  ipcMain.handle('save-prompt-info', async (event, params) => {
    const { buildRequestBody, sanitizeBatchFolder } = await loadNovelaiModule();
    const body = buildRequestBody(params);
    body.parameters.seed = Number(params.seed) > 0 ? Number(params.seed) : 0;
    const safeBatchFolder = sanitizeBatchFolder(params.batchFolder);
    const outputDir = getOutputDir();
    const targetDir = safeBatchFolder ? path.join(outputDir, safeBatchFolder) : outputDir;
    fs.mkdirSync(targetDir, { recursive: true });
    writeJson(path.join(targetDir, `${params.fileName}.json`), body);
    return true;
  });
}

module.exports = { registerGenerationHandlers };
