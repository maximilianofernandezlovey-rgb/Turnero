import AppHeader from "../../components/AppHeader";
import OperatorClient from "./OperatorClient";

export default function OperadoresPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <span className="eyebrow">Panel interno · Ingreso</span>
    <h1>Atención de operadores</h1>
    <p className="lead">Seleccioná tu box, visualizá la cola real y gestioná cada llamado desde un único panel.</p>
    <OperatorClient/>
  </main></div>;
}
