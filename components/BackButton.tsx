"use client";

import { useRouter } from "next/navigation";

export default function BackButton(){
  const router=useRouter();
  return <button type="button" className="btn btn-secondary btn-sm" onClick={()=>router.back()} aria-label="Volver a la pantalla anterior">← Volver</button>;
}
