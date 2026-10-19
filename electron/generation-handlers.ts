import { ipcMain, IpcMainInvokeEvent } from 'electron';
import path from 'path';
import fs from 'fs';
import { unzipSync } from 'fflate';
import { getOutputDir } from './settings-store';
import {
  loadNovelaiModule,
  requestImage,
  requestSubscriptionInfo,
  requestEncodeVibe,
} from './novelai-client';
import type { BuildRequestBodyParams } from '../shared/novelai.mjs';

export function registerGenerationHandlers(): void {
  ipcMain.handle('get-subscription-info', async (event: IpcMainInvokeEvent, apiKey: string) => {
    if (!apiKey) throw new Error('APIキーを入力してください');
    const { parseSubscriptionInfo, NOVELAI_SUBSCRIPTION_ENDPOINT } = await loadNovelaiModule();
    const data = await requestSubscriptionInfo(apiKey, NOVELAI_SUBSCRIPTION_ENDPOINT);
    return parseSubscriptionInfo(data);
  });

  ipcMain.handle(
    'encode-vibe',
    async (
      event: IpcMainInvokeEvent,
      params: { apiKey: string; image: string; model: string; informationExtracted: number }
    ) => {
      if (!params.apiKey) throw new Error('APIキーを入力してください');
      const { NOVELAI_ENCODE_VIBE_ENDPOINT } = await loadNovelaiModule();
      const buffer = await requestEncodeVibe(
        params.apiKey,
        {
          image: params.image,
          model: params.model,
          informationExtracted: params.informationExtracted,
        },
        NOVELAI_ENCODE_VIBE_ENDPOINT
      );
      return buffer.toString('base64');
    }
  );

  ipcMain.handle(
    'generate-image',
    async (
      event: IpcMainInvokeEvent,
      params: BuildRequestBodyParams & {
        apiKey: string;
        batchFolder?: string;
      }
    ) => {
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

      return {
        fileName,
        filePath,
        seed: body.parameters.seed,
        dataUrl: `data:image/png;base64,${imageBuffer.toString('base64')}`,
      };
    }
  );
}
