import Section from './Section.jsx';
import CharacterCard from './CharacterCard.jsx';

function QueueItemCard({
  index,
  item,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  onFocusField,
  onAddCharacter,
  onRemoveCharacter,
  onChangeCharacter,
}) {
  const characters = item.characters || [];

  return (
    <div className="char-card">
      <button type="button" className="remove-char" onClick={() => onRemove(index)}>
        削除
      </button>

      <div className="row">
        <div>
          <button type="button" className="secondary" onClick={() => onMoveUp(index)}>
            ↑
          </button>
          <button type="button" className="secondary" onClick={() => onMoveDown(index)}>
            ↓
          </button>
        </div>
        <div>
          <label>枚数</label>
          <input
            type="number"
            min="1"
            max="100"
            value={item.count}
            onChange={(e) => onChange(index, 'count', e.target.value)}
          />
        </div>
      </div>

      <label>{`${index + 1}. プロンプト`}</label>
      <textarea
        value={item.prompt}
        onChange={(e) => onChange(index, 'prompt', e.target.value)}
        onFocus={() => onFocusField(`queue:${item.id}:prompt`)}
      />

      <label>ネガティブプロンプト</label>
      <textarea
        value={item.negativePrompt}
        onChange={(e) => onChange(index, 'negativePrompt', e.target.value)}
        onFocus={() => onFocusField(`queue:${item.id}:negativePrompt`)}
      />

      <label>キャラクタープロンプト</label>
      {characters.map((character, charIndex) => (
        <details className="char-fold" key={character.id}>
          <summary>{`キャラクター${charIndex + 1}`}</summary>
          <CharacterCard
            index={charIndex}
            character={character}
            onChange={(ci, field, value) => onChangeCharacter(index, ci, field, value)}
            onRemove={(ci) => onRemoveCharacter(index, ci)}
            onFocusField={(fieldKey) => onFocusField(`queue:${item.id}:${fieldKey}`)}
          />
        </details>
      ))}
      <button type="button" className="secondary" onClick={() => onAddCharacter(index)}>
        ＋ キャラクターを追加
      </button>
    </div>
  );
}

export default function PromptQueueSection({
  open,
  onToggle,
  queueItems,
  onChangeItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onAddItem,
  onAddItemCharacter,
  onRemoveItemCharacter,
  onChangeItemCharacter,
  onFocusField,
  queueInterval,
  setQueueInterval,
  onStartQueue,
  onStopQueue,
  queueRunning,
  queueStatus,
  queueTemplates,
  onSaveAsQueueTemplate,
  onApplyQueueTemplate,
  onEditQueueTemplate,
  onDeleteQueueTemplate,
}) {
  return (
    <Section id="promptQueueSection" title="複数プロンプト連続生成" open={open} onToggle={onToggle}>
      <p className="hint">
        指定した順番でプロンプトを切り替えながら、それぞれ指定した枚数だけ連続生成します。
      </p>

      {queueItems.map((item, index) => (
        <QueueItemCard
          key={item.id}
          index={index}
          item={item}
          onChange={onChangeItem}
          onRemove={onRemoveItem}
          onMoveUp={onMoveItemUp}
          onMoveDown={onMoveItemDown}
          onFocusField={onFocusField}
          onAddCharacter={onAddItemCharacter}
          onRemoveCharacter={onRemoveItemCharacter}
          onChangeCharacter={onChangeItemCharacter}
        />
      ))}

      <button type="button" onClick={onAddItem} disabled={queueRunning}>
        ＋ プロンプトを追加
      </button>

      <label>複数プロンプトテンプレート</label>
      <button
        type="button"
        className="secondary"
        onClick={onSaveAsQueueTemplate}
        disabled={queueRunning}
      >
        現在の内容をテンプレートとして保存
      </button>

      <div id="queueTemplateList">
        {queueTemplates.map((template) => (
          <div className="template-chip" key={template.id}>
            <span className="template-name">{template.name}</span>
            <button
              type="button"
              className="template-apply"
              onClick={() => onApplyQueueTemplate(template)}
              disabled={queueRunning}
            >
              適用
            </button>
            <button
              type="button"
              className="template-edit"
              onClick={() => onEditQueueTemplate(template)}
            >
              編集
            </button>
            <button
              type="button"
              className="template-delete"
              onClick={() => onDeleteQueueTemplate(template.id)}
            >
              削除
            </button>
          </div>
        ))}
      </div>

      <div className="row">
        <div>
          <label>生成間隔（秒）</label>
          <input
            type="number"
            min="1"
            max="120"
            value={queueInterval}
            onChange={(e) => setQueueInterval(e.target.value)}
          />
        </div>
      </div>

      <div className="row">
        <div>
          <button
            type="button"
            onClick={onStartQueue}
            disabled={queueRunning || queueItems.length === 0}
          >
            連続生成する
          </button>
        </div>
        <div>
          <button
            type="button"
            className="secondary"
            onClick={onStopQueue}
            disabled={!queueRunning}
          >
            中断する
          </button>
        </div>
      </div>
      <div id="promptQueueStatus" className="file-info">
        {queueStatus}
      </div>
    </Section>
  );
}
