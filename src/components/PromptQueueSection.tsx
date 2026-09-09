import type { ChangeEvent } from 'react';
import Section from './Section';
import CharacterCard from './CharacterCard';
import type { QueueCharacter, QueueItem, QueueTemplate, VibeTransferImage } from '../types/domain';

interface QueueVibeTransferCardProps {
  image: VibeTransferImage;
  onChangeField: (
    id: string,
    field: 'informationExtracted' | 'referenceStrength',
    value: number
  ) => void;
  onRemove: (id: string) => void;
}

function QueueVibeTransferCard({ image, onChangeField, onRemove }: QueueVibeTransferCardProps) {
  const isVibeFile = image.source === 'vibeFile';
  return (
    <div className="char-card">
      <button type="button" className="remove-char" onClick={() => onRemove(image.id)}>
        削除
      </button>
      {isVibeFile ? (
        <div
          style={{
            width: '120px',
            height: '120px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '8px',
            border: '1px dashed #888',
            fontSize: '12px',
            textAlign: 'center',
          }}
        >
          ポーションセット
        </div>
      ) : (
        <img
          src={`data:image/png;base64,${image.image}`}
          alt="参照画像"
          style={{ maxWidth: '120px', maxHeight: '120px', display: 'block', marginBottom: '8px' }}
        />
      )}
      {isVibeFile ? (
        <>
          <label>Information Extracted（{image.informationExtracted.toFixed(2)}）</label>
          <p className="hint">ポーションセットファイルに含まれる値のため変更できません。</p>
        </>
      ) : (
        <>
          <label>Information Extracted（{image.informationExtracted.toFixed(2)}）</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={image.informationExtracted}
            onChange={(e) =>
              onChangeField(image.id, 'informationExtracted', Number(e.target.value))
            }
          />
        </>
      )}
      <label>Reference Strength（{image.referenceStrength.toFixed(2)}）</label>
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={image.referenceStrength}
        onChange={(e) => onChangeField(image.id, 'referenceStrength', Number(e.target.value))}
      />
    </div>
  );
}

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
  onAddVibeTransferImage: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onAddVibeTransferSetFile: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
  onRemoveVibeTransferImage: (index: number, vibeId: string) => void;
  onChangeVibeTransferField: (
    index: number,
    vibeId: string,
    field: 'informationExtracted' | 'referenceStrength',
    value: number
  ) => void;
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
  onAddVibeTransferImage,
  onAddVibeTransferSetFile,
  onRemoveVibeTransferImage,
  onChangeVibeTransferField,
}: QueueItemCardProps) {
  const characters = item.characters || [];
  const vibeTransferImages = item.vibeTransferImages || [];
  const previewText = item.prompt.trim() || '(プロンプト未入力)';

  return (
    <details className="char-card">
      <summary>{`${index + 1}. ${previewText}`}</summary>
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

      <details className="char-fold">
        <summary>AIポーション（Vibe Transfer）</summary>
        {vibeTransferImages.map((image) => (
          <QueueVibeTransferCard
            key={image.id}
            image={image}
            onChangeField={(vibeId, field, value) =>
              onChangeVibeTransferField(index, vibeId, field, value)
            }
            onRemove={(vibeId) => onRemoveVibeTransferImage(index, vibeId)}
          />
        ))}
        <label>＋ 参照画像を追加</label>
        <input type="file" accept="image/*" onChange={(e) => onAddVibeTransferImage(index, e)} />
        <label>＋ ポーションセットファイルを読み込む（.naiv4vibe / .naiv4vibeBundle）</label>
        <input
          type="file"
          accept=".naiv4vibe,.naiv4vibebundle,.naiv4vibeBundle"
          onChange={(e) => onAddVibeTransferSetFile(index, e)}
        />
      </details>
    </details>
  );
}

interface PromptQueueSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  queueItems: QueueItem[];
  bulkCount: string;
  setBulkCount: (value: string) => void;
  onApplyBulkCount: () => void;
  onApplyBulkVibeTransferImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onApplyBulkVibeTransferSetFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onChangeItem: QueueItemCardProps['onChange'];
  onRemoveItem: (index: number) => void;
  onMoveItemUp: (index: number) => void;
  onMoveItemDown: (index: number) => void;
  onAddItem: () => void;
  onAddItemCharacter: (index: number) => void;
  onRemoveItemCharacter: (index: number, charIndex: number) => void;
  onChangeItemCharacter: QueueItemCardProps['onChangeCharacter'];
  onLoadItemImageMetadata: QueueItemCardProps['onLoadImageMetadata'];
  onAddItemVibeTransferImage: QueueItemCardProps['onAddVibeTransferImage'];
  onAddItemVibeTransferSetFile: QueueItemCardProps['onAddVibeTransferSetFile'];
  onRemoveItemVibeTransferImage: QueueItemCardProps['onRemoveVibeTransferImage'];
  onChangeItemVibeTransferField: QueueItemCardProps['onChangeVibeTransferField'];
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
  onApplyBulkVibeTransferImage,
  onApplyBulkVibeTransferSetFile,
  onChangeItem,
  onRemoveItem,
  onMoveItemUp,
  onMoveItemDown,
  onAddItem,
  onAddItemCharacter,
  onRemoveItemCharacter,
  onChangeItemCharacter,
  onLoadItemImageMetadata,
  onAddItemVibeTransferImage,
  onAddItemVibeTransferSetFile,
  onRemoveItemVibeTransferImage,
  onChangeItemVibeTransferField,
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

      <label>AIポーション（Vibe Transfer）を全行にまとめて追加</label>
      <p className="hint">
        選択した参照画像・ポーションセットファイルを、既存の行ごとの参照画像は残したまま全行に追加します。
      </p>
      <div className="row">
        <div>
          <label>＋ 参照画像を全行に追加</label>
          <input type="file" accept="image/*" onChange={onApplyBulkVibeTransferImage} />
        </div>
        <div>
          <label>＋ ポーションセットファイルを全行に追加（.naiv4vibe / .naiv4vibeBundle）</label>
          <input
            type="file"
            accept=".naiv4vibe,.naiv4vibebundle,.naiv4vibeBundle"
            onChange={onApplyBulkVibeTransferSetFile}
          />
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
          onAddVibeTransferImage={onAddItemVibeTransferImage}
          onAddVibeTransferSetFile={onAddItemVibeTransferSetFile}
          onRemoveVibeTransferImage={onRemoveItemVibeTransferImage}
          onChangeVibeTransferField={onChangeItemVibeTransferField}
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
