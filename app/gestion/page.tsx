import AppHeader from "../../components/AppHeader";
import BackendPending from "../../components/BackendPending";

const options=[
  ["Inscripción","INS","Inscripción y consultas de ingreso"],
  ["Informes","INF","Información general y orientación"],
  ["Visita","VIS","Consultas relacionadas con visitas"],
  ["Equivalencias externas","EQE","Ingreso con estudios previos"],
];

export default function GestionPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Atención universitaria</span>
    <h1>¿Qué necesitás resolver?</h1>
    <p className="lead">Elegí el motivo de tu consulta. Esta será la experiencia móvil de acceso por QR y seguimiento del turno.</p>
    <div className="category-buttons">{options.map(([name,prefix,desc])=><button className="category" key={prefix} type="button"><span className="pill">{prefix}</span><br/><br/><strong>{name}</strong><div className="muted" style={{marginTop:8}}>{desc}</div></button>)}</div>
    <BackendPending/>
    <p className="footer-note">Próxima integración: QR → categoría → creación transaccional → ticket digital → espera en tiempo real → IA.</p>
  </main></div>
}
