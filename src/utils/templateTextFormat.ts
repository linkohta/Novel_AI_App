// プロンプトテンプレート／複数プロンプトテンプレートを、メモ帳等で人が
// 読み書きしやすいtxt形式へ相互変換する純粋関数群（Reactに依存しない）。
//
// 書式は「### 見出し」行で区切ったセクションの並びで、見出しの次の行から
// 次の見出しの直前までがそのセクションの値になる（複数行可）。見出しとして
// 扱うのは下記の決まった書式に一致する行だけで、それ以外の「###」で始まる
// 行はプロンプト本文の一部として扱う。
//
// プロンプトテンプレート:
//   ### 名前
//   テンプレート名
//   ### 本文
//   1girl, "hair_color" hair
//
// 複数プロンプトテンプレート（行・キャラクターは1始まりの連番）:
//   ### 名前
//   テンプレート名
//   ### 行1 枚数
//   1
//   ### 行1 プロンプト
//   ...
//   ### 行1 ネガティブプロンプト
//   ...
//   ### 行1 キャラクター1 有効
//   はい
//   ### 行1 キャラクター1 プロンプト
//   ...
//   ### 行1 キャラクター1 ネガティブプロンプト
//   ...
import type {
  NamedItem,
  QueueTemplateDraftCharacter,
  QueueTemplateDraftRow,
} from '../types/domain';

const HEADING_PREFIX = '### ';
const HEADING_PATTERN =
  /^###\s+(名前|本文|行(\d+)\s+(枚数|プロンプト|ネガティブプロンプト)|行(\d+)\s+キャラクター(\d+)\s+(有効|プロンプト|ネガティブプロンプト))\s*$/;
const ENABLED_TRUE = 'はい';
const ENABLED_FALSE = 'いいえ';

interface Section {
  heading: string;
  rowNumber?: number;
  rowField?: string;
  charNumber?: number;
  charField?: string;
  value: string;
}

function heading(label: string): string {
  return `${HEADING_PREFIX}${label}`;
}

// 先頭のBOM（メモ帳等が付けることがある）を除去し、改行コードをLFに揃える。
function normalizeText(rawText: string): string {
  const withoutBom = rawText.charCodeAt(0) === 0xfeff ? rawText.slice(1) : rawText;
  return withoutBom.replace(/\r\n?/g, '\n');
}

// 正規化したテキストをセクションに分解する。最初の見出しより前にある行は無視する。
function parseSections(rawText: string): Section[] {
  const lines = normalizeText(rawText).split('\n');
  const sections: Section[] = [];
  let current: (Section & { lines: string[] }) | null = null;
  const flush = () => {
    if (!current) return;
    const { lines: bodyLines, ...rest } = current;
    sections.push({ ...rest, value: bodyLines.join('\n').trim() });
  };
  for (const line of lines) {
    const match = HEADING_PATTERN.exec(line);
    if (match) {
      flush();
      current = {
        heading: match[1].startsWith('行') ? '行' : match[1],
        rowNumber: match[2] ? Number(match[2]) : match[4] ? Number(match[4]) : undefined,
        rowField: match[3],
        charNumber: match[5] ? Number(match[5]) : undefined,
        charField: match[6],
        value: '',
        lines: [],
      };
    } else if (current) {
      current.lines.push(line);
    }
  }
  flush();
  return sections;
}

// ファイル名（拡張子を除く）をテンプレート名のフォールバックに使う。
export function fileNameToTemplateName(fileName: string): string {
  return fileName.replace(/\.txt$/i, '').trim();
}

// テンプレート名をファイル名として安全な文字列にする（Windowsで使えない文字を置換）。
export function templateNameToFileName(name: string): string {
  const safe = Array.from(name)
    .map((ch) => (ch.charCodeAt(0) < 0x20 || '\\/:*?"<>|'.includes(ch) ? '_' : ch))
    .join('')
    .replace(/[. ]+$/, '')
    .trim();
  return `${safe || 'template'}.txt`;
}

export function serializePromptTemplate(template: { name: string; text: string }): string {
  return [heading('名前'), template.name, heading('本文'), template.text, ''].join('\n');
}

// 見出しの無いただのtxtも読み込めるよう、「### 本文」が無ければファイル全体を
// 本文、ファイル名をテンプレート名として扱う。
export function parsePromptTemplate(
  rawText: string,
  fallbackName: string
): Pick<NamedItem, 'name' | 'text'> {
  const sections = parseSections(rawText);
  if (sections.some((s) => s.heading === '行')) {
    throw new Error('複数プロンプトテンプレートのファイルです');
  }
  const nameSection = sections.find((s) => s.heading === '名前');
  const bodySection = sections.find((s) => s.heading === '本文');
  const name = (nameSection?.value || fallbackName).trim();
  const text = bodySection ? bodySection.value : normalizeText(rawText).trim();
  if (!name) throw new Error('テンプレート名がありません');
  if (!text) throw new Error('本文が空です');
  return { name, text };
}

export function serializeQueueTemplate(template: {
  name: string;
  rows: QueueTemplateDraftRow[];
}): string {
  const lines = [heading('名前'), template.name];
  template.rows.forEach((row, rowIndex) => {
    const r = `行${rowIndex + 1}`;
    lines.push(heading(`${r} 枚数`), String(row.count || '1'));
    lines.push(heading(`${r} プロンプト`), row.prompt || '');
    lines.push(heading(`${r} ネガティブプロンプト`), row.negativePrompt || '');
    (row.characters || []).forEach((c, charIndex) => {
      const ch = `${r} キャラクター${charIndex + 1}`;
      lines.push(heading(`${ch} 有効`), c.enabled === false ? ENABLED_FALSE : ENABLED_TRUE);
      lines.push(heading(`${ch} プロンプト`), c.prompt || '');
      lines.push(heading(`${ch} ネガティブプロンプト`), c.negativePrompt || '');
    });
  });
  lines.push('');
  return lines.join('\n');
}

// 行・キャラクターは見出しの番号順に並べ直す（番号が飛んでいても詰める）。
// 枚数・有効は省略可能で、省略時はそれぞれ「1」「はい」とみなす。
export function parseQueueTemplate(
  rawText: string,
  fallbackName: string
): { name: string; rows: QueueTemplateDraftRow[] } {
  const sections = parseSections(rawText);
  const nameSection = sections.find((s) => s.heading === '名前');
  const name = (nameSection?.value || fallbackName).trim();
  if (!name) throw new Error('テンプレート名がありません');

  const rowMap = new Map<
    number,
    QueueTemplateDraftRow & { charMap: Map<number, QueueTemplateDraftCharacter> }
  >();
  for (const s of sections) {
    if (s.heading !== '行' || s.rowNumber === undefined) continue;
    let row = rowMap.get(s.rowNumber);
    if (!row) {
      row = { prompt: '', negativePrompt: '', count: '1', characters: [], charMap: new Map() };
      rowMap.set(s.rowNumber, row);
    }
    if (s.charNumber !== undefined) {
      let c = row.charMap.get(s.charNumber);
      if (!c) {
        c = { prompt: '', negativePrompt: '', enabled: true };
        row.charMap.set(s.charNumber, c);
      }
      if (s.charField === '有効') c.enabled = s.value !== ENABLED_FALSE;
      else if (s.charField === 'プロンプト') c.prompt = s.value;
      else if (s.charField === 'ネガティブプロンプト') c.negativePrompt = s.value;
    } else if (s.rowField === '枚数') {
      const count = Number(s.value);
      row.count = Number.isInteger(count) && count > 0 ? String(count) : '1';
    } else if (s.rowField === 'プロンプト') {
      row.prompt = s.value;
    } else if (s.rowField === 'ネガティブプロンプト') {
      row.negativePrompt = s.value;
    }
  }
  if (rowMap.size === 0) {
    throw new Error('「### 行1 プロンプト」形式の行が見つかりません');
  }
  const rows = [...rowMap.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, { charMap, ...row }]) => ({
      ...row,
      characters: [...charMap.entries()].sort(([a], [b]) => a - b).map(([, c]) => c),
    }));
  return { name, rows };
}
