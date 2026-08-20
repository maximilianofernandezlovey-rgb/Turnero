"use client";

import { useEffect, useMemo, useState } from "react";

const INGRESO_ID="75942fa8-9bea-4207-93a8-fe4c53484500";
type Summary={turns_today:number;waiting:number;finished:number;absent:number;cancelled:number;avg_wait_minutes:number;avg_service_minutes:number;by_sector:Array<{sector_id:string;sector:string;waiting:number;today:number}>};
type Row=Record<string,unknown>;
type Config={boxes:Array<{id:string;code:string;name:string;active:boolean;floor?:string;location?:string}>;categories:Array<{id:string;name:string;prefix:string;active:boolean;target_minutes?:number}>;users:Array<{id:string;username:string;display_name:string;role:string;active:boolean;last_login_at?:string}>};
type Tab="resumen"|"atencion"|"turnos"|"operadores"|"boxes"|"categorias"|"estadisticas";

function today(){return new Date().toISOString().slice(0,10)}
function csvEscape(v:unknown){const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}

export default function AdminClient(){
 const [tab,setTab]=useState<Tab>("resumen");
 const [summary,setSummary]=useState<Summary|null>(null);
 const [config,setConfig]=useState<Config|null>(null);
 const [rows,setRows]=useState<Row[]>([]);
 const [from,setFrom]=useState(today());
 const [to,setTo]=useState(today());
 const [loading,setLoading]=useState(false);
 const [error,setError]=useState("");

 async function request(url:string){const res=await fetch(url,{cache:'no-store'});const json=await res.json();if(res.status===401)throw new Error('Iniciá sesión desde Operadores con un usuario administrador');if(!res.ok||!json.ok)throw new Error(json.error||'No se pudieron cargar los datos');return json.data}
 async function loadSummary(){setSummary(await request('/api/admin/summary'))}
 async function loadConfig(){setConfig(await request(`/api/admin/configuration?sectorId=${INGRESO_ID}`))}
 async function loadReport(){setLoading(true);setError('');try{const qs=new URLSearchParams({from,to,sectorId:INGRESO_ID});setRows(await request(`/api/admin/report?${qs}`)||[])}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el informe')}finally{setLoading(false)}}
 useEffect(()=>{Promise.all([loadSummary(),loadConfig(),loadReport()]).catch(e=>setError(e.message))},[]);
 const columns=useMemo(()=>rows.length?Object.keys(rows[0]):[],[rows]);
 function downloadCsv(){if(!rows.length)return;const csv=[columns.join(','),...rows.map(r=>columns.map(c=>csvEscape(r[c])).join(','))].join('\n');const blob=new Blob(["\ufeff"+csv],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`turnero_ingreso_${from}_${to}.csv`;a.click();URL.revokeObjectURL(url)}
 const tabs:Array<[Tab,string]>=[["resumen","Resumen"],["atencion","Atención"],["turnos","Turnos"],["operadores","Operadores"],["boxes","Boxes"],["categorias","Categorías"],["estadisticas","Estadísticas"]];
 return <>
  <div className="adminnav">{tabs.map(([id,label])=><button key={id} type="button" className={tab===id?"button":"button secondary"} onClick={()=>setTab(id)}>{label}</button>)}</div>
  {error&&<div className="error-box">{error}</div>}

  {tab==="resumen"&&<div className="grid">
   <section className="card span4"><div className="muted">Turnos de hoy</div><div className="metric">{summary?.turns_today??'—'}</div></section>
   <section className="card span4"><div className="muted">Finalizados</div><div className="metric">{summary?.finished??'—'}</div></section>
   <section className="card span4"><div className="muted">Esperando</div><div className="metric">{summary?.waiting??'—'}</div></section>
   <section className="card span4"><div className="muted">Espera promedio</div><div className="metric">{summary?.avg_wait_minutes??'—'} min</div></section>
   <section className="card span4"><div className="muted">Atención promedio</div><div className="metric">{summary?.avg_service_minutes??'—'} min</div></section>
   <section className="card span4"><div className="muted">Ausentes / cancelados</div><div className="metric">{(summary?.absent??0)+(summary?.cancelled??0)}</div></section>
  </div>}

  {tab==="atencion"&&<section className="card"><h2>Atención de hoy</h2><p className="muted">Seguimiento operativo del sector Ingreso.</p><div className="grid"><div className="span4"><div className="metric">{summary?.waiting??0}</div><div className="muted">Esperando</div></div><div className="span4"><div className="metric">{summary?.finished??0}</div><div className="muted">Finalizados</div></div><div className="span4"><div className="metric">{config?.boxes.filter(b=>b.active).length??0}</div><div className="muted">Boxes activos</div></div></div></section>}

  {tab==="turnos"&&<Report rows={rows} columns={columns} from={from} to={to} setFrom={setFrom} setTo={setTo} loading={loading} loadReport={loadReport} downloadCsv={downloadCsv}/>} 

  {tab==="operadores"&&<section className="card"><h2>Operadores de Ingreso</h2><div className="queue">{config?.users.map(u=><div className="row" key={u.id}><div className="number" style={{fontSize:16}}>{u.display_name}</div><div>{u.username}</div><div>{u.role}</div><div>{u.active?'Activo':'Inactivo'}</div></div>)}</div></section>}

  {tab==="boxes"&&<section className="card"><h2>Boxes de Ingreso</h2><div className="queue">{config?.boxes.map(b=><div className="row" key={b.id}><div className="number" style={{fontSize:16}}>{b.name}</div><div>{b.code}</div><div>{b.floor||'—'}</div><div>{b.active?'Activo':'Inactivo'}</div></div>)}</div></section>}

  {tab==="categorias"&&<section className="card"><h2>Categorías</h2><div className="queue">{config?.categories.map(c=><div className="row" key={c.id}><div className="number" style={{fontSize:16}}>{c.prefix}</div><div>{c.name}</div><div>{c.target_minutes??'—'} min</div><div>{c.active?'Activa':'Inactiva'}</div></div>)}</div></section>}

  {tab==="estadisticas"&&<><div className="grid"><section className="card span4"><div className="muted">Espera promedio</div><div className="metric">{summary?.avg_wait_minutes??0} min</div></section><section className="card span4"><div className="muted">Atención promedio</div><div className="metric">{summary?.avg_service_minutes??0} min</div></section><section className="card span4"><div className="muted">Turnos hoy</div><div className="metric">{summary?.turns_today??0}</div></section></div><Report rows={rows} columns={columns} from={from} to={to} setFrom={setFrom} setTo={setTo} loading={loading} loadReport={loadReport} downloadCsv={downloadCsv}/></>}
 </>
}

function Report({rows,columns,from,to,setFrom,setTo,loading,loadReport,downloadCsv}:{rows:Row[];columns:string[];from:string;to:string;setFrom:(v:string)=>void;setTo:(v:string)=>void;loading:boolean;loadReport:()=>void;downloadCsv:()=>void}){
 return <section className="card" style={{marginTop:20}}><h2>Informe de atención</h2><div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}><label>Desde<input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Hasta<input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label><button className="button" onClick={loadReport} disabled={loading}>{loading?'Cargando…':'Aplicar filtros'}</button><button className="button secondary" onClick={downloadCsv} disabled={!rows.length}>Descargar CSV</button></div><p className="muted">{rows.length} registros. Incluye carrera, residencia, beca, comentarios y feedback cuando estén disponibles.</p><div style={{overflowX:'auto'}}><table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}><thead><tr>{columns.map(c=><th key={c} style={{textAlign:'left',padding:8,borderBottom:'1px solid var(--line)'}}>{c}</th>)}</tr></thead><tbody>{rows.slice(0,100).map((r,i)=><tr key={i}>{columns.map(c=><td key={c} style={{padding:8,borderBottom:'1px solid var(--line)'}}>{r[c]==null?'':String(r[c])}</td>)}</tr>)}</tbody></table></div></section>
}
