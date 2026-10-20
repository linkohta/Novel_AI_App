import type { ChangeEvent } from 'react';
import BatchSection from './BatchSection';
import PromptQueueSection from './PromptQueueSection';
import type { QueueTemplate, SectionState } from '../types/domain';
import type { UseQueueItemsResult } from '../hooks/useQueueItems';
import type { UseQueueTemplateDraftResult } from '../hooks/useQueueTemplateDraft';
import { handleSingleFile } from '../utils/fileInput';

interface BatchTabProps {
  sectionState: SectionState;
  onSectionToggle: (id: string, open: boolean) => void;
  batchCount: string;
  setBatchCount: (value: string) => void;
  batchInterval: string;
  setBatchInterval: (value: string) => void;
  batchRunning: boolean;
  batchStatus: string;
  onStartBatch: () => void;
  onStopBatch: () => void;
  // useQueueItemsの戻り値をそのまま受け取る（リストのstateとCRUD）。
  queueApi: UseQueueItemsResult;
  // useQueueTemplateDraftの戻り値をそのまま受け取る（テンプレートの保存・適用）。
  queueTemplateApi: UseQueueTemplateDraftResult;
  queueTemplates: QueueTemplate[];
  onDeleteQueueTemplate: (id: string) => void;
  queueInterval: string;
  setQueueInterval: (value: string) => void;
  queueRunning: boolean;
  queueStatus: string;
  onStartQueue: () => void;
  onStopQueue: () => void;
  onFocusField: (key: string) => void;
  onLoadQueueItemImageMetadata: (index: number, e: ChangeEvent<HTMLInputElement>) => void;
}

// 左パネル「連続生成」タブの中身：連続生成・複数プロンプト連続生成。
// 状態は持たず、App.tsxの各フックの戻り値を各セクションへ配線するだけ。
export default function BatchTab({
  sectionState,
  onSectionToggle,
  batchCount,
  setBatchCount,
  batchInterval,
  setBatchInterval,
  batchRunning,
  batchStatus,
  onStartBatch,
  onStopBatch,
  queueApi,
  queueTemplateApi,
  queueTemplates,
  onDeleteQueueTemplate,
  queueInterval,
  setQueueInterval,
  queueRunning,
  queueStatus,
  onStartQueue,
  onStopQueue,
  onFocusField,
  onLoadQueueItemImageMetadata,
}: BatchTabProps) {
  return (
    <>
      <BatchSection
        open={!!sectionState.batchSection}
        onToggle={onSectionToggle}
        batchCount={batchCount}
        setBatchCount={setBatchCount}
        batchInterval={batchInterval}
        setBatchInterval={setBatchInterval}
        onStartBatch={onStartBatch}
        onStopBatch={onStopBatch}
        batchRunning={batchRunning}
        batchStatus={batchStatus}
      />

      <PromptQueueSection
        open={!!sectionState.promptQueueSection}
        onToggle={onSectionToggle}
        queueItems={queueApi.queueItems}
        bulkCount={queueApi.bulkCount}
        setBulkCount={queueApi.setBulkCount}
        onApplyBulkCount={queueApi.applyBulkCount}
        onApplyBulkVibeTransferImage={(e) =>
          handleSingleFile(e, queueApi.applyBulkVibeTransferImage)
        }
        onApplyBulkVibeTransferSetFile={(e) =>
          handleSingleFile(e, queueApi.applyBulkVibeTransferSetFile)
        }
        itemHandlers={{
          onChange: queueApi.updateQueueItemField,
          onRemove: queueApi.removeQueueItem,
          onMoveUp: (index) => queueApi.moveQueueItem(index, -1),
          onMoveDown: (index) => queueApi.moveQueueItem(index, 1),
          onFocusField,
          onAddCharacter: queueApi.addQueueItemCharacter,
          onRemoveCharacter: queueApi.removeQueueItemCharacter,
          onChangeCharacter: queueApi.updateQueueItemCharacterField,
          onLoadImageMetadata: onLoadQueueItemImageMetadata,
          onAddVibeTransferImage: (index, e) =>
            handleSingleFile(e, (file) => queueApi.addQueueItemVibeTransferImage(index, file)),
          onAddVibeTransferSetFile: (index, e) =>
            handleSingleFile(e, (file) => queueApi.addQueueItemVibeTransferSetFile(index, file)),
          onRemoveVibeTransferImage: queueApi.removeQueueItemVibeTransferImage,
          onBalanceVibeTransferStrengths: queueApi.balanceQueueItemVibeTransferStrengths,
          onChangeVibeTransferField: queueApi.updateQueueItemVibeTransferField,
        }}
        onAddItem={queueApi.addQueueItem}
        onClearItems={() => {
          if (window.confirm('複数プロンプト連続生成のリストをすべて削除しますか？')) {
            queueApi.clearQueueItems();
          }
        }}
        queueInterval={queueInterval}
        setQueueInterval={setQueueInterval}
        onStartQueue={onStartQueue}
        onStopQueue={onStopQueue}
        queueRunning={queueRunning}
        queueStatus={queueStatus}
        queueTemplates={queueTemplates}
        onSaveAsQueueTemplate={queueTemplateApi.openQueueTemplateSaveDialog}
        onApplyQueueTemplate={queueTemplateApi.handleApplyQueueTemplate}
        onEditQueueTemplate={queueTemplateApi.openQueueTemplateEditDialog}
        onDeleteQueueTemplate={onDeleteQueueTemplate}
        onExportQueueTemplate={queueTemplateApi.handleExportQueueTemplate}
        onImportQueueTemplateFiles={queueTemplateApi.handleImportQueueTemplateFiles}
      />
    </>
  );
}
