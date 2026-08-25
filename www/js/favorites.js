// Favorite artists and favorite characters: save/edit/delete, insert into the
// focused prompt field, and (for characters) populate the "キャラクター名で追加"
// form defined in characters.js.
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
