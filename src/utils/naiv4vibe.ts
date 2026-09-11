// NovelAI公式サイトが出力する「ポーションセット」ファイル（拡張子`.naiv4vibe`）、
// および複数のポーションをまとめてExportした「ポーションセットバンドル」ファイル
// （拡張子`.naiv4vibeBundle`）のパーサ。
// `.naiv4vibe`の中身はJSONで、`encodings`配下にモデルごとの「事前にエンコード済みの
// vibeデータ（base64文字列）＋information_extracted」の組がキーごとに複数格納されて
// いる場合がある（公式サイトでInformation Extractedスライダーを調整するたびに
// 新しいエンコードが追加されていくため、同じ元画像に対して異なる
// information_extracted値のエンコードが複数残っていることがある。実際に公式サイト
// からExportしたファイルで確認済み）。このうち実際に使うべきなのは`importInfo`が
// 指す最後に選択されていた値のエンコードのみであり、それ以外は同じ元画像の
// 過去の調整履歴（＝見本画像相当の余分なエンコード）に過ぎないため、
// `extractEntries`は`importInfo.information_extracted`に一致する1件のみを
// グループごとに採用する（後述）。`encodings`直下のキー名はモデルによって異なり
// （実際にNovelAI公式サイトからExportしたファイルで確認したところ、nai-diffusion-4系は
// `v4full`/`v4curated`、nai-diffusion-4-5系は`v4-5full`/`v4-5curated`など）、
// 将来のモデル追加でも増えうるため、キー名を決め打ちせず`encodings`直下の全キーを
// 走査して抽出する（キーごとに1件ずつ、上記の絞り込みを行った上で）。エンコード
// 済みデータはアップロード画像のbase64と同じ形で`reference_image_multiple`に
// そのまま渡せるため、ここでは値の抽出のみを行う（デコードや再エンコードは行わない）。
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
  information_extracted?: unknown;
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
// エントリを1件だけ抽出する。公式サイトはInformation Extractedスライダーを
// 調整するたびに新しいハッシュキーでエンコード結果を追加していくため、1つの
// モデルグループ内に同じ元画像の異なるInformation Extracted値のエンコードが
// 複数残っていることがある（例: スライダーを0.7→1→0.6と動かした履歴が
// 3件とも残る）。これを全件読み込むと同じ元画像（見本画像）が重複して複数の
// 参照画像として扱われてしまうため、`importInfo.information_extracted`
// （公式サイトを書き出した時点で実際に選択されていた値）に一致する1件のみを
// 採用する。一致するものが無い場合は先頭の1件にフォールバックする。
// `referenceStrength`はグループ単位ではなくvibe単位の情報（`importInfo.strength`）
// なので、呼び出し側から受け取ってエントリに付ける。
function extractEntries(
  group: Record<string, Naiv4VibeEncodingEntry> | undefined,
  referenceStrength: number | undefined,
  activeInformationExtracted: number | undefined
): Naiv4VibeEntry[] {
  if (!group || typeof group !== 'object') return [];
  const candidates = Object.values(group).filter(
    (value): value is Naiv4VibeEncodingEntry & { encoding: string } =>
      !!value && typeof value.encoding === 'string'
  );
  if (candidates.length === 0) return [];

  const matched =
    typeof activeInformationExtracted === 'number'
      ? candidates.find(
          (value) => value.params?.information_extracted === activeInformationExtracted
        )
      : undefined;
  const selected = matched ?? candidates[0];

  const informationExtracted =
    typeof selected.params?.information_extracted === 'number'
      ? selected.params.information_extracted
      : 1;
  return [{ encoding: selected.encoding, informationExtracted, referenceStrength }];
}

// vibeデータの`importInfo.strength`（公式サイトでExportした時点のReference
// Strength）を取り出す。無い・数値でない場合はundefinedを返す。
function extractReferenceStrength(importInfo: Naiv4VibeImportInfo | undefined): number | undefined {
  return typeof importInfo?.strength === 'number' ? importInfo.strength : undefined;
}

// 単体のvibeデータ（`.naiv4vibe`ファイル、またはバンドル内の`vibes`配列の1要素）から
// エントリ一覧を抽出する。`encodings`直下のキー（モデルごとのエンコード結果）を
// すべて走査し、キーごとに1件（`extractEntries`が選んだもの）を連結する（どの
// モデル向けのエンコードかはこのアプリでは区別せず、選択中のモデルに合わないもの
// を送信した場合はNovelAI API側でエラーになる——生画像アップロード時にモデルの
// 整合性を検証していないのと同じ扱いとしている）。
function extractEncodingsFromVibeData(
  encodings: Naiv4VibeEncodings | undefined,
  importInfo: Naiv4VibeImportInfo | undefined
): Naiv4VibeEntry[] {
  if (!encodings || typeof encodings !== 'object') return [];
  const referenceStrength = extractReferenceStrength(importInfo);
  const activeInformationExtracted =
    typeof importInfo?.information_extracted === 'number'
      ? importInfo.information_extracted
      : undefined;
  const entries: Naiv4VibeEntry[] = [];
  for (const group of Object.values(encodings)) {
    entries.push(...extractEntries(group, referenceStrength, activeInformationExtracted));
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
