import type { Character } from '../types/domain';

interface CharacterCardProps {
  index: number;
  character: Character;
  onChange: (index: number, field: keyof Character, value: string | boolean) => void;
  onRemove: (index: number) => void;
  onFocusField: (key: string) => void;
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
        onFocus={() => onFocusField(`char:${index}:prompt`)}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        value={character.negativePrompt || ''}
        disabled={!enabled}
        onChange={(e) => onChange(index, 'negativePrompt', e.target.value)}
        onFocus={() => onFocusField(`char:${index}:negativePrompt`)}
      />
    </div>
  );
}
