const apiKeyEl = document.getElementById('apiKey');
const promptEl = document.getElementById('prompt');
const negativePromptEl = document.getElementById('negativePrompt');
const modelEl = document.getElementById('model');
const widthEl = document.getElementById('width');
const heightEl = document.getElementById('height');
const stepsEl = document.getElementById('steps');
const scaleEl = document.getElementById('scale');
const samplerEl = document.getElementById('sampler');
const seedEl = document.getElementById('seed');
const generateBtn = document.getElementById('generateBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const statusEl = document.getElementById('status');
const resultImageEl = document.getElementById('result-image');
const fileInfoEl = document.getElementById('file-info');
const historyEl = document.getElementById('history');
const characterListEl = document.getElementById('characterList');
const addCharBtn = document.getElementById('addCharBtn');
const charNameByNameEl = document.getElementById('charNameByName');
const charSeriesByNameEl = document.getElementById('charSeriesByName');
const charNameSourceEl = document.getElementById('charNameSource');
const addCharByNameBtn = document.getElementById('addCharByNameBtn');
const chunkNameEl = document.getElementById('chunkName');
const saveChunkBtn = document.getElementById('saveChunkBtn');
const chunkListEl = document.getElementById('chunkList');
const chunkEditOverlayEl = document.getElementById('chunkEditOverlay');
const chunkEditNameEl = document.getElementById('chunkEditName');
const chunkEditTextEl = document.getElementById('chunkEditText');
const chunkEditSaveBtn = document.getElementById('chunkEditSave');
const chunkEditCancelBtn = document.getElementById('chunkEditCancel');
const templateNameEl = document.getElementById('templateName');
const templateTextEl = document.getElementById('templateText');
const saveTemplateBtn = document.getElementById('saveTemplateBtn');
const templateListEl = document.getElementById('templateList');
const templateEditOverlayEl = document.getElementById('templateEditOverlay');
const templateEditNameEl = document.getElementById('templateEditName');
const templateEditTextEl = document.getElementById('templateEditText');
const templateEditSaveBtn = document.getElementById('templateEditSave');
const templateEditCancelBtn = document.getElementById('templateEditCancel');
const templateApplyOverlayEl = document.getElementById('templateApplyOverlay');
const templateApplyFieldsEl = document.getElementById('templateApplyFields');
const templateApplyConfirmBtn = document.getElementById('templateApplyConfirm');
const templateApplyCancelBtn = document.getElementById('templateApplyCancel');
const characterSectionEl = document.getElementById('characterSection');
const favArtistNameEl = document.getElementById('favArtistName');
const saveFavArtistBtn = document.getElementById('saveFavArtistBtn');
const favArtistListEl = document.getElementById('favArtistList');
const favArtistEditOverlayEl = document.getElementById('favArtistEditOverlay');
const favArtistEditNameEl = document.getElementById('favArtistEditName');
const favArtistEditSaveBtn = document.getElementById('favArtistEditSave');
const favArtistEditCancelBtn = document.getElementById('favArtistEditCancel');
const favCharNameEl = document.getElementById('favCharName');
const favCharSeriesEl = document.getElementById('favCharSeries');
const saveFavCharBtn = document.getElementById('saveFavCharBtn');
const favCharListEl = document.getElementById('favCharList');
const favCharEditOverlayEl = document.getElementById('favCharEditOverlay');
const favCharEditNameEl = document.getElementById('favCharEditName');
const favCharEditSeriesEl = document.getElementById('favCharEditSeries');
const favCharEditSaveBtn = document.getElementById('favCharEditSave');
const favCharEditCancelBtn = document.getElementById('favCharEditCancel');

const fields = [
  apiKeyEl,
  promptEl,
  negativePromptEl,
  modelEl,
  widthEl,
  heightEl,
  stepsEl,
  scaleEl,
  samplerEl,
];

let characters = [];
let editingChunkId = null;
let editingTemplateId = null;
let editingFavArtistId = null;
let editingFavCharId = null;
let applyingTemplate = null;
let lastFocusedTextarea = promptEl;
let loadedChunks = [];
let loadedTemplates = [];

function extractTemplateVariables(text) {
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

function substituteTemplateVariables(text, values) {
  let result = text;
  Object.keys(values).forEach((varName) => {
    const pattern = new RegExp(`\\(${varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\)`, 'g');
    result = result.replace(pattern, values[varName]);
  });
  return result;
}

function renderCharNameSourceOptions() {
  const previousValue = charNameSourceEl.value;
  charNameSourceEl.innerHTML = '<option value="">なし</option>';
  if (loadedChunks.length) {
    const chunkGroup = document.createElement('optgroup');
    chunkGroup.label = 'プロンプトチャンク';
    loadedChunks.forEach((chunk) => {
      const option = document.createElement('option');
      option.value = `chunk:${chunk.id}`;
      option.textContent = chunk.name;
      chunkGroup.appendChild(option);
    });
    charNameSourceEl.appendChild(chunkGroup);
  }
  if (loadedTemplates.length) {
    const templateGroup = document.createElement('optgroup');
    templateGroup.label = 'プロンプトテンプレート';
    loadedTemplates.forEach((template) => {
      const option = document.createElement('option');
      option.value = `template:${template.id}`;
      option.textContent = template.name;
      templateGroup.appendChild(option);
    });
    charNameSourceEl.appendChild(templateGroup);
  }
  charNameSourceEl.value = previousValue;
}

function trackFocus(el) {
  el.addEventListener('focus', () => {
    lastFocusedTextarea = el;
  });
}

trackFocus(promptEl);
trackFocus(negativePromptEl);

function renderCharacters() {
  characterListEl.innerHTML = '';
  characters.forEach((char, index) => {
    const card = document.createElement('div');
    card.className = 'char-card';

    if (char.enabled === undefined) char.enabled = true;

    const removeBtn = document.createElement('button');
    removeBtn.type = 'button';
    removeBtn.className = 'remove-char';
    removeBtn.textContent = '削除';
    removeBtn.addEventListener('click', () => {
      characters.splice(index, 1);
      renderCharacters();
      persistSettings();
    });

    const enableLabel = document.createElement('label');
    enableLabel.className = 'char-enable';
    const enableCheckbox = document.createElement('input');
    enableCheckbox.type = 'checkbox';
    enableCheckbox.checked = char.enabled;
    enableCheckbox.addEventListener('change', () => {
      char.enabled = enableCheckbox.checked;
      promptInput.disabled = !char.enabled;
      negInput.disabled = !char.enabled;
      card.classList.toggle('char-disabled', !char.enabled);
      persistSettings();
    });
    enableLabel.appendChild(enableCheckbox);
    enableLabel.appendChild(document.createTextNode(`キャラクター${index + 1} を有効にする`));

    const promptLabel = document.createElement('label');
    promptLabel.textContent = `キャラクター${index + 1} プロンプト`;
    const promptInput = document.createElement('textarea');
    promptInput.value = char.prompt || '';
    promptInput.disabled = !char.enabled;
    promptInput.addEventListener('change', () => {
      char.prompt = promptInput.value;
      persistSettings();
    });
    trackFocus(promptInput);

    const negLabel = document.createElement('label');
    negLabel.textContent = 'ネガティブプロンプト';
    const negInput = document.createElement('textarea');
    negInput.value = char.negativePrompt || '';
    negInput.disabled = !char.enabled;
    negInput.addEventListener('change', () => {
      char.negativePrompt = negInput.value;
      persistSettings();
    });
    trackFocus(negInput);

    if (!char.enabled) card.classList.add('char-disabled');

    card.appendChild(removeBtn);
    card.appendChild(enableLabel);
    card.appendChild(promptLabel);
    card.appendChild(promptInput);
    card.appendChild(negLabel);
    card.appendChild(negInput);
    characterListEl.appendChild(card);
  });
}

function finishAddCharacterByName(prompt) {
  characters.push({ prompt, negativePrompt: '', enabled: true });
  renderCharacters();
  persistSettings();
  charNameByNameEl.value = '';
  charSeriesByNameEl.value = '';
  charNameSourceEl.value = '';
}

addCharByNameBtn.addEventListener('click', () => {
  const name = charNameByNameEl.value.trim();
  const series = charSeriesByNameEl.value.trim();
  if (!name) {
    statusEl.textContent = 'キャラクター名を入力してください';
    return;
  }
  const base = series ? `${name} (${series})` : name;
  const sourceValue = charNameSourceEl.value;

  if (!sourceValue) {
    finishAddCharacterByName(base);
    return;
  }

  const [sourceType, sourceId] = sourceValue.split(':');
  if (sourceType === 'chunk') {
    const chunk = loadedChunks.find((c) => c.id === sourceId);
    finishAddCharacterByName(chunk ? `${base}, ${chunk.text}` : base);
    return;
  }

  if (sourceType === 'template') {
    const template = loadedTemplates.find((t) => t.id === sourceId);
    if (!template) {
      finishAddCharacterByName(base);
      return;
    }
    openTemplateApplyModal(template, (result) => {
      finishAddCharacterByName(`${base}, ${result}`);
    });
  }
});

addCharBtn.addEventListener('click', () => {
  characters.push({ prompt: '', negativePrompt: '', enabled: true });
  renderCharacters();
  persistSettings();
});

function insertIntoFocusedField(text) {
  const target = lastFocusedTextarea || promptEl;
  const sep = target.value.trim() ? ', ' : '';
  target.value = `${target.value}${sep}${text}`;
  target.dispatchEvent(new Event('change'));
}

function populateCharacterFieldsFromFavorite(favorite) {
  charNameByNameEl.value = favorite.name;
  charSeriesByNameEl.value = favorite.series || '';
  characterSectionEl.open = true;
  charNameByNameEl.focus();
}

async function renderFavoriteArtists() {
  const favorites = await window.api.loadFavorites('artist');
  favArtistListEl.innerHTML = '';
  favorites.forEach((favorite) => {
    const chip = document.createElement('div');
    chip.className = 'chunk-chip';

    const insertSpan = document.createElement('span');
    insertSpan.className = 'chunk-insert';
    insertSpan.textContent = favorite.name;
    insertSpan.title = 'クリックでフォーカス中の欄に挿入';
    insertSpan.addEventListener('click', () => insertIntoFocusedField(favorite.name));

    const editSpan = document.createElement('span');
    editSpan.className = 'chunk-edit';
    editSpan.textContent = '✎';
    editSpan.addEventListener('click', () => {
      editingFavArtistId = favorite.id;
      favArtistEditNameEl.value = favorite.name;
      favArtistEditOverlayEl.classList.add('open');
    });

    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'chunk-delete';
    deleteSpan.textContent = '×';
    deleteSpan.addEventListener('click', async () => {
      await window.api.deleteFavorite('artist', favorite.id);
      renderFavoriteArtists();
    });

    chip.appendChild(insertSpan);
    chip.appendChild(editSpan);
    chip.appendChild(deleteSpan);
    favArtistListEl.appendChild(chip);
  });
}

saveFavArtistBtn.addEventListener('click', async () => {
  const name = favArtistNameEl.value.trim();
  if (!name) {
    statusEl.textContent = 'アーティスト名を入力してください';
    return;
  }
  await window.api.saveFavorite('artist', { name });
  favArtistNameEl.value = '';
  renderFavoriteArtists();
});

favArtistEditCancelBtn.addEventListener('click', () => {
  editingFavArtistId = null;
  favArtistEditOverlayEl.classList.remove('open');
});

favArtistEditSaveBtn.addEventListener('click', async () => {
  const name = favArtistEditNameEl.value.trim();
  if (!name) {
    statusEl.textContent = 'アーティスト名を入力してください';
    return;
  }
  await window.api.updateFavorite('artist', { id: editingFavArtistId, name });
  editingFavArtistId = null;
  favArtistEditOverlayEl.classList.remove('open');
  renderFavoriteArtists();
});

async function renderFavoriteCharacters() {
  const favorites = await window.api.loadFavorites('character');
  favCharListEl.innerHTML = '';
  favorites.forEach((favorite) => {
    const label = favorite.series ? `${favorite.name} (${favorite.series})` : favorite.name;
    const chip = document.createElement('div');
    chip.className = 'chunk-chip';

    const insertSpan = document.createElement('span');
    insertSpan.className = 'chunk-insert';
    insertSpan.textContent = label;
    insertSpan.title = 'クリックでフォーカス中の欄に挿入';
    insertSpan.addEventListener('click', () => insertIntoFocusedField(label));

    const toTemplateSpan = document.createElement('span');
    toTemplateSpan.className = 'chunk-to-template';
    toTemplateSpan.textContent = 'テンプレへ';
    toTemplateSpan.title = '「キャラクター名で追加」欄に入力する';
    toTemplateSpan.addEventListener('click', () => populateCharacterFieldsFromFavorite(favorite));

    const editSpan = document.createElement('span');
    editSpan.className = 'chunk-edit';
    editSpan.textContent = '✎';
    editSpan.addEventListener('click', () => {
      editingFavCharId = favorite.id;
      favCharEditNameEl.value = favorite.name;
      favCharEditSeriesEl.value = favorite.series || '';
      favCharEditOverlayEl.classList.add('open');
    });

    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'chunk-delete';
    deleteSpan.textContent = '×';
    deleteSpan.addEventListener('click', async () => {
      await window.api.deleteFavorite('character', favorite.id);
      renderFavoriteCharacters();
    });

    chip.appendChild(insertSpan);
    chip.appendChild(toTemplateSpan);
    chip.appendChild(editSpan);
    chip.appendChild(deleteSpan);
    favCharListEl.appendChild(chip);
  });
}

saveFavCharBtn.addEventListener('click', async () => {
  const name = favCharNameEl.value.trim();
  const series = favCharSeriesEl.value.trim();
  if (!name) {
    statusEl.textContent = 'キャラクター名を入力してください';
    return;
  }
  await window.api.saveFavorite('character', { name, series });
  favCharNameEl.value = '';
  favCharSeriesEl.value = '';
  renderFavoriteCharacters();
});

favCharEditCancelBtn.addEventListener('click', () => {
  editingFavCharId = null;
  favCharEditOverlayEl.classList.remove('open');
});

favCharEditSaveBtn.addEventListener('click', async () => {
  const name = favCharEditNameEl.value.trim();
  const series = favCharEditSeriesEl.value.trim();
  if (!name) {
    statusEl.textContent = 'キャラクター名を入力してください';
    return;
  }
  await window.api.updateFavorite('character', { id: editingFavCharId, name, series });
  editingFavCharId = null;
  favCharEditOverlayEl.classList.remove('open');
  renderFavoriteCharacters();
});

async function renderChunks() {
  const chunks = await window.api.loadChunks();
  loadedChunks = chunks;
  chunkListEl.innerHTML = '';
  chunks.forEach((chunk) => {
    const chip = document.createElement('div');
    chip.className = 'chunk-chip';

    const insertSpan = document.createElement('span');
    insertSpan.className = 'chunk-insert';
    insertSpan.textContent = chunk.name;
    insertSpan.title = chunk.text;
    insertSpan.addEventListener('click', () => {
      const target = lastFocusedTextarea || promptEl;
      const sep = target.value.trim() ? ', ' : '';
      target.value = `${target.value}${sep}${chunk.text}`;
      target.dispatchEvent(new Event('change'));
    });

    const editSpan = document.createElement('span');
    editSpan.className = 'chunk-edit';
    editSpan.textContent = '✎';
    editSpan.addEventListener('click', () => openChunkEditModal(chunk));

    const deleteSpan = document.createElement('span');
    deleteSpan.className = 'chunk-delete';
    deleteSpan.textContent = '×';
    deleteSpan.addEventListener('click', async () => {
      await window.api.deleteChunk(chunk.id);
      renderChunks();
    });

    chip.appendChild(insertSpan);
    chip.appendChild(editSpan);
    chip.appendChild(deleteSpan);
    chunkListEl.appendChild(chip);
  });
  renderCharNameSourceOptions();
}

function openChunkEditModal(chunk) {
  editingChunkId = chunk.id;
  chunkEditNameEl.value = chunk.name;
  chunkEditTextEl.value = chunk.text;
  chunkEditOverlayEl.classList.add('open');
}

function closeChunkEditModal() {
  editingChunkId = null;
  chunkEditOverlayEl.classList.remove('open');
}

chunkEditCancelBtn.addEventListener('click', closeChunkEditModal);

chunkEditSaveBtn.addEventListener('click', async () => {
  const name = chunkEditNameEl.value.trim();
  const text = chunkEditTextEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'チャンク名とプロンプトを入力してください';
    return;
  }
  await window.api.updateChunk({ id: editingChunkId, name, text });
  closeChunkEditModal();
  renderChunks();
});

saveChunkBtn.addEventListener('click', async () => {
  const name = chunkNameEl.value.trim();
  const text = promptEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'チャンク名とプロンプトを入力してください';
    return;
  }
  await window.api.saveChunk({ name, text });
  chunkNameEl.value = '';
  renderChunks();
});

async function renderTemplates() {
  const templates = await window.api.loadTemplates();
  loadedTemplates = templates;
  templateListEl.innerHTML = '';
  templates.forEach((template) => {
    const chip = document.createElement('div');
    chip.className = 'template-chip';

    const nameSpan = document.createElement('span');
    nameSpan.className = 'template-name';
    nameSpan.textContent = template.name;
    nameSpan.title = template.text;

    const applyBtn = document.createElement('button');
    applyBtn.type = 'button';
    applyBtn.className = 'template-apply';
    applyBtn.textContent = '適用';
    applyBtn.addEventListener('click', () => {
      const target = lastFocusedTextarea || promptEl;
      openTemplateApplyModal(template, (result) => {
        target.value = result;
        target.dispatchEvent(new Event('change'));
      });
    });

    const editBtn = document.createElement('button');
    editBtn.type = 'button';
    editBtn.className = 'template-edit';
    editBtn.textContent = '編集';
    editBtn.addEventListener('click', () => openTemplateEditModal(template));

    const deleteBtn = document.createElement('button');
    deleteBtn.type = 'button';
    deleteBtn.className = 'template-delete';
    deleteBtn.textContent = '削除';
    deleteBtn.addEventListener('click', async () => {
      await window.api.deleteTemplate(template.id);
      renderTemplates();
    });

    chip.appendChild(nameSpan);
    chip.appendChild(applyBtn);
    chip.appendChild(editBtn);
    chip.appendChild(deleteBtn);
    templateListEl.appendChild(chip);
  });
  renderCharNameSourceOptions();
}

function openTemplateEditModal(template) {
  editingTemplateId = template.id;
  templateEditNameEl.value = template.name;
  templateEditTextEl.value = template.text;
  templateEditOverlayEl.classList.add('open');
}

function closeTemplateEditModal() {
  editingTemplateId = null;
  templateEditOverlayEl.classList.remove('open');
}

templateEditCancelBtn.addEventListener('click', closeTemplateEditModal);

templateEditSaveBtn.addEventListener('click', async () => {
  const name = templateEditNameEl.value.trim();
  const text = templateEditTextEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'テンプレート名と本文を入力してください';
    return;
  }
  await window.api.updateTemplate({ id: editingTemplateId, name, text });
  closeTemplateEditModal();
  renderTemplates();
});

saveTemplateBtn.addEventListener('click', async () => {
  const name = templateNameEl.value.trim();
  const text = templateTextEl.value.trim();
  if (!name || !text) {
    statusEl.textContent = 'テンプレート名と本文を入力してください';
    return;
  }
  await window.api.saveTemplate({ name, text });
  templateNameEl.value = '';
  templateTextEl.value = '';
  renderTemplates();
});

function openTemplateApplyModal(template, onApply) {
  applyingTemplate = { template, onApply };
  const variables = extractTemplateVariables(template.text);
  templateApplyFieldsEl.innerHTML = '';
  if (!variables.length) {
    const note = document.createElement('div');
    note.className = 'no-vars';
    note.textContent = 'このテンプレートに変数はありません。そのまま反映します。';
    templateApplyFieldsEl.appendChild(note);
  } else {
    variables.forEach((varName) => {
      const field = document.createElement('div');
      field.className = 'template-var-field';
      const label = document.createElement('label');
      label.textContent = varName;
      const input = document.createElement('input');
      input.type = 'text';
      input.dataset.varName = varName;
      field.appendChild(label);
      field.appendChild(input);
      templateApplyFieldsEl.appendChild(field);
    });
  }
  templateApplyOverlayEl.classList.add('open');
}

function closeTemplateApplyModal() {
  applyingTemplate = null;
  templateApplyOverlayEl.classList.remove('open');
}

templateApplyCancelBtn.addEventListener('click', closeTemplateApplyModal);

templateApplyConfirmBtn.addEventListener('click', () => {
  if (!applyingTemplate) return;
  const { template, onApply } = applyingTemplate;
  const inputs = templateApplyFieldsEl.querySelectorAll('input[data-var-name]');
  const values = {};
  inputs.forEach((input) => {
    values[input.dataset.varName] = input.value;
  });
  const result = substituteTemplateVariables(template.text, values);
  closeTemplateApplyModal();
  onApply(result);
});

const sectionEls = Array.from(document.querySelectorAll('details.section'));

function getSectionState() {
  const state = {};
  sectionEls.forEach((el) => {
    if (el.id) state[el.id] = el.open;
  });
  return state;
}

function applySectionState(state) {
  if (!state) return;
  sectionEls.forEach((el) => {
    if (el.id && Object.prototype.hasOwnProperty.call(state, el.id)) {
      el.open = state[el.id];
    }
  });
}

sectionEls.forEach((el) => el.addEventListener('toggle', persistSettings));

async function init() {
  if (window.isNativeApp) {
    openFolderBtn.textContent = '最新の画像を共有';
  }
  const settings = await window.api.loadSettings();
  if (settings.apiKey) apiKeyEl.value = settings.apiKey;
  if (settings.prompt) promptEl.value = settings.prompt;
  if (settings.negativePrompt) negativePromptEl.value = settings.negativePrompt;
  if (settings.model) modelEl.value = settings.model;
  if (settings.width) widthEl.value = settings.width;
  if (settings.height) heightEl.value = settings.height;
  if (settings.steps) stepsEl.value = settings.steps;
  if (settings.scale) scaleEl.value = settings.scale;
  if (settings.sampler) samplerEl.value = settings.sampler;
  characters = Array.isArray(settings.characters) ? settings.characters : [];
  applySectionState(settings.sectionState);
  renderCharacters();
  await renderChunks();
  await renderTemplates();
  await renderFavoriteArtists();
  await renderFavoriteCharacters();
}

function persistSettings() {
  window.api.saveSettings({
    apiKey: apiKeyEl.value,
    prompt: promptEl.value,
    negativePrompt: negativePromptEl.value,
    model: modelEl.value,
    width: widthEl.value,
    height: heightEl.value,
    steps: stepsEl.value,
    scale: scaleEl.value,
    sampler: samplerEl.value,
    characters,
    sectionState: getSectionState(),
  });
}

fields.forEach((el) => el.addEventListener('change', persistSettings));

function addHistoryThumb(dataUrl, fileName) {
  const img = document.createElement('img');
  img.src = dataUrl;
  img.title = fileName;
  img.addEventListener('click', () => {
    resultImageEl.src = dataUrl;
    resultImageEl.style.display = 'block';
    fileInfoEl.textContent = fileName;
  });
  historyEl.prepend(img);
}

function buildGenerateParams(extra) {
  return {
    apiKey: apiKeyEl.value,
    prompt: promptEl.value,
    negativePrompt: negativePromptEl.value,
    model: modelEl.value,
    width: widthEl.value,
    height: heightEl.value,
    steps: stepsEl.value,
    scale: scaleEl.value,
    sampler: samplerEl.value,
    seed: seedEl.value,
    characterPrompts: characters.filter((c) => c.enabled && c.prompt && c.prompt.trim()),
    ...extra,
  };
}

generateBtn.addEventListener('click', async () => {
  persistSettings();
  generateBtn.disabled = true;
  statusEl.textContent = '生成中...';
  try {
    const result = await window.api.generateImage(buildGenerateParams());
    resultImageEl.src = result.dataUrl;
    resultImageEl.style.display = 'block';
    fileInfoEl.textContent = `${result.fileName} (seed: ${result.seed})`;
    addHistoryThumb(result.dataUrl, result.fileName);
    statusEl.textContent = `保存しました: ${result.filePath}`;
  } catch (err) {
    statusEl.textContent = `エラー: ${err.message}`;
  } finally {
    generateBtn.disabled = false;
  }
});

openFolderBtn.addEventListener('click', () => window.api.openOutputFolder());

const batchCountEl = document.getElementById('batchCount');
const batchIntervalEl = document.getElementById('batchInterval');
const batchGenerateBtn = document.getElementById('batchGenerateBtn');
const batchStopBtn = document.getElementById('batchStopBtn');
const batchStatusEl = document.getElementById('batchStatus');

let batchStopRequested = false;

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

batchGenerateBtn.addEventListener('click', async () => {
  persistSettings();
  const count = Math.max(1, Math.min(100, parseInt(batchCountEl.value, 10) || 1));
  const intervalSec = Math.max(1, parseInt(batchIntervalEl.value, 10) || 5);
  const batchFolder = `batch_${Date.now()}`;

  batchStopRequested = false;
  batchGenerateBtn.disabled = true;
  generateBtn.disabled = true;
  batchStopBtn.disabled = false;

  for (let i = 1; i <= count; i += 1) {
    if (batchStopRequested) {
      batchStatusEl.textContent = `${i - 1}/${count} 枚生成後に中断しました（保存先: output/${batchFolder}）`;
      break;
    }
    batchStatusEl.textContent = `${i}/${count} 枚目を生成中...`;
    try {
      const result = await window.api.generateImage(buildGenerateParams({ batchFolder }));
      resultImageEl.src = result.dataUrl;
      resultImageEl.style.display = 'block';
      fileInfoEl.textContent = `${result.fileName} (seed: ${result.seed})`;
      addHistoryThumb(result.dataUrl, result.fileName);
      batchStatusEl.textContent = `${i}/${count} 枚生成しました（保存先: output/${batchFolder}）`;
    } catch (err) {
      batchStatusEl.textContent = `${i}/${count} 枚目でエラー: ${err.message}（中断しました）`;
      break;
    }
    if (i < count && !batchStopRequested) {
      for (let remaining = intervalSec; remaining > 0; remaining -= 1) {
        if (batchStopRequested) break;
        batchStatusEl.textContent = `次の生成まで ${remaining} 秒待機中...（${i}/${count} 枚完了）`;
        await sleep(1000);
      }
    }
  }

  batchGenerateBtn.disabled = false;
  generateBtn.disabled = false;
  batchStopBtn.disabled = true;
});

batchStopBtn.addEventListener('click', () => {
  batchStopRequested = true;
  batchStopBtn.disabled = true;
});

init();
