import type { Dispatch, SetStateAction } from 'react';
import ChunkEditModal from './modals/ChunkEditModal';
import TemplateEditModal from './modals/TemplateEditModal';
import TemplateApplyModal from './modals/TemplateApplyModal';
import QueueTemplateEditModal from './modals/QueueTemplateEditModal';
import QueueTemplateApplyModal from './modals/QueueTemplateApplyModal';
import FavArtistEditModal from './modals/FavArtistEditModal';
import FavCharEditModal from './modals/FavCharEditModal';
import type {
  FavoriteArtist,
  FavoriteCharacter,
  NamedItem,
  QueueTemplateApplyState,
  QueueTemplateDraft,
  QueueTemplateDraftCharacter,
  QueueTemplateRow,
  TemplateApplyState,
} from '../types/domain';

interface AppModalsProps {
  chunkEditDraft: NamedItem | null;
  setChunkEditDraft: Dispatch<SetStateAction<NamedItem | null>>;
  handleSaveChunkEdit: () => void;
  templateEditDraft: NamedItem | null;
  setTemplateEditDraft: Dispatch<SetStateAction<NamedItem | null>>;
  handleSaveTemplateEdit: () => void;
  templateApplyState: TemplateApplyState | null;
  setTemplateApplyState: Dispatch<SetStateAction<TemplateApplyState | null>>;
  handleTemplateApplyConfirm: (result: string) => void;
  queueTemplateDraft: QueueTemplateDraft | null;
  setQueueTemplateDraft: Dispatch<SetStateAction<QueueTemplateDraft | null>>;
  updateQueueTemplateDraftRow: (
    rowIndex: number,
    field: 'prompt' | 'negativePrompt',
    value: string
  ) => void;
  updateQueueTemplateDraftCharacter: (
    rowIndex: number,
    charIndex: number,
    field: keyof QueueTemplateDraftCharacter,
    value: string | boolean
  ) => void;
  addQueueTemplateDraftRow: () => void;
  removeQueueTemplateDraftRow: (rowIndex: number) => void;
  addQueueTemplateDraftCharacter: (rowIndex: number) => void;
  removeQueueTemplateDraftCharacter: (rowIndex: number, charIndex: number) => void;
  handleSaveQueueTemplate: () => void;
  queueTemplateApplyState: QueueTemplateApplyState | null;
  setQueueTemplateApplyState: Dispatch<SetStateAction<QueueTemplateApplyState | null>>;
  handleQueueTemplateApplyConfirm: (rows: QueueTemplateRow[]) => void;
  favArtistEditDraft: FavoriteArtist | null;
  setFavArtistEditDraft: Dispatch<SetStateAction<FavoriteArtist | null>>;
  handleSaveFavArtistEdit: () => void;
  favCharEditDraft: FavoriteCharacter | null;
  setFavCharEditDraft: Dispatch<SetStateAction<FavoriteCharacter | null>>;
  handleSaveFavCharEdit: () => void;
}

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
}: AppModalsProps) {
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
