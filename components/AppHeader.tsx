import Link from "next/link";
import BackButton from "./BackButton";

export default function AppHeader(){
  return <header className="topbar">
    <div style={{display:"flex",alignItems:"center",gap:14}}>
      <div className="brand">UADE</div>
      <BackButton/>
    </div>
    <nav className="toplinks" aria-label="Navegación principal">
      <Link href="/gestion">Alumno</Link>
      <Link href="/operadores">Operadores</Link>
      <Link href="/pantalla">Pantalla TV</Link>
      <Link href="/totem">Tótem</Link>
      <Link href="/admin">Administración</Link>
    </nav>
  </header>
}
