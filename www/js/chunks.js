// Prompt chunks: save/edit/delete, and click-to-insert into the focused field.
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
    insertSpan.addEventListener('click', () => insertIntoFocusedField(chunk.text));

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
