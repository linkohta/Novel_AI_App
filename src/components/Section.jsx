export default function Section({ id, title, open, onToggle, children }) {
  return (
    <details
      className="section"
      id={id}
      open={open}
      onToggle={(e) => onToggle(id, e.currentTarget.open)}
    >
      <summary>{title}</summary>
      {children}
    </details>
  );
}
