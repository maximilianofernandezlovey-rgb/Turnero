import TotemClient from "../../components/TotemClient";

export default function TotemPage(){
  return <main className="main" style={{maxWidth:1180,paddingTop:30,paddingBottom:48}}>
    <div style={{display:"flex",alignItems:"end",justifyContent:"space-between",gap:24,flexWrap:"wrap"}}>
      <div>
        <div className="brand" style={{color:"var(--primary-darker)",fontSize:36}}>UADE</div>
        <span className="eyebrow">Tótem de atención</span>
        <h1 style={{marginBottom:8,maxWidth:760}}>Sacá tu turno de la forma que te resulte más cómoda</h1>
        <p className="lead" style={{maxWidth:760,marginBottom:0}}>Usá el QR para seguir el turno desde tu celular o elegí la opción en papel.</p>
      </div>
    </div>
    <TotemClient/>
  </main>;
}
