export function extractTemplateVariables(text) {
  const names = [];
  const seen = new Set();
  const regex = /\(([^()]+)\)/g;
  let match;
  while ((match = regex.exec(text || ''))) {
    const name = match[1].trim();
    if (name && !seen.has(name)) {
      seen.add(name);
      names.push(name);
    }
  }
  return names;
}

export function substituteTemplateVariables(text, values) {
  let result = text;
  Object.keys(values).forEach((varName) => {
    const pattern = new RegExp(`\\(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    result = result.replace(pattern, values[varName]);
  });
  return result;
}

// A queue template's "text" is spread across every row's prompt/negativePrompt
// and each row's character prompts/negativePrompts, so variables must be
// collected from all of them combined before showing a single input per name.
export function extractQueueTemplateVariables(rows) {
  const combined = (rows || [])
    .flatMap((row) => [
      row.prompt,
      row.negativePrompt,
      ...(row.characters || []).flatMap((c) => [c.prompt, c.negativePrompt]),
    ])
    .join('\n');
  return extractTemplateVariables(combined);
}

export function substituteQueueTemplateRows(rows, values) {
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
