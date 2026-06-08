import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, BellRing, CheckCheck, Loader2, Award, GraduationCap, AlertCircle, Info, MessageCircle, DollarSign, Bot, ExternalLink } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useNotificacoesSocket } from "@/hooks/useNotificacoesSocket";
import { getNotifications, markAsRead, markAllAsRead, type Notification } from "@/api/notifications";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

const tipoIconMap: Record<string, React.ElementType> = {
  BOT: Bot,
  ERRO: AlertCircle,
  SUCESSO: Award,
  INFO: Info,
  CURSO: GraduationCap,
  MENTORIA: MessageCircle,
  PAGAMENTO: DollarSign,
};

const tipoColorMap: Record<string, string> = {
  BOT: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
  ERRO: "text-red-500 bg-red-50 dark:bg-red-500/10",
  SUCESSO: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
  INFO: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
  CURSO: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
  MENTORIA: "text-teal-500 bg-teal-50 dark:bg-teal-500/10",
  PAGAMENTO: "text-green-500 bg-green-50 dark:bg-green-500/10",
};

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHor = Math.floor(diffMs / 3600000);
  const diffDia = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Agora";
  if (diffMin < 60) return `${diffMin}m`;
  if (diffHor < 24) return `${diffHor}h`;
  if (diffDia < 7) return `${diffDia}d`;
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" });
}

export function NotificationBell({ userId }: { userId?: string }) {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useNotificacoesSocket(userId);

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ["notificacoes", userId],
    queryFn: getNotifications,
    enabled: !!userId,
    refetchInterval: 30_000,
  });

  const unreadCount = notifications.filter((n) => !n.visualizada).length;

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", userId] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notificacoes", userId] });
    },
  });

  function handleNotificationClick(notif: Notification) {
    if (!notif.visualizada) {
      markReadMutation.mutate(notif.id);
    }
    setOpen(false);
    if (notif.link) {
      navigate(notif.link);
    }
  }

  function getTipoIcon(tipo: string) {
    const Icon = tipoIconMap[tipo] || Bell;
    return Icon;
  }

  function getTipoColor(tipo: string) {
    return tipoColorMap[tipo] || "text-gray-500 bg-gray-50 dark:bg-white/[0.04]";
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <button
          aria-label="Notificações"
          className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] bg-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-all duration-200"
        >
          <AnimatePresence mode="wait">
            {unreadCount > 0 ? (
              <motion.div
                key="ringing"
                initial={{ rotate: -15 }}
                animate={{ rotate: [0, -12, 12, -8, 8, -4, 4, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 2, ease: "easeInOut" }}
              >
                <BellRing className="h-4 w-4" />
              </motion.div>
            ) : (
              <motion.div key="silent" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}>
                <Bell className="h-4 w-4" />
              </motion.div>
            )}
          </AnimatePresence>
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex items-center justify-center w-[18px] h-[18px] rounded-full bg-red-500 text-[9px] font-bold text-white leading-none shadow-sm aspect-square">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-[380px] mt-2 p-0 rounded-xl border border-gray-100 dark:border-white/[0.06] dark:bg-[#111113] shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-gray-500 dark:text-zinc-400" />
            <span className="text-sm font-semibold text-gray-900 dark:text-white">Notificações</span>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllReadMutation.mutate()}
              disabled={markAllReadMutation.isPending}
              className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 transition-colors"
            >
              {markAllReadMutation.isPending ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCheck className="w-3.5 h-3.5" />
              )}
              Marcar todas lidas
            </button>
          )}
        </div>

        <Separator className="bg-gray-100 dark:bg-white/[0.06]" />

        {/* List */}
        <ScrollArea className="max-h-[360px]">
          {isLoading ? (
            <div className="flex flex-col gap-3 p-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/[0.06] shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-3/4 bg-gray-100 dark:bg-white/[0.06] rounded" />
                    <div className="h-2.5 w-full bg-gray-100 dark:bg-white/[0.06] rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 px-5">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center">
                <Bell className="w-6 h-6 text-gray-300 dark:text-zinc-600" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Nenhuma notificação</p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">As suas notificações aparecerão aqui.</p>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {notifications.slice(0, 20).map((notif) => {
                const Icon = getTipoIcon(notif.tipo);
                const isUnread = !notif.visualizada;
                return (
                  <button
                    key={notif.id}
                    onClick={() => handleNotificationClick(notif)}
                    className={cn(
                      "w-full text-left flex gap-3 px-5 py-3.5 transition-colors duration-150",
                      isUnread
                        ? "bg-emerald-50/40 dark:bg-emerald-500/[0.03] hover:bg-emerald-50 dark:hover:bg-emerald-500/[0.06]"
                        : "hover:bg-gray-50 dark:hover:bg-white/[0.02]"
                    )}
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", getTipoColor(notif.tipo))}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className={cn("text-sm leading-snug", isUnread ? "font-semibold text-gray-900 dark:text-white" : "font-medium text-gray-600 dark:text-zinc-400")}>
                          {notif.titulo}
                        </p>
                        <span className="text-[10px] text-gray-400 dark:text-zinc-600 whitespace-nowrap shrink-0 mt-0.5">
                          {formatTime(notif.created_at)}
                        </span>
                      </div>
                      <p className={cn("text-xs mt-0.5 line-clamp-2", isUnread ? "text-gray-500 dark:text-zinc-400" : "text-gray-400 dark:text-zinc-500")}>
                        {notif.conteudo}
                      </p>
                      {notif.link && (
                        <span className="inline-flex items-center gap-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 mt-1">
                          Ver detalhes
                          <ExternalLink className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && (
          <>
            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />
            <div className="px-5 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => { setOpen(false); navigate("/settings"); }}
                className="w-full h-9 text-xs rounded-lg text-gray-500 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-white/[0.06]"
              >
                Ver todas as notificações
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
