import type { ReactNode } from 'react';

interface ModalOverlayProps {
  open: boolean;
  children: ReactNode;
}

export default function ModalOverlay({ open, children }: ModalOverlayProps) {
  if (!open) return null;
  return (
    <div className="modal-overlay open">
      <div className="modal">{children}</div>
    </div>
  );
}
