import GestionClient from "../../components/GestionClient";

export default function GestionPage(){
  return <div className="shell">
    <header className="topbar" style={{justifyContent:"center"}}><div className="brand">UADE</div></header>
    <main className="main" style={{maxWidth:760}}>
      <GestionClient/>
    </main>
  </div>
}
