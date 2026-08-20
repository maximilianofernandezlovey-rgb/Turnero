"use client";

import { useEffect, useMemo, useState } from "react";

type Sector = { id: string; slug: string; name: string };
type Category = { id: string; sector_id: string; slug: string; name: string; prefix?: string };
type Catalog = { sectors: Sector[]; categories: Category[] };
type Turn = { visible_number?: string; tracking_code?: string; status?: string; estimated_wait_minutes?: number };

const preferredOrder = ["inscripcion", "informes", "visita", "equivalencias-externas"];

export default function GestionClient() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/catalog", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !data?.ok) throw new Error(data?.error || "No se pudo cargar la atención");
        if (active) setCatalog(data.catalog);
      })
      .catch((err) => active && setError(err instanceof Error ? err.message : "No se pudo cargar la atención"))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const ingreso = useMemo(() => catalog?.sectors?.find((s) => s.slug === "ingreso") ?? null, [catalog]);
  const categories = useMemo(() => {
    if (!catalog || !ingreso) return [];
    const list = catalog.categories.filter((c) => c.sector_id === ingreso.id);
    return [...list].sort((a, b) => {
      const ai = preferredOrder.indexOf(a.slug);
      const bi = preferredOrder.indexOf(b.slug);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [catalog, ingreso]);

  async function createTurn(category: Category) {
    if (!ingreso || creating) return;
    setError(null);
    setCreating(category.id);
    try {
      const response = await fetch("/api/turns/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sectorId: ingreso.id, categoryId: category.id, requestId: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "No se pudo generar el turno");
      setTurn(data.turn);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo generar el turno");
    } finally {
      setCreating(null);
    }
  }

  if (turn) {
    return <section className="ticket-card">
      <span className="eyebrow">Tu turno</span>
      <div className="ticket-number">{turn.visible_number || "Turno generado"}</div>
      <h2>Ya estás en la fila.</h2>
      <p className="lead">Aguardá a ser llamado. Esta pantalla va a evolucionar al seguimiento en tiempo real.</p>
      {turn.tracking_code ? <p className="muted">Código de seguimiento: <strong>{turn.tracking_code}</strong></p> : null}
      <button className="primary-btn" type="button" onClick={() => setTurn(null)}>Volver al inicio</button>
    </section>;
  }

  return <>
    {loading ? <p className="lead">Cargando trámites disponibles…</p> : null}
    {error ? <div className="error-box">{error}</div> : null}
    {!loading && !error && categories.length === 0 ? <div className="error-box">No hay categorías activas para Ingreso.</div> : null}
    <div className="category-buttons">
      {categories.map((category) => <button
        className="category"
        key={category.id}
        type="button"
        onClick={() => createTurn(category)}
        disabled={Boolean(creating)}
      >
        <span className="pill">{category.prefix || category.slug.slice(0, 3).toUpperCase()}</span>
        <br/><br/>
        <strong>{category.name}</strong>
        <div className="muted" style={{ marginTop: 8 }}>{creating === category.id ? "Generando turno…" : "Tocar para obtener turno"}</div>
      </button>)}
    </div>
  </>;
}
