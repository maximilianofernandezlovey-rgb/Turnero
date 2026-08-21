import GestionClient from "../../components/GestionClient";

export default function TotemPage(){
  return <main className="main" style={{maxWidth:960,paddingTop:60}}>
    <div className="brand" style={{color:"#071b36"}}>UADE</div>
    <span className="eyebrow">Tótem de autoservicio</span>
    <h1>Seleccioná tu trámite</h1>
    <p className="lead">Tocá una opción para generar tu turno. El turno se registra en la cola real de atención.</p>
    <GestionClient/>
  </main>;
}
