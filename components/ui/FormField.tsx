import { ReactNode } from "react";

export default function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={{ display: "grid", gap: 7, fontWeight: 750 }}>
      {label}
      {children}
    </label>
  );
}
