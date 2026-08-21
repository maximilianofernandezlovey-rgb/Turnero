"use client";
import { useEffect, useMemo, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import EmptyState from "../../components/ui/EmptyState";
import MetricCard from "../../components/ui/MetricCard";
import NavRail, { NavRailItem } from "../../components/ui/NavRail";
import BarList from "../../components/ui/BarList";
import FormField from "../../components/ui/FormField";

const INGRESO_ID="75942fa8-9bea-4207-93a8-fe4c53484500";

type Summary={turns_today:number;waiting:number;finished:number;absent:number;cancelled:number;avg_wait_minutes:number;avg_service_minutes:number;by_sector:Array<{sector_id:string;sector:string;waiting:number;today:number}>};
type ReportRow={fecha?:string;turno?:string;sector?:string;categoria?:string;estado?:string;box?:string;operador?:string;creado?:string;llamado?:string;inicio_atencion?:string;finalizado?:string;espera_segundos?:number;atencion_segundos?:number;origen?:string;carrera_interes?:string;interes_residencia?:boolean;interes_beca?:boolean;comentario_operador?:string;calificacion_ingresante?:number;comentario_ingresante?:string;email_contacto?:string};
type Box={id:string;code:string;name:string;active:boolean;floor?:string;location?:string};
type Category={id:string;name:string;prefix:string;active:boolean;target_minutes?:number};
type User={id:string;username:string;display_name:string;role:string;active:boolean;last_login_at?:string};
type Config={boxes:Box[];categories:Category[];users:User[]};
type LiveTurn={id:string;visible_number:string;category:string;wait_minutes?:number};
type LiveBox={id:string;name:string;code:string;active:boolean;turn?:{visible_number:string;category:string;status:string;operator?:string}|null};
type LiveData={waiting:LiveTurn[];boxes:LiveBox[];stats:{waiting:number;called:number;in_service:number}};
type Tab="resumen"|"atencion"|"turnos"|"operadores"|"boxes"|"postulantes"|"comentarios"|"reportes"|"configuracion";

function today(){return new Date().toISOString().slice(0,10)}
function csvEscape(v:unknown){const s=v==null?"":String(v);return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}

export default function AdminClient(){
 const[tab,setTab]=useState<Tab>("resumen"),[summary,setSummary]=useState<Summary|null>(null),[config,setConfig]=useState<Config|null>(null),[rows,setRows]=useState<ReportRow[]>([]),[from,setFrom]=useState(today()),[to,setTo]=useState(today()),[loading,setLoading]=useState(false),[saving,setSaving]=useState(false),[error,setError]=useState(""),[notice,setNotice]=useState("");
 const[live,setLive]=useState<LiveData|null>(null),[liveError,setLiveError]=useState("");

 async function request(url:string,init?:RequestInit){const res=await fetch(url,{cache:'no-store',...init}),json=await res.json();if(res.status===401)throw new Error('Iniciá sesión desde Operadores con un usuario administrador');if(!res.ok||!json.ok)throw new Error(json.error||'No se pudieron cargar los datos');return json.data}
 async function loadSummary(){setSummary(await request('/api/admin/summary'))}
 async function loadConfig(){setConfig(await request(`/api/admin/configuration?sectorId=${INGRESO_ID}`))}
 async function loadReport(){setLoading(true);setError('');try{const qs=new URLSearchParams({from,to,sectorId:INGRESO_ID});setRows(await request(`/api/admin/report?${qs}`)||[])}catch(e){setError(e instanceof Error?e.message:'No se pudo cargar el informe')}finally{setLoading(false)}}
 async function loadLive(){try{const data=await request(`/api/operator/dashboard?sectorId=${INGRESO_ID}`);setLive(data);setLiveError('')}catch(e){setLiveError(e instanceof Error?e.message:'No se pudo cargar la vista en vivo')}}
 async function save(url:string,body:unknown){setSaving(true);setError('');setNotice('');try{await request(url,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});await loadConfig();setNotice('Cambios guardados correctamente.')}catch(e){setError(e instanceof Error?e.message:'No se pudieron guardar los cambios')}finally{setSaving(false)}}

 useEffect(()=>{Promise.all([loadSummary(),loadConfig(),loadReport()]).catch(e=>setError(e.message))},[]);
 useEffect(()=>{if(tab!=="atencion")return;loadLive();const id=setInterval(loadLive,5000);return()=>clearInterval(id)},[tab]);

 const columns=useMemo(()=>rows.length?Object.keys(rows[0]):[],[rows]);
 function downloadCsv(){if(!rows.length)return;const csv=[columns.join(','),...rows.map(r=>columns.map(c=>csvEscape((r as Record<string,unknown>)[c])).join(','))].join('\n'),blob=new Blob(["﻿"+csv],{type:'text/csv;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`turnero_ingreso_${from}_${to}.csv`;a.click();URL.revokeObjectURL(url)}

 const boxesActive=config?.boxes.filter(b=>b.active).length??0;
 const categoryBars=useMemo(()=>{
   const counts=new Map<string,number>();
   for(const r of rows){if(!r.categoria)continue;counts.set(r.categoria,(counts.get(r.categoria)||0)+1)}
   return [...counts.entries()].map(([label,value])=>({label,value})).sort((a,b)=>b.value-a.value);
 },[rows]);
 const hourBars=useMemo(()=>{
   const counts=new Map<number,number>();
   for(const r of rows){if(!r.creado)continue;const h=new Date(r.creado).getHours();if(Number.isNaN(h))continue;counts.set(h,(counts.get(h)||0)+1)}
   return [...counts.entries()].sort((a,b)=>a[0]-b[0]).map(([h,value])=>({label:`${String(h).padStart(2,'0')}:00`,value}));
 },[rows]);
 const postulantes=useMemo(()=>rows.filter(r=>r.carrera_interes||r.comentario_operador||r.interes_residencia!=null||r.interes_beca!=null),[rows]);
 const comentarios=useMemo(()=>rows.filter(r=>r.comentario_ingresante),[rows]);

 const navItems:NavRailItem<Tab>[]=[
   {id:"resumen",label:"Resumen"},{id:"atencion",label:"Atención en vivo"},{id:"turnos",label:"Turnos"},
   {id:"operadores",label:"Operadores"},{id:"boxes",label:"Boxes"},{id:"postulantes",label:"Postulantes"},
   {id:"comentarios",label:"Comentarios"},{id:"reportes",label:"Reportes"},{id:"configuracion",label:"Configuración"},
 ];

 return <div className="admin-layout">
   <NavRail items={navItems} active={tab} onSelect={setTab}/>
   <div>
     {error&&<Alert tone="danger">{error}</Alert>}
     {notice&&<div style={{marginTop:error?10:0}}><Alert tone="success">{notice}</Alert></div>}

     {tab==="resumen"&&<div style={{display:"grid",gap:20,marginTop:error||notice?14:0}}>
       <div className="metric-grid">
         <MetricCard label="Turnos de hoy" value={summary?.turns_today??"—"}/>
         <MetricCard label="Esperando" value={summary?.waiting??"—"} accent="warning"/>
         <MetricCard label="Espera promedio" value={`${summary?.avg_wait_minutes??"—"} min`}/>
         <MetricCard label="Atención promedio" value={`${summary?.avg_service_minutes??"—"} min`}/>
         <MetricCard label="Boxes activos" value={boxesActive} accent="success"/>
         <MetricCard label="Ausentes / cancelados" value={(summary?.absent??0)+(summary?.cancelled??0)} accent="danger"/>
       </div>
       <div className="admin-charts">
         <Card><h2 style={{marginTop:0}}>Trámites solicitados hoy</h2>{categoryBars.length?<BarList items={categoryBars}/>:<EmptyState icon="📊" title="Todavía no hay turnos hoy"/>}</Card>
         <Card><h2 style={{marginTop:0}}>Atención por hora</h2>{hourBars.length?<BarList items={hourBars}/>:<EmptyState icon="🕒" title="Todavía no hay datos suficientes"/>}</Card>
       </div>
     </div>}

     {tab==="atencion"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Atención en vivo</h2>
       {liveError&&<Alert tone="danger">{liveError}</Alert>}
       {live&&<>
         <div className="metric-grid" style={{marginBottom:18}}>
           <MetricCard label="Esperando" value={live.stats.waiting}/>
           <MetricCard label="Llamados" value={live.stats.called} accent="warning"/>
           <MetricCard label="En atención" value={live.stats.in_service} accent="success"/>
         </div>
         <h3>Boxes</h3>
         <div className="queue">
           {live.boxes.map(b=><div className="row" key={b.id} style={{gridTemplateColumns:"120px 1fr auto"}}>
             <strong>{b.name}</strong>
             <span className="muted">{b.turn?`${b.turn.visible_number} · ${b.turn.category}`:"Libre"}</span>
             <Badge tone={b.turn?"info":"neutral"}>{b.turn?b.turn.status:"—"}</Badge>
           </div>)}
         </div>
       </>}
     </Card>}

     {tab==="turnos"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Turnos ({rows.length})</h2>
       {rows.length?<ReportTable rows={rows} columns={columns}/>:<EmptyState icon="🎫" title="Sin turnos en el rango seleccionado"/>}
     </Card>}

     {tab==="operadores"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Operadores de Ingreso</h2>
       <div className="queue">{config?.users.map(u=><div className="row" key={u.id} style={{gridTemplateColumns:"1fr 1fr auto auto"}}>
         <strong>{u.display_name}</strong><div className="muted">{u.username}</div>
         <Badge tone="info">{u.role}</Badge>
         <Badge tone={u.active?"success":"neutral"}>{u.active?"Activo":"Inactivo"}</Badge>
       </div>)}</div>
     </Card>}

     {tab==="boxes"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Boxes de Ingreso</h2>
       <p className="muted">No se puede desactivar un box que tenga un turno activo.</p>
       <div className="queue">{config?.boxes.map(b=><BoxLine key={b.id} box={b} saving={saving} save={x=>save('/api/admin/box',x)}/>)}</div>
     </Card>}

     {tab==="postulantes"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Postulantes ({postulantes.length})</h2>
       {postulantes.length?<div className="queue">{postulantes.map((r,i)=><div className="row" key={i} style={{gridTemplateColumns:"1fr"}}>
         <div style={{display:"grid",gap:4}}>
           <strong>{r.turno} · {r.categoria}</strong>
           {r.carrera_interes&&<span>Carrera de interés: {r.carrera_interes}</span>}
           <span className="muted">Residencia: {r.interes_residencia==null?"sin informar":r.interes_residencia?"sí":"no"} · Beca: {r.interes_beca==null?"sin informar":r.interes_beca?"sí":"no"}</span>
           {r.comentario_operador&&<span className="muted">Nota del operador: {r.comentario_operador}</span>}
         </div>
       </div>)}</div>:<EmptyState icon="🎓" title="Todavía no hay postulantes registrados" subtitle="Se completa cuando un operador cierra la atención con estos datos."/>}
     </Card>}

     {tab==="comentarios"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Comentarios de ingresantes ({comentarios.length})</h2>
       {comentarios.length?<div className="queue">{comentarios.map((r,i)=><div className="row" key={i} style={{gridTemplateColumns:"1fr"}}>
         <div style={{display:"grid",gap:4}}>
           <strong>{r.turno} · {r.categoria}</strong>
           <span>{r.comentario_ingresante}</span>
           {r.email_contacto&&<span className="muted">Contacto: {r.email_contacto}</span>}
         </div>
       </div>)}</div>:<EmptyState icon="💬" title="Todavía no hay comentarios en este rango"/>}
     </Card>}

     {tab==="reportes"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Informe de atención</h2>
       <div style={{display:'flex',gap:12,flexWrap:'wrap',alignItems:'end'}}>
         <FormField label="Desde"><input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></FormField>
         <FormField label="Hasta"><input type="date" value={to} onChange={e=>setTo(e.target.value)}/></FormField>
         <Button onClick={loadReport} disabled={loading}>{loading?'Cargando…':'Aplicar filtros'}</Button>
         <Button variant="secondary" onClick={downloadCsv} disabled={!rows.length}>Descargar CSV</Button>
       </div>
       <p className="muted">{rows.length} registros.</p>
     </Card>}

     {tab==="configuracion"&&<Card style={{marginTop:14}}>
       <h2 style={{marginTop:0}}>Categorías</h2>
       <p className="muted">Prefijo: 2 a 5 letras/números. Tiempo objetivo: 1 a 240 minutos.</p>
       <div className="queue">{config?.categories.map(c=><CategoryLine key={c.id} category={c} saving={saving} save={x=>save('/api/admin/category',x)}/>)}</div>
     </Card>}
   </div>
 </div>;
}

function BoxLine({box,saving,save}:{box:Box;saving:boolean;save:(v:unknown)=>void}){
 const[name,setName]=useState(box.name),[active,setActive]=useState(box.active);
 return <div className="row" style={{gridTemplateColumns:"80px 1fr auto auto"}}>
   <strong>{box.code}</strong>
   <input value={name} onChange={e=>setName(e.target.value)}/>
   <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Activo</label>
   <Button size="sm" disabled={saving} onClick={()=>save({servicePointId:box.id,name,active,floor:box.floor||'',location:box.location||''})}>Guardar</Button>
 </div>;
}

function CategoryLine({category,saving,save}:{category:Category;saving:boolean;save:(v:unknown)=>void}){
 const[name,setName]=useState(category.name),[prefix,setPrefix]=useState(category.prefix),[minutes,setMinutes]=useState(category.target_minutes||10),[active,setActive]=useState(category.active);
 return <div className="row" style={{gridTemplateColumns:"70px 1fr 90px auto auto"}}>
   <input value={prefix} onChange={e=>setPrefix(e.target.value.toUpperCase())}/>
   <input value={name} onChange={e=>setName(e.target.value)}/>
   <input type="number" min={1} max={240} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/>
   <label style={{display:"flex",alignItems:"center",gap:6}}><input type="checkbox" checked={active} onChange={e=>setActive(e.target.checked)}/> Activa</label>
   <Button size="sm" disabled={saving} onClick={()=>save({categoryId:category.id,name,prefix,targetMinutes:minutes,active})}>Guardar</Button>
 </div>;
}

function ReportTable({rows,columns}:{rows:ReportRow[];columns:string[]}){
 return <div style={{overflowX:'auto'}}>
   <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
     <thead><tr>{columns.map(c=><th key={c} style={{textAlign:'left',padding:8,borderBottom:'2px solid var(--line)'}}>{c}</th>)}</tr></thead>
     <tbody>{rows.slice(0,100).map((r,i)=><tr key={i} style={{borderBottom:'1px solid var(--line)'}}>{columns.map(c=><td key={c} style={{padding:8}}>{String((r as Record<string,unknown>)[c]??'')}</td>)}</tr>)}</tbody>
   </table>
 </div>;
}
