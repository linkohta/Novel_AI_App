import Section from './Section.jsx';
import CharacterCard from './CharacterCard.jsx';

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
  onAddByName,
  nameInputRef,
}) {
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

      <label>組み合わせるチャンク／テンプレート（任意）</label>
      <select value={charNameSource} onChange={(e) => setCharNameSource(e.target.value)}>
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
