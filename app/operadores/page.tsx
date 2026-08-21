import AppHeader from "../../components/AppHeader";
import PageHeader from "../../components/ui/PageHeader";
import OperatorClient from "./OperatorClient";

export default function OperadoresPage(){
  return <div className="shell"><AppHeader/><main className="main">
    <PageHeader eyebrow="Panel interno · Ingreso" title="Atención de operadores" lead="Seleccioná tu box, visualizá la cola real y gestioná cada llamado desde un único panel."/>
    <OperatorClient/>
  </main></div>;
}
