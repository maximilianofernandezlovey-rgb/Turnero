"use client";

import { ReactNode, useEffect } from "react";

export default function Modal({ title, onClose, children, wide }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
useEffect(() => {
function onKey(e: KeyboardEvent) {
if (e.key === "Escape") onClose();
}
window.addEventListener("keydown", onKey);
return () => window.removeEventListener("keydown", onKey);
}, [onClose]);

return (
<div className="modal-overlay" onClick={onClose} role="presentation">
<div className="modal-panel" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} style={wide ? { width: "min(94vw, 920px)" } : undefined}>
<div className="modal-header">
<strong>{title}</strong>
<button type="button" className="modal-close" onClick={onClose} aria-label="Cerrar">✕</button>
</div>
{children}
</div>
</div>
);
}
