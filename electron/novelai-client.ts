import https from 'https';

// shared/novelai.mts はネイティブESMモジュールであり（ブラウザ側の
// src/platform/capacitorBridge.js からもViteを介して直接importされている）、
// このCommonJSファイルからrequire()で読み込むことはできないため、
// キャッシュ付きの動的importを使用する。
type NovelaiModule = typeof import('../shared/novelai.mjs');

let novelaiModulePromise: Promise<NovelaiModule> | undefined;
export function loadNovelaiModule(): Promise<NovelaiModule> {
  if (!novelaiModulePromise) novelaiModulePromise = import('../shared/novelai.mjs');
  return novelaiModulePromise;
}

export function requestImage(apiKey: string, body: any, endpoint: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/x-zip-compressed',
          Authorization: `Bearer ${apiKey}`,
          'Content-Length': Buffer.byteLength(data),
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`API エラー (${res.statusCode}): ${buffer.toString('utf-8')}`));
            return;
          }
          resolve(buffer);
        });
      }
    );
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

export function requestSubscriptionInfo(apiKey: string, endpoint: string): Promise<any> {
  return new Promise((resolve, reject) => {
    const url = new URL(endpoint);
    const req = https.request(
      {
        hostname: url.hostname,
        path: url.pathname,
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Accept: 'application/json',
        },
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(new Error(`API エラー (${res.statusCode}): ${buffer.toString('utf-8')}`));
            return;
          }
          try {
            resolve(JSON.parse(buffer.toString('utf-8')));
          } catch {
            reject(new Error('残量情報の解析に失敗しました'));
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}
