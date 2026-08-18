import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart, MessageCircle, Share2,
  MoreHorizontal, ChevronRight, Search, FileText,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { novidadesApi } from "@/api/novidades";
import { api, getUploadUrl } from "@/lib/axios";

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return "Hoje";
  if (days === 1) return "Ontem";
  if (days < 7) return `Há ${days} dias`;

  return d.toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatRelativeTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / (1000 * 60));

  if (mins < 1) return "Agora mesmo";
  if (mins < 60) return `Há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Há ${days}d`;
  return formatDate(dateStr);
}

export function NovidadesPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  const { data: apiData = [] } = useQuery({
    queryKey: ["novidades"],
    queryFn: () => novidadesApi.list({ status: "PUBLICADO" }),
    retry: false,
  });

  const novidades = apiData;

  const filtered = useMemo(() => {
    if (!search) return novidades;
    const q = search.toLowerCase();
    return novidades.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.introduction?.toLowerCase().includes(q)
    );
  }, [novidades, search]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0b]">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/80 dark:bg-[#0a0a0b]/80 backdrop-blur-xl border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-xl mx-auto px-4 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Novidades</h1>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">Fique por dentro</p>
          </div>
          <div className="relative w-44">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar..."
              className="pl-9 h-9 text-xs rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08]"
            />
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="max-w-xl mx-auto px-4 py-5 space-y-5">
        <AnimatePresence>
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-20"
            >
              <FileText size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
              <p className="text-sm text-gray-500 dark:text-zinc-500">Nenhuma novidade encontrada</p>
            </motion.div>
          ) : (
            filtered.map((novidade, i) => {
              const coverUrl = novidade.image_url
                ? novidade.image_url
                : novidade.image_path
                ? getUploadUrl(`/uploads/${novidade.image_path}`)
                : null;

              const isLiked = liked.has(novidade.id);

              return (
                <motion.article
                  key={novidade.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-300"
                >
                  {/* Card header — avatar + nome + data */}
                  <div className="flex items-center gap-3 px-4 pt-4 pb-2">
                    <div className="w-9 h-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs shrink-0">
                      {novidade.usuario?.nome?.charAt(0)?.toUpperCase() || "A"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {novidade.usuario?.nome || "Afroscholars"}
                        </p>
                        {novidade.destaque && (
                          <span className="shrink-0 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400">
                            Destaque
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        {formatRelativeTime(novidade.created_at)}
                      </p>
                    </div>
                    <button className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors">
                      <MoreHorizontal size={16} className="text-gray-400 dark:text-zinc-500" />
                    </button>
                  </div>

                  {/* Cover image (only images, never video) */}
                  {coverUrl && (
                    <div
                      className="cursor-pointer"
                      onClick={() => navigate(`/novidades/${novidade.id}`)}
                    >
                      <div className="mx-4 rounded-xl overflow-hidden bg-gray-50 dark:bg-white/[0.04]">
                        <img
                          src={coverUrl}
                          alt={novidade.title}
                          className="w-full h-auto max-h-80 object-cover hover:scale-[1.02] transition-transform duration-500"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = "none";
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="px-4 pt-3 pb-2">
                    <h2
                      className="text-base font-bold text-gray-900 dark:text-white leading-snug cursor-pointer hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                      onClick={() => navigate(`/novidades/${novidade.id}`)}
                    >
                      {novidade.title}
                    </h2>
                    {novidade.introduction && (
                      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1.5 leading-relaxed line-clamp-3">
                        {novidade.introduction}
                      </p>
                    )}
                  </div>

                  {/* Action bar */}
                  <div className="flex items-center gap-1 px-4 py-2 border-t border-gray-50 dark:border-white/[0.04] mt-2">
                    <button
                      onClick={() => {
                        setLiked((prev) => {
                          const next = new Set(prev);
                          if (next.has(novidade.id)) next.delete(novidade.id);
                          else next.add(novidade.id);
                          return next;
                        });
                      }}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                        isLiked
                          ? "text-red-500 bg-red-50 dark:bg-red-500/10"
                          : "text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                      }`}
                    >
                      <Heart size={14} className={isLiked ? "fill-red-500" : ""} />
                      Gostar
                    </button>
                    <button
                      onClick={() => navigate(`/novidades/${novidade.id}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all duration-200"
                    >
                      <MessageCircle size={14} />
                      Comentar
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-all duration-200">
                      <Share2 size={14} />
                      Partilhar
                    </button>
                    <div className="flex-1" />
                    <button
                      onClick={() => navigate(`/novidades/${novidade.id}`)}
                      className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors px-1"
                    >
                      Ler mais
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </motion.article>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default NovidadesPage;