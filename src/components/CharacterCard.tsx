// キャラクタープロンプト1件分の入力カード（有効チェック・プロンプト・
// ネガティブプロンプト・削除）。左パネルのキャラクター一覧・複数プロンプト
// 連続生成の行ごとのキャラクター・複数プロンプトテンプレートの編集ダイアログ
// の3か所で共用する。テンプレートのドラフトはidを持たないため、idに依存せず
// 表示に必要な3フィールドだけを受け取る。
export interface CharacterCardValue {
  prompt?: string;
  negativePrompt?: string;
  enabled?: boolean;
}

interface CharacterCardProps {
  index: number;
  character: CharacterCardValue;
  onChange: (
    index: number,
    field: 'prompt' | 'negativePrompt' | 'enabled',
    value: string | boolean
  ) => void;
  onRemove: (index: number) => void;
  // チャンク／テンプレート挿入先の追跡用。挿入対象にならない編集ダイアログでは省略する。
  onFocusField?: (key: string) => void;
}

export default function CharacterCard({
  index,
  character,
  onChange,
  onRemove,
  onFocusField,
}: CharacterCardProps) {
  const enabled = character.enabled !== false;

  return (
    <div className={`char-card${enabled ? '' : ' char-disabled'}`}>
      <button type="button" className="remove-char" onClick={() => onRemove(index)}>
        削除
      </button>

      <label className="char-enable">
        <input
          type="checkbox"
          checked={enabled}
          onChange={(e) => onChange(index, 'enabled', e.target.checked)}
        />
        {`キャラクター${index + 1} を有効にする`}
      </label>

      <label>{`キャラクター${index + 1} プロンプト`}</label>
      <textarea
        value={character.prompt || ''}
        disabled={!enabled}
        onChange={(e) => onChange(index, 'prompt', e.target.value)}
        onFocus={() => onFocusField?.(`char:${index}:prompt`)}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        value={character.negativePrompt || ''}
        disabled={!enabled}
        onChange={(e) => onChange(index, 'negativePrompt', e.target.value)}
        onFocus={() => onFocusField?.(`char:${index}:negativePrompt`)}
      />
    </div>
  );
}
