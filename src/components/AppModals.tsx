import type { Dispatch, SetStateAction } from 'react';
import NamedItemEditModal from './modals/NamedItemEditModal';
import TemplateApplyModal from './modals/TemplateApplyModal';
import QueueTemplateEditModal from './modals/QueueTemplateEditModal';
import QueueTemplateApplyModal from './modals/QueueTemplateApplyModal';
import FavNameEditModal from './modals/FavNameEditModal';
import FavCharEditModal from './modals/FavCharEditModal';
import type { TemplateApplyState } from '../types/domain';
import type { UsePromptLibraryResult } from '../hooks/usePromptLibrary';
import type { UseQueueTemplateDraftResult } from '../hooks/useQueueTemplateDraft';
import type { UseFavoritesHandlersResult } from '../hooks/useFavoritesHandlers';

interface AppModalsProps {
  // チャンク／テンプレートの編集ドラフトとテンプレート適用の確定処理。
  promptLibrary: UsePromptLibraryResult;
  // テンプレート適用モーダルの状態（App.tsxが所有。usePromptLibraryとuseCharactersで共有）。
  templateApplyState: TemplateApplyState | null;
  setTemplateApplyState: Dispatch<SetStateAction<TemplateApplyState | null>>;
  // 複数プロンプトテンプレートの編集ドラフト・適用状態。
  queueTemplateApi: UseQueueTemplateDraftResult;
  // お気に入りアーティスト／キャラクター／作品の編集ドラフト。
  favorites: UseFavoritesHandlersResult;
}

// App.tsxが持つ編集・適用系の状態を渡すだけの、モーダル7種のまとめ役。
// 各モーダル自体は状態を持たず、開閉は draft/applyState が truthy かどうかで
// 決まる（ModalOverlay側の条件付きレンダリング）。
export default function AppModals({
  promptLibrary,
  templateApplyState,
  setTemplateApplyState,
  queueTemplateApi,
  favorites,
}: AppModalsProps) {
  return (
    <>
      <NamedItemEditModal
        draft={promptLibrary.chunkEditDraft}
        onChange={promptLibrary.setChunkEditDraft}
        onCancel={() => promptLibrary.setChunkEditDraft(null)}
        onSave={promptLibrary.handleSaveChunkEdit}
        title="プロンプトチャンクを編集"
        nameLabel="チャンク名"
        textLabel="プロンプト"
      />
      <NamedItemEditModal
        draft={promptLibrary.templateEditDraft}
        onChange={promptLibrary.setTemplateEditDraft}
        onCancel={() => promptLibrary.setTemplateEditDraft(null)}
        onSave={promptLibrary.handleSaveTemplateEdit}
        title="プロンプトテンプレートを編集"
        nameLabel="テンプレート名"
        textLabel='テンプレート本文（変数は "変数名" の形式）'
      />
      <TemplateApplyModal
        applyState={templateApplyState}
        onCancel={() => setTemplateApplyState(null)}
        onConfirm={promptLibrary.handleTemplateApplyConfirm}
      />
      <QueueTemplateEditModal
        draft={queueTemplateApi.queueTemplateDraft}
        onChange={queueTemplateApi.setQueueTemplateDraft}
        onChangeRow={queueTemplateApi.updateQueueTemplateDraftRow}
        onChangeCharacter={queueTemplateApi.updateQueueTemplateDraftCharacter}
        onAddRow={queueTemplateApi.addQueueTemplateDraftRow}
        onRemoveRow={queueTemplateApi.removeQueueTemplateDraftRow}
        onAddCharacter={queueTemplateApi.addQueueTemplateDraftCharacter}
        onRemoveCharacter={queueTemplateApi.removeQueueTemplateDraftCharacter}
        onCancel={() => queueTemplateApi.setQueueTemplateDraft(null)}
        onSave={queueTemplateApi.handleSaveQueueTemplate}
      />
      <QueueTemplateApplyModal
        applyState={queueTemplateApi.queueTemplateApplyState}
        onCancel={() => queueTemplateApi.setQueueTemplateApplyState(null)}
        onConfirm={queueTemplateApi.handleQueueTemplateApplyConfirm}
      />
      <FavNameEditModal
        draft={favorites.favArtistEditDraft}
        onChange={favorites.setFavArtistEditDraft}
        onCancel={() => favorites.setFavArtistEditDraft(null)}
        onSave={favorites.handleSaveFavArtistEdit}
        title="お気に入りアーティストを編集"
        label="アーティスト名"
      />
      <FavCharEditModal
        draft={favorites.favCharEditDraft}
        onChange={favorites.setFavCharEditDraft}
        onCancel={() => favorites.setFavCharEditDraft(null)}
        onSave={favorites.handleSaveFavCharEdit}
      />
      <FavNameEditModal
        draft={favorites.favSeriesEditDraft}
        onChange={favorites.setFavSeriesEditDraft}
        onCancel={() => favorites.setFavSeriesEditDraft(null)}
        onSave={favorites.handleSaveFavSeriesEdit}
        title="お気に入り作品を編集"
        label="作品名"
      />
    </>
  );
}
