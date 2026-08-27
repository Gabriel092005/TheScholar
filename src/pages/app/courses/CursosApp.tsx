import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search, BookOpen, Users, Clock, ArrowRight, GraduationCap,
  SlidersHorizontal, X, PlayCircle,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { cursosApi } from "@/api/cursos";
import { useQuery } from "@tanstack/react-query";

const categoryColors: Record<string, string> = {
  TI: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
  Negocios: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
  Saude: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400",
  Engenharia: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
  Arte: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-400",
  Financas: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
  Idiomas: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-400",
  Tecnologia: "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400",
  Direito: "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400",
  default: "bg-gray-50 text-gray-700 dark:bg-white/5 dark:text-zinc-400",
};

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
      {/* ─── Hero ─── */}
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-[#0a1a14] dark:via-[#0d2420] dark:to-[#0a0a0a] overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wMyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        <div className="relative container mx-auto px-6 py-10 md:py-14 max-w-6xl">
          <motion.div {...fadeUp(0)} className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 text-[9px] font-medium mb-3">
              Preparação Pessoal
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.15] mb-2 tracking-tight">
              Prepare-se para o{" "}
              <span className="text-emerald-200">seu futuro</span>
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm max-w-lg leading-relaxed">
              Programas de preparação pessoal para bolsas de estudos, intercâmbios,
              estágios, trabalhos, viagens e outras oportunidades. Aprenda com os
              melhores mentores e conquiste a sua vaga.
            </p>
          </motion.div>

          <div className="flex items-end justify-between mt-5 gap-4">
            <motion.div {...fadeUp(0.1)} className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-emerald-200/60" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Pesquisar..."
                  className="h-9 pl-9 pr-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white placeholder:text-emerald-200/50 focus-visible:ring-emerald-400/50 focus-visible:border-emerald-400/50 text-xs"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-emerald-200/60 hover:text-white transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </motion.div>
            <motion.div
              {...fadeUp(0.2)}
              className="flex items-center gap-2 text-emerald-100/70 text-[11px] shrink-0"
            >
              <GraduationCap className="h-3 w-3" />
              <span className="font-semibold text-white">{cursos.length}</span>
              <span>programa{cursos.length !== 1 ? "s" : ""}</span>
            </motion.div>
          </div>
        </div>

        <div className="h-12 bg-gradient-to-t from-white dark:from-[#111113] to-transparent" />
      </div>

      {/* ─── Content ─── */}
      <section className="container mx-auto px-6 py-10 max-w-6xl">
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

        {/* Results header */}
        <div className="flex items-center justify-between mb-6">
          {search && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-gray-500 dark:text-zinc-500"
            >
              {cursos.length} programa{cursos.length !== 1 ? "s" : ""} para "
              <span className="font-semibold text-gray-900 dark:text-white">
                {search}
              </span>
            </motion.p>
          )}
          {!search && (
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              <span className="font-semibold text-gray-900 dark:text-white">
                {cursos.length}
              </span>{" "}
              programa{cursos.length !== 1 ? "s" : ""} disponíve
              {cursos.length !== 1 ? "is" : "l"}
            </p>
          )}
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
              <motion.div
                key={curso.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: index * 0.06,
                  duration: 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
                whileHover={{ y: -6 }}
                onClick={() => navigate(`/cursos/${curso.id}`)}
                className="group cursor-pointer rounded-2xl bg-white dark:bg-[#111113] border border-gray-200/70 dark:border-white/[0.06] overflow-hidden hover:border-emerald-300 dark:hover:border-emerald-500/40 hover:shadow-xl hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/5 transition-all duration-300 flex flex-col"
              >
                {/* Cover */}
                <div className="relative h-48 overflow-hidden bg-gray-50 dark:bg-zinc-900">
                  {curso.capaUrl ? (
                    <img
                      src={curso.capaUrl}
                      alt={curso.titulo}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <BookOpen className="h-14 w-14 text-gray-200 dark:text-zinc-700" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* Category badge */}
                  <div className="absolute top-3 left-3">
                    <span
                      className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        categoryColors[curso.categoria] || categoryColors.default
                      }`}
                    >
                      {curso.categoria}
                    </span>
                  </div>

                  {/* Duration badge */}
                  {curso.duracao && (
                    <div className="absolute top-3 right-3 px-2 py-1 rounded-full bg-black/50 backdrop-blur-sm text-white/90 text-[10px] font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {curso.duracao}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 flex flex-col p-5">
                  {/* Title & Subtitle */}
                  <h3 className="font-bold text-base text-gray-900 dark:text-white leading-snug mb-0.5 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200">
                    {curso.titulo}
                  </h3>
                  {curso.subtitulo && (
                    <p className="text-xs text-gray-500 dark:text-zinc-500 line-clamp-1 mb-2">
                      {curso.subtitulo}
                    </p>
                  )}

                  {/* Mentor */}
                  {curso.mentorNome && (
                    <div className="flex items-center gap-2 mb-3 mt-1">
                      {curso.mentorAvatar ? (
                        <img
                          src={curso.mentorAvatar}
                          alt={curso.mentorNome}
                          className="h-5 w-5 rounded-full object-cover"
                        />
                      ) : (
                        <div className="h-5 w-5 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                          {curso.mentorNome.charAt(0)}
                        </div>
                      )}
                      <span className="text-[11px] text-gray-500 dark:text-zinc-500 truncate">
                        {curso.mentorNome}
                      </span>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-zinc-500 mb-3">
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {curso.estudantes}
                    </span>
                    <span className="flex items-center gap-1">
                      {curso.rating.toFixed(1)}
                    </span>
                    <span className="flex items-center gap-1">
                      <PlayCircle className="h-3 w-3" />
                      {curso.quantAulas} aulas
                    </span>
                  </div>

                  {/* Tags */}
                  {curso.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {curso.tags.slice(0, 2).map((tag) => (
                        <span
                          key={tag}
                          className="text-[9px] font-medium px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-zinc-500 border border-gray-100 dark:border-white/5"
                        >
                          {tag}
                        </span>
                      ))}
                      {curso.tags.length > 2 && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-zinc-600">
                          +{curso.tags.length - 2}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spacer */}
                  <div className="flex-1" />

                  {/* Price & CTA */}
                  <div className="flex items-end justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                          {formatPrice(curso.preco)}
                        </span>
                        {curso.precoOriginal && curso.precoOriginal > curso.preco && (
                          <span className="text-[11px] text-gray-400 dark:text-zinc-600 line-through">
                            {formatPrice(curso.precoOriginal)}
                          </span>
                        )}
                      </div>
                      {curso.precoOriginal && curso.precoOriginal > curso.preco && (
                        <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                          -{Math.round((1 - curso.preco / curso.precoOriginal) * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 opacity-0 group-hover:opacity-100 translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                      Ver Programa
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </div>
                </div>
              </motion.div>
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
