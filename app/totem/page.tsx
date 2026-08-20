import BackendPending from "../../components/BackendPending";

const items=["Inscripción","Informes","Visita","Equivalencias externas"];
export default function TotemPage(){
  return <main className="main" style={{maxWidth:960,paddingTop:60}}><div className="brand" style={{color:"#071b36"}}>UADE</div><span className="eyebrow">Tótem de autoservicio</span><h1>Seleccioná tu trámite</h1><div className="category-buttons">{items.map(x=><button key={x} className="category" type="button"><strong>{x}</strong></button>)}</div><BackendPending/></main>
}
