"use client";

import { useEffect, useState } from "react";
import MobileQr from "./MobileQr";
import PaperTurnClient from "./PaperTurnClient";
import Button from "./ui/Button";
import { formatClock } from "../lib/turnDisplay";
import styles from "./TotemClient.module.css";

const STEPS = [
  { title: "Escaneá el QR", detail: "Abrí la cámara del celular y apuntá al código para empezar." },
  { title: "Elegí tu trámite", detail: "Inscripción, Informes generales o Equivalencias externas." },
  { title: "Seguí tu turno", detail: "Vas a ver tu número, la espera estimada y el box cuando te llamemos." },
];

export default function TotemClient(){
  const [paper,setPaper]=useState(false);
  const [now,setNow]=useState<Date|null>(null);
  useEffect(()=>{setNow(new Date());const id=setInterval(()=>setNow(new Date()),30000);return()=>clearInterval(id)},[]);

  if(paper)return <section className={`${styles.shell} ${styles.paperView}`}>
    <div className={styles.back}><Button variant="secondary" onClick={()=>setPaper(false)}>← Volver</Button></div>
    <span className="eyebrow">Turno en papel</span>
    <h2 className={styles.paperTitle}>Elegí el motivo de tu consulta</h2>
    <p className={styles.paperLead}>Tocá una opción para generar e imprimir tu número.</p>
    <PaperTurnClient onDone={()=>setPaper(false)}/>
  </section>;

  return <section className={styles.shell}>
    <div className={styles.hero}>
      <div className={styles.qrPane}>
        {now&&<div className={styles.clock}>{formatClock(now)}</div>}
        <div className={styles.qrLabel}>Opción recomendada</div>
        <MobileQr/>
      </div>
      <div className={styles.guidePane}>
        <span className={styles.eyebrow}>Turno desde el celular</span>
        <h2 className={styles.title}>Escaneá, elegí tu trámite y seguí la espera.</h2>
        <div className={styles.steps}>
          {STEPS.map((step,i)=><div key={step.title} className={styles.step}>
            <span className={styles.stepNumber}>{i+1}</span>
            <div><strong>{step.title}</strong><p>{step.detail}</p></div>
          </div>)}
        </div>
      </div>
    </div>
    <div className={styles.paperBar}>
      <div className={styles.paperCopy}><span>Alternativa</span><strong>¿No tenés celular o batería? Sacá tu turno en papel.</strong></div>
      <Button size="lg" onClick={()=>setPaper(true)}>Sacar turno en papel</Button>
    </div>
  </section>;
}
