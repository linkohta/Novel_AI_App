import ModalOverlay from './ModalOverlay';
import type { NamedItem } from '../../types/domain';

interface ChunkEditModalProps {
  draft: NamedItem | null;
  onChange: (draft: NamedItem) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function ChunkEditModal({ draft, onChange, onCancel, onSave }: ChunkEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>プロンプトチャンクを編集</h2>
      <label>チャンク名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as NamedItem), name: e.target.value })}
      />
      <label>プロンプト</label>
      <textarea
        value={draft?.text || ''}
        onChange={(e) => onChange({ ...(draft as NamedItem), text: e.target.value })}
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
