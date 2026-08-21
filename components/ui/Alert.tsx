import { ReactNode } from "react";

type Tone = "success" | "warning" | "danger" | "info";

const ICONS: Record<Tone, string> = { success: "✓", warning: "⚠", danger: "✕", info: "ℹ" };

export default function Alert({ tone = "info", children }: { tone?: Tone; children: ReactNode }) {
  return (
    <div className={`alert alert-${tone}`} role={tone === "danger" ? "alert" : "status"}>
      <span aria-hidden="true">{ICONS[tone]}</span>
      <div>{children}</div>
    </div>
  );
}
