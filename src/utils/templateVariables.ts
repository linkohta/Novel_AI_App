import type { QueueTemplateRow } from '../types/domain';

export function extractTemplateVariables(text: string): string[] {
  const names: string[] = [];
  const seen = new Set<string>();
  const regex = /"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(text || ''))) {
    const name = match[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

export function substituteTemplateVariables(text: string, values: Record<string, string>): string {
  let result = text;
  Object.keys(values).forEach((varName) => {
    const pattern = new RegExp(`"${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`, 'g');
    result = result.replace(pattern, values[varName]);
  });
  return result;
}

// 複数プロンプトテンプレートの「本文」は各行のprompt/negativePromptと、
// 各行のキャラクターのprompt/negativePromptに分散しているため、変数名ごとに
// 1つの入力欄を表示する前に、それらすべてを合わせた上で変数を収集する必要がある。
export function extractQueueTemplateVariables(rows: QueueTemplateRow[]): string[] {
  const combined = (rows || [])
    .flatMap((row) => [
      row.prompt,
      row.negativePrompt,
      ...(row.characters || []).flatMap((c) => [c.prompt, c.negativePrompt]),
    ])
    .join('\n');
  return extractTemplateVariables(combined);
}

export function substituteQueueTemplateRows(
  rows: QueueTemplateRow[],
  values: Record<string, string>
): QueueTemplateRow[] {
  return (rows || []).map((row) => ({
    ...row,
    prompt: substituteTemplateVariables(row.prompt || '', values),
    negativePrompt: substituteTemplateVariables(row.negativePrompt || '', values),
    characters: (row.characters || []).map((c) => ({
      ...c,
      prompt: substituteTemplateVariables(c.prompt || '', values),
      negativePrompt: substituteTemplateVariables(c.negativePrompt || '', values),
    })),
  }));
}
