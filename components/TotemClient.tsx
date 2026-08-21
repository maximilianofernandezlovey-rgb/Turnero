"use client";

import { useState } from "react";
import MobileQr from "./MobileQr";
import PaperTurnClient from "./PaperTurnClient";

export default function TotemClient(){
  const [paper,setPaper]=useState(false);
  if(paper)return <section className="card" style={{padding:28}}><button className="button secondary" onClick={()=>setPaper(false)}>← Volver</button><span className="eyebrow" style={{display:'block',marginTop:18}}>Turno en papel</span><h2>Elegí tu trámite</h2><PaperTurnClient onDone={()=>setPaper(false)}/></section>;
  return <section className="card" style={{overflow:'hidden',padding:0}}>
    <div style={{display:'grid',gridTemplateColumns:'minmax(320px,1fr) minmax(320px,1fr)'}}>
      <div style={{padding:34,background:'#fff'}}><MobileQr/></div>
      <div style={{padding:38,background:'#0b2342',color:'#fff',display:'flex',flexDirection:'column',justifyContent:'center'}}>
        <span className="eyebrow" style={{color:'#65e6c4'}}>Rápido y sin papel</span>
        <h2 style={{fontSize:40,margin:'8px 0 20px'}}>Seguí tu turno desde el celular</h2>
        <div style={{display:'grid',gap:16}}>
          <div><strong>1. Escaneá el QR</strong><div style={{opacity:.75}}>Abrí la cámara de tu teléfono y apuntá al código.</div></div>
          <div><strong>2. Elegí el trámite</strong><div style={{opacity:.75}}>Inscripción, Informes o Equivalencias externas.</div></div>
          <div><strong>3. Esperá el llamado</strong><div style={{opacity:.75}}>Vas a ver tu número, cuántas personas tenés adelante y el box.</div></div>
        </div>
      </div>
    </div>
    <div style={{padding:'18px 24px',display:'flex',justifyContent:'space-between',alignItems:'center',gap:20,background:'#eef2f6'}}>
      <div><span className="eyebrow">¿No tenés celular o batería?</span><strong style={{display:'block',marginTop:4}}>También podés sacar un turno en papel</strong></div>
      <button className="primary-btn" onClick={()=>setPaper(true)}>Sacar turno en papel →</button>
    </div>
  </section>;
}
