import { Link, Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";
import { Headset, LogOut } from "lucide-react";
import { useUser } from "@/api/useGetProfile";
import { NotificationBell } from "@/components/notification-bell";
import { SplashLogo } from "@/components/splash-logo";
import { ModeToggle } from "@/components/theme/theme-toggle";
import { ScrollArea } from "@/components/ui/scroll-area";
import logo from "@/assets/logo-icone.png";

/** Painel da equipa de atendimento: só o CRM, sem a navegação da área do estudante. */
export function AtendimentoLayout() {
  const { user, isLoading, handleLogout } = useUser();
  const hasToken = !!Cookies.get("token");

  if (!user && !hasToken) return <Navigate to="/sign-in" replace />;
  if (!user || isLoading) return <SplashLogo />;
  // O admin trabalha o CRM dentro do painel admin.
  if (user.role === "ADMIN") return <Navigate to="/admin/crm" replace />;
  if (user.role !== "ATENDIMENTO") return <Navigate to="/" replace />;

  const primeiroNome = user.nome?.split(" ")[0] ?? "";

  return (
    <div className="flex h-dvh w-full flex-col bg-[#f3f6f4] text-gray-900 dark:bg-[#070809] dark:text-white">
      <header className="z-20 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-gray-200/70 bg-white px-4 pt-[env(safe-area-inset-top)] dark:border-white/[0.06] dark:bg-[#0d0d0f] sm:px-6">
        <Link to="/atendimento" className="flex min-w-0 items-center gap-2">
          <img src={logo} alt="" className="size-7 shrink-0" />
          <span className="flex min-w-0 items-center gap-1.5 text-sm font-bold">
            <Headset className="size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">Atendimento</span>
          </span>
        </Link>
        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          <span className="hidden text-xs text-gray-500 dark:text-zinc-400 sm:inline">Olá, {primeiroNome}</span>
          <NotificationBell userId={user.id} role={user.role} />
          <ModeToggle />
          <button
            type="button"
            onClick={handleLogout}
            title="Terminar sessão"
            aria-label="Terminar sessão"
            className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-600 dark:text-zinc-400"
          >
            <LogOut className="size-4" />
          </button>
        </div>
      </header>
      <ScrollArea className="min-h-0 flex-1">
        <div className="pb-[env(safe-area-inset-bottom)]">
          <Outlet />
        </div>
      </ScrollArea>
    </div>
  );
}

/** /crm (links antigos e notificações): leva cada um ao seu painel, mantendo ?lead=. */
export function CrmRedirect() {
  const { user, isLoading } = useUser();
  if (isLoading || !user) return <SplashLogo />;
  const destino = user.role === "ADMIN" ? "/admin/crm" : user.role === "ATENDIMENTO" ? "/atendimento" : "/";
  return <Navigate to={`${destino}${window.location.search}`} replace />;
}
