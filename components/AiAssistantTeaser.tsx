// Módulo preparado visualmente para un futuro asistente de IA en /gestion.
// Apagado por defecto: no llama a ninguna API de IA. Para habilitar el
// teaser visual (sin conectar IA todavía) cambiar AI_ASSISTANT_ENABLED a true.
const AI_ASSISTANT_ENABLED = false;

export default function AiAssistantTeaser() {
  if (!AI_ASSISTANT_ENABLED) return null;

  return (
    <div className="surface surface-pad" style={{ marginTop: 16, display: "grid", gap: 6 }}>
      <span className="eyebrow">Mientras esperás…</span>
      <strong>¿Tenés alguna consulta sobre UADE?</strong>
      <button type="button" className="btn btn-secondary" disabled>Preguntarle al asistente</button>
    </div>
  );
}
