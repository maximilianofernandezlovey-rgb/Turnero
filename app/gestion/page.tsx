import GestionClient from "../../components/GestionClient";

export default function GestionPage(){
  return <div className="shell">
    <header className="topbar" style={{justifyContent:"center"}}><div className="brand">UADE</div></header>
    <main className="main" style={{maxWidth:760}}>
      <span className="eyebrow">Turno desde el celular</span>
      <h1>¿Qué necesitás resolver?</h1>
      <p className="lead">Elegí tu trámite y seguí el estado de tu turno desde esta pantalla.</p>
      <GestionClient/>
    </main>
  </div>
}
