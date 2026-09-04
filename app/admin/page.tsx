import Link from "next/link";
import AppHeader from "../../components/AppHeader";
import PageHeader from "../../components/ui/PageHeader";
import Card from "../../components/ui/Card";
import AdminClient from "./AdminClient";
import styles from "./AdminPage.module.css";

export default function AdminPage(){
  return <div className={`shell ${styles.admin}`}><AppHeader/><main className="main">
    <div className={styles.hero}>
      <PageHeader eyebrow="Administración" title="Panel operativo de Ingreso" lead="Un tablero para entender la atención de hoy, detectar cuellos de botella y gestionar la operación."/>
      <div className={styles.heroMeta}>
        <span className={styles.heroChip}>Vista ejecutiva</span>
        <span className={styles.heroChip}>Datos del día</span>
      </div>
    </div>
    <Card className={styles.accessCard}>
      <div className={styles.accessCopy}>
        <span className={styles.status}><span className={styles.statusDot}/>Panel interno</span>
        <strong>Acceso administrativo</strong>
        <p>Usá tu sesión interna para administrar turnos, operadores, boxes y reportes.</p>
      </div>
      <Link className="btn btn-primary" href="/operadores">Iniciar sesión / cambiar usuario</Link>
    </Card>
    <AdminClient/>
  </main></div>
}
