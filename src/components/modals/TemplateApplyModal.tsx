import ModalOverlay from './ModalOverlay';
import TemplateVariableDialog from './TemplateVariableDialog';
import {
  extractTemplateVariables,
  substituteTemplateVariables,
} from '../../utils/templateVariables';
import type { TemplateApplyState } from '../../types/domain';

interface TemplateApplyModalProps {
  applyState: TemplateApplyState | null;
  onCancel: () => void;
  onConfirm: (result: string) => void;
}

export default function TemplateApplyModal({
  applyState,
  onCancel,
  onConfirm,
}: TemplateApplyModalProps) {
  return (
    <ModalOverlay open={!!applyState}>
      {applyState && (
        <TemplateVariableDialog
          key={applyState.template.id}
          fieldsId="templateApplyFields"
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
