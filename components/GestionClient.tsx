"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Sector = { id: string; slug: string; name: string };
type Category = { id: string; sector_id: string; slug: string; name: string; prefix?: string };
type Catalog = { sectors: Sector[]; categories: Category[] };
type Turn = { visible_number?: string; tracking_code?: string; status?: string; estimated_wait_minutes?: number };
type FeedbackStatus = { turn_id:string; visible_number:string; status:string; can_submit:boolean; submitted:boolean };

const preferredOrder = ["inscripcion", "informes", "visita", "equivalencias-externas"];

export default function GestionClient() {
  const [catalog, setCatalog] = useState<Catalog | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [turn, setTurn] = useState<Turn | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [feedbackStatus,setFeedbackStatus]=useState<FeedbackStatus|null>(null);
  const [rating,setRating]=useState<number|null>(null);
  const [comment,setComment]=useState("");
  const [contactEmail,setContactEmail]=useState("");
  const [sendingFeedback,setSendingFeedback]=useState(false);
  const [feedbackSent,setFeedbackSent]=useState(false);

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

  useEffect(()=>{
    if(!turn?.tracking_code) return;
    let active=true;
    async function check(){
      try{
        const res=await fetch(`/api/feedback/status?trackingCode=${encodeURIComponent(turn.tracking_code||"")}`,{cache:"no-store"});
        const json=await res.json();
        if(res.ok&&json?.ok&&active){
          setFeedbackStatus(json.data);
          if(json.data?.submitted) setFeedbackSent(true);
        }
      }catch{}
    }
    check();
    const id=setInterval(check,5000);
    return()=>{active=false;clearInterval(id);};
  },[turn?.tracking_code]);

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
    setFeedbackStatus(null);
    setFeedbackSent(false);
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

  async function submitFeedback(e:FormEvent){
    e.preventDefault();
    if(!turn?.tracking_code) return;
    setSendingFeedback(true);setError(null);
    try{
      const res=await fetch("/api/feedback/submit",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({trackingCode:turn.tracking_code,rating,comment,contactEmail}),
      });
      const json=await res.json();
      if(!res.ok||!json?.ok) throw new Error(json?.error||"No se pudo enviar tu comentario");
      setFeedbackSent(true);
      setFeedbackStatus(s=>s?{...s,submitted:true}:s);
    }catch(err){setError(err instanceof Error?err.message:"No se pudo enviar tu comentario");}
    finally{setSendingFeedback(false);}
  }

  if (turn) {
    const finished=feedbackStatus?.can_submit;
    return <section className="ticket-card">
      <span className="eyebrow">Tu turno</span>
      <div className="ticket-number">{turn.visible_number || "Turno generado"}</div>
      {!finished&&<>
        <h2>Ya estás en la fila.</h2>
        <p className="lead">Conservá esta pantalla abierta. Cuando termine tu atención, acá mismo vas a poder dejar tu opinión.</p>
        <p className="muted">Estado actual: <strong>{feedbackStatus?.status||"esperando"}</strong></p>
      </>}
      {turn.tracking_code ? <p className="muted">Código de seguimiento: <strong>{turn.tracking_code}</strong></p> : null}

      {finished&&!feedbackSent&&<form onSubmit={submitFeedback} style={{marginTop:24,display:"grid",gap:16}}>
        <div><span className="eyebrow">Atención finalizada</span><h2>¿Cómo fue tu experiencia?</h2><p className="muted">Tu comentario nos ayuda a mejorar la atención.</p></div>
        <div><strong>Calificación</strong><div style={{display:"flex",gap:8,marginTop:10,flexWrap:"wrap"}}>{[1,2,3,4,5].map(n=><button key={n} type="button" className={rating===n?"button":"button secondary"} onClick={()=>setRating(n)} style={{minWidth:48}}>{n}</button>)}</div></div>
        <label>Comentario<textarea rows={4} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Contanos brevemente cómo fue la atención"/></label>
        <label>Email de contacto (opcional)<input type="email" value={contactEmail} onChange={e=>setContactEmail(e.target.value)} placeholder="tu@email.com"/></label>
        {error&&<div className="error-box">{error}</div>}
        <button className="primary-btn" disabled={sendingFeedback}>{sendingFeedback?"Enviando…":"Enviar opinión"}</button>
      </form>}

      {finished&&feedbackSent&&<div className="notice" style={{marginTop:24,background:"#eefbf3",color:"#157347",borderColor:"#b8e0c7"}}><strong>Gracias por tu comentario.</strong><br/>La atención quedó registrada correctamente.</div>}

      {(!finished||feedbackSent)&&<button className="primary-btn" style={{marginTop:20}} type="button" onClick={() => setTurn(null)}>Volver al inicio</button>}
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
