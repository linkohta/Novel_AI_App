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
