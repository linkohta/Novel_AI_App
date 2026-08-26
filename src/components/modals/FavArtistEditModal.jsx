import ModalOverlay from './ModalOverlay.jsx';

export default function FavArtistEditModal({ draft, onChange, onCancel, onSave }) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>お気に入りアーティストを編集</h2>
      <label>アーティスト名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
      />
      <div className="modal-buttons">
        <button type="button" className="secondary" onClick={onCancel}>
          キャンセル
        </button>
        <button type="button" onClick={onSave}>
          保存
        </button>
      </div>
    </ModalOverlay>
  );
}
