import AppHeader from "../../components/AppHeader";
import BackendPending from "../../components/BackendPending";

const demo=[
  ["INS-001","Inscripción","8 min","11:30"],
  ["INF-001","Informes","5 min","11:33"],
  ["INS-002","Inscripción","3 min","11:35"],
];

export default function OperadoresPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Panel interno · Ingreso</span><h1>Atención — Box 4</h1>
    <p className="lead">Vista operativa orientada a acciones rápidas. El backend deberá garantizar que dos operadores nunca tomen el mismo turno.</p>
    <div className="grid">
      <section className="card span4"><div className="muted">Esperando</div><div className="metric">12</div></section>
      <section className="card span4"><div className="muted">Espera estimada</div><div className="metric">11 min</div></section>
      <section className="card span4"><div className="muted">Boxes activos</div><div className="metric">9 / 13</div></section>
      <section className="card span8"><h2>Cola</h2><div className="queue">{demo.map(r=><div className="row" key={r[0]}><div className="number">{r[0]}</div><div>{r[1]}</div><div>{r[2]}</div><div>{r[3]}</div></div>)}</div></section>
      <section className="card span4"><span className="pill">Turno actual</span><div className="hero-number" style={{fontSize:58,marginTop:24}}>INS-000</div><p className="muted">Sin atención activa</p><div style={{display:"grid",gap:10}}><button className="button" type="button" disabled>LLAMAR SIGUIENTE</button><button className="button secondary" type="button" disabled>Volver a llamar</button></div></section>
    </div><BackendPending/>
  </main></div>
}
