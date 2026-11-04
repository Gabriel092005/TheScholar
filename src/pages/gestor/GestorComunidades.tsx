import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import {
  ArrowRight, CalendarDays, MessagesSquare, Plus, Users, UsersRound,
} from "lucide-react";
import { listarComunidades } from "@/api/comunidades";
import { useUser } from "@/api/useGetProfile";
import { CriarComunidadeDialog } from "@/components/criar-comunidade-dialog";
import { Button } from "@/components/ui/button";
import {
  EmptyState, PageHeader, SearchInput, StatCard, faintText, primaryButton, softText, surface,
} from "./ui";

function formatDate(data?: string) {
  if (!data) return "—";
  try {
    return format(parseISO(data), "dd MMM yyyy", { locale: pt });
  } catch {
    return data;
  }
}

export function GestorComunidades() {
  const navigate = useNavigate();
  const { user } = useUser();
  const [search, setSearch] = useState("");
  const [criarOpen, setCriarOpen] = useState(false);

  const { data = [], isLoading } = useQuery({
    queryKey: ["gestor-comunidades"],
    queryFn: listarComunidades,
    staleTime: 1000 * 60,
  });

  const minhas = data.filter((comunidade) => comunidade.criadorId === user?.id);
  const termo = search.trim().toLowerCase();
  const filtradas = minhas.filter(
    (comunidade) =>
      comunidade.nome.toLowerCase().includes(termo) ||
      (comunidade.descricao ?? "").toLowerCase().includes(termo),
  );

  const totalMembros = minhas.reduce((acc, c) => acc + (c._count?.membros ?? 0), 0);
  const totalMensagens = minhas.reduce((acc, c) => acc + (c._count?.mensagens ?? 0), 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Minhas comunidades"
        description="Comunidades que criaste e que geres."
        action={
          <Button className={primaryButton} onClick={() => setCriarOpen(true)}>
            <Plus size={15} className="mr-1.5" />
            Nova comunidade
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard label="Comunidades" value={minhas.length} icon={UsersRound} highlight />
        <StatCard label="Membros" value={totalMembros} icon={Users} />
        <StatCard label="Mensagens" value={totalMensagens} icon={MessagesSquare} />
      </div>

      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Pesquisar comunidade..."
        className="max-w-sm"
      />

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${surface} animate-pulse p-5`}>
              <div className="h-4 w-2/3 rounded bg-zinc-100 dark:bg-white/[0.06]" />
              <div className="mt-2 h-3 w-1/2 rounded bg-zinc-100 dark:bg-white/[0.06]" />
              <div className="mt-5 h-3 w-full rounded bg-zinc-100 dark:bg-white/[0.06]" />
            </div>
          ))}
        </div>
      ) : filtradas.length === 0 ? (
        <div className={surface}>
          <EmptyState
            icon={UsersRound}
            title={minhas.length === 0 ? "Ainda não criaste nenhuma comunidade" : "Nenhuma comunidade encontrada"}
            description={
              minhas.length === 0
                ? "Cria uma comunidade para reunir e acompanhar os teus estudantes."
                : "Tenta pesquisar por outro nome."
            }
            action={
              minhas.length === 0 ? (
                <Button className={primaryButton} onClick={() => setCriarOpen(true)}>
                  Criar comunidade
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtradas.map((comunidade) => (
            <button
              key={comunidade.id}
              type="button"
              onClick={() => navigate(`/comunidades/${comunidade.id}`)}
              className={`${surface} group flex flex-col p-5 text-left transition-colors hover:border-emerald-300/60 dark:hover:border-emerald-500/30`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <UsersRound size={18} />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">
                      {comunidade.nome}
                    </p>
                    <p className={`truncate text-[11px] ${faintText}`}>
                      {comunidade.descricao || "Sem descrição"}
                    </p>
                  </div>
                </div>
                <ArrowRight
                  size={16}
                  className="shrink-0 text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-emerald-500 dark:text-zinc-600"
                />
              </div>

              <div className={`mt-4 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3 text-[11px] dark:border-white/[0.06] ${softText}`}>
                <span className="flex items-center gap-1.5">
                  <Users size={13} />
                  {comunidade._count?.membros ?? 0} membros
                </span>
                <span className="flex items-center gap-1.5">
                  <MessagesSquare size={13} />
                  {comunidade._count?.mensagens ?? 0} mensagens
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={13} />
                  {formatDate(comunidade.created_at)}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <CriarComunidadeDialog open={criarOpen} onOpenChange={setCriarOpen} />
    </div>
  );
}

export default GestorComunidades;
