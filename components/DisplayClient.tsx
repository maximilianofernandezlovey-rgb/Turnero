"use client";

import { useEffect, useRef, useState } from "react";

type DisplayTurn = {
  id: string;
  box: string;
  status: string;
  category: string;
  called_at: string;
  visible_number: string;
};

type DisplayData = {
  latest: DisplayTurn | null;
  recent: DisplayTurn[];
  sector_id: string;
};

export default function DisplayClient() {
  const [data, setData] = useState<DisplayData | null>(null);
  const [error, setError] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [entered, setEntered] = useState(false);
  const lastSpoken = useRef<string | null>(null);
  const lastLatestId = useRef<string | null>(null);

  async function refresh() {
    try {
      const response = await fetch("/api/display?sector=ingreso", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok || !payload.ok) throw new Error(payload.error || "No se pudo actualizar la pantalla");
      setData(payload.data);
      setError("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de conexión");
    }
  }

  useEffect(() => {
    refresh();
    const id = window.setInterval(refresh, 2500);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const latest = data?.latest;
    if (!voiceEnabled || !latest || latest.id === lastSpoken.current) return;
    if (latest.status !== "llamado" && latest.status !== "en_atencion") return;
    lastSpoken.current = latest.id;
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(`Turno ${latest.visible_number}, dirigirse al ${latest.box}`);
      utterance.lang = "es-AR";
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  }, [data, voiceEnabled]);

  // Transición breve y elegante (no continua) cuando entra un llamado nuevo.
  useEffect(() => {
    const latest = data?.latest;
    if (!latest || latest.id === lastLatestId.current) return;
    lastLatestId.current = latest.id;
    setEntered(false);
    const id = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(id);
  }, [data]);

  const latest = data?.latest;

  return (
    <main className="screen display-screen">
      <div className="display-wrap">
        <div className="display-topline">
          <div><strong>UADE</strong><span> · Turnos de Ingreso</span></div>
          <button className="sound-btn" onClick={() => setVoiceEnabled(v => !v)} type="button" aria-pressed={voiceEnabled}>
            {voiceEnabled ? "🔊 Voz activada" : "🔇 Activar voz"}
          </button>
        </div>

        {error ? <div className="display-error" role="alert">{error}</div> : null}

        {latest ? (
          <section className="display-hero" style={{opacity:entered?1:0,transform:entered?'scale(1)':'scale(.97)',transition:'opacity .35s ease, transform .35s ease'}}>
            <div className="display-label">TURNO</div>
            <div className="display-number">{latest.visible_number}</div>
            <div className="display-label" style={{marginTop:18}}>DIRIGITE AL</div>
            <div className="display-box">{latest.box}</div>
            <div className="display-category">{latest.category}</div>
          </section>
        ) : (
          <section className="display-hero"><div className="display-label">SIN LLAMADOS TODAVÍA</div></section>
        )}

        <section className="display-recent">
          <h2>Últimos llamados</h2>
          {(data?.recent || []).length ? (
            <div className="display-list">
              {(data?.recent || []).slice(0, 6).map(turn => (
                <div className="display-row" key={`${turn.id}-${turn.called_at}`}>
                  <strong>{turn.visible_number}</strong>
                  <span>{turn.category}</span>
                  <b>{turn.box}</b>
                </div>
              ))}
            </div>
          ) : <p style={{opacity:.6}}>Todavía no hubo otros llamados.</p>}
        </section>
      </div>
    </main>
  );
}
