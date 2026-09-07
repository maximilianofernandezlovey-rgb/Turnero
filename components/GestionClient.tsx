"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import Button from "./ui/Button";
import Alert from "./ui/Alert";
import FormField from "./ui/FormField";
import { visualStage } from "../lib/turnDisplay";
import styles from "./GestionClient.module.css";

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
const COMMENT_MAX=300;

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
const [offline,setOffline]=useState(false);
const previousStatus=useRef<string|undefined>(undefined);

useEffect(()=>{const params=new URLSearchParams(window.location.search);const trackingCode=params.get("trackingCode");if(trackingCode)setTurn({tracking_code:trackingCode});},[]);
useEffect(()=>{let active=true;fetch("/api/catalog",{cache:"no-store"}).then(async r=>{const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo cargar la atención");if(active)setCatalog(d.catalog)}).catch(e=>active&&setError(e instanceof Error?e.message:"No se pudo cargar la atención")).finally(()=>active&&setLoading(false));return()=>{active=false};},[]);
useEffect(()=>{if(!turn?.tracking_code)return;const trackingCode=turn.tracking_code;let active=true;async function refresh(){try{const r=await fetch(`/api/turns/status?trackingCode=${encodeURIComponent(trackingCode)}&t=${Date.now()}`,{cache:"no-store"});const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo actualizar el turno");if(active){setStatus(d.data);setTurn(current=>current?{...current,visible_number:d.data.visible_number}:{tracking_code:trackingCode,visible_number:d.data.visible_number});setFeedbackSent(Boolean(d.data.feedback_submitted));setError(null);setOffline(false);}}catch(e){if(!active)return;const isNetworkFailure=e instanceof TypeError||!navigator.onLine;if(isNetworkFailure)setOffline(true);else setError(e instanceof Error?e.message:"No se pudo actualizar el turno");}}refresh();const id=setInterval(refresh,3000);return()=>{active=false;clearInterval(id)};},[turn?.tracking_code]);
useEffect(()=>{if(status?.status==="llamado"&&previousStatus.current!=="llamado"&&typeof navigator!=="undefined"&&"vibrate" in navigator){try{navigator.vibrate([120,60,120])}catch{}}previousStatus.current=status?.status;},[status?.status]);

const ingreso=useMemo(()=>catalog?.sectors?.find(s=>s.slug==="ingreso")??null,[catalog]);
const categories=useMemo(()=>{if(!catalog||!ingreso)return[];return catalog.categories.filter(c=>c.sector_id===ingreso.id&&allowedSlugs.has(c.slug)).sort((a,b)=>preferredOrder.indexOf(a.slug)-preferredOrder.indexOf(b.slug));},[catalog,ingreso]);

async function createTurn(category:Category){if(!ingreso||creating)return;setCreating(category.id);setError(null);try{const response=await fetch("/api/turns/create",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({sectorId:ingreso.id,categoryId:category.id,requestId:crypto.randomUUID(),origin:"qr"})});const data=await response.json();if(!response.ok||!data?.ok)throw new Error(data?.error||"No se pudo generar el turno");setTurn(data.turn);setStatus(null);setFeedbackSent(false);if(data.turn?.tracking_code){const u=new URL(window.location.href);u.searchParams.set("trackingCode",data.turn.tracking_code);window.history.replaceState({},"",u.toString());}}catch(e){setError(e instanceof Error?e.message:"No se pudo generar el turno")}finally{setCreating(null)}}
async function submitFeedback(e:FormEvent){e.preventDefault();if(!turn?.tracking_code)return;setSending(true);setError(null);try{const r=await fetch("/api/feedback/submit",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({trackingCode:turn.tracking_code,rating:null,comment:comment.trim()||null,contactEmail:email.trim()||null})});const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||"No se pudo enviar tu comentario");setFeedbackSent(true);}catch(e){setError(e instanceof Error?e.message:"No se pudo enviar tu comentario")}finally{setSending(false)}}
function reset(){setTurn(null);setStatus(null);setComment("");setEmail("");setFeedbackSent(false);setError(null);const u=new URL(window.location.href);u.searchParams.delete("trackingCode");window.history.replaceState({},"",u.pathname+u.search);}

if(turn){
const stage=visualStage(status?.status,status?.people_ahead);const finished=stage==="finalizado";const calledLike=stage==="llamado"||stage==="en_atencion";const waitingLike=stage==="esperando"||stage==="proximo";const visible=turn.visible_number||status?.visible_number||"…";
if(finished)return <main className={styles.page}><div className={styles.stateShell}><section className={styles.stateCard}>{!feedbackSent?<><div className={styles.finishIcon}>✓</div><h1 className={styles.finishTitle}>¡Gracias por visitarnos!</h1><p className={styles.finishText}>Tu atención finalizó correctamente. Si querés, podés ayudarnos a seguir mejorando.</p><form onSubmit={submitFeedback} className={styles.feedback}><FormField label="Comentario (opcional)"><textarea rows={5} maxLength={COMMENT_MAX} value={comment} onChange={e=>setComment(e.target.value.slice(0,COMMENT_MAX))} placeholder="Contanos cómo fue tu experiencia…"/><div className={styles.counter}>{comment.length} / {COMMENT_MAX}</div></FormField><FormField label="Email de contacto (opcional)"><input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nombre@email.com"/></FormField>{offline&&<Alert tone="warning">Sin conexión. Mostrando el último estado disponible.</Alert>}{error&&<Alert tone="danger">{error}</Alert>}<Button type="submit" disabled={sending} block>{sending?"Enviando…":"Enviar comentario"}</Button><button type="button" className={styles.skipButton} onClick={reset}>No, gracias</button></form></>:<div className={styles.successBox}>¡Gracias por tu comentario! Tu opinión nos ayuda a mejorar.</div>}</section></div></main>;
if(calledLike)return <main className={styles.page}><div className={styles.stateShell}><section className={`${styles.stateCard} ${styles.calledCard}`}><div className={styles.stateLabel}>Atención de ingreso</div><h1 className={styles.calledTitle}>¡Es tu turno!</h1><div className={styles.calledNumber}>{visible}</div>{status?.box&&<div className={styles.box}>{status.box}</div>}<p className={styles.calledText}>Podés acercarte ahora. Nuestro operador te está esperando.</p>{offline&&<div className={styles.offline}><Alert tone="warning">Sin conexión. Mostrando el último estado disponible.</Alert></div>}</section></div></main>;
if(waitingLike)return <main className={styles.page}><div className={styles.stateShell}><section className={styles.stateCard}><div className={styles.stateLabel}>Tu turno</div><div className={styles.turnNumber}>{visible}</div><div className={styles.statusPill}><span className={styles.dot}/>En espera</div><div className={styles.queueBlock}><div className={styles.metric}><strong>{status?.people_ahead??"—"}</strong><span>{status?.people_ahead===1?"persona antes que vos":"personas antes que vos"}</span></div><div className={styles.metric}><strong>{turn.estimated_wait_minutes?`~ ${turn.estimated_wait_minutes}`:"—"}</strong><span>minutos estimados</span></div></div><p className={styles.helper}>Podés mantener esta página abierta. Te avisaremos cuando sea tu turno.</p>{offline&&<div className={styles.offline}><Alert tone="warning">Sin conexión. Mostrando el último estado disponible.</Alert></div>}{error&&<div className={styles.error}><Alert tone="danger">{error}</Alert></div>}</section></div></main>;
}

return <main className={styles.page}><header className={styles.header}><div className={styles.brand}>UADE</div><div className={styles.eyebrow}>Turnos de ingreso</div></header><section><div className={styles.eyebrow}>Atención presencial</div><h1 className={styles.title}>¿En qué podemos ayudarte?</h1><p className={styles.subtitle}>Elegí el motivo de tu consulta para obtener tu turno.</p>{loading&&<p className="lead">Cargando trámites…</p>}{error&&<div className={styles.error}><Alert tone="danger">{error}</Alert></div>}<div className={styles.categoryGrid}>{categories.map(category=><button className={styles.categoryCard} key={category.id} type="button" onClick={()=>createTurn(category)} disabled={Boolean(creating)}><span className={styles.categoryText}><strong>{category.name}</strong><span>{creating===category.id?"Generando turno…":CATEGORY_DESCRIPTIONS[category.slug]||"Tocar para obtener turno"}</span></span><span className={styles.arrow} aria-hidden="true">→</span></button>)}</div></section></main>;
}
