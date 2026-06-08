import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  MessageCircle, Users, Plus, Loader2,
  Search, ChevronRight, GraduationCap,
} from "lucide-react";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { listarComunidades, criarComunidade, entrarComunidade, type Community } from "@/api/comunidades";
import { bolsasApi } from "@/api/bolsas";
import { api } from "@/lib/axios";

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
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [bolsaId, setBolsaId] = useState("");

  const isStaff = tokenRole === "ADMIN" || tokenRole === "GESTOR";

  const { data: comunidades = [], isLoading } = useQuery({
    queryKey: ["comunidades"],
    queryFn: listarComunidades,
  });

  const { data: inscricoes = [] } = useQuery({
    queryKey: ["minhas-inscricoes-filtro"],
    queryFn: () => bolsasApi.listMinhasInscricoes(),
    enabled: !isStaff,
  });

  const bolsaIdsPermitidos = new Set(
    (inscricoes as any[])
      .filter((i: any) => i.tipoInteresse === "MENTORIA" && i.bolsaId)
      .map((i: any) => i.bolsaId)
  );

  const comunidadesVisiveis = isStaff
    ? comunidades
    : comunidades.filter((c) => !c.bolsaId || bolsaIdsPermitidos.has(c.bolsaId));

  const { data: bolsas = [] } = useQuery({
    queryKey: ["bolsas-select"],
    queryFn: async () => {
      const { data } = await api.get("/bolsas");
      return data.data || data;
    },
    enabled: isStaff,
  });

  const criarMutation = useMutation({
    mutationFn: () => criarComunidade({ nome, descricao: descricao || undefined, bolsaId: bolsaId || undefined }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      setCriarOpen(false);
      setNome("");
      setDescricao("");
      setBolsaId("");
      toast.success("Comunidade criada!");
      navigate(`/comunidades/${data.id}`);
    },
    onError: () => toast.error("Erro ao criar comunidade"),
  });

  const entrarMutation = useMutation({
    mutationFn: entrarComunidade,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      toast.success("Solicitação enviada! Aguarde aprovação.");
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erro ao solicitar entrada"),
  });

  const filtradas = comunidadesVisiveis.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8"
      >
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
            Comunidades
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
            Conecte-se, troque ideias e aprenda em grupo.
          </p>
        </div>
        {(tokenRole === "ADMIN" || tokenRole === "GESTOR") && (
          <Button
            onClick={() => setCriarOpen(true)}
            className="h-11 px-5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Comunidade
          </Button>
        )}
      </motion.div>

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

      <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111113]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Criar Comunidade
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              Crie um espaço para partilhar ideias e discutir temas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                Nome
              </Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Bolsas Europa 2026"
                className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-sm focus-visible:ring-emerald-500/40"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                Descrição (opcional)
              </Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o propósito da comunidade..."
                className="rounded-xl bg-gray-50 dark:bg-white/[0.04] text-sm resize-none focus-visible:ring-emerald-500/40"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                Bolsa (opcional)
              </Label>
              <Select value={bolsaId} onValueChange={setBolsaId}>
                <SelectTrigger className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-sm focus-visible:ring-emerald-500/40">
                  <SelectValue placeholder="Selecionar bolsa..." />
                </SelectTrigger>
                <SelectContent>
                  {bolsas.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCriarOpen(false)}
              className="rounded-xl border-gray-200 dark:border-white/[0.08] dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => criarMutation.mutate()}
              disabled={!nome || nome.length < 3 || criarMutation.isPending}
              className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {criarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.35 }}
    >
      <Link
        to={`/comunidades/${comunidade.id}`}
        className="block group rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] hover:border-emerald-200 dark:hover:border-emerald-500/25 hover:shadow-sm transition-all duration-200"
      >
        <div className="flex items-start gap-3 mb-3">
          <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", avatarColor)}>
            {comunidade.nome.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
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
          <ChevronRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 group-hover:text-emerald-500 transition-colors shrink-0 mt-1" />
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

        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
          <span className="text-[10px] text-gray-400 dark:text-zinc-600">
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
    </motion.div>
  );
}
