"use client";

import { useEffect, useState } from "react";
import MobileQr from "./MobileQr";
import PaperTurnClient from "./PaperTurnClient";
import Button from "./ui/Button";
import { formatClock } from "../lib/turnDisplay";

const STEPS = [
  { title: "Escaneá", detail: "Abrí la cámara de tu teléfono y apuntá al código." },
  { title: "Elegí tu trámite", detail: "Inscripción, Informes o Equivalencias externas." },
  { title: "Seguí tu turno", detail: "Vas a ver tu número, cuántas personas tenés adelante y el box." },
];

export default function TotemClient(){
  const [paper,setPaper]=useState(false);
  const [now,setNow]=useState<Date|null>(null);
  useEffect(()=>{setNow(new Date());const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id)},[]);

  if(paper)return <section className="surface surface-pad">
    <Button variant="secondary" onClick={()=>setPaper(false)}>← Volver</Button>
    <span className="eyebrow" style={{display:'block',marginTop:18}}>Turno en papel</span>
    <h2 style={{marginTop:4}}>Elegí tu trámite</h2>
    <PaperTurnClient onDone={()=>setPaper(false)}/>
  </section>;

  return <section className="surface" style={{overflow:'hidden',padding:0}}>
    <div style={{display:'grid',gridTemplateColumns:'minmax(320px,1fr) minmax(320px,1fr)'}}>
      <div style={{padding:34,background:'#fff',position:'relative'}}>
        {now&&<div className="muted" style={{position:'absolute',top:18,right:22,fontWeight:800}}>{formatClock(now)}</div>}
        <MobileQr/>
      </div>
      <div style={{padding:38,background:'var(--primary-darker)',color:'#fff',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <span className="eyebrow" style={{color:'var(--celeste)'}}>Rápido y sin papel</span>
        <h2 style={{fontSize:40,margin:'8px 0 24px'}}>Seguí tu turno desde el celular</h2>
        <div style={{display:'grid',gap:18}}>
          {STEPS.map((step,i)=>
            <div key={step.title} style={{display:'flex',gap:14,alignItems:'flex-start'}}>
              <span style={{flexShrink:0,width:34,height:34,borderRadius:'50%',background:'var(--celeste)',color:'var(--primary-darker)',display:'grid',placeItems:'center',fontWeight:950}}>{i+1}</span>
              <div><strong>{step.title}</strong><div style={{opacity:.8}}>{step.detail}</div></div>
            </div>
          )}
        </div>
      </div>
    </div>
    <div style={{padding:'18px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,background:'var(--neutral-bg)',flexWrap:'wrap'}}>
      <div><span className="eyebrow">¿No tenés celular o batería?</span><strong style={{display:'block',marginTop:4}}>También podés sacar un turno en papel</strong></div>
      <Button size="lg" onClick={()=>setPaper(true)}>Sacar turno en papel →</Button>
    </div>
  </section>;
}
