// App bootstrap: restores persisted settings, wires the single-image "生成する"
// button, and renders generation history. Must be the LAST <script> loaded
// (see index.html) since init() assumes every other www/js/*.js file has
// already registered its state and event listeners.
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

init();
