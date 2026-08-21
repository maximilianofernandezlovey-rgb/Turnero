"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

export default function MobileQr(){
  const [src,setSrc]=useState("");

  useEffect(()=>{
    const target=`${window.location.origin}/gestion?origen=qr&sector=ingreso`;
    QRCode.toDataURL(target,{width:420,margin:2,errorCorrectionLevel:"M"})
      .then(setSrc)
      .catch(()=>setSrc(""));
  },[]);

  return <div style={{textAlign:"center"}}>
    {src?<img src={src} alt="Código QR para sacar turno desde el celular" width={360} height={360} style={{display:"block",maxWidth:"100%",height:"auto",margin:"0 auto",background:"#fff",padding:10}}/>:<div className="muted" style={{padding:60}}>Generando QR…</div>}
  </div>;
}
