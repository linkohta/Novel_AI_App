import ModalOverlay from './ModalOverlay';
import TemplateVariableDialog from './TemplateVariableDialog';
import {
  extractQueueTemplateVariables,
  substituteQueueTemplateRows,
} from '../../utils/templateVariables';
import type { QueueTemplateApplyState, QueueTemplateRow } from '../../types/domain';
import type { FavoriteOptionGroup } from '../../utils/favorites';

interface QueueTemplateApplyModalProps {
  applyState: QueueTemplateApplyState | null;
  favoriteOptionGroups: FavoriteOptionGroup[];
  onCancel: () => void;
  onConfirm: (rows: QueueTemplateRow[]) => void;
}

export default function QueueTemplateApplyModal({
  applyState,
  favoriteOptionGroups,
  onCancel,
  onConfirm,
}: QueueTemplateApplyModalProps) {
  return (
    <ModalOverlay open={!!applyState}>
      {applyState && (
        <TemplateVariableDialog
          key={applyState.template.id}
          fieldsId="queueTemplateApplyFields"
          favoriteOptionGroups={favoriteOptionGroups}
          variables={extractQueueTemplateVariables(applyState.template.rows)}
          onCancel={onCancel}
          onConfirm={(values) =>
            onConfirm(substituteQueueTemplateRows(applyState.template.rows, values))
          }
        />
      )}
    </ModalOverlay>
  );
}
