import Section from './Section.jsx';

function QueueItemCard({ index, item, onChange, onRemove, onMoveUp, onMoveDown, onFocusField }) {
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
  onFocusField,
  queueInterval,
  setQueueInterval,
  onStartQueue,
  onStopQueue,
  queueRunning,
  queueStatus,
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
        />
      ))}

      <button type="button" onClick={onAddItem} disabled={queueRunning}>
        ＋ プロンプトを追加
      </button>

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
