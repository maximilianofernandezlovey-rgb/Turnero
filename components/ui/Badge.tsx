import { ReactNode } from "react";
import { StatusTone } from "../../lib/turnDisplay";

export default function Badge({ tone = "neutral", children, className = "" }: { tone?: StatusTone; children: ReactNode; className?: string }) {
  return <span className={`badge badge-${tone} ${className}`.trim()}>{children}</span>;
}

export function CategoryBadge({ index, children }: { index: number; children: ReactNode }) {
  return <span className={`badge badge-cat-${index % 4}`}>{children}</span>;
}
