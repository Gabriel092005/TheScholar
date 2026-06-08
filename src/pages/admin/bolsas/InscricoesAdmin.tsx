import { FileText } from "lucide-react";
import { InscricoesTable } from "@/components/admin/InscricoesTable";

export function InscricoesAdmin() {
  return (
    <InscricoesTable
      tipoInteresse="INSCRICAO"
      title="Inscrições"
      description="Gerir candidaturas a bolsas de estudos"
      emptyMessage="Nenhuma inscrição encontrada"
      icon={FileText}
    />
  );
}

export default InscricoesAdmin;