import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import AdminClient from "./AdminClient";

export default function AdminPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <PageHeader eyebrow="Administración" title="Panel operativo de Ingreso" lead="Estado del sector, turnos, operadores y reportes en un mismo lugar."/>
    <Card style={{margin:'20px 0'}}>
      <strong>Acceso administrativo</strong>
      <p className="muted" style={{margin:'6px 0 12px'}}>La administración utiliza la misma sesión segura del panel interno. Si todavía no iniciaste sesión, ingresá primero con tu usuario administrador.</p>
      <Link className="btn btn-primary" href="/operadores">Iniciar sesión / cambiar usuario</Link>
    </Card>
    <AdminClient/>
  </main></div>
}
