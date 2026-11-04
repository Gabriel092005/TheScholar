import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle, Users, Plus,
  Search, ChevronRight, GraduationCap,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { CardAccent, Reveal, UserPageHeader, cardTitle, userCard } from "@/components/user-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import { listarComunidades, entrarComunidade, type Community } from "@/api/comunidades";
import { CriarComunidadeDialog } from "@/components/criar-comunidade-dialog";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

function getTokenRole(): string | null {
  try {
    const token = Cookies.get("token");
    if (!token) return null;
    const payload = jwtDecode<{ role?: string }>(token);
    return payload.role ?? null;
  } catch {
    return null;
  }
}

export function ComunidadesPage() {
  const tokenRole = getTokenRole();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [criarOpen, setCriarOpen] = useState(false);

  // A API já só devolve as comunidades que este usuário pode ver.
  const { data: comunidades = [], isLoading } = useQuery({
    queryKey: ["comunidades"],
    queryFn: listarComunidades,
  });

  const entrarMutation = useMutation({
    mutationFn: entrarComunidade,
    onSuccess: (mensagem) => {
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      toast.success(mensagem);
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erro ao solicitar entrada"),
  });

  const filtradas = comunidades.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl"
    >
      <UserPageHeader
        icon={Users}
        title="Comunidades"
        description="Conecte-se, troque ideias e aprenda em grupo."
        action={
          (tokenRole === "ADMIN" || tokenRole === "GESTOR") && (
            <Button
              onClick={() => setCriarOpen(true)}
              className="h-11 px-5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              <Plus className="mr-2 h-4 w-4" />
              Criar Comunidade
            </Button>
          )
        }
      />

      <div className="relative mb-6">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Pesquisar comunidades..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 h-12 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-sm focus-visible:ring-emerald-500/40"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/[0.06] rounded" />
                  <div className="h-3 w-1/2 bg-gray-100 dark:bg-white/[0.06] rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-gray-100 dark:bg-white/[0.06] rounded mb-3" />
              <div className="h-8 w-full bg-gray-100 dark:bg-white/[0.06] rounded-xl" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center">
            <MessageCircle className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
          </div>
          <div className="text-center">
            <p className="text-base font-semibold text-gray-900 dark:text-white">Nenhuma comunidade encontrada</p>
            <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
              {search ? "Tente outro termo de pesquisa." : "Crie a primeira comunidade!"}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtradas.map((comunidade, i) => (
            <CommunityCard
              key={comunidade.id}
              comunidade={comunidade}
              index={i}
              onEnter={() => entrarMutation.mutate(comunidade.id)}
              isEntering={entrarMutation.isPending}
            />
          ))}
        </div>
      )}

      <CriarComunidadeDialog
        open={criarOpen}
        onOpenChange={setCriarOpen}
        onCriada={(comunidade) => navigate(`/comunidades/${comunidade.id}`)}
      />
    </motion.div>
  );
}

function CommunityCard({ comunidade, index, onEnter, isEntering }: {
  comunidade: Community;
  index: number;
  onEnter: () => void;
  isEntering: boolean;
}) {
  const avatarColor = COLORS[comunidade.nome.length % COLORS.length];

  return (
    <Reveal index={index}>
      <Link
        to={`/comunidades/${comunidade.id}`}
        className={`${userCard} flex h-full flex-col p-5`}
      >
        <CardAccent />
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0 transition-transform duration-300 group-hover:-rotate-3 group-hover:scale-110 motion-reduce:transform-none", avatarColor)}>
            {comunidade.nome.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className={`${cardTitle} text-sm truncate`}>
              {comunidade.nome}
            </h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-zinc-500">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                {comunidade._count.membros}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3 h-3" />
                {comunidade._count.mensagens}
              </span>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all duration-300 shrink-0 mt-1" />
        </div>

        {comunidade.descricao && (
          <p className="text-xs text-gray-500 dark:text-zinc-500 line-clamp-2 mb-3 leading-relaxed">
            {comunidade.descricao}
          </p>
        )}

        {comunidade.bolsa && (
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-3 flex items-center gap-1">
            <GraduationCap className="h-3 w-3" />
            {comunidade.bolsa.titulo}
          </p>
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <span className="text-xs text-gray-500 dark:text-zinc-400">
            {comunidade.souMembro ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Membro</span>
            ) : comunidade.solicitacaoPendente ? (
              <span className="text-yellow-600 dark:text-yellow-400 font-medium">Solicitado</span>
            ) : (
              `${comunidade._count.membros} membro${comunidade._count.membros !== 1 ? "s" : ""}`
            )}
          </span>
          {!comunidade.souMembro && !comunidade.solicitacaoPendente && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onEnter();
              }}
              disabled={isEntering}
              className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
            >
              {isEntering ? "Entrando..." : "Entrar"}
            </button>
          )}
        </div>
      </Link>
    </Reveal>
  );
}
