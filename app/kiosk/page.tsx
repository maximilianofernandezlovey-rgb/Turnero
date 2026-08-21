import TotemClient from "../../components/TotemClient";

export default function KioskPage(){
  return <main className="main" style={{maxWidth:1100,paddingTop:42,paddingBottom:60}}>
    <div className="brand" style={{color:"#071b36",fontSize:34}}>UADE</div>
    <span className="eyebrow">Tótem de autoservicio</span>
    <h1 style={{marginBottom:8}}>Escaneá el código QR</h1>
    <p className="lead" style={{maxWidth:760}}>Sacá tu turno desde el celular y seguí la espera desde ahí. Si no tenés celular disponible, también podés obtener un turno en papel.</p>
    <TotemClient/>
  </main>;
}
