export type NavRailItem<T extends string> = { id: T; label: string };

export default function NavRail<T extends string>({ items, active, onSelect }: { items: NavRailItem<T>[]; active: T; onSelect: (id: T) => void }) {
  return (
    <nav className="nav-rail" aria-label="Secciones de administración">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          className={`nav-rail-item ${item.id === active ? "active" : ""}`.trim()}
          aria-current={item.id === active ? "page" : undefined}
          onClick={() => onSelect(item.id)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
