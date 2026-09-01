// Pure browser-side parsing of NovelAI's PNG generation metadata. NovelAI
// (and this app's own generateImage output) embeds the parameters used to
// generate an image as PNG text chunks ("Description" / "Comment" / "Source"
// / "Software"), so this reads a File the user picked and returns the
// extracted prompt/parameters without any window.api round-trip — the
// parsing needs only the file bytes, so there is nothing platform-specific
// for Electron's main.js or capacitorBridge.js to implement.

const PNG_SIGNATURE = [137, 80, 78, 71, 13, 10, 26, 10];

async function inflateZlib(bytes) {
  // PNG's zTXt/compressed-iTXt payloads are zlib streams (RFC 1950), which is
  // what the Streams API's 'deflate' format name refers to (unlike
  // 'deflate-raw', which is RFC 1951 with no zlib header).
  const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate'));
  const buf = await new Response(stream).arrayBuffer();
  return new Uint8Array(buf);
}

function readUint32BE(view, offset) {
  return view.getUint32(offset, false);
}

// Parses raw PNG bytes into { width, height, texts }, where `texts` maps each
// tEXt/zTXt/iTXt chunk's keyword (e.g. "Comment", "Description", "Source",
// "Software") to its decoded string value.
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
        const compressed = data.subarray(nullIndex + 2); // skip null + compression method byte
        try {
          const inflated = await inflateZlib(compressed);
          texts[keyword] = decoder.decode(inflated);
        } catch {
          // Ignore chunks we fail to decompress rather than aborting the whole parse.
        }
      }
    } else if (type === 'iTXt') {
      let p = data.indexOf(0);
      if (p !== -1) {
        const keyword = decoder.decode(data.subarray(0, p));
        const compressionFlag = data[p + 1];
        p += 3; // null + compressionFlag + compressionMethod
        const langEnd = data.indexOf(0, p);
        p = langEnd + 1;
        const translatedEnd = data.indexOf(0, p);
        p = translatedEnd + 1;
        const textBytes = data.subarray(p);
        try {
          const finalBytes = compressionFlag === 1 ? await inflateZlib(textBytes) : textBytes;
          texts[keyword] = decoder.decode(finalBytes);
        } catch {
          // Ignore chunks we fail to decompress rather than aborting the whole parse.
        }
      }
    }

    offset = dataEnd + 4; // skip CRC
    if (type === 'IEND') break;
  }

  return { width, height, texts };
}

// Extracts NovelAI generation parameters from a PNG File/Blob. Returns null
// if the image carries no recognizable NovelAI metadata (e.g. a screenshot,
// or a PNG that was re-saved/re-encoded by another tool and lost its text
// chunks). Throws only if the file isn't a valid PNG at all.
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
