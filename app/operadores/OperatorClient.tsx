"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

const INGRESO_ID = "75942fa8-9bea-4207-93a8-fe4c53484500";

type Turn = { id:string; visible_number:string; category:string; category_id?:string; status?:string; wait_minutes?:number; created_at?:string };
type Box = { id:string; name:string; code:string; active:boolean; turn?: Turn | null };
type Category = { id:string; name:string; prefix:string; waiting:number; oldest_wait_minutes:number };
type Dashboard = {
  categories: Category[];
  boxes: Box[];
  waiting: Turn[];
  current: Turn | null;
  stats: { waiting:number; called:number; in_service:number; finished:number; absent:number; cancelled:number; transferred:number };
};

export default function OperatorClient(){
  const [loggedIn,setLoggedIn]=useState(false);
  const [username,setUsername]=useState("");
  const [password,setPassword]=useState("");
  const [boxId,setBoxId]=useState("");
  const [data,setData]=useState<Dashboard|null>(null);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const [transferCategory,setTransferCategory]=useState("");
  const [transferBox,setTransferBox]=useState("");

  const load = useCallback(async (selectedBox=boxId) => {
    const qs=new URLSearchParams({sectorId:INGRESO_ID});
    if(selectedBox) qs.set("servicePointId",selectedBox);
    const res=await fetch(`/api/operator/dashboard?${qs}`,{cache:"no-store"});
    const json=await res.json();
    if(res.status===401){setLoggedIn(false);return;}
    if(!res.ok||!json.ok) throw new Error(json.error||"No se pudo cargar el panel");
    setData(json.data);
    setLoggedIn(true);
  },[boxId]);

  useEffect(()=>{ load().catch(()=>{}); },[]);
  useEffect(()=>{
    if(!loggedIn) return;
    const id=setInterval(()=>load().catch(()=>{}),5000);
    return()=>clearInterval(id);
  },[loggedIn,load]);

  async function login(e:FormEvent){
    e.preventDefault(); setLoading(true); setError("");
    try{
      const res=await fetch("/api/auth/login",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({username,password})});
      const json=await res.json();
      if(!res.ok||!json.ok) throw new Error(json.error||"No se pudo iniciar sesión");
      setPassword(""); setLoggedIn(true); await load("");
    }catch(e){setError(e instanceof Error?e.message:"No se pudo iniciar sesión");}
    finally{setLoading(false);}
  }

  async function chooseBox(id:string){ setBoxId(id); setError(""); try{await load(id);}catch(e){setError(e instanceof Error?e.message:"No se pudo seleccionar el box");} }

  async function post(url:string,body:Record<string,unknown>){
    const res=await fetch(url,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});
    const json=await res.json();
    if(!res.ok||!json.ok) throw new Error(json.error||"No se pudo ejecutar la operación");
    return json.data;
  }

  async function callNext(){
    if(!boxId){setError("Seleccioná un box antes de llamar");return;}
    setLoading(true);setError("");
    try{
      const result=await post("/api/operator/call-next",{sectorId:INGRESO_ID,servicePointId:boxId});
      if(result===null) setError("No hay turnos esperando");
      await load(boxId);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo llamar");}finally{setLoading(false);}
  }

  async function callCategory(categoryId:string){
    if(!boxId){setError("Seleccioná un box antes de llamar");return;}
    setLoading(true);setError("");
    try{
      const result=await post("/api/operator/call-category",{sectorId:INGRESO_ID,categoryId,servicePointId:boxId});
      if(result===null) setError("No hay turnos esperando en esa categoría");
      await load(boxId);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo llamar por categoría");}finally{setLoading(false);}
  }

  async function callSpecific(turnId:string){
    if(!boxId){setError("Seleccioná un box antes de llamar");return;}
    setLoading(true);setError("");
    try{
      await post("/api/operator/call-specific",{turnId,servicePointId:boxId});
      await load(boxId);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo llamar el turno");}finally{setLoading(false);}
  }

  async function action(actionName:string){
    if(!data?.current?.id) return;
    setLoading(true);setError("");
    try{
      await post("/api/operator/action",{turnId:data.current.id,action:actionName});
      await load(boxId);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo ejecutar la acción");}finally{setLoading(false);}
  }

  async function transfer(){
    if(!data?.current?.id) return;
    if(!transferCategory&&!transferBox){setError("Elegí una categoría o un box de destino");return;}
    setLoading(true);setError("");
    try{
      await post("/api/operator/transfer",{
        turnId:data.current.id,
        targetCategoryId:transferCategory||null,
        targetServicePointId:transferBox||null,
      });
      setTransferCategory("");setTransferBox("");
      await load(boxId);
    }catch(e){setError(e instanceof Error?e.message:"No se pudo transferir el turno");}finally{setLoading(false);}
  }

  if(!loggedIn){
    return <div className="operator-login"><form className="card login-card" onSubmit={login}>
      <span className="eyebrow">Acceso interno</span><h2>Panel de operadores</h2>
      <label>Usuario<input value={username} onChange={e=>setUsername(e.target.value)} autoComplete="username"/></label>
      <label>Contraseña<input type="password" value={password} onChange={e=>setPassword(e.target.value)} autoComplete="current-password"/></label>
      {error&&<div className="error-box">{error}</div>}
      <button className="button" disabled={loading}>{loading?"Ingresando…":"Ingresar"}</button>
    </form></div>;
  }

  const current=data?.current;
  const selectedBox=data?.boxes?.find(b=>b.id===boxId);
  return <>
    <div className="operator-toolbar card">
      <div><span className="eyebrow">Sector</span><strong>Ingreso</strong></div>
      <label>Box
        <select value={boxId} onChange={e=>chooseBox(e.target.value)}>
          <option value="">Seleccionar box</option>
          {data?.boxes?.map(b=><option value={b.id} key={b.id}>{b.name}</option>)}
        </select>
      </label>
      <div><span className="muted">Puesto actual</span><strong>{selectedBox?.name||"Sin seleccionar"}</strong></div>
    </div>
    {error&&<div className="error-box" style={{marginTop:14}}>{error}</div>}
    <div className="grid">
      <section className="card span4"><div className="muted">Esperando</div><div className="metric">{data?.stats?.waiting??0}</div></section>
      <section className="card span4"><div className="muted">En atención</div><div className="metric">{data?.stats?.in_service??0}</div></section>
      <section className="card span4"><div className="muted">Boxes activos</div><div className="metric">{data?.boxes?.length??0} / 13</div></section>

      <section className="card span8"><h2>Cola real</h2>
        <div className="category-summary">{data?.categories?.map(c=><button className="pill" style={{border:0,cursor:"pointer"}} key={c.id} disabled={loading||!boxId||!!current||c.waiting===0} onClick={()=>callCategory(c.id)}>{c.prefix}: {c.waiting} · llamar</button>)}</div>
        <div className="queue" style={{marginTop:16}}>{data?.waiting?.length?data.waiting.map(t=><div className="row" key={t.id}><div className="number">{t.visible_number}</div><div>{t.category}</div><div>{t.wait_minutes??0} min</div><div><button className="button secondary" style={{padding:"8px 10px"}} disabled={loading||!boxId||!!current} onClick={()=>callSpecific(t.id)}>Llamar</button></div></div>):<p className="muted">No hay turnos esperando.</p>}</div>
      </section>

      <section className="card span4"><span className="pill">Turno actual</span>
        <div className="hero-number" style={{fontSize:58,marginTop:24}}>{current?.visible_number||"—"}</div>
        <p className="muted">{current?`${current.category} · ${current.status}`:"Sin atención activa"}</p>
        <div style={{display:"grid",gap:10}}>
          <button className="button" type="button" onClick={callNext} disabled={loading||!boxId||!!current}>LLAMAR SIGUIENTE</button>
          <button className="button secondary" type="button" onClick={()=>action("recall")} disabled={loading||current?.status!=="llamado"}>Volver a llamar</button>
          <button className="button" type="button" onClick={()=>action("start")} disabled={loading||current?.status!=="llamado"}>Comenzar atención</button>
          <button className="button" type="button" onClick={()=>action("finish")} disabled={loading||current?.status!=="en_atencion"}>Finalizar</button>
          <button className="button secondary" type="button" onClick={()=>action("absent")} disabled={loading||!current}>Ausente</button>
          <button className="button secondary" type="button" onClick={()=>action("cancel")} disabled={loading||!current}>Cancelar</button>
        </div>
        {current&&<div style={{marginTop:18,paddingTop:18,borderTop:"1px solid var(--line)",display:"grid",gap:10}}>
          <strong>Transferir turno</strong>
          <select value={transferCategory} onChange={e=>setTransferCategory(e.target.value)}>
            <option value="">Mantener categoría</option>
            {data?.categories?.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}
          </select>
          <select value={transferBox} onChange={e=>setTransferBox(e.target.value)}>
            <option value="">Sin box específico</option>
            {data?.boxes?.filter(b=>b.id!==boxId).map(b=><option value={b.id} key={b.id}>{b.name}</option>)}
          </select>
          <button className="button secondary" type="button" onClick={transfer} disabled={loading||(!transferCategory&&!transferBox)}>Transferir</button>
        </div>}
      </section>
    </div>
  </>;
}
