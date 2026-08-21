"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function MobileQr(){
  const [src,setSrc]=useState("");
  const [url,setUrl]=useState("");

  useEffect(()=>{
    const target=`${window.location.origin}/gestion?origen=qr&sector=ingreso`;
    setUrl(target);
    QRCode.toDataURL(target,{width:360,margin:2,errorCorrectionLevel:"M"})
      .then(setSrc)
      .catch(()=>setSrc(""));
  },[]);

  return <section className="card" style={{maxWidth:520,margin:'0 auto 28px',textAlign:'center',padding:28}}>
    <span className="eyebrow">Turno desde tu celular</span>
    <h2 style={{marginTop:8}}>Escaneá el código QR</h2>
    <p className="muted">Abrí la cámara de tu celular, escaneá el código y elegí el trámite que necesitás.</p>
    {src?<img src={src} alt="Código QR para sacar turno" width={320} height={320} style={{display:'block',maxWidth:'100%',height:'auto',margin:'18px auto',background:'#fff',padding:12,borderRadius:24}}/>:<div className="muted" style={{padding:40}}>Generando QR…</div>}
    {url?<p className="muted" style={{fontSize:12,wordBreak:'break-all'}}>Acceso móvil seguro: {url}</p>:null}
  </section>;
}
