import ModalOverlay from './ModalOverlay';
import type { NamedItem } from '../../types/domain';

interface TemplateEditModalProps {
  draft: NamedItem | null;
  onChange: (draft: NamedItem) => void;
  onCancel: () => void;
  onSave: () => void;
}

export default function TemplateEditModal({
  draft,
  onChange,
  onCancel,
  onSave,
}: TemplateEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>プロンプトテンプレートを編集</h2>
      <label>テンプレート名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as NamedItem), name: e.target.value })}
      />
      <label>テンプレート本文（変数は "変数名" の形式）</label>
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
