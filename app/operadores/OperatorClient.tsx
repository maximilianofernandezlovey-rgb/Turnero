"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
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

export default function OperatorClient(){
  const [loggedIn,setLoggedIn]=useState(false),[username,setUsername]=useState(""),[password,setPassword]=useState("");
  const [operatorName,setOperatorName]=useState("");
  const [boxId,setBoxId]=useState(""); const [data,setData]=useState<Dashboard|null>(null); const [loading,setLoading]=useState(false); const [error,setError]=useState("");
  const [transferOpen,setTransferOpen]=useState(false);
  const [transferCategory,setTransferCategory]=useState(""),[transferBox,setTransferBox]=useState("");
  const [closureTurn,setClosureTurn]=useState<Turn|null>(null),[careerInterest,setCareerInterest]=useState(""),[residenceInterest,setResidenceInterest]=useState(""),[scholarshipInterest,setScholarshipInterest]=useState(""),[operatorComment,setOperatorComment]=useState(""),[closureSaved,setClosureSaved]=useState(false);
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
  async function action(actionName:string){if(!data?.current?.id)return;const t=data.current;setLoading(true);setError("");try{await post("/api/operator/action",{turnId:t.id,action:actionName});if(actionName==="finish"){setClosureTurn({...t,status:"finalizado"});setClosureSaved(false);setCareerInterest("");setResidenceInterest("");setScholarshipInterest("");setOperatorComment("")}await load(boxId)}catch(e){setError(e instanceof Error?e.message:"No se pudo ejecutar la acción")}finally{setLoading(false)}}
  async function saveClosure(e:FormEvent){e.preventDefault();if(!closureTurn?.id)return;setLoading(true);setError("");try{await post("/api/operator/closure",{turnId:closureTurn.id,careerInterest,residenceInterest:residenceInterest===""?null:residenceInterest==="yes",scholarshipInterest:scholarshipInterest===""?null:scholarshipInterest==="yes",operatorComment});setClosureSaved(true)}catch(e){setError(e instanceof Error?e.message:"No se pudo guardar el cierre")}finally{setLoading(false)}}
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

    {closureTurn&&<form onSubmit={saveClosure}><Card style={{marginTop:16,display:"grid",gap:14}}>
      <div><span className="eyebrow">Cierre de atención</span><h2 style={{margin:"4px 0 0"}}>{closureTurn.visible_number}</h2></div>
      <FormField label="Carrera de interés"><input value={careerInterest} onChange={e=>setCareerInterest(e.target.value)} placeholder="Ej.: Lic. en Administración"/></FormField>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
        <FormField label="¿Interesado en residencia?"><select value={residenceInterest} onChange={e=>setResidenceInterest(e.target.value)}><option value="">Sin informar</option><option value="yes">Sí</option><option value="no">No</option></select></FormField>
        <FormField label="¿Interesado en becas?"><select value={scholarshipInterest} onChange={e=>setScholarshipInterest(e.target.value)}><option value="">Sin informar</option><option value="yes">Sí</option><option value="no">No</option></select></FormField>
      </div>
      <FormField label="Comentario del operador"><textarea value={operatorComment} onChange={e=>setOperatorComment(e.target.value)} rows={3}/></FormField>
      {closureSaved?<Alert tone="success">Cierre guardado correctamente.</Alert>:<Button type="submit" disabled={loading}>Guardar cierre</Button>}
      {closureSaved&&<Button type="button" variant="secondary" onClick={()=>setClosureTurn(null)}>Cerrar formulario</Button>}
    </Card></form>}

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
            disabled={loading||!boxId||!!current||c.waiting===0||(!!closureTurn&&!closureSaved)} onClick={()=>callCategory(c.id)}>
            {c.prefix}: {c.waiting} · llamar
          </button>)}
        </div>
        {data?.waiting?.length?
          <div className="queue">
            {data.waiting.map(t=><div className="row" key={t.id} style={{gridTemplateColumns:"auto 1fr auto auto"}}>
              <CategoryBadge index={categoryToneIndex(t.category_id||t.category)}>{t.visible_number}</CategoryBadge>
              <div>{t.category}</div>
              <div className="muted">{formatMinutes(t.wait_minutes)}</div>
              <Button size="sm" variant="secondary" disabled={loading||!boxId||!!current||(!!closureTurn&&!closureSaved)} onClick={()=>callSpecific(t.id)}>Llamar</Button>
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
  </>;
}
