import ModalOverlay from './ModalOverlay';
import ModalButtons from './ModalButtons';
import CharacterCard from '../CharacterCard';
import type {
  QueueTemplateDraft,
  QueueTemplateDraftCharacter,
  QueueTemplateDraftRow,
} from '../../types/domain';

type RowField = 'prompt' | 'negativePrompt';
type CharacterField = keyof QueueTemplateDraftCharacter;

interface QueueTemplateRowFieldsProps {
  row: QueueTemplateDraftRow;
  rowIndex: number;
  onChangeRow: (rowIndex: number, field: RowField, value: string) => void;
  onRemoveRow: (rowIndex: number) => void;
  onChangeCharacter: (
    rowIndex: number,
    charIndex: number,
    field: CharacterField,
    value: string | boolean
  ) => void;
  onAddCharacter: (rowIndex: number) => void;
  onRemoveCharacter: (rowIndex: number, charIndex: number) => void;
}

function QueueTemplateRowFields({
  row,
  rowIndex,
  onChangeRow,
  onRemoveRow,
  onChangeCharacter,
  onAddCharacter,
  onRemoveCharacter,
}: QueueTemplateRowFieldsProps) {
  return (
    <div className="char-card">
      <button type="button" className="remove-char" onClick={() => onRemoveRow(rowIndex)}>
        削除
      </button>

      <label>{`${rowIndex + 1}. プロンプト`}</label>
      <textarea
        value={row.prompt || ''}
        onChange={(e) => onChangeRow(rowIndex, 'prompt', e.target.value)}
      />
      <label>ネガティブプロンプト</label>
      <textarea
        value={row.negativePrompt || ''}
        onChange={(e) => onChangeRow(rowIndex, 'negativePrompt', e.target.value)}
      />

      {/* 行数・キャラクター数が増えてもダイアログが縦に長くなりすぎないよう、
          各キャラクターは既定で折りたたむ（複数プロンプト連続生成の行と同じ構成）。 */}
      {(row.characters || []).map((character, charIndex) => (
        <details className="char-fold" key={charIndex}>
          <summary>{`キャラクター${charIndex + 1}`}</summary>
          <CharacterCard
            index={charIndex}
            character={character}
            onChange={(ci, field, value) => onChangeCharacter(rowIndex, ci, field, value)}
            onRemove={(ci) => onRemoveCharacter(rowIndex, ci)}
          />
        </details>
      ))}
      <button type="button" className="secondary" onClick={() => onAddCharacter(rowIndex)}>
        ＋ キャラクターを追加
      </button>
    </div>
  );
}

interface QueueTemplateEditModalProps {
  draft: QueueTemplateDraft | null;
  onChange: (draft: QueueTemplateDraft) => void;
  onChangeRow: QueueTemplateRowFieldsProps['onChangeRow'];
  onRemoveRow: QueueTemplateRowFieldsProps['onRemoveRow'];
  onChangeCharacter: QueueTemplateRowFieldsProps['onChangeCharacter'];
  onAddRow: () => void;
  onAddCharacter: QueueTemplateRowFieldsProps['onAddCharacter'];
  onRemoveCharacter: QueueTemplateRowFieldsProps['onRemoveCharacter'];
  onCancel: () => void;
  onSave: () => void;
}

export default function QueueTemplateEditModal({
  draft,
  onChange,
  onChangeRow,
  onRemoveRow,
  onChangeCharacter,
  onAddRow,
  onAddCharacter,
  onRemoveCharacter,
  onCancel,
  onSave,
}: QueueTemplateEditModalProps) {
  return (
    <ModalOverlay open={!!draft}>
      <h2>{draft?.id ? '複数プロンプトテンプレートを編集' : '複数プロンプトテンプレートを保存'}</h2>
      <p className="hint">
        プロンプト行を追加・編集し、変数にしたい箇所を "変数名"
        の形式で置き換えてから保存してください。
      </p>
      <label>テンプレート名</label>
      <input
        type="text"
        value={draft?.name || ''}
        onChange={(e) => onChange({ ...(draft as QueueTemplateDraft), name: e.target.value })}
      />
      {(draft?.rows || []).map((row, rowIndex) => (
        <QueueTemplateRowFields
          key={rowIndex}
          row={row}
          rowIndex={rowIndex}
          onChangeRow={onChangeRow}
          onRemoveRow={onRemoveRow}
          onChangeCharacter={onChangeCharacter}
          onAddCharacter={onAddCharacter}
          onRemoveCharacter={onRemoveCharacter}
        />
      ))}
      <button type="button" onClick={onAddRow}>
        ＋ プロンプトを追加
      </button>
      <ModalButtons onCancel={onCancel} onConfirm={onSave} />
    </ModalOverlay>
  );
}
