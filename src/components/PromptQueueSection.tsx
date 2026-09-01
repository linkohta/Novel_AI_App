import type { ChangeEvent } from 'react';
import Section from './Section';
import CharacterCard from './CharacterCard';
import type { QueueCharacter, QueueItem, QueueTemplate } from '../types/domain';

interface QueueItemCardProps {
  index: number;
  item: QueueItem;
  onChange: (index: number, field: 'prompt' | 'negativePrompt' | 'count', value: string) => void;
  onRemove: (index: number) => void;
  onMoveUp: (index: number) => void;
  onMoveDown: (index: number) => void;
  onFocusField: (key: string) => void;
  onAddCharacter: (index: number) => void;
  onRemoveCharacter: (index: number, charIndex: number) => void;
  onChangeCharacter: (
    index: number,
    charIndex: number,
    field: keyof QueueCharacter,
    value: string | boolean
  ) => void;
  onLoadImageMetadata: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
}

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
  onLoadImageMetadata,
}: QueueItemCardProps) {
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

      <label>画像から読み込み</label>
      <p className="hint">
        NovelAIで生成されたPNG画像を選択すると、この行のプロンプト・ネガティブプロンプト・キャラクタープロンプトを読み込んだ内容で置き換えます。
      </p>
      <input type="file" accept="image/png" onChange={(e) => onLoadImageMetadata(index, e)} />

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

interface PromptQueueSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  queueItems: QueueItem[];
  bulkCount: string;
  setBulkCount: (value: string) => void;
  onApplyBulkCount: () => void;
  onChangeItem: QueueItemCardProps['onChange'];
  onRemoveItem: (index: number) => void;
  onMoveItemUp: (index: number) => void;
  onMoveItemDown: (index: number) => void;
  onAddItem: () => void;
  onAddItemCharacter: (index: number) => void;
  onRemoveItemCharacter: (index: number, charIndex: number) => void;
  onChangeItemCharacter: QueueItemCardProps['onChangeCharacter'];
  onLoadItemImageMetadata: QueueItemCardProps['onLoadImageMetadata'];
  onFocusField: (key: string) => void;
  queueInterval: string;
  setQueueInterval: (value: string) => void;
  onStartQueue: () => void;
  onStopQueue: () => void;
  queueRunning: boolean;
  queueStatus: string;
  queueTemplates: QueueTemplate[];
  onSaveAsQueueTemplate: () => void;
  onApplyQueueTemplate: (template: QueueTemplate) => void;
  onEditQueueTemplate: (template: QueueTemplate) => void;
  onDeleteQueueTemplate: (id: string) => void;
}

export default function PromptQueueSection({
  open,
  onToggle,
  queueItems,
  bulkCount,
  setBulkCount,
  onApplyBulkCount,
  onChangeItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onAddItem,
  onAddItemCharacter,
  onRemoveItemCharacter,
  onChangeItemCharacter,
  onLoadItemImageMetadata,
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
}: PromptQueueSectionProps) {
  return (
    <Section id="promptQueueSection" title="複数プロンプト連続生成" open={open} onToggle={onToggle}>
      <p className="hint">
        指定した順番でプロンプトを切り替えながら、それぞれ指定した枚数だけ連続生成します。
      </p>

      <div className="row">
        <div>
          <label>生成枚数を全行にまとめて指定</label>
          <input
            type="number"
            min="1"
            max="100"
            value={bulkCount}
            onChange={(e) => setBulkCount(e.target.value)}
          />
        </div>
        <div>
          <button type="button" className="secondary" onClick={onApplyBulkCount}>
            全行に反映
          </button>
        </div>
      </div>

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
          onLoadImageMetadata={onLoadItemImageMetadata}
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
