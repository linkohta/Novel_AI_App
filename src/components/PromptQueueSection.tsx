import type { ChangeEvent } from 'react';
import Section from './Section';
import RunControls from './RunControls';
import QueueItemCard, { type QueueItemHandlers } from './queue/QueueItemCard';
import QueueBulkControls from './queue/QueueBulkControls';
import QueueTemplatePanel from './queue/QueueTemplatePanel';
import type { QueueItem, QueueTemplate } from '../types/domain';

interface PromptQueueSectionProps {
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  queueItems: QueueItem[];
  itemHandlers: QueueItemHandlers;
  bulkCount: string;
  setBulkCount: (value: string) => void;
  onApplyBulkCount: () => void;
  onApplyBulkVibeTransferImage: (e: ChangeEvent<HTMLInputElement>) => void;
  onApplyBulkVibeTransferSetFile: (e: ChangeEvent<HTMLInputElement>) => void;
  onAddItem: () => void;
  onClearItems: () => void;
  queueInterval: string;
  setQueueInterval: (value: string) => void;
  queueFolderName: string;
  setQueueFolderName: (value: string) => void;
  onStartQueue: () => void;
  onStopQueue: () => void;
  queueRunning: boolean;
  queueStatus: string;
  queueTemplates: QueueTemplate[];
  onSaveAsQueueTemplate: () => void;
  onApplyQueueTemplate: (template: QueueTemplate) => void;
  onEditQueueTemplate: (template: QueueTemplate) => void;
  onDeleteQueueTemplate: (id: string) => void;
  onExportQueueTemplate: (template: QueueTemplate) => void;
  onImportQueueTemplateFiles: (files: File[]) => void;
}

// 「複数プロンプト連続生成」セクション。全行一括操作（QueueBulkControls）・
// 行カード（QueueItemCard）・複数プロンプトテンプレート（QueueTemplatePanel）・
// 実行操作（RunControls）を組み合わせる。
export default function PromptQueueSection({
  open,
  onToggle,
  queueItems,
  itemHandlers,
  bulkCount,
  setBulkCount,
  onApplyBulkCount,
  onApplyBulkVibeTransferImage,
  onApplyBulkVibeTransferSetFile,
  onAddItem,
  onClearItems,
  queueInterval,
  setQueueInterval,
  queueFolderName,
  setQueueFolderName,
  onStartQueue,
  onStopQueue,
  queueRunning,
  queueStatus,
  queueTemplates,
  onSaveAsQueueTemplate,
  onApplyQueueTemplate,
  onEditQueueTemplate,
  onDeleteQueueTemplate,
  onExportQueueTemplate,
  onImportQueueTemplateFiles,
}: PromptQueueSectionProps) {
  return (
    <Section id="promptQueueSection" title="複数プロンプト連続生成" open={open} onToggle={onToggle}>
      <p className="hint">
        指定した順番でプロンプトを切り替えながら、それぞれ指定した枚数だけ連続生成します。
      </p>

      <QueueBulkControls
        bulkCount={bulkCount}
        setBulkCount={setBulkCount}
        onApplyBulkCount={onApplyBulkCount}
        onApplyBulkVibeTransferImage={onApplyBulkVibeTransferImage}
        onApplyBulkVibeTransferSetFile={onApplyBulkVibeTransferSetFile}
      />

      {queueItems.map((item, index) => (
        <QueueItemCard key={item.id} index={index} item={item} handlers={itemHandlers} />
      ))}

      <div className="row">
        <div>
          <button type="button" onClick={onAddItem} disabled={queueRunning}>
            ＋ プロンプトを追加
          </button>
        </div>
        <div>
          <button
            type="button"
            className="secondary"
            onClick={onClearItems}
            disabled={queueRunning}
          >
            全行を削除
          </button>
        </div>
      </div>

      <QueueTemplatePanel
        queueTemplates={queueTemplates}
        queueRunning={queueRunning}
        onSaveAsQueueTemplate={onSaveAsQueueTemplate}
        onApplyQueueTemplate={onApplyQueueTemplate}
        onEditQueueTemplate={onEditQueueTemplate}
        onDeleteQueueTemplate={onDeleteQueueTemplate}
        onExportQueueTemplate={onExportQueueTemplate}
        onImportQueueTemplateFiles={onImportQueueTemplateFiles}
      />

      <label>保存先フォルダ名（任意）</label>
      <input
        type="text"
        placeholder="queue"
        value={queueFolderName}
        onChange={(e) => setQueueFolderName(e.target.value)}
        disabled={queueRunning}
      />
      <p className="hint">
        生成画像は保存先フォルダ内の「フォルダ名_タイムスタンプ」フォルダにまとめて保存されます（未入力時は「queue_タイムスタンプ」）。
      </p>

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

      <RunControls
        running={queueRunning}
        startDisabled={queueItems.length === 0}
        onStart={onStartQueue}
        onStop={onStopQueue}
        status={queueStatus}
        statusId="promptQueueStatus"
      />
    </Section>
  );
}
