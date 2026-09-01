const https = require('https');

// shared/novelai.mjs はネイティブESMモジュールであり（ブラウザ側の
// src/platform/capacitorBridge.js からもViteを介して直接importされている）、
// このCommonJSファイルからrequire()で読み込むことはできないため、
// キャッシュ付きの動的importを使用する。
let novelaiModulePromise;
function loadNovelaiModule() {
  if (!novelaiModulePromise) novelaiModulePromise = import('../shared/novelai.mjs');
  return novelaiModulePromise;
}

function requestImage(apiKey, body, endpoint) {
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
        const chunks = [];
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

function requestSubscriptionInfo(apiKey, endpoint) {
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
        const chunks = [];
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

module.exports = { loadNovelaiModule, requestImage, requestSubscriptionInfo };
