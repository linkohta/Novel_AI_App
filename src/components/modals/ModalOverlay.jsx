export default function ModalOverlay({ open, children }) {
  if (!open) return null;
  return (
    <div className="modal-overlay open">
      <div className="modal">{children}</div>
    </div>
  );
}
