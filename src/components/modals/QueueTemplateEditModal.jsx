import ModalOverlay from './ModalOverlay.jsx';

function QueueTemplateRowFields({
  row,
  rowIndex,
  onChangeRow,
  onRemoveRow,
  onChangeCharacter,
  onAddCharacter,
  onRemoveCharacter,
}) {
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

      {(row.characters || []).map((character, charIndex) => (
        <details className="char-card" key={charIndex}>
          <summary>{`キャラクター${charIndex + 1}`}</summary>
          <button
            type="button"
            className="remove-char"
            onClick={() => onRemoveCharacter(rowIndex, charIndex)}
          >
            削除
          </button>
          <label className="char-enable">
            <input
              type="checkbox"
              checked={character.enabled !== false}
              onChange={(e) => onChangeCharacter(rowIndex, charIndex, 'enabled', e.target.checked)}
            />
            {`キャラクター${charIndex + 1} を有効にする`}
          </label>
          <label>{`キャラクター${charIndex + 1} プロンプト`}</label>
          <textarea
            value={character.prompt || ''}
            onChange={(e) => onChangeCharacter(rowIndex, charIndex, 'prompt', e.target.value)}
          />
          <label>ネガティブプロンプト</label>
          <textarea
            value={character.negativePrompt || ''}
            onChange={(e) =>
              onChangeCharacter(rowIndex, charIndex, 'negativePrompt', e.target.value)
            }
          />
        </details>
      ))}
      <button type="button" className="secondary" onClick={() => onAddCharacter(rowIndex)}>
        ＋ キャラクターを追加
      </button>
    </div>
  );
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
}) {
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
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
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
