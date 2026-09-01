import ChunkEditModal from './modals/ChunkEditModal.jsx';
import TemplateEditModal from './modals/TemplateEditModal.jsx';
import TemplateApplyModal from './modals/TemplateApplyModal.jsx';
import QueueTemplateEditModal from './modals/QueueTemplateEditModal.jsx';
import QueueTemplateApplyModal from './modals/QueueTemplateApplyModal.jsx';
import FavArtistEditModal from './modals/FavArtistEditModal.jsx';
import FavCharEditModal from './modals/FavCharEditModal.jsx';

// App.jsxが持つ編集・適用系の状態を渡すだけの、モーダル7種のまとめ役。
// 各モーダル自体は状態を持たず、開閉は draft/applyState が truthy かどうかで
// 決まる（ModalOverlay側の条件付きレンダリング）。
export default function AppModals({
  chunkEditDraft,
  setChunkEditDraft,
  handleSaveChunkEdit,
  templateEditDraft,
  setTemplateEditDraft,
  handleSaveTemplateEdit,
  templateApplyState,
  setTemplateApplyState,
  handleTemplateApplyConfirm,
  queueTemplateDraft,
  setQueueTemplateDraft,
  updateQueueTemplateDraftRow,
  updateQueueTemplateDraftCharacter,
  addQueueTemplateDraftRow,
  removeQueueTemplateDraftRow,
  addQueueTemplateDraftCharacter,
  removeQueueTemplateDraftCharacter,
  handleSaveQueueTemplate,
  queueTemplateApplyState,
  setQueueTemplateApplyState,
  handleQueueTemplateApplyConfirm,
  favArtistEditDraft,
  setFavArtistEditDraft,
  handleSaveFavArtistEdit,
  favCharEditDraft,
  setFavCharEditDraft,
  handleSaveFavCharEdit,
}) {
  return (
    <>
      <ChunkEditModal
        draft={chunkEditDraft}
        onChange={setChunkEditDraft}
        onCancel={() => setChunkEditDraft(null)}
        onSave={handleSaveChunkEdit}
      />
      <TemplateEditModal
        draft={templateEditDraft}
        onChange={setTemplateEditDraft}
        onCancel={() => setTemplateEditDraft(null)}
        onSave={handleSaveTemplateEdit}
      />
      <TemplateApplyModal
        applyState={templateApplyState}
        onCancel={() => setTemplateApplyState(null)}
        onConfirm={handleTemplateApplyConfirm}
      />
      <QueueTemplateEditModal
        draft={queueTemplateDraft}
        onChange={setQueueTemplateDraft}
        onChangeRow={updateQueueTemplateDraftRow}
        onChangeCharacter={updateQueueTemplateDraftCharacter}
        onAddRow={addQueueTemplateDraftRow}
        onRemoveRow={removeQueueTemplateDraftRow}
        onAddCharacter={addQueueTemplateDraftCharacter}
        onRemoveCharacter={removeQueueTemplateDraftCharacter}
        onCancel={() => setQueueTemplateDraft(null)}
        onSave={handleSaveQueueTemplate}
      />
      <QueueTemplateApplyModal
        applyState={queueTemplateApplyState}
        onCancel={() => setQueueTemplateApplyState(null)}
        onConfirm={handleQueueTemplateApplyConfirm}
      />
      <FavArtistEditModal
        draft={favArtistEditDraft}
        onChange={setFavArtistEditDraft}
        onCancel={() => setFavArtistEditDraft(null)}
        onSave={handleSaveFavArtistEdit}
      />
      <FavCharEditModal
        draft={favCharEditDraft}
        onChange={setFavCharEditDraft}
        onCancel={() => setFavCharEditDraft(null)}
        onSave={handleSaveFavCharEdit}
      />
    </>
  );
}
