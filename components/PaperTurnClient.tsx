"use client";

import { useEffect, useMemo, useState } from "react";

type Sector={id:string;slug:string;name:string};
type Category={id:string;sector_id:string;slug:string;name:string;prefix?:string};
type Catalog={sectors:Sector[];categories:Category[]};
type Turn={visible_number?:string;tracking_code?:string};

const order=["inscripcion","informes","equivalencias-externas"];
const allowed=new Set(order);

export default function PaperTurnClient({onDone}:{onDone?:()=>void}){
 const [catalog,setCatalog]=useState<Catalog|null>(null),[turn,setTurn]=useState<Turn|null>(null),[loading,setLoading]=useState(true),[creating,setCreating]=useState(""),[error,setError]=useState("");
 useEffect(()=>{fetch('/api/catalog',{cache:'no-store'}).then(async r=>{const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||'No se pudo cargar');setCatalog(d.catalog)}).catch(e=>setError(e.message)).finally(()=>setLoading(false))},[]);
 useEffect(()=>{if(!turn)return;const id=setTimeout(()=>{setTurn(null);onDone?.()},12000);return()=>clearTimeout(id)},[turn,onDone]);
 const ingreso=useMemo(()=>catalog?.sectors?.find(s=>s.slug==='ingreso')??null,[catalog]);
 const categories=useMemo(()=>catalog&&ingreso?catalog.categories.filter(c=>c.sector_id===ingreso.id&&allowed.has(c.slug)).sort((a,b)=>order.indexOf(a.slug)-order.indexOf(b.slug)):[],[catalog,ingreso]);
 async function create(category:Category){if(!ingreso||creating)return;setCreating(category.id);setError('');try{const r=await fetch('/api/turns/create',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sectorId:ingreso.id,categoryId:category.id,requestId:crypto.randomUUID(),origin:'totem'})});const d=await r.json();if(!r.ok||!d?.ok)throw new Error(d?.error||'No se pudo generar el turno');setTurn(d.turn)}catch(e){setError(e instanceof Error?e.message:'No se pudo generar el turno')}finally{setCreating('')}}
 if(turn)return <section className="ticket-card" style={{textAlign:'center'}}><span className="eyebrow">Tu turno</span><div className="ticket-number">{turn.visible_number||'Turno generado'}</div><h2>Aguardá a ser llamado</h2><p className="muted">Podés imprimir este comprobante o anotar tu número.</p><button className="primary-btn" onClick={()=>window.print()}>Imprimir turno</button><button className="button secondary" style={{marginLeft:10}} onClick={()=>{setTurn(null);onDone?.()}}>Finalizar</button></section>;
 return <>{loading&&<p className="lead">Cargando trámites…</p>}{error&&<div className="error-box">{error}</div>}<div className="category-buttons">{categories.map(c=><button className="category" key={c.id} disabled={!!creating} onClick={()=>create(c)}><span className="pill">{c.prefix}</span><br/><br/><strong>{c.name}</strong><div className="muted" style={{marginTop:8}}>{creating===c.id?'Generando turno…':'Tocar para obtener turno'}</div></button>)}</div></>;
}
