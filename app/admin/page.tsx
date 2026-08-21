import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import AdminClient from "./AdminClient";

export default function AdminPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Administración</span>
    <h1>Resumen y reportes</h1>
    <p className="lead">Datos reales de atención de Ingreso, con filtros e informe descargable.</p>
    <div className="card" style={{marginBottom:20,padding:18}}>
      <strong>Acceso administrativo</strong>
      <p className="muted" style={{margin:'6px 0 12px'}}>La administración utiliza la misma sesión segura del panel interno. Si todavía no iniciaste sesión, ingresá primero con tu usuario administrador.</p>
      <Link className="primary-btn" href="/operadores">Iniciar sesión / cambiar usuario</Link>
    </div>
    <AdminClient/>
  </main></div>
}
