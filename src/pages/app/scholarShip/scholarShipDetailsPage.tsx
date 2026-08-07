import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { ScholarshipDetail } from "./ScholarshipDetail";
import { Loader2, AlertTriangle, ArrowLeft } from "lucide-react";

function formataData(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: pt });
  } catch {
    return data;
  }
}

function getNivelLabel(nivel?: string): string {
  if (!nivel) return "Graduação";
  const map: Record<string, string> = {
    GRADUACAO: "Graduação",
    MESTRADO: "Mestrado",
    DOUTORAMENTO: "Doutoramento",
    POSDOC: "Pós-Doutorado",
    MBA: "MBA",
  };
  return map[nivel] || nivel;
}

function formatCurrency(valor: number, _moeda?: string): string {
  if (!valor || valor <= 0) return "";
  return `AOA ${valor.toLocaleString()}`;
}

function mapBolsaToScholarship(bolsa: Bolsa) {
  const benefits = [];
  if (bolsa.valor > 0) {
    benefits.push(formatCurrency(bolsa.valor, bolsa.moeda));
  }
  if (bolsa.modalidade) {
    benefits.push(bolsa.modalidade);
  }
  if (bolsa.pais) {
    benefits.push(bolsa.pais);
  }
  if (bolsa.idioma) {
    benefits.push(`Idioma: ${bolsa.idioma}`);
  }

  return {
    id: bolsa.id,
    title: bolsa.titulo,
    university: bolsa.instituicao || "Não especificada",
    country: bolsa.pais || "",
    flag: "",
    deadline: formataData(bolsa.prazo) || formataData(bolsa.datasImportantes?.prazo) || "",
    level: getNivelLabel(bolsa.nivel),
    area: bolsa.categoria || "",
    slots: bolsa.numeroVagas || 0,
    description: bolsa.descricao || "",
    requirements: bolsa.requisitos ? [bolsa.requisitos] : [],
    benefits: benefits.length ? benefits : ["Consultar/edital"],
    tags: bolsa.tags || [],
    linkAplicar: bolsa.linkAplicar,
    bgImage: bolsa.imagemBg,
    inscriptionPrice: bolsa.precoInscricao ?? undefined,
    consultoriaPrice: bolsa.precoConsultoria ?? undefined,
    mentoriaPrice: bolsa.precoMentoria ?? undefined,
    currency: "AOA",
    originalPrice: bolsa.precoOriginal ?? undefined,
  };
}

export function ScholarshipDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { data: bolsa, isLoading, error } = useQuery({
    queryKey: ["bolsa", id],
    queryFn: () => bolsasApi.get(id!),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f7fdfb] dark:bg-[#111113] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#3a7d6f]" />
          <p className="text-sm text-[#7a9e98] dark:text-zinc-500 font-medium">A carregar bolsa...</p>
        </div>
      </div>
    );
  }

  if (error || !bolsa) {
    return (
      <div className="min-h-screen bg-[#f7fdfb] dark:bg-[#111113] flex items-center justify-center">
        <div className="flex flex-col items-center gap-5 max-w-sm text-center">
          <div className="h-14 w-14 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
            <AlertTriangle className="h-7 w-7 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[#122b26] dark:text-white mb-1">Bolsa não encontrada</h2>
            <p className="text-sm text-[#7a9e98] dark:text-zinc-500">
              Esta bolsa pode ter sido removida ou está indisponível.
            </p>
          </div>
          <button
            onClick={() => navigate("/bolsas")}
            className="flex items-center gap-2 px-6 py-3 bg-[#122b26] text-white rounded-xl text-sm font-bold hover:bg-[#1e4039] transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar às oportunidades
          </button>
        </div>
      </div>
    );
  }

  const scholarship = mapBolsaToScholarship(bolsa);

  const servicoParam = searchParams.get("servico");
  const autoServico = (servicoParam === "consultoria" || servicoParam === "mentoria" || servicoParam === "inscricao")
    ? servicoParam.toUpperCase() as "CONSULTORIA" | "MENTORIA" | "INSCRICAO"
    : undefined;

  return (
    <ScholarshipDetail
      scholarship={scholarship}
      onBack={() => navigate("/bolsas")}
      bolsaId={id}
      autoServico={autoServico}
    />
  );
}
