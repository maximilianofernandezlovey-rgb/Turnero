export type BarListItem = { label: string; value: number };

export default function BarList({ items }: { items: BarListItem[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));
  return (
    <div className="bar-list">
      {items.map((item) => (
        <div className="bar-list-row" key={item.label}>
          <span className="muted" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.label}</span>
          <div className="bar-list-track">
            <div className="bar-list-fill" style={{ width: `${Math.round((item.value / max) * 100)}%` }} />
          </div>
          <strong>{item.value}</strong>
        </div>
      ))}
    </div>
  );
}
