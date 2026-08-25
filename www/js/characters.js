// Character prompt cards: manual add/remove, and the "キャラクター名で追加"
// (add-by-name) form that can combine a name/series with a saved chunk or
// template. Depends on globals from state.js and openTemplateApplyModal from
// templates.js (only referenced inside click callbacks, so load order between
// characters.js and templates.js does not matter).
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

function populateCharacterFieldsFromFavorite(favorite) {
  charNameByNameEl.value = favorite.name;
  charSeriesByNameEl.value = favorite.series || '';
  characterSectionEl.open = true;
  charNameByNameEl.focus();
}
