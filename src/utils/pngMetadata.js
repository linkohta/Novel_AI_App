// NovelAIのPNG生成メタデータを純粋にブラウザ側だけで解析する。NovelAI
// （およびこのアプリ自身のgenerateImageの出力）は、画像生成に使ったパラメータを
// PNGのテキストチャンク（"Description" / "Comment" / "Source" / "Software"）
// として埋め込んでいるため、ユーザーが選択したFileを読み取り、window.apiを
// 経由することなく抽出したプロンプト・パラメータを返す——解析にはファイルの
// バイト列だけあれば十分なので、Electronのmain.jsやcapacitorBridge.js側に
// プラットフォーム固有の実装は不要である。

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

async function inflateZlib(bytes) {
  // PNGのzTXt／圧縮iTXtのペイロードはzlibストリーム（RFC 1950）であり、これは
  // Streams APIの'deflate'というフォーマット名が指すものにあたる（zlibヘッダの
  // 無いRFC 1951である'deflate-raw'とは異なる）。
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function readUint32BE(view, offset) {
  return view.getUint32(offset, false);
}

// 生のPNGバイト列を { width, height, texts } にパースする。`texts` は
// tEXt/zTXt/iTXt 各チャンクのキーワード（例: "Comment", "Description",
// "Source", "Software"）をデコード後の文字列値にマッピングしたものである。
async function parsePngChunks(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const view = new DataView(arrayBuffer);
  for (let i = 0; i < PNG_SIGNATURE.length; i++) {
    if (bytes[i] !== PNG_SIGNATURE[i]) {
      throw new Error('PNG形式の画像ではありません');
    }
  }

  const texts = {};
  let width = 0;
  let height = 0;
  let offset = 8;
  const decoder = new TextDecoder('utf-8');

  while (offset + 8 <= bytes.length) {
    const length = readUint32BE(view, offset);
    const type = decoder.decode(bytes.subarray(offset + 4, offset + 8));
    const dataStart = offset + 8;
    const dataEnd = dataStart + length;
    if (dataEnd > bytes.length) break;
    const data = bytes.subarray(dataStart, dataEnd);

    if (type === 'IHDR') {
      width = readUint32BE(view, dataStart);
      height = readUint32BE(view, dataStart + 4);
    } else if (type === 'tEXt') {
      const nullIndex = data.indexOf(0);
      if (nullIndex !== -1) {
        const keyword = decoder.decode(data.subarray(0, nullIndex));
        const text = decoder.decode(data.subarray(nullIndex + 1));
        texts[keyword] = text;
      }
    } else if (type === 'zTXt') {
      const nullIndex = data.indexOf(0);
      if (nullIndex !== -1) {
        const keyword = decoder.decode(data.subarray(0, nullIndex));
        const compressed = data.subarray(nullIndex + 2); // null文字＋圧縮方式バイトをスキップ
        try {
          const inflated = await inflateZlib(compressed);
          texts[keyword] = decoder.decode(inflated);
        } catch {
          // 解凍に失敗したチャンクは無視し、パース全体を中断しない。
        }
      }
    } else if (type === 'iTXt') {
      let p = data.indexOf(0);
      if (p !== -1) {
        const keyword = decoder.decode(data.subarray(0, p));
        const compressionFlag = data[p + 1];
        p += 3; // null文字＋compressionFlag＋compressionMethod
        const langEnd = data.indexOf(0, p);
        p = langEnd + 1;
        const translatedEnd = data.indexOf(0, p);
        p = translatedEnd + 1;
        const textBytes = data.subarray(p);
        try {
          const finalBytes = compressionFlag === 1 ? await inflateZlib(textBytes) : textBytes;
          texts[keyword] = decoder.decode(finalBytes);
        } catch {
          // 解凍に失敗したチャンクは無視し、パース全体を中断しない。
        }
      }
    }

    offset = dataEnd + 4; // CRCをスキップ
    if (type === 'IEND') break;
  }

  return { width, height, texts };
}

// PNGのFile/BlobからNovelAIの生成パラメータを抽出する。画像がNovelAIの
// メタデータを含んでいない場合（スクリーンショットや、他のツールで再保存・
// 再エンコードされてテキストチャンクが失われたPNGなど）はnullを返す。
// 有効なPNGでない場合にのみ例外を投げる。
export async function extractNovelAiMetadata(file) {
  const arrayBuffer = await file.arrayBuffer();
  const { width, height, texts } = await parsePngChunks(arrayBuffer);

  let comment = null;
  if (texts.Comment) {
    try {
      comment = JSON.parse(texts.Comment);
    } catch {
      comment = null;
    }
  }

  if (!comment && !texts.Description) {
    return null;
  }

  const result = {
    prompt: comment?.prompt ?? texts.Description ?? '',
    negativePrompt: comment?.uc ?? comment?.negative_prompt ?? '',
    steps: comment?.steps != null ? String(comment.steps) : '',
    scale: comment?.scale != null ? String(comment.scale) : '',
    sampler: comment?.sampler ?? '',
    seed: comment?.seed != null ? String(comment.seed) : '',
    width: width || (comment?.width != null ? String(comment.width) : ''),
    height: height || (comment?.height != null ? String(comment.height) : ''),
    sourceInfo: texts.Source || '',
    characters: [],
  };

  if (comment?.v4_prompt?.caption?.char_captions) {
    const positives = comment.v4_prompt.caption.char_captions;
    const negatives = comment?.v4_negative_prompt?.caption?.char_captions ?? [];
    result.characters = positives.map((c, i) => ({
      prompt: c.char_caption || '',
      negativePrompt: negatives[i]?.char_caption || '',
    }));
  } else if (Array.isArray(comment?.characterPrompts)) {
    result.characters = comment.characterPrompts.map((c) => ({
      prompt: c.prompt || '',
      negativePrompt: c.uc || '',
    }));
  }

  return result;
}
