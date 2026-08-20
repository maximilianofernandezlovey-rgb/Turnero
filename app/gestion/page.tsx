import AppHeader from "../../components/AppHeader";
import GestionClient from "../../components/GestionClient";

export default function GestionPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Atención universitaria</span>
    <h1>¿Qué necesitás resolver?</h1>
    <p className="lead">Elegí el motivo de tu consulta. El turno se genera en la base real y queda disponible para el circuito de atención.</p>
    <GestionClient/>
    <p className="footer-note">Siguiente etapa: seguimiento del turno en tiempo real, posición, box asignado y asistente académico.</p>
  </main></div>
}
