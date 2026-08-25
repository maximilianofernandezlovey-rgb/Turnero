"use client";

import { FormEvent, useCallback, useEffect, useRef, useState } from "react";
import Button from "../../components/ui/Button";
import Card from "../../components/ui/Card";
import Badge, { CategoryBadge } from "../../components/ui/Badge";
import Alert from "../../components/ui/Alert";
import Modal from "../../components/ui/Modal";
import MetricCard from "../../components/ui/MetricCard";
import EmptyState from "../../components/ui/EmptyState";
import FormField from "../../components/ui/FormField";
import { categoryToneIndex, formatClock, formatElapsed, formatMinutes } from "../../lib/turnDisplay";

const INGRESO_ID = "75942fa8-9bea-4207-93a8-fe4c53484500";
const BOX_STORAGE_KEY="uade_ingreso_operator_box";

type Turn = { id:string; visible_number:string; category:string; category_id?:string; status?:string; wait_minutes?:number; created_at?:string; called_at?:string|null; started_at?:string|null };
type Box = { id:string; name:string; code:string; active:boolean; turn?: Turn | null };
type Category = { id:string; name:string; prefix:string; waiting:number; oldest_wait_minutes:number };
type Dashboard = { categories:Category[]; boxes:Box[]; waiting:Turn[]; current:Turn|null; stats:{waiting:number;called:number;in_service:number;finished:number;absent:number;cancelled:number;transferred:number} };
type ProgramSuggestion = { id:string; name:string; faculty:string; program_type:string };

const FREQUENT_PROGRAMS: ProgramSuggestion[] = [
{ id:"89ac7bc0-fc49-4cd4-94f0-b3d8111542a0", name:"Administración de Empresas", faculty:"Ciencias Económicas", program_type:"grado" },
{ id:"4ffb7c70-9685-4622-b364-f5c42584ec93", name:"Contador Público", faculty:"Ciencias Económicas", program_type:"grado" },
{ id:"d2f68423-e04c-4b6b-a0de-86847e397ebe", name:"Marketing", faculty:"Ciencias Económicas", program_type:"grado" },
{ id:"9cbb7d58-3ce3-4180-aa1d-03932e85c8aa", name:"Comercio Internacional", faculty:"Ciencias Económicas", program_type:"grado" },
{ id:"f1d474c5-9eee-4912-b91f-b8a256270239", name:"Economía", faculty:"Ciencias Económicas", program_type:"grado" },
];

export default function OperatorClient(){
const [loggedIn,setLoggedIn]=useState(false),[username,setUsername]=useState(""),[password,setPassword]=useState("");
const [operatorName,setOperatorName]=useState("");
const [boxId,setBoxId]=useState(""); const [data,setData]=useState<Dashboard|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
const [transferOpen,setTransferOpen]=useState(false);
const [transferCategory,setTransferCategory]=useState(""),[transferBox,setTransferBox]=useState("");
const [closureTurn,setClosureTurn]=useState<Turn|null>(null),[careerInterest,setCareerInterest]=useState(""),[academicProgramId,setAcademicProgramId]=useState(""),[residenceInterest,setResidenceInterest]=useState(false),[operatorComment,setOperatorComment]=useState(""),[closureSaved,setClosureSaved]=useState(false);
const [careerSuggestions,setCareerSuggestions]=useState<ProgramSuggestion[]>([]);
const [showSuggestions,setShowSuggestions]=useState(false);
const searchTimeoutRef=useRef<ReturnType<typeof setTimeout>|null>(null);
const careerInputRef=useRef<HTMLInputElement>(null);
const [now,setNow]=useState(()=>new Date());

useEffect(()=>{const id=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(id)},[]);

const load=useCallback(async(selectedBox=boxId)=>{const qs=new URLSearchParams({sectorId:INGRESO_ID});if(selectedBox)qs.set("servicePointId",selectedBox);const res=await fetch(`/api/operator/dashboard?${qs}`,{cache:"no-store"});const json=await res.json();if(res.status===401){setLoggedIn(false);return}if(!res.ok||!json.ok)throw new Error(json.error||"No se pudo cargar el panel");setData(json.data);setLoggedIn(true)},[boxId]);
useEffect(()=>{const saved=window.localStorage.getItem(BOX_STORAGE_KEY)||"";if(saved)setBoxId(saved);load(saved).catch(()=>{})},[]);
useEffect(()=>{if(!loggedIn)return;const id=setInterval(()=>load().catch(()=>{}),5000);return()=>clearInterval(id)},[loggedIn,load]);

async function login(e:FormEvent){e.preventDefault();setLoading(true);setError("");try{const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});const json=await res.json();if(!res.ok||!json.ok)throw new Error(json.error||"No se pudo iniciar sesión");setOperatorName(username);setPassword("");setLoggedIn(true);const saved=window.localStorage.getItem(BOX_STORAGE_KEY)||"";if(saved)setBoxId(saved);await load(saved)}catch(e){setError(e instanceof Error?e.message:"No se pudo iniciar sesión")}finally{setLoading(false)}}
async function chooseBox(id:string){setBoxId(id);if(id)window.localStorage.setItem(BOX_STORAGE_KEY,id);else window.localStorage.removeItem(BOX_STORAGE_KEY);setError("");try{await load(id)}catch(e){setError(e instanceof Error?e.message:"No se pudo seleccionar el box")}}
async function post(url:string,body:Record<string,unknown>){const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});const json=await res.json();if(!res.ok||!json.ok)throw new Error(json.error||"No se pudo ejecutar la operación");return json.data}
async function callNext(){if(!boxId){setError("Seleccioná un box antes de llamar");return}setLoading(true);setError("");try{const r=await post("/api/operator/call-next",{sectorId:INGRESO_ID,servicePointId:boxId});if(r===null)setError("No hay turnos esperando");await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo llamar")}finally{setLoading(false)}}
async function callCategory(categoryId:string){if(!boxId){setError("Seleccioná un box antes de llamar");return}setLoading(true);setError("");try{const r=await post("/api/operator/call-category",{sectorId:INGRESO_ID,categoryId,servicePointId:boxId});if(r===null)setError("No hay turnos esperando en esa categoría");await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo llamar por categoría")}finally{setLoading(false)}}
async function callSpecific(turnId:string){if(!boxId){setError("Seleccioná un box antes de llamar");return}setLoading(true);setError("");try{await post("/api/operator/call-specific",{turnId,servicePointId:boxId});await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo llamar el turno")}finally{setLoading(false)}}
async function action(actionName:string){if(!data?.current?.id)return;const t=data.current;setLoading(true);setError("");try{await post("/api/operator/action",{turnId:t.id,action:actionName});if(actionName==="finish"){setClosureTurn({...t,status:"finalizado"});setClosureSaved(false);setCareerInterest("");setAcademicProgramId("");setCareerSuggestions([]);setShowSuggestions(false);setResidenceInterest(false);setOperatorComment("")}await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo ejecutar la acción")}finally{setLoading(false)}}
function onCareerInputChange(value:string){setCareerInterest(value);setAcademicProgramId("");if(searchTimeoutRef.current)clearTimeout(searchTimeoutRef.current);if(value.trim().length<2){setCareerSuggestions([]);setShowSuggestions(false);return}searchTimeoutRef.current=setTimeout(async()=>{try{const res=await fetch(`/api/operator/search-programs?q=${encodeURIComponent(value.trim())}`);const json=await res.json();if(res.ok&&json.ok){setCareerSuggestions(json.data||[]);setShowSuggestions(true)}}catch{/* no bloquea la carga manual del texto */}},250)}
async function showMorePrograms(){
try{
const res=await fetch("/api/operator/search-programs?q=");
const json=await res.json();
if(res.ok&&json.ok){setCareerSuggestions(json.data||[]);setShowSuggestions(true)}
}catch{}
careerInputRef.current?.focus();
}
function pickProgram(p:ProgramSuggestion){setCareerInterest(p.name);setAcademicProgramId(p.id);setCareerSuggestions([]);setShowSuggestions(false)}
async function saveClosure(e:FormEvent){e.preventDefault();if(!closureTurn?.id)return;setLoading(true);setError("");try{await post("/api/operator/closure",{turnId:closureTurn.id,careerInterest,academicProgramId:academicProgramId||null,residenceInterest,operatorComment});setClosureSaved(true)}catch(e){setError(e instanceof Error?e.message:"No se pudo guardar el cierre")}finally{setLoading(false)}}
async function transfer(){if(!data?.current?.id)return;if(!transferCategory&&!transferBox){setError("Elegí una categoría o un box de destino");return}setLoading(true);setError("");try{await post("/api/operator/transfer",{turnId:data.current.id,targetCategoryId:transferCategory||null,targetServicePointId:transferBox||null});setTransferCategory("");setTransferBox("");setTransferOpen(false);await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo transferir el turno")}finally{setLoading(false)}}

if(!loggedIn)return <div className="operator-login">
<form onSubmit={login}>
<Card className="login-card">
<span className="eyebrow">Acceso interno</span>
<h2 style={{margin:"4px 0 14px"}}>Panel de operadores</h2>
<div style={{display:"grid",gap:14}}>
<FormField label="Usuario"><input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/></FormField>
<FormField label="Contraseña"><input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></FormField>
{error&&<Alert tone="danger">{error}</Alert>}
<Button type="submit" disabled={loading} block>{loading?"Ingresando…":"Ingresar"}</Button>
</div>
</Card>
</form>
</div>;

if(loggedIn&&!boxId)return <div className="operator-login">
<Card className="login-card" style={{maxWidth:560}}>
<span className="eyebrow">{operatorName||"Operador"}</span>
<h2 style={{margin:"4px 0 6px"}}>¿En qué box vas a atender hoy?</h2>
<p className="muted" style={{marginTop:0}}>Se va a recordar para tus próximas atenciones en este dispositivo.</p>
{error&&<div style={{marginBottom:12}}><Alert tone="danger">{error}</Alert></div>}
<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(110px,1fr))",gap:10,marginTop:10}}>
{data?.boxes?.map(b=><button key={b.id} type="button" className="badge badge-neutral" style={{border:"1px solid var(--line)",cursor:"pointer",padding:"14px 8px",fontSize:15,fontWeight:700}} onClick={()=>chooseBox(b.id)}>{b.name}</button>)}
</div>
{!data?.boxes?.length&&<p className="muted">Cargando boxes disponibles…</p>}
</Card>
</div>;

const current=data?.current;const selectedBox=data?.boxes?.find(b=>b.id===boxId);
const chronoSource=current?.status==="en_atencion"?current.started_at:current?.called_at;
const nextAction = !current ? {label:"LLAMAR SIGUIENTE",fn:callNext,disabled:loading||!boxId} :
current.status==="llamado" ? {label:"Comenzar atención",fn:()=>action("start"),disabled:loading} :
current.status==="en_atencion" ? {label:"Finalizar",fn:()=>action("finish"),disabled:loading} :
{label:"LLAMAR SIGUIENTE",fn:callNext,disabled:true};

return <>
<Card style={{display:"flex",flexWrap:"wrap",gap:20,alignItems:"center",justifyContent:"space-between"}}>
<div style={{display:"flex",gap:28,flexWrap:"wrap",alignItems:"center"}}>
<div><span className="muted" style={{fontSize:12}}>OPERADOR</span><div style={{fontWeight:800}}>{operatorName||"—"}</div></div>
<div>
<span className="muted" style={{fontSize:12}}>BOX</span>
<select value={boxId} onChange={e=>chooseBox(e.target.value)} style={{display:"block",border:"1px solid var(--line)",borderRadius:10,padding:"8px 10px",marginTop:2}}>
<option value="">Seleccionar box</option>
{data?.boxes?.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}
</select>
</div>
<div><span className="muted" style={{fontSize:12}}>HORA</span><div style={{fontWeight:800}}>{formatClock(now)}</div></div>
<div><span className="muted" style={{fontSize:12}}>ESTADO</span><div><Badge tone="success">● Conectado</Badge></div></div>
</div>
</Card>

{error&&<div style={{marginTop:14}}><Alert tone="danger">{error}</Alert></div>}

<div className="metric-grid" style={{marginTop:20}}>
<MetricCard label="Esperando" value={data?.stats?.waiting??0}/>
<MetricCard label="En atención" value={data?.stats?.in_service??0} accent="success"/>
<MetricCard label="Box actual" value={selectedBox?.name||"—"}/>
</div>

<div className="operator-columns">
<Card>
<h2 style={{marginTop:0}}>Cola de espera</h2>
<div className="category-summary" style={{marginBottom:14}}>
{data?.categories?.map(c=><button key={c.id} className="badge badge-neutral" style={{border:0,cursor:"pointer"}}
disabled={loading||!boxId||!!current||c.waiting===0} onClick={()=>callCategory(c.id)}>
{c.prefix}: {c.waiting} · llamar
</button>)}
</div>
{data?.waiting?.length?
<div className="queue">
{data.waiting.map(t=><div className="row" key={t.id} style={{gridTemplateColumns:"auto 1fr auto auto"}}>
<CategoryBadge index={categoryToneIndex(t.category_id||t.category)}>{t.visible_number}</CategoryBadge>
<div>{t.category}</div>
<div className="muted">{formatMinutes(t.wait_minutes)}</div>
<Button size="sm" variant="secondary" disabled={loading||!boxId||!!current} onClick={()=>callSpecific(t.id)}>Llamar</Button>
</div>)}
</div>
:<EmptyState icon="🪑" title="No hay turnos esperando" subtitle="La cola de Ingreso está vacía en este momento."/>}
</Card>

<Card>
<span className="badge badge-info">Turno actual</span>
<div className="hero-number" style={{fontSize:56,marginTop:18}}>{current?.visible_number||"—"}</div>
<p className="muted" style={{marginTop:0}}>{current?`${current.category} · ${current.status}`:"Sin atención activa"}</p>
{current&&<div style={{fontSize:34,fontWeight:900,letterSpacing:"-.02em",margin:"6px 0 16px"}}>{formatElapsed(chronoSource,now.getTime())}</div>}

<Button block onClick={nextAction.fn} disabled={nextAction.disabled} size="lg">{nextAction.label}</Button>

<div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:12}}>
<Button size="sm" variant="secondary" onClick={()=>action("recall")} disabled={loading||current?.status!=="llamado"}>Volver a llamar</Button>
<Button size="sm" variant="secondary" onClick={()=>action("absent")} disabled={loading||!current}>Ausente</Button>
<Button size="sm" variant="secondary" onClick={()=>action("cancel")} disabled={loading||!current}>Cancelar</Button>
<Button size="sm" variant="ghost" onClick={()=>setTransferOpen(true)} disabled={loading||!current}>Transferir…</Button>
</div>
</Card>
</div>

{transferOpen&&<Modal title="Transferir turno" onClose={()=>setTransferOpen(false)}>
<div style={{display:"grid",gap:14}}>
<FormField label="Categoría de destino">
<select value={transferCategory} onChange={e=>setTransferCategory(e.target.value)}>
<option value="">Mantener categoría</option>
{data?.categories?.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
</select>
</FormField>
<FormField label="Box de destino">
<select value={transferBox} onChange={e=>setTransferBox(e.target.value)}>
<option value="">Sin box específico</option>
{data?.boxes?.filter(b=>b.id!==boxId).map(b=><option value={b.id} key={b.id}>{b.name}</option>)}
</select>
</FormField>
<Button onClick={transfer} disabled={loading||(!transferCategory&&!transferBox)} block>Transferir</Button>
</div>
</Modal>}

{closureTurn&&<Modal title={`Finalizar atención · ${closureTurn.visible_number}`} onClose={()=>{if(closureSaved)setClosureTurn(null)}}>
<form onSubmit={saveClosure}>
<div style={{display:"grid",gridTemplateColumns:"1.3fr 1fr",gap:22}}>
<div>
<FormField label="Carrera de interés *">
<div style={{position:"relative"}}>
<input value={careerInterest} onChange={e=>onCareerInputChange(e.target.value)} onFocus={()=>{if(careerSuggestions.length)setShowSuggestions(true)}} onBlur={()=>setTimeout(()=>setShowSuggestions(false),150)} placeholder="Buscar carrera..." autoComplete="off" ref={careerInputRef}/>
{showSuggestions&&careerSuggestions.length>0&&<div style={{position:"absolute",top:"100%",left:0,right:0,background:"var(--surface,#fff)",border:"1px solid var(--line)",borderRadius:10,marginTop:4,maxHeight:220,overflowY:"auto",zIndex:20,boxShadow:"0 8px 20px rgba(0,0,0,.12)"}}>
{careerSuggestions.map(p=><button key={p.id} type="button" onMouseDown={()=>pickProgram(p)} style={{display:"block",width:"100%",textAlign:"left",padding:"9px 12px",border:0,background:"transparent",cursor:"pointer"}}>
<div style={{fontWeight:700,fontSize:14}}>{p.name}</div>
<div className="muted" style={{fontSize:12}}>{p.faculty}{p.program_type==="tecnicatura"?" · Tecnicatura":""}</div>
</button>)}
</div>}
</div>
</FormField>
<div style={{marginTop:16}}>
<div className="muted" style={{fontSize:11,fontWeight:700,letterSpacing:.4,textTransform:"uppercase",marginBottom:8}}>Sugerencias frecuentes</div>
<div style={{display:"flex",flexWrap:"wrap",gap:8}}>
{FREQUENT_PROGRAMS.map(p=><button key={p.id} type="button" onClick={()=>pickProgram(p)} className="badge badge-neutral" style={{border:"1px solid var(--line)",cursor:"pointer",padding:"7px 13px",fontWeight:600,display:"inline-flex",alignItems:"center",gap:6}}><span aria-hidden="true">🎓</span>{p.name}</button>)}
</div>
<button type="button" onClick={showMorePrograms} style={{border:0,background:"transparent",color:"var(--primary,#1d4ed8)",fontWeight:700,cursor:"pointer",padding:"10px 0 0",fontSize:13}}>Ver más carreras →</button>
</div>
</div>
<div style={{display:"grid",gap:14,alignContent:"start"}}>
<label style={{display:"flex",alignItems:"center",gap:9,fontWeight:600,cursor:"pointer",border:"1px solid var(--line)",borderRadius:12,padding:14}}>
<input type="checkbox" checked={residenceInterest} onChange={e=>setResidenceInterest(e.target.checked)} style={{width:18,height:18}}/>
¿Interesado en Residencia UADE?
</label>
<FormField label="Observaciones (opcional)">
<textarea value={operatorComment} onChange={e=>setOperatorComment(e.target.value.slice(0,300))} maxLength={300} rows={9} placeholder="Escribí alguna observación relevante..." style={{minHeight:170}}/>
<div className="muted" style={{textAlign:"right",fontSize:11,marginTop:2}}>{operatorComment.length} / 300 caracteres</div>
</FormField>
</div>
</div>
<div style={{display:"flex",justifyContent:"flex-end",gap:10,marginTop:20}}>
<Button type="button" variant="secondary" onClick={()=>setClosureTurn(null)}>Cancelar</Button>
{closureSaved?<Alert tone="success">Cierre guardado correctamente.</Alert>:<Button type="submit" disabled={loading}>Guardar y finalizar</Button>}
</div>
</form>
</Modal>}
</>;
}
