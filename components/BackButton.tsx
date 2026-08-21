"use client";

import { useRouter } from "next/navigation";

export default function BackButton(){
  const router=useRouter();
  return <button type="button" className="button secondary" onClick={()=>router.back()} aria-label="Volver a la pantalla anterior">← Volver</button>;
}
