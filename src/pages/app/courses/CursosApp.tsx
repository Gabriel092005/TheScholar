import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, BookOpen, Users, Clock, ArrowRight, GraduationCap,
  Star, X, PlayCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { CardAccent, Reveal, UserPageHeader, cardArrow, cardTitle, userCard } from "@/components/user-ui";
import { cursosApi } from "@/api/cursos";
import { getUploadUrl } from "@/lib/axios";
import { useQuery } from "@tanstack/react-query";

const categories = [
  "Todos", "TI", "Negocios", "Financas", "Idiomas",
  "Saude", "Engenharia", "Tecnologia", "Arte", "Direito",
];

const fadeUp = (delay = 0) => ({
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
});

export function CursosApp() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("Todos");

  const { data: response, isLoading } = useQuery({
    queryKey: ["cursos-app"],
    queryFn: () => cursosApi.list({ status: "PUBLICADO" }),
  });

  const cursos = useMemo(() => {
    const all = response?.data || [];
    return all.filter((curso) => {
      const matchSearch =
        !search ||
        curso.titulo.toLowerCase().includes(search.toLowerCase()) ||
        curso.subtitulo?.toLowerCase().includes(search.toLowerCase()) ||
        curso.mentorNome?.toLowerCase().includes(search.toLowerCase());
      const matchCategoria =
        categoria === "Todos" || curso.categoria === categoria;
      return matchSearch && matchCategoria;
    });
  }, [response, search, categoria]);

  const formatPrice = (preco: number) =>
    new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "AOA",
    }).format(preco);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white dark:bg-[#111113]"
    >
      {/* ─── Content ─── */}
      <section className="container mx-auto px-6 py-8 sm:py-10 max-w-6xl">
        <UserPageHeader
          icon={GraduationCap}
          title="Preparação Pessoal"
          description="Programas e cursos para se preparar para as suas candidaturas."
        />
        <div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar programas..."
              className="h-10 pl-9 pr-9 rounded-xl text-sm"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                aria-label="Limpar pesquisa"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400 shrink-0">
            <span className="font-semibold text-gray-900 dark:text-white">{cursos.length}</span>{" "}
            programa{cursos.length !== 1 ? "s" : ""}
          </p>
        </div>
        {/* Categories */}
        <motion.div
          {...fadeUp(0.05)}
          className="flex items-center gap-2 mb-8 overflow-x-auto pb-2 scrollbar-none"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoria(cat)}
              className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-200 ${
                categoria === cat
                  ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/25"
                  : "bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/10 border border-gray-200/60 dark:border-white/5"
              }`}
            >
              {cat === "Todos" ? "Todos" : cat}
            </button>
          ))}
        </motion.div>
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
        ) : cursos.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">
              Nenhum programa encontrado
            </p>
            <p className="text-xs text-gray-400 dark:text-zinc-500">
              {categoria === "Todos"
                ? "Nenhum programa disponível no momento."
                : "Nenhum programa disponível nesta categoria."}
            </p>
            {search && (
              <button
                onClick={() => setSearch("")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
              >
                <X className="h-4 w-4" />
                Limpar pesquisa
              </button>
            )}
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {cursos.map((curso, index) => (
              <Reveal key={curso.id} index={index}>
                <button
                  onClick={() => navigate(`/cursos/${curso.id}`)}
                  className={`${userCard} flex h-full w-full flex-col`}
                >
                  <CardAccent />

                  {/* Cover */}
                  <div className="relative h-48 w-full overflow-hidden bg-gray-100 dark:bg-zinc-900">
                    {curso.capaUrl ? (
                      <img
                        src={getUploadUrl(curso.capaUrl)}
                        alt=""
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      />
                    ) : (
                      <div className="h-full flex items-center justify-center">
                        <BookOpen className="h-14 w-14 text-gray-300 dark:text-zinc-700" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

                    <span className="absolute left-3 top-3 rounded-lg bg-white/90 px-2 py-1 text-[11px] font-semibold text-gray-800 shadow-sm backdrop-blur-sm dark:bg-black/60 dark:text-white">
                      {curso.categoria}
                    </span>

                    {curso.duracao && (
                      <span className="absolute right-3 top-3 flex items-center gap-1 rounded-lg bg-black/55 px-2 py-1 text-[11px] font-medium text-white backdrop-blur-sm">
                        <Clock className="h-3 w-3" />
                        {curso.duracao}
                      </span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex w-full flex-1 flex-col p-5">
                    <h3 className={`${cardTitle} text-base line-clamp-2`}>{curso.titulo}</h3>
                    {curso.subtitulo && (
                      <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400 line-clamp-1">
                        {curso.subtitulo}
                      </p>
                    )}

                    {curso.mentorNome && (
                      <div className="mt-3 flex items-center gap-2">
                        {curso.mentorAvatar ? (
                          <img
                            src={curso.mentorAvatar}
                            alt=""
                            loading="lazy"
                            className="h-6 w-6 rounded-full object-cover"
                          />
                        ) : (
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400">
                            {curso.mentorNome.charAt(0)}
                          </div>
                        )}
                        <span className="truncate text-xs text-gray-500 dark:text-zinc-400">
                          {curso.mentorNome}
                        </span>
                      </div>
                    )}

                    <div className="mt-3 flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-400">
                      <span className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                        {curso.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {curso.estudantes}
                      </span>
                      <span className="flex items-center gap-1">
                        <PlayCircle className="h-3.5 w-3.5" />
                        {curso.quantAulas} aulas
                      </span>
                    </div>

                    {curso.tags.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {curso.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
                          >
                            {tag}
                          </span>
                        ))}
                        {curso.tags.length > 2 && (
                          <span className="rounded-md bg-gray-100 px-2 py-0.5 text-[11px] text-gray-500 dark:bg-white/[0.06] dark:text-zinc-500">
                            +{curso.tags.length - 2}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Price & CTA */}
                    <div className="mt-auto flex items-end justify-between gap-3 pt-4">
                      <div className="min-w-0">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {curso.bolsaId && curso.preco <= 0 ? "Incluído na bolsa" : formatPrice(curso.preco)}
                        </span>
                      </div>
                      <span className={cardArrow}>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </button>
              </Reveal>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 dark:border-white/[0.06] py-10 bg-gray-50 dark:bg-[#111113]">
        <div className="container mx-auto px-6 max-w-6xl text-center text-sm text-gray-400 dark:text-zinc-600">
          &copy; {new Date().getFullYear()} Afroscholars &middot; Todos os
          direitos reservados
        </div>
      </footer>
    </motion.div>
  );
}

export default CursosApp;
