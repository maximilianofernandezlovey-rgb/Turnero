import AppHeader from "../../components/AppHeader";
import AdminClient from "./AdminClient";

export default function AdminPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Administración</span>
    <h1>Resumen y reportes</h1>
    <p className="lead">Datos reales de atención de Ingreso, con filtros e informe descargable.</p>
    <AdminClient/>
  </main></div>
}
