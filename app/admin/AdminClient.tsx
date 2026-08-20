"use client";

import { useEffect, useMemo, useState } from "react";

const INGRESO_ID="75942fa8-9bea-4207-93a8-fe4c53484500";

type Summary={turns_today:number;waiting:number;finished:number;absent:number;cancelled:number;avg_wait_minutes:number;avg_service_minutes:number;by_sector:Array<{sector_id:string;sector:string;waiting:number;today:number}>};
type Row=Record<string,unknown>;

function today(){return new Date().toISOString().slice(0,10)}
function csvEscape(v:unknown){const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}

export default function AdminClient(){
 const [summary,setSummary]=useState<Summary|null>(null);
 const [rows,setRows]=useState<Row[]>([]);
 const [from,setFrom]=useState(today());
 const [to,setTo]=useState(today());
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 async function loadSummary(){
  const res=await fetch('/api/admin/summary',{cache:'no-store'}); const json=await res.json();
  if(res.status===401) throw new Error('Iniciá sesión desde Operadores con un usuario administrador');
  if(!res.ok||!json.ok) throw new Error(json.error||'No se pudo cargar el resumen');
  setSummary(json.data);
 }
 async function loadReport(){
  setLoading(true);setError('');
  try{const qs=new URLSearchParams({from,to,sectorId:INGRESO_ID}); const res=await fetch(`/api/admin/report?${qs}`,{cache:'no-store'}); const json=await res.json(); if(!res.ok||!json.ok) throw new Error(json.error||'No se pudo cargar el informe'); setRows(json.data||[])}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el informe')}finally{setLoading(false)}
 }
 useEffect(()=>{loadSummary().catch(e=>setError(e.message));loadReport()},[]);
 const columns=useMemo(()=>rows.length?Object.keys(rows[0]):[],[rows]);
 function downloadCsv(){if(!rows.length)return;const csv=[columns.join(','),...rows.map(r=>columns.map(c=>csvEscape(r[c])).join(','))].join('\n');const blob=new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`turnero_ingreso_${from}_${to}.csv`;a.click();URL.revokeObjectURL(url)}
 return <>
  {error&&<div className="error-box">{error}</div>}
  <div className="grid">
   <section className="card span4"><div className="muted">Turnos de hoy</div><div className="metric">{summary?.turns_today??'—'}</div></section>
   <section className="card span4"><div className="muted">Finalizados</div><div className="metric">{summary?.finished??'—'}</div></section>
   <section className="card span4"><div className="muted">Esperando</div><div className="metric">{summary?.waiting??'—'}</div></section>
   <section className="card span4"><div className="muted">Espera promedio</div><div className="metric">{summary?.avg_wait_minutes??'—'} min</div></section>
   <section className="card span4"><div className="muted">Atención promedio</div><div className="metric">{summary?.avg_service_minutes??'—'} min</div></section>
   <section className="card span4"><div className="muted">Ausentes / cancelados</div><div className="metric">{(summary?.absent??0)+(summary?.cancelled??0)}</div></section>
  </div>
  <section className="card" style={{marginTop:20}}>
   <h2>Informe de atención</h2>
   <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
    <label>Desde<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label>
    <label>Hasta<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label>
    <button className="button" onClick={loadReport} disabled={loading}>{loading?'Cargando…':'Aplicar filtros'}</button>
    <button className="button secondary" onClick={downloadCsv} disabled={!rows.length}>Descargar CSV</button>
   </div>
   <p className="muted">{rows.length} registros. Incluye carrera, residencia, beca, comentarios y feedback cuando estén disponibles.</p>
   <div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{columns.map(c=><th key={c} style={{textAlign:'left',padding:8,borderBottom:'1px solid var(--line)'}}>{c}</th>)}</tr></thead><tbody>{rows.slice(0,100).map((r,i)=><tr key={i}>{columns.map(c=><td key={c} style={{padding:8,borderBottom:'1px solid var(--line)'}}>{r[c]==null?'':String(r[c])}</td>)}</tr>)}</tbody></table></div>
  </section>
 </>
}
