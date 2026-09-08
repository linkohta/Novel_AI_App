// NovelAI公式サイトが出力する「ポーションセット」ファイル（拡張子`.naiv4vibe`）、
// および複数のポーションをまとめてExportした「ポーションセットバンドル」ファイル
// （拡張子`.naiv4vibeBundle`）のパーサ。
// `.naiv4vibe`の中身はJSONで、`encodings`配下にモデルごとの「事前にエンコード済みの
// vibeデータ（base64文字列）＋information_extracted」の組がキーごとに複数格納されて
// いる（1つの元画像から異なるinformation_extracted値で複数エンコードした結果を
// 1ファイルにまとめられる仕様）。`encodings`直下のキー名はモデルによって異なり
// （実際にNovelAI公式サイトからExportしたファイルで確認したところ、nai-diffusion-4系は
// `v4full`/`v4curated`、nai-diffusion-4-5系は`v4-5full`/`v4-5curated`など）、
// 将来のモデル追加でも増えうるため、キー名を決め打ちせず`encodings`直下の全キーを
// 走査して抽出する。エンコード済みデータはアップロード画像のbase64と同じ形で
// `reference_image_multiple`にそのまま渡せるため、ここでは値の抽出のみを行う
// （デコードや再エンコードは行わない）。
// `.naiv4vibeBundle`の中身は`{ vibes: [...] }`という構造で、`vibes`配列の各要素が
// `.naiv4vibe`単体ファイルとほぼ同じ`encodings`構造を持つ。
// 参考: コミュニティによるAPIリバースエンジニアリング成果である
// https://github.com/Aedial/novelai-api の `ImagePreset.references_from_nai4vibe`。

export interface Naiv4VibeEntry {
  encoding: string;
  informationExtracted: number;
  // ファイルの`importInfo.strength`（公式サイトでExportした時点のReference
  // Strength）。ファイルに含まれない場合はundefinedで、その場合は呼び出し側の
  // 既定値（0.6）が使われる。
  referenceStrength?: number;
}

interface Naiv4VibeEncodingEntry {
  encoding?: unknown;
  params?: { information_extracted?: unknown };
}

interface Naiv4VibeImportInfo {
  strength?: unknown;
}

// `encodings`直下のキー名（`v4full`/`v4curated`/`v4-5full`等）はモデルごとに
// 異なり決め打ちできないため、任意のキーを許容する。
type Naiv4VibeEncodings = Record<string, Record<string, Naiv4VibeEncodingEntry> | undefined>;

interface Naiv4VibeFile {
  encodings?: Naiv4VibeEncodings;
  importInfo?: Naiv4VibeImportInfo;
}

interface Naiv4VibeBundleFile {
  vibes?: { encodings?: Naiv4VibeEncodings; importInfo?: Naiv4VibeImportInfo }[];
}

// 指定した`encodings`直下の1グループ（モデルごとのエンコード結果）から
// エントリ一覧を抽出する。`referenceStrength`はグループ単位ではなくvibe単位の
// 情報（`importInfo.strength`）なので、呼び出し側から受け取って各エントリに付ける。
function extractEntries(
  group: Record<string, Naiv4VibeEncodingEntry> | undefined,
  referenceStrength: number | undefined
): Naiv4VibeEntry[] {
  if (!group || typeof group !== 'object') return [];
  const entries: Naiv4VibeEntry[] = [];
  for (const value of Object.values(group)) {
    if (!value || typeof value.encoding !== 'string') continue;
    const informationExtracted =
      typeof value.params?.information_extracted === 'number'
        ? value.params.information_extracted
        : 1;
    entries.push({ encoding: value.encoding, informationExtracted, referenceStrength });
  }
  return entries;
}

// vibeデータの`importInfo.strength`（公式サイトでExportした時点のReference
// Strength）を取り出す。無い・数値でない場合はundefinedを返す。
function extractReferenceStrength(importInfo: Naiv4VibeImportInfo | undefined): number | undefined {
  return typeof importInfo?.strength === 'number' ? importInfo.strength : undefined;
}

// 単体のvibeデータ（`.naiv4vibe`ファイル、またはバンドル内の`vibes`配列の1要素）から
// エントリ一覧を抽出する。`encodings`直下のキー（モデルごとのエンコード結果）を
// すべて走査し、見つかったエントリを連結する（どのモデル向けのエンコードかは
// このアプリでは区別せず、選択中のモデルに合わないものを送信した場合はNovelAI
// API側でエラーになる——生画像アップロード時にモデルの整合性を検証していないのと
// 同じ扱いとしている）。
function extractEncodingsFromVibeData(
  encodings: Naiv4VibeEncodings | undefined,
  importInfo: Naiv4VibeImportInfo | undefined
): Naiv4VibeEntry[] {
  if (!encodings || typeof encodings !== 'object') return [];
  const referenceStrength = extractReferenceStrength(importInfo);
  const entries: Naiv4VibeEntry[] = [];
  for (const group of Object.values(encodings)) {
    entries.push(...extractEntries(group, referenceStrength));
  }
  return entries;
}

// ポーションセットファイル（`.naiv4vibe`）またはポーションセットバンドルファイル
// （`.naiv4vibeBundle`、`File`）を読み込み、含まれるvibeデータの一覧を返す。
export async function parseNaiv4VibeFile(file: File): Promise<Naiv4VibeEntry[]> {
  const text = await file.text();

  let data: Naiv4VibeFile | Naiv4VibeBundleFile;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('ポーションセットファイルの形式が正しくありません（JSONとして読み取れません）');
  }

  if (!data || typeof data !== 'object') {
    throw new Error('ポーションセットファイルの形式が正しくありません');
  }

  // バンドル形式（`.naiv4vibeBundle`）: トップレベルに`vibes`配列を持つ。
  if (Array.isArray((data as Naiv4VibeBundleFile).vibes)) {
    const vibes = (data as Naiv4VibeBundleFile).vibes ?? [];
    const entries: Naiv4VibeEntry[] = [];
    for (const vibe of vibes) {
      if (!vibe || typeof vibe !== 'object') continue;
      entries.push(...extractEncodingsFromVibeData(vibe.encodings, vibe.importInfo));
    }
    if (entries.length === 0) {
      throw new Error('ポーションセットバンドルファイルからvibeデータを読み取れませんでした');
    }
    return entries;
  }

  // 単体形式（`.naiv4vibe`）。
  const single = data as Naiv4VibeFile;
  if (!single.encodings) {
    throw new Error(
      'ポーションセットファイルの形式が正しくありません（encodingsが見つかりません）'
    );
  }

  const entries = extractEncodingsFromVibeData(single.encodings, single.importInfo);
  if (entries.length === 0) {
    throw new Error('ポーションセットファイルからvibeデータを読み取れませんでした');
  }

  return entries;
}
