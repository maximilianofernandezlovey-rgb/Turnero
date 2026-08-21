import MobileQr from "../../components/MobileQr";
import GestionClient from "../../components/GestionClient";

export default function TotemPage(){
  return <main className="main" style={{maxWidth:1020,paddingTop:48,paddingBottom:60}}>
    <div className="brand" style={{color:"#071b36",fontSize:34}}>UADE</div>
    <span className="eyebrow">Atención de Ingreso</span>
    <h1 style={{marginBottom:8}}>Sacá tu turno</h1>
    <p className="lead" style={{maxWidth:720}}>Preferentemente escaneá el QR y seguí tu turno desde el celular. Si no tenés celular disponible, también podés sacar el turno desde esta pantalla.</p>
    <MobileQr/>
    <section className="card" style={{padding:28}}>
      <span className="eyebrow">Alternativa desde el tótem</span>
      <h2 style={{marginTop:8}}>Elegí tu trámite</h2>
      <GestionClient/>
    </section>
  </main>;
}
