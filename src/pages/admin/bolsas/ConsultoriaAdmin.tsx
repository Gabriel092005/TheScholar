import { Briefcase } from "lucide-react";
import { InscricoesTable } from "@/components/admin/InscricoesTable";

export function ConsultoriaAdmin() {
  return (
    <InscricoesTable
      tipoInteresse="CONSULTORIA"
      title="Consultorias"
      description="Gerir pedidos de consultoria"
      emptyMessage="Nenhuma consultoria encontrada"
      icon={Briefcase}
    />
  );
}

export default ConsultoriaAdmin;