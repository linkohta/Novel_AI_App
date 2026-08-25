// Shared DOM references, mutable state, and small helpers used across the other
// www/js/*.js files. This script must be loaded FIRST (see index.html) — the
// other feature scripts are plain, non-module scripts that rely on the globals
// declared here already existing by the time their own top-level code runs.
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

function trackFocus(el) {
  el.addEventListener('focus', () => {
    lastFocusedTextarea = el;
  });
}

trackFocus(promptEl);
trackFocus(negativePromptEl);

function insertIntoFocusedField(text) {
  const target = lastFocusedTextarea || promptEl;
  const sep = target.value.trim() ? ', ' : '';
  target.value = `${target.value}${sep}${text}`;
  target.dispatchEvent(new Event('change'));
}

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

sectionEls.forEach((el) => el.addEventListener('toggle', persistSettings));
fields.forEach((el) => el.addEventListener('change', persistSettings));
