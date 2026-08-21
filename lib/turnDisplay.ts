// Helpers puramente de presentación (mapeo estado→color/emoji, formateo de
// tiempo). No calculan ni inventan datos: solo interpretan lo que ya
// devuelven las APIs existentes.

export type TurnState = "esperando" | "proximo" | "llamado" | "en_atencion" | "finalizado" | "ausente" | "cancelado" | "transferido";

export type StatusTone = "success" | "warning" | "info" | "danger" | "neutral";

const STATE_LABELS: Record<string, string> = {
  esperando: "En espera",
  llamado: "Te están llamando",
  en_atencion: "En atención",
  finalizado: "Atención finalizada",
  ausente: "Ausente",
  cancelado: "Cancelado",
  transferido: "Transferido",
};

export function statusLabel(status?: string): string {
  if (!status) return "En espera";
  return STATE_LABELS[status] || status;
}

// Deriva el "estado visual" combinando status real + people_ahead real
// (sin inventar un estado que el backend no reporta).
export function visualStage(status?: string, peopleAhead?: number): "esperando" | "proximo" | "llamado" | "en_atencion" | "finalizado" | "otro" {
  if (status === "llamado") return "llamado";
  if (status === "en_atencion") return "en_atencion";
  if (status === "finalizado") return "finalizado";
  if (status === "esperando") {
    if (typeof peopleAhead === "number" && peopleAhead <= 1) return "proximo";
    return "esperando";
  }
  return "otro";
}

export function toneForStatus(status?: string): StatusTone {
  switch (status) {
    case "esperando":
      return "success";
    case "llamado":
    case "en_atencion":
      return "info";
    case "finalizado":
      return "success";
    case "ausente":
    case "cancelado":
      return "danger";
    case "transferido":
      return "warning";
    default:
      return "neutral";
  }
}

// Paleta de color por categoría (distinta de la semántica de estado, para
// no confundir "trámite" con "estado"). Determinística por prefijo.
const CATEGORY_PALETTE_SIZE = 4;
export function categoryToneIndex(prefixOrId: string): number {
  let hash = 0;
  for (let i = 0; i < prefixOrId.length; i++) hash = (hash * 31 + prefixOrId.charCodeAt(i)) >>> 0;
  return hash % CATEGORY_PALETTE_SIZE;
}

export function formatMinutes(minutes?: number | null): string {
  if (minutes == null) return "—";
  if (minutes < 1) return "menos de 1 min";
  return `${minutes} min`;
}

export function formatElapsed(fromIso?: string | null, nowMs: number = Date.now()): string {
  if (!fromIso) return "00:00";
  const start = new Date(fromIso).getTime();
  if (Number.isNaN(start)) return "00:00";
  const totalSeconds = Math.max(0, Math.floor((nowMs - start) / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

export function formatClock(date: Date = new Date()): string {
  return date.toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" });
}
