import ModalOverlay from './ModalOverlay';
import TemplateVariableDialog from './TemplateVariableDialog';
import {
  extractTemplateVariables,
  substituteTemplateVariables,
} from '../../utils/templateVariables';
import type { TemplateApplyState } from '../../types/domain';
import type { FavoriteOptionGroup } from '../../utils/favorites';

interface TemplateApplyModalProps {
  applyState: TemplateApplyState | null;
  favoriteOptionGroups: FavoriteOptionGroup[];
  onCancel: () => void;
  onConfirm: (result: string) => void;
}

export default function TemplateApplyModal({
  applyState,
  favoriteOptionGroups,
  onCancel,
  onConfirm,
}: TemplateApplyModalProps) {
  return (
    <ModalOverlay open={!!applyState}>
      {applyState && (
        <TemplateVariableDialog
          key={applyState.template.id}
          fieldsId="templateApplyFields"
          favoriteOptionGroups={favoriteOptionGroups}
          variables={extractTemplateVariables(applyState.template.text)}
          onCancel={onCancel}
          onConfirm={(values) =>
            onConfirm(substituteTemplateVariables(applyState.template.text, values))
          }
        />
      )}
    </ModalOverlay>
  );
}
