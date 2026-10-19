import https from 'https';
import type { RawSubscriptionData } from '../shared/novelai.mjs';

// shared/novelai.mts はネイティブESMモジュールであり、
// このCommonJSファイルからrequire()で読み込むことはできないため、
// キャッシュ付きの動的importを使用する。
type NovelaiModule = typeof import('../shared/novelai.mjs');

let novelaiModulePromise: Promise<NovelaiModule> | undefined;
export function loadNovelaiModule(): Promise<NovelaiModule> {
  if (!novelaiModulePromise) novelaiModulePromise = import('../shared/novelai.mjs');
  return novelaiModulePromise;
}

interface NovelaiRequestOptions {
  apiKey: string;
  endpoint: string;
  method: 'GET' | 'POST';
  // JSONとして送信するリクエストボディ（GETでは省略）。
  body?: object;
  // レスポンスのAccept（省略時はAcceptを送らない）。
  accept?: string;
  // エラーメッセージの先頭に付ける文言。HTTPエラー時の既定は「API エラー」。
  // 指定した場合は通信エラー（ネットワーク障害等）のメッセージにも付ける。
  errorPrefix?: string;
}

// NovelAI APIへのBearer認証付きHTTPSリクエスト。レスポンスボディは生の
// Bufferのまま返し、用途ごとの解釈（ZIP展開・JSON解析・そのまま使う）は
// 呼び出し側に任せる。画像生成・残量確認・Vibeエンコードの3か所で
// ほぼ同じリクエスト処理が重複していたためまとめた。
function requestNovelai({
  apiKey,
  endpoint,
  method,
  body,
  accept,
  errorPrefix,
}: NovelaiRequestOptions): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const data = body === undefined ? undefined : JSON.stringify(body);
    const url = new URL(endpoint);
    const headers: Record<string, string | number> = { Authorization: `Bearer ${apiKey}` };
    if (accept) headers.Accept = accept;
    if (data !== undefined) {
      headers['Content-Type'] = 'application/json';
      headers['Content-Length'] = Buffer.byteLength(data);
    }
    const req = https.request(
      { hostname: url.hostname, path: url.pathname, method, headers },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buffer = Buffer.concat(chunks);
          if (res.statusCode !== 200) {
            reject(
              new Error(
                `${errorPrefix ?? 'API エラー'} (${res.statusCode}): ${buffer.toString('utf-8')}`
              )
            );
            return;
          }
          resolve(buffer);
        });
      }
    );
    req.on('error', (err) =>
      reject(errorPrefix ? new Error(`${errorPrefix}: ${err.message}`) : err)
    );
    if (data !== undefined) req.write(data);
    req.end();
  });
}

// 画像生成。レスポンスは生成画像を含むZIP。
export function requestImage(apiKey: string, body: object, endpoint: string): Promise<Buffer> {
  return requestNovelai({
    apiKey,
    endpoint,
    method: 'POST',
    body,
    accept: 'application/x-zip-compressed',
  });
}

// AIポーション（Vibe Transfer）の参照画像を事前エンコードする。
// レスポンスはJSONではなく生バイナリ（エンコード済みvibeデータ）で返る。
export function requestEncodeVibe(
  apiKey: string,
  body: { image: string; model: string; informationExtracted: number },
  endpoint: string
): Promise<Buffer> {
  return requestNovelai({
    apiKey,
    endpoint,
    method: 'POST',
    body,
    errorPrefix: 'Vibeのエンコードに失敗しました',
  });
}

// サブスクリプション情報（Anlas残量・Opus特典）。レスポンスはJSONで、形の
// 解釈（RawSubscriptionData）はshared/novelai.mtsのparseSubscriptionInfoに任せる。
export async function requestSubscriptionInfo(
  apiKey: string,
  endpoint: string
): Promise<RawSubscriptionData> {
  const buffer = await requestNovelai({
    apiKey,
    endpoint,
    method: 'GET',
    accept: 'application/json',
  });
  try {
    return JSON.parse(buffer.toString('utf-8')) as RawSubscriptionData;
  } catch {
    throw new Error('残量情報の解析に失敗しました');
  }
}
