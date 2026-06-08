import { GraduationCap } from "lucide-react";
import { InscricoesTable } from "@/components/admin/InscricoesTable";

export function MentoriaAdmin() {
  return (
    <InscricoesTable
      tipoInteresse="MENTORIA"
      title="Mentorias"
      description="Gerir pedidos de mentoria"
      emptyMessage="Nenhuma mentoria encontrada"
      icon={GraduationCap}
    />
  );
}

export default MentoriaAdmin;