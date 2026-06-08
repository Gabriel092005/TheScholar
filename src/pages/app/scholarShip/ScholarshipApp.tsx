import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ScholarshipCard } from "./ScholarshipCard";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { api } from "@/lib/axios";

import { Search, SlidersHorizontal, GraduationCap, AlertTriangle, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/input";
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
        ? (bolsa.imagemBg.startsWith("http") ? bolsa.imagemBg : `${api.defaults.baseURL}/uploads/${bolsa.imagemBg}`)
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
    queryKey: ["bolsas"],
    queryFn: () => bolsasApi.list({ status: "PUBLICADA" }),
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
      {/* ─── Hero ─── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-[#0a1a14] dark:via-[#0d2420] dark:to-[#0a0a0a]">
        <div className="relative container mx-auto px-6 py-8 md:py-10 max-w-6xl">
          <motion.div {...fadeUp(0)} className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 text-[9px] font-medium mb-3">
              Plataforma de Bolsas
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.15] mb-2 tracking-tight">
              Oportunidades <span className="text-emerald-200">de Bolsas</span>
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm max-w-lg leading-relaxed">
              Descubra bolsas de estudo nacionais e internacionais adaptadas ao seu perfil académico.
            </p>
          </motion.div>

          <div className="flex items-end justify-between mt-4 gap-4">
            <motion.div {...fadeUp(0.1)} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-200/60" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar bolsas..."
                  className="h-9 pl-9 pr-3 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-emerald-200/50 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50 text-xs"
                />
              </div>
            </motion.div>
            <motion.div {...fadeUp(0.2)} className="flex items-center gap-2 text-emerald-100/70 text-[11px] shrink-0">
              <GraduationCap className="h-3 w-3" />
              <span className="font-semibold text-white">{scholarships.length}</span>
              <span>oportunidades</span>
            </motion.div>
          </div>
        </div>

        <div className="h-12 bg-gradient-to-t from-white dark:from-[#111113] to-transparent" />
      </div>

      {/* ─── Content ─── */}
      <section className="container mx-auto px-6 py-12 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <p className="text-sm text-gray-500 dark:text-zinc-500">
            {search ? (
              <>{scholarships.length} resultado{scholarships.length !== 1 ? "s" : ""} para "<span className="font-semibold text-gray-900 dark:text-white">{search}</span>"</>
            ) : (
              <><span className="font-semibold text-gray-900 dark:text-white">{scholarships.length}</span> oportunidades encontradas</>
            )}
          </p>
          <button className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400 font-semibold hover:text-emerald-500 transition-colors">
            <SlidersHorizontal className="h-4 w-4" />
            Filtros
          </button>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 dark:bg-white/[0.04] h-48 rounded-t-2xl" />
                <div className="p-5 space-y-3 bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06] border-t-0 rounded-b-2xl">
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
