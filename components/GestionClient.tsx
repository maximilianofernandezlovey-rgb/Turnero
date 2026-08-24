"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import PushOptIn from "./PushOptIn";
import AiAssistantTeaser from "./AiAssistantTeaser";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import ProgressSteps from "./ui/ProgressSteps";
import { visualStage, formatMinutes } from "../lib/turnDisplay";

type Sector={id:string;slug:string;name:string};
type Category={id:string;sector_id:string;slug:string;name:string;prefix?:string};
type Catalog={sectors:Sector[];categories:Category[]};
type Turn={visible_number?:string;tracking_code?:string;estimated_wait_minutes?:number};
type TurnStatus={turn_id:string;visible_number:string;tracking_code:string;status:string;people_ahead:number;box?:string|null;feedback_submitted:boolean};

const preferredOrder=["inscripcion","informes","equivalencias-externas"];
const allowedSlugs=new Set(preferredOrder);
const CATEGORY_DESCRIPTIONS:Record<string,string>={
inscripcion:"Iniciar o continuar mi proceso de ingreso",
informes:"Información sobre carreras y admisión",
"equivalencias-externas":"Consulta por estudios realizados anteriormente",
};
const RATING_OPTIONS=[
{value:1,emoji:"😖",label:"Muy mala"},
{value:2,emoji:"🙁",label:"Mala"},
{value:3,emoji:"😐",label:"Regular"},
{value:4,emoji:"🙂",label:"Buena"},
{value:5,emoji:"😄",label:"Muy buena"},
];

export default function GestionClient(){
const [catalog,setCatalog]=useState<Catalog|null>(null);
const [loading,setLoading]=useState(true);
const [creating,setCreating]=useState<string|null>(null);
const [turn,setTurn]=useState<Turn|null>(null);
const [status,setStatus]=useState<TurnStatus|null>(null);
const [error,setError]=useState<string|null>(null);
const [rating,setRating]=useState<number|null>(null);
const [comment,setComment]=useState("");
const [email,setEmail]=useState("");
const [sending,setSending]=useState(false);
const [feedbackSent,setFeedbackSent]=useState(false);
const [offline,setOffline]=useState(false);
const previousStatus=useRef<string|undefined>(undefined);

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
const trackingCode=turn.tracking_code;
let active=true;
async function refresh(){
try{
const r=await fetch(`/api/turns/status?trackingCode=${encodeURIComponent(trackingCode)}&t=${Date.now()}`,{cache:"no-store"});
const d=await r.json();
if(!r.ok||!d?.ok) throw new Error(d?.error||"No se pudo actualizar el turno");
if(active){
setStatus(d.data);
setTurn(current=>current?{...current,visible_number:d.data.visible_number}:{tracking_code:trackingCode,visible_number:d.data.visible_number});
setFeedbackSent(Boolean(d.data.feedback_submitted));
setError(null);
setOffline(false);
}
}catch(e){
if(!active)return;
const isNetworkFailure=e instanceof TypeError||!navigator.onLine;
if(isNetworkFailure) setOffline(true);
else setError(e instanceof Error?e.message:"No se pudo actualizar el turno");
}
}
refresh();
const id=setInterval(refresh,3000);
return()=>{active=false;clearInterval(id)};
},[turn?.tracking_code]);

// Vibración breve como mejora progresiva al ser llamado (no requisito).
useEffect(()=>{
if(status?.status==="llamado"&&previousStatus.current!=="llamado"){
if(typeof navigator!=="undefined"&&"vibrate" in navigator){
try{navigator.vibrate([120,60,120])}catch{}
}
}
previousStatus.current=status?.status;
},[status?.status]);

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
const response=await fetch("/api/turns/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sectorId:ingreso.id,categoryId:category.id,requestId:crypto.randomUUID(),origin:"qr"})});
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
setSending(true);setError(null);
try{
const r=await fetch("/api/feedback/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({trackingCode:turn.tracking_code,rating,comment:comment.trim()||null,contactEmail:email.trim()||null})});
const d=await r.json();
if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo enviar tu comentario");
setFeedbackSent(true);
}catch(e){setError(e instanceof Error?e.message:"No se pudo enviar tu comentario")}finally{setSending(false)}
}

function reset(){
setTurn(null);setStatus(null);setRating(null);setComment("");setEmail("");setFeedbackSent(false);setError(null);
const u=new URL(window.location.href);u.searchParams.delete("trackingCode");window.history.replaceState({},"",u.pathname+u.search);
}

if(turn){
const stage=visualStage(status?.status,status?.people_ahead);
const finished=stage==="finalizado";
const called=stage==="llamado";
const enAtencion=stage==="en_atencion";
const proximo=stage==="proximo";
const waitingLike=stage==="esperando"||proximo;
const activeCall=called||enAtencion;

return <section className="ticket-card" style={{maxWidth:520,margin:'24px auto'}}>
<span className="eyebrow">Tu turno</span>
<div className="ticket-number">{turn.visible_number||status?.visible_number||"…"}</div>

{!finished&&<ProgressSteps stage={stage==="otro"?"esperando":stage}/>}

{stage==="esperando"&&<div className="alert alert-success" style={{marginTop:8}}>
<span aria-hidden="true">✅</span>
<div><strong>¡Es tu turno!</strong><div>{status?.people_ahead??"—"} persona{status?.people_ahead===1?"":"s"} delante tuyo</div></div>
</div>}

{proximo&&<div className="alert alert-warning" style={{marginTop:8}}>
<span aria-hidden="true">🟠</span>
<div><strong>¡Ya falta poco!</strong><div>{status?.people_ahead??1} persona{status?.people_ahead===1?"":"s"} adelante</div><div>Mantenete cerca del área de atención.</div></div>
</div>}

{called&&<div className="alert alert-info" style={{marginTop:8,flexDirection:'column',alignItems:'center',textAlign:'center',padding:'44px 20px',borderRadius:18}}>
<span aria-hidden="true" style={{fontSize:60,lineHeight:1}}>🔔</span>
<strong style={{fontSize:28,marginTop:12,display:'block'}}>¡Te llamamos!</strong>
<p style={{marginTop:10,fontSize:16}}>Nuestro operador te está esperando.</p>
</div>}

{enAtencion&&<div className="alert alert-info" style={{marginTop:8,flexDirection:'column',alignItems:'center',textAlign:'center',padding:'34px 20px'}}>
<span aria-hidden="true" style={{fontSize:42}}>🟢</span>
<strong style={{fontSize:20,marginTop:10,display:'block'}}>En atención</strong>
<p style={{marginTop:6}}>Ya estás siendo atendido por nuestro operador.</p>
</div>}

{stage==="esperando"&&turn.estimated_wait_minutes!=null&&
<p className="muted" style={{marginTop:10}}>Estimado al generar tu turno: ≈ {formatMinutes(turn.estimated_wait_minutes)}</p>}

{waitingLike&&<p className="lead" style={{fontSize:15}}>Podés usar otras aplicaciones. Te avisaremos cuando tu turno esté próximo.</p>}
{offline&&<Alert tone="warning">Sin conexión. Mostrando el último estado disponible.</Alert>}
{error&&<Alert tone="danger">{error}</Alert>}
{waitingLike&&turn.tracking_code&&<PushOptIn trackingCode={turn.tracking_code}/>}
{waitingLike&&<AiAssistantTeaser/>}

{finished&&!feedbackSent&&<form onSubmit={submitFeedback} className="surface surface-pad" style={{marginTop:22,display:'grid',gap:16,textAlign:'center'}}>
<div>
<div style={{fontSize:44}}>🎉</div>
<h2 style={{margin:'8px 0 2px'}}>¡Gracias por visitarnos!</h2>
<p className="muted" style={{margin:0}}>Tu atención ha finalizado.</p>
</div>
<div>
<p style={{fontWeight:700,marginBottom:10}}>¿Cómo fue tu atención?</p>
<div style={{display:'flex',justifyContent:'center',gap:8,flexWrap:'wrap'}}>
{RATING_OPTIONS.map(o=><button key={o.value} type="button" onClick={()=>setRating(o.value)} title={o.label} aria-label={o.label} aria-pressed={rating===o.value}
style={{fontSize:28,padding:'8px 10px',borderRadius:12,border:rating===o.value?'2px solid var(--primary)':'1px solid var(--line)',background:rating===o.value?'var(--primary-tint,#eef4ff)':'transparent',cursor:'pointer'}}>
{o.emoji}
</button>)}
</div>
</div>
<label style={{textAlign:'left'}}>Contanos tu experiencia (opcional)<textarea rows={3} value={comment} onChange={e=>setComment(e.target.value)} placeholder="Contanos brevemente cómo fue tu atención"/></label>
<label style={{textAlign:'left'}}>Email de contacto (opcional)<input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@email.com"/></label>
<p className="muted" style={{margin:0,fontSize:13}}>Dejanos tu email si querés que podamos contactarte por tu comentario.</p>
<Button type="submit" disabled={sending}>{sending?"Enviando…":"Enviar comentario"}</Button>
</form>}
{finished&&feedbackSent&&<Alert tone="success"><strong>¡Gracias por tu comentario!</strong><div>Tu opinión nos ayuda a mejorar la atención.</div></Alert>}
{!activeCall&&!finished&&<Button variant="secondary" onClick={reset} style={{marginTop:20}}>← Volver al inicio</Button>}
</section>;
}

return <>
<span className="eyebrow">Turno desde el celular</span>
<h1>¿En qué podemos ayudarte?</h1>
{loading&&<p className="lead">Cargando trámites…</p>}
{error&&<Alert tone="danger">{error}</Alert>}
<div className="category-buttons">
{categories.map(category=><button className="category" key={category.id} type="button" onClick={()=>createTurn(category)} disabled={Boolean(creating)}>
<span className="pill">{category.prefix||category.slug.slice(0,3).toUpperCase()}</span><br/><br/>
<strong>{category.name}</strong>
<div className="muted" style={{marginTop:8}}>{creating===category.id?"Generando turno…":CATEGORY_DESCRIPTIONS[category.slug]||"Tocar para obtener turno"}</div>
</button>)}
</div>
</>;
}
