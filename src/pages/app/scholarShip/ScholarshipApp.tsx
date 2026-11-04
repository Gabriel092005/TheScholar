import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScholarshipCard } from "./ScholarshipCard";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { api, getUploadUrl } from "@/lib/axios";

import { Award, Search, GraduationCap, AlertTriangle, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { UserPageHeader } from "@/components/user-ui";
import { useState } from "react";


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

function formataData(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: pt });
  } catch {
    return data;
  }
}

function getTags(bolsa: Bolsa): string[] {
  const tags = [];
  if (bolsa.valor > 0) tags.push("Integral");
  if (bolsa.modalidade) tags.push(bolsa.modalidade);
  if (bolsa.pais) tags.push(bolsa.pais);
  return tags.length ? tags : ["Estudo"];
}

function mapBolsaToScholarship(bolsa: Bolsa) {
  return {
    id: bolsa.id,
    title: bolsa.titulo,
    university: bolsa.instituicao || "Não especificada",
    country: bolsa.pais || "",
    flag: "",
    deadline: formataData(bolsa.datasImportantes?.fechamento)
          || formataData(bolsa.datasImportantes?.abertura)
          || formataData(bolsa.prazo)
          || "—",
    level: getNivelLabel(bolsa.nivel),
    area: bolsa.categoria || "",
    slots: 0,
    description: bolsa.descricao || "",
    requirements: bolsa.requisitos ? [bolsa.requisitos] : [],
    benefits: bolsa.valor > 0
      ? [`AOA ${Number(bolsa.valor).toLocaleString()}`]
      : [],
    tags: getTags(bolsa),
    bgImage: bolsa.imagemUrl
      || (bolsa.imagemBg
        ? (bolsa.imagemBg.startsWith("http") ? bolsa.imagemBg : getUploadUrl(`/uploads/${bolsa.imagemBg}`))
        : undefined),
    inscriptionPrice: bolsa.precoInscricao ?? undefined,
    consultoriaPrice: bolsa.precoConsultoria ?? undefined,
    mentoriaPrice: bolsa.precoMentoria ?? undefined,
    currency: "AOA",
    originalPrice: bolsa.precoOriginal ?? undefined,
  };
}

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
});

export function ScholarshipApp() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");

  const { data: response, isLoading, isError, error, refetch } = useQuery({
    // Chave própria: outras páginas pedem ["bolsas"] sem este filtro.
    queryKey: ["bolsas", "catalogo"],
    queryFn: () => bolsasApi.list({ status: "PUBLICADA", ocultarMinhas: true }),
    retry: 2,
  });

  const scholarships = (response?.data || [])
    .map(mapBolsaToScholarship)
    .filter((s) =>
      !search || s.title.toLowerCase().includes(search.toLowerCase()) ||
      s.university.toLowerCase().includes(search.toLowerCase()) ||
      s.area.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white dark:bg-[#111113]"
    >
      {/* ─── Content ─── */}
      <section className="container mx-auto px-6 py-8 sm:py-10 max-w-6xl">
        <UserPageHeader
          icon={Award}
          title="Bolsas de Estudos"
          description="Encontre oportunidades de estudo em Angola e no estrangeiro."
        />
        <div className="flex flex-col gap-3 mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar bolsas..."
              className="h-10 pl-9 pr-3 rounded-xl text-sm"
            />
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">
            <span className="font-semibold text-gray-900 dark:text-white">{scholarships.length}</span>{" "}
            {search
              ? `resultado${scholarships.length !== 1 ? "s" : ""}`
              : `oportunidade${scholarships.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 dark:bg-white/[0.04] h-28 rounded-t-2xl" />
                <div className="p-4 space-y-3 bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06] border-t-0 rounded-b-2xl">
                  <div className="h-4 bg-gray-100 dark:bg-white/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-1/2" />
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-16" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-12" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-14" />
                  </div>
                  <div className="h-9 bg-gray-100 dark:bg-white/[0.06] rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">
              Erro ao carregar bolsas
            </p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mb-6 max-w-md mx-auto">
              {(error as any)?.response?.data?.message || "Não foi possível carregar as bolsas. Verifique a sua conexão e tente novamente."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </motion.div>
        ) : scholarships.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Nenhuma bolsa encontrada</p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mb-6">
              {search ? "Tente ajustar a sua pesquisa ou limpar os filtros." : "Nenhuma bolsa disponível de momento."}
            </p>
            {search && (
              <button onClick={() => setSearch("")} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors">
                <X className="h-4 w-4" />
                Limpar pesquisa
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {scholarships.map((scholarship, i) => (
              <ScholarshipCard
                key={scholarship.id}
                scholarship={scholarship}
                onSelect={(s) => navigate(`/bolsas/${s.id}`)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06] py-10 bg-gray-50 dark:bg-[#111113]">
        <div className="container mx-auto px-6 max-w-6xl text-center text-sm text-gray-400 dark:text-zinc-600">
          &copy; 2026 Afroscholars &middot; Todos os direitos reservados
        </div>
      </footer>

    </motion.div>
  );
}
