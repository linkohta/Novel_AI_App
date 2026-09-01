import type { ReactNode } from 'react';

interface SectionProps {
  id: string;
  title: ReactNode;
  open: boolean;
  onToggle: (id: string, open: boolean) => void;
  children: ReactNode;
}

export default function Section({ id, title, open, onToggle, children }: SectionProps) {
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
