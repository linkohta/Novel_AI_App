interface TabBarItem {
  key: string;
  label: string;
}

interface TabBarProps {
  items: TabBarItem[];
  activeKey: string;
  onChange: (key: string) => void;
}

export default function TabBar({ items, activeKey, onChange }: TabBarProps) {
  return (
    <div className="tab-bar" role="tablist">
      {items.map((item) => (
        <button
          key={item.key}
          type="button"
          role="tab"
          className={item.key === activeKey ? 'tab-button active' : 'tab-button'}
          aria-selected={item.key === activeKey}
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}
