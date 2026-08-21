"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Sector={id:string;slug:string;name:string};
type Category={id:string;sector_id:string;slug:string;name:string;prefix?:string};
type Catalog={sectors:Sector[];categories:Category[]};
type Turn={visible_number?:string;tracking_code?:string};
type TurnStatus={turn_id:string;visible_number:string;tracking_code:string;status:string;people_ahead:number;box?:string|null;feedback_submitted:boolean};

const preferredOrder=["inscripcion","informes","equivalencias-externas"];
const allowedSlugs=new Set(preferredOrder);

function statusLabel(status?:string){
  const labels:Record<string,string>={esperando:"En espera",llamado:"Te están llamando",en_atencion:"En atención",finalizado:"Atención finalizada",ausente:"Ausente",cancelado:"Cancelado",transferido:"Transferido"};
  return status?labels[status]||status:"En espera";
}

export default function GestionClient(){
  const [catalog,setCatalog]=useState<Catalog|null>(null);
  const [loading,setLoading]=useState(true);
  const [creating,setCreating]=useState<string|null>(null);
  const [turn,setTurn]=useState<Turn|null>(null);
  const [status,setStatus]=useState<TurnStatus|null>(null);
  const [error,setError]=useState<string|null>(null);
  const [comment,setComment]=useState("");
  const [email,setEmail]=useState("");
  const [sending,setSending]=useState(false);
  const [feedbackSent,setFeedbackSent]=useState(false);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const trackingCode=params.get("trackingCode");
    if(trackingCode) setTurn({tracking_code:trackingCode});
  },[]);

  useEffect(()=>{
    let active=true;
    fetch("/api/catalog",{cache:"no-store"})
      .then(async r=>{const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo cargar la atención");if(active)setCatalog(d.catalog)})
      .catch(e=>active&&setError(e instanceof Error?e.message:"No se pudo cargar la atención"))
      .finally(()=>active&&setLoading(false));
    return()=>{active=false};
  },[]);

  useEffect(()=>{
    if(!turn?.tracking_code) return;
    let active=true;
    async function refresh(){
      try{
        const r=await fetch(`/api/turns/status?trackingCode=${encodeURIComponent(turn.tracking_code||"")}&t=${Date.now()}`,{cache:"no-store"});
        const d=await r.json();
        if(!r.ok||!d?.ok) throw new Error(d?.error||"No se pudo actualizar el turno");
        if(active){
          setStatus(d.data);
          setTurn(t=>({...t,visible_number:d.data.visible_number}));
          setFeedbackSent(Boolean(d.data.feedback_submitted));
          setError(null);
        }
      }catch(e){if(active)setError(e instanceof Error?e.message:"No se pudo actualizar el turno")}
    }
    refresh();
    const id=setInterval(refresh,3000);
    return()=>{active=false;clearInterval(id)};
  },[turn?.tracking_code]);

  const ingreso=useMemo(()=>catalog?.sectors?.find(s=>s.slug==="ingreso")??null,[catalog]);
  const categories=useMemo(()=>{
    if(!catalog||!ingreso)return[];
    return catalog.categories
      .filter(c=>c.sector_id===ingreso.id&&allowedSlugs.has(c.slug))
      .sort((a,b)=>preferredOrder.indexOf(a.slug)-preferredOrder.indexOf(b.slug));
  },[catalog,ingreso]);

  async function createTurn(category:Category){
    if(!ingreso||creating)return;
    setCreating(category.id);setError(null);
    try{
      const response=await fetch("/api/turns/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sectorId:ingreso.id,categoryId:category.id,requestId:crypto.randomUUID()})});
      const data=await response.json();
      if(!response.ok||!data?.ok)throw new Error(data?.error||"No se pudo generar el turno");
      setTurn(data.turn);setStatus(null);setFeedbackSent(false);
      if(data.turn?.tracking_code){
        const u=new URL(window.location.href);u.searchParams.set("trackingCode",data.turn.tracking_code);window.history.replaceState({},"",u.toString());
      }
    }catch(e){setError(e instanceof Error?e.message:"No se pudo generar el turno")}finally{setCreating(null)}
  }

  async function submitFeedback(e:FormEvent){
    e.preventDefault();
    if(!turn?.tracking_code)return;
    if(!comment.trim()){setError("Escribí un comentario sobre tu atención");return;}
    setSending(true);setError(null);
    try{
      const r=await fetch("/api/feedback/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({trackingCode:turn.tracking_code,comment:comment.trim(),contactEmail:email.trim()||null})});
      const d=await r.json();
      if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo enviar el comentario");
      setFeedbackSent(true);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo enviar el comentario")}finally{setSending(false)}
  }

  function reset(){
    setTurn(null);setStatus(null);setComment("");setEmail("");setFeedbackSent(false);setError(null);
    const u=new URL(window.location.href);u.searchParams.delete("trackingCode");window.history.replaceState({},"",u.pathname+u.search);
  }

  if(turn){
    const finished=status?.status==="finalizado";
    return <section className="ticket-card" style={{maxWidth:720,margin:'24px auto'}}>
      <span className="eyebrow">Tu turno</span>
      <div className="ticket-number">{turn.visible_number||status?.visible_number||"…"}</div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(150px,1fr))',gap:12,margin:'22px 0'}}>
        <div className="card" style={{padding:16}}><div className="muted">Estado</div><strong>{statusLabel(status?.status)}</strong></div>
        <div className="card" style={{padding:16}}><div className="muted">Personas adelante</div><strong style={{fontSize:28}}>{status?.people_ahead??'—'}</strong></div>
        <div className="card" style={{padding:16}}><div className="muted">Box</div><strong>{status?.box||"A confirmar"}</strong></div>
      </div>
      {!finished&&<p className="lead">Podés dejar esta pantalla abierta. Tu turno se actualiza automáticamente.</p>}
      {error&&<div className="error-box">{error}</div>}

      {finished&&!feedbackSent&&<form onSubmit={submitFeedback} className="card" style={{marginTop:22,padding:22,display:'grid',gap:14}}>
        <span className="eyebrow">Atención finalizada</span>
        <h2 style={{margin:0}}>¿Cómo fue tu atención?</h2>
        <label>Comentario<textarea rows={4} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Contanos brevemente cómo fue tu atención" required/></label>
        <label>Email de contacto<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@email.com"/></label>
        <p className="muted" style={{margin:0}}>El email es opcional y nos permite contactarte si necesitamos ampliar tu comentario.</p>
        <button className="primary-btn" disabled={sending}>{sending?"Enviando…":"Enviar comentario"}</button>
      </form>}

      {finished&&feedbackSent&&<div className="notice" style={{marginTop:22}}><strong>Gracias.</strong> Tu comentario quedó registrado.</div>}
      <button className="button secondary" type="button" onClick={reset} style={{marginTop:20}}>← Volver al inicio</button>
    </section>;
  }

  return <>
    {loading&&<p className="lead">Cargando trámites…</p>}
    {error&&<div className="error-box">{error}</div>}
    <div className="category-buttons">
      {categories.map(category=><button className="category" key={category.id} type="button" onClick={()=>createTurn(category)} disabled={Boolean(creating)}>
        <span className="pill">{category.prefix||category.slug.slice(0,3).toUpperCase()}</span><br/><br/>
        <strong>{category.name}</strong>
        <div className="muted" style={{marginTop:8}}>{creating===category.id?"Generando turno…":"Tocar para obtener turno"}</div>
      </button>)}
    </div>
  </>;
}
