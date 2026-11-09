import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, CheckCheck, ChevronRight, Loader2, Award, GraduationCap, AlertCircle, Info, MessageCircle, Wallet, Bot, Target } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNotificacoesSocket } from "@/hooks/useNotificacoesSocket";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/api/notifications";
import { gestorApi } from "@/api/gestor";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";

const tipoIconMap: Record<string, React.ElementType> = {
  BOT: Bot,
  ERRO: AlertCircle,
  SUCESSO: Award,
  INFO: Info,
  CURSO: GraduationCap,
  MENTORIA: MessageCircle,
  PAGAMENTO: Wallet,
  BOLSA_COMPATIVEL: Target,
  BOLSA_NOVA: GraduationCap,
};

const tipoColorMap: Record<string, string> = {
  BOT: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
  ERRO: "text-red-500 bg-red-50 dark:bg-red-500/10",
  SUCESSO: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  INFO: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  CURSO: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
  MENTORIA: "text-teal-500 bg-teal-50 dark:bg-teal-500/10",
  PAGAMENTO: "text-emerald-600 bg-emerald-100 dark:bg-emerald-500/15",
  BOLSA_COMPATIVEL: "text-amber-600 bg-amber-100 dark:bg-amber-500/15",
  BOLSA_NOVA: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
};

const emKwanzas = (valor: number) =>
  `${valor.toLocaleString("pt-PT", { maximumFractionDigits: 2 })} Kz`;

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHor = Math.floor(diffMs / 3600000);
  const diffDia = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin} min`;
  if (diffHor < 24) return `${diffHor} h`;
  if (diffDia < 7) return `${diffDia} d`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

function grupoDaData(dateStr: string): string {
  const inicio = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dias = Math.round((inicio(new Date()) - inicio(new Date(dateStr))) / 86400000);
  if (dias <= 0) return "Hoje";
  if (dias === 1) return "Ontem";
  return "Anteriores";
}

function PainelFaturacao({ role, onVer }: { role: string; onVer: () => void }) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["gestor", "faturacao"],
    queryFn: gestorApi.getFaturacao,
  });

  if (isError) return null;

  const itens = data
    ? [...data.bolsas, ...data.cursos, ...data.documentos].sort((a, b) => b.total - a.total).slice(0, 3)
    : [];

  return (
    <div className="border-b border-gray-100 bg-emerald-50/50 px-5 py-4 dark:border-white/[0.06] dark:bg-emerald-500/[0.04]">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-1.5 text-[11px] font-medium text-gray-500 dark:text-zinc-400">
            <Wallet className="h-3.5 w-3.5" />
            {role === "ADMIN" ? "Faturação da plataforma" : "A sua faturação"}
          </p>
          {isLoading ? (
            <div className="mt-1.5 h-6 w-28 animate-pulse rounded bg-emerald-100 dark:bg-white/[0.06]" />
          ) : (
            <p className="mt-0.5 text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              {emKwanzas(data?.total ?? 0)}
            </p>
          )}
        </div>
        {!isLoading && (
          <div className="shrink-0 text-right">
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">Este mês</p>
            <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">{emKwanzas(data?.mes ?? 0)}</p>
          </div>
        )}
      </div>

      {itens.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {itens.map((item) => (
            <li key={item.id} className="flex items-center justify-between gap-3 text-xs">
              <span className="min-w-0 truncate text-gray-600 dark:text-zinc-400">{item.titulo}</span>
              <span className="shrink-0 font-semibold text-gray-900 dark:text-white">{emKwanzas(item.total)}</span>
            </li>
          ))}
        </ul>
      )}

      <button
        onClick={onVer}
        className="mt-3 flex items-center gap-0.5 rounded text-[11px] font-semibold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 dark:text-emerald-400"
      >
        Ver desempenho
        <ChevronRight className="h-3 w-3" />
      </button>
    </div>
  );
}

export function NotificationBell({ userId, role }: { userId?: string; role?: string }) {
  const [open, setOpen] = useState(false);
  const [filtro, setFiltro] = useState<"todas" | "nao-lidas">("todas");
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const queryKey = ["notificacoes", userId];
  const eGestor = role === "ADMIN" || role === "GESTOR";

  useNotificacoesSocket(userId);
  usePushNotifications(userId);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey,
    queryFn: getNotifications,
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.visualizada).length;

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  function handleNotificationClick(notif: Notification) {
    if (!notif.visualizada) markReadMutation.mutate(notif.id);
    setOpen(false);
    if (notif.link) navigate(notif.link);
  }

  const visiveis = filtro === "nao-lidas" ? notifications.filter((n) => !n.visualizada) : notifications;
  const grupos = ["Hoje", "Ontem", "Anteriores"]
    .map((nome) => ({ nome, itens: visiveis.filter((n) => grupoDaData(n.created_at) === nome) }))
    .filter((grupo) => grupo.itens.length > 0);

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label={unreadCount > 0 ? `Notificações, ${unreadCount} por ler` : "Notificações"}
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] bg-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-all duration-200"
        >
          {/* Toca uma vez quando chega uma notificação, em vez de abanar sem parar. */}
          <motion.span
            key={unreadCount}
            animate={unreadCount > 0 ? { rotate: [0, -14, 12, -8, 6, 0] } : { rotate: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="flex origin-top"
          >
            <Bell className="h-4 w-4" />
          </motion.span>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white shadow-sm">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        collisionPadding={12}
        className="mt-2 w-[min(400px,calc(100vw-1.5rem))] overflow-hidden rounded-2xl border border-gray-100 p-0 shadow-xl dark:border-white/[0.06] dark:bg-[#111113]"
      >
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-3">
          <span className="text-sm font-semibold text-gray-900 dark:text-white">Notificações</span>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1 rounded text-[11px] font-semibold text-emerald-600 transition-colors hover:text-emerald-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:opacity-60 dark:text-emerald-400"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5" />
              )}
              Marcar todas como lidas
            </button>
          )}
        </div>

        {eGestor && (
          <PainelFaturacao
            role={role!}
            onVer={() => {
              setOpen(false);
              navigate(role === "ADMIN" ? "/admin/estatisticas" : "/gestor/estatisticas");
            }}
          />
        )}

        <div className="flex gap-1 border-b border-gray-100 px-5 py-2 dark:border-white/[0.06]">
          {([
            { id: "todas", label: "Todas" },
            { id: "nao-lidas", label: unreadCount > 0 ? `Por ler (${unreadCount})` : "Por ler" },
          ] as const).map((opcao) => (
            <button
              key={opcao.id}
              onClick={() => setFiltro(opcao.id)}
              aria-pressed={filtro === opcao.id}
              className={cn(
                "rounded-lg px-2.5 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500",
                filtro === opcao.id
                  ? "bg-gray-100 text-gray-900 dark:bg-white/[0.08] dark:text-white"
                  : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              {opcao.label}
            </button>
          ))}
        </div>

        {/* A altura máxima fica no viewport: na raiz do ScrollArea o conteúdo seria cortado sem rolar. */}
        <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-[min(380px,50vh)] [&>[data-radix-scroll-area-viewport]]:overscroll-contain">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex animate-pulse gap-3">
                  <div className="h-9 w-9 shrink-0 rounded-xl bg-gray-100 dark:bg-white/[0.06]" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 rounded bg-gray-100 dark:bg-white/[0.06]" />
                    <div className="h-2.5 w-full rounded bg-gray-100 dark:bg-white/[0.06]" />
                  </div>
                </div>
              ))}
            </div>
          ) : grupos.length === 0 ? (
            <div className="flex flex-col items-center gap-3 px-5 py-12">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gray-50 dark:bg-white/[0.04]">
                <Bell className="h-6 w-6 text-gray-300 dark:text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">
                  {filtro === "nao-lidas" ? "Está tudo lido" : "Nenhuma notificação"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-500">
                  {filtro === "nao-lidas"
                    ? "Não tem notificações por ler."
                    : "As suas notificações aparecerão aqui."}
                </p>
              </div>
            </div>
          ) : (
            grupos.map((grupo) => (
              <section key={grupo.nome}>
                <h3 className="sticky top-0 z-10 bg-white/95 px-5 py-1.5 text-[11px] font-medium text-gray-400 backdrop-blur dark:bg-[#111113]/95 dark:text-zinc-500">
                  {grupo.nome}
                </h3>
                {grupo.itens.map((notif) => {
                  const Icon = tipoIconMap[notif.tipo] || Bell;
                  const isUnread = !notif.visualizada;
                  return (
                    <button
                      key={notif.id}
                      onClick={() => handleNotificationClick(notif)}
                      className={cn(
                        "flex w-full gap-3 px-5 py-3 text-left transition-colors duration-150 focus-visible:bg-gray-50 focus-visible:outline-none dark:focus-visible:bg-white/[0.04]",
                        isUnread && notif.tipo === "BOLSA_COMPATIVEL"
                          ? "border-l-4 border-amber-500 bg-amber-50 hover:bg-amber-100/70 dark:bg-amber-500/10 dark:hover:bg-amber-500/15"
                          : isUnread
                            ? "bg-emerald-50/40 hover:bg-emerald-50 dark:bg-emerald-500/[0.03] dark:hover:bg-emerald-500/[0.06]"
                            : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                      )}
                    >
                      <div
                        className={cn(
                          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                          tipoColorMap[notif.tipo] || "bg-gray-50 text-gray-500 dark:bg-white/[0.04]"
                        )}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={cn(
                              "text-sm leading-snug",
                              isUnread
                                ? "font-semibold text-gray-900 dark:text-white"
                                : "font-medium text-gray-600 dark:text-zinc-400"
                            )}
                          >
                            {notif.titulo}
                          </p>
                          <span className="mt-0.5 shrink-0 whitespace-nowrap text-[10px] text-gray-400 dark:text-zinc-500">
                            {formatTime(notif.created_at)}
                          </span>
                        </div>
                        <p
                          className={cn(
                            "mt-0.5 line-clamp-3 text-xs",
                            isUnread ? "text-gray-500 dark:text-zinc-400" : "text-gray-400 dark:text-zinc-500"
                          )}
                        >
                          {notif.conteudo}
                        </p>
                      </div>
                      {isUnread && (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-label="Por ler" />
                      )}
                    </button>
                  );
                })}
              </section>
            ))
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
