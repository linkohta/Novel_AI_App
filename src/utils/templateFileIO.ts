// プロンプトテンプレート／複数プロンプトテンプレートのtxtインポート・
// エクスポートで共通する処理。書式の変換自体は templateTextFormat.ts が担い、
// ここではファイルの読み込み・window.api経由の書き出し・同名テンプレートの
// 上書き判定だけを行う。
import type { NamedListApi } from '../types/domain';
import { fileNameToTemplateName, templateNameToFileName } from './templateTextFormat';

export interface TemplateImportResult {
  added: number;
  updated: number;
  errors: string[];
}

// 選択された各txtを解析し、既存に同名のテンプレートがあれば上書き、
// 無ければ新規追加する。同じ選択の中に同名のファイルが複数ある場合は
// 後に選んだもの（配列の後ろ）を採用する。
export async function importTemplateFiles<
  TItem extends { id: string; name: string },
  TNewItem extends { name: string },
>(
  files: File[],
  parse: (rawText: string, fallbackName: string) => TNewItem,
  list: NamedListApi<TItem, TNewItem>
): Promise<TemplateImportResult> {
  const result: TemplateImportResult = { added: 0, updated: 0, errors: [] };
  const parsedByName = new Map<string, TNewItem>();
  for (const file of files) {
    try {
      const parsed = parse(await file.text(), fileNameToTemplateName(file.name));
      parsedByName.set(parsed.name, parsed);
    } catch (err) {
      result.errors.push(`${file.name}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  for (const parsed of parsedByName.values()) {
    const existing = list.items.find((item) => item.name === parsed.name);
    if (existing) {
      await list.editItem({ ...existing, ...parsed });
      result.updated += 1;
    } else {
      await list.addItem(parsed);
      result.added += 1;
    }
  }
  return result;
}

export function formatImportStatus({ added, updated, errors }: TemplateImportResult): string {
  const parts = [`テンプレートを読み込みました（追加 ${added}件・上書き ${updated}件）`];
  if (errors.length) parts.push(`読み込めなかったファイル: ${errors.join(' / ')}`);
  return parts.join('。');
}

// テンプレート名からファイル名を決めて書き出し、ステータス表示用の文言を返す。
export async function exportTemplateFile(name: string, text: string): Promise<string> {
  const savedPath = await window.api.exportTextFile(templateNameToFileName(name), text);
  return savedPath ? `テンプレートを書き出しました: ${savedPath}` : 'エクスポートを中止しました';
}
