import ModalOverlay from './ModalOverlay.jsx';

export default function ChunkEditModal({ draft, onChange, onCancel, onSave }) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>プロンプトチャンクを編集</h2>
      <label>チャンク名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
      />
      <label>プロンプト</label>
      <textarea
        value={draft?.text || ''}
        onChange={(e) => onChange({ ...draft, text: e.target.value })}
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
