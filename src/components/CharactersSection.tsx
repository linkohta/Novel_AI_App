import type { ChangeEvent, ReactNode, RefObject } from 'react';
import Section from './Section';
import CharacterCard from './CharacterCard';
import type { Character, NamedItem } from '../types/domain';

interface CombineSourceSelectProps {
  label: string;
  chunks: NamedItem[];
  templates: NamedItem[];
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
}

function CombineSourceSelect({
  label,
  chunks,
  templates,
  value,
  onChange,
}: CombineSourceSelectProps): ReactNode {
  return (
    <>
      <label>{label}</label>
      <select value={value} onChange={onChange}>
        <option value="">なし</option>
        {chunks.length > 0 && (
          <optgroup label="プロンプトチャンク">
            {chunks.map((chunk) => (
              <option key={chunk.id} value={`chunk:${chunk.id}`}>
                {chunk.name}
              </option>
            ))}
          </optgroup>
        )}
        {templates.length > 0 && (
          <optgroup label="プロンプトテンプレート">
            {templates.map((template) => (
              <option key={template.id} value={`template:${template.id}`}>
                {template.name}
              </option>
            ))}
          </optgroup>
        )}
      </select>
    </>
  );
}

interface CharactersSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  characters: Character[];
  onChangeCharacter: (index: number, field: keyof Character, value: string | boolean) => void;
  onRemoveCharacter: (index: number) => void;
  onAddBlankCharacter: () => void;
  onFocusField: (key: string) => void;
  chunks: NamedItem[];
  templates: NamedItem[];
  charNameByName: string;
  setCharNameByName: (value: string) => void;
  charSeriesByName: string;
  setCharSeriesByName: (value: string) => void;
  charNameSource: string;
  setCharNameSource: (value: string) => void;
  charNameNegativeSource: string;
  setCharNameNegativeSource: (value: string) => void;
  onAddByName: () => void;
  nameInputRef: RefObject<HTMLInputElement | null>;
}

export default function CharactersSection({
  open,
  onToggle,
  characters,
  onChangeCharacter,
  onRemoveCharacter,
  onAddBlankCharacter,
  onFocusField,
  chunks,
  templates,
  charNameByName,
  setCharNameByName,
  charSeriesByName,
  setCharSeriesByName,
  charNameSource,
  setCharNameSource,
  charNameNegativeSource,
  setCharNameNegativeSource,
  onAddByName,
  nameInputRef,
}: CharactersSectionProps) {
  return (
    <Section id="characterSection" title="キャラクタープロンプト" open={open} onToggle={onToggle}>
      <div className="row">
        <div>
          <label>キャラクター名</label>
          <input
            type="text"
            placeholder="hatsune miku"
            value={charNameByName}
            onChange={(e) => setCharNameByName(e.target.value)}
            ref={nameInputRef}
          />
        </div>
        <div>
          <label>作品名（任意）</label>
          <input
            type="text"
            placeholder="vocaloid"
            value={charSeriesByName}
            onChange={(e) => setCharSeriesByName(e.target.value)}
          />
        </div>
      </div>

      <CombineSourceSelect
        label="組み合わせるチャンク／テンプレート（任意）"
        chunks={chunks}
        templates={templates}
        value={charNameSource}
        onChange={(e) => setCharNameSource(e.target.value)}
      />
      <CombineSourceSelect
        label="組み合わせるチャンク／テンプレート（ネガティブプロンプト、任意）"
        chunks={chunks}
        templates={templates}
        value={charNameNegativeSource}
        onChange={(e) => setCharNameNegativeSource(e.target.value)}
      />
      <button type="button" className="secondary" onClick={onAddByName}>
        キャラクター名で追加
      </button>

      <div id="characterList">
        {characters.map((character, index) => (
          <CharacterCard
            key={character.id}
            index={index}
            character={character}
            onChange={onChangeCharacter}
            onRemove={onRemoveCharacter}
            onFocusField={onFocusField}
          />
        ))}
      </div>
      <button type="button" className="secondary" onClick={onAddBlankCharacter}>
        ＋ キャラクターを追加
      </button>
    </Section>
  );
}
