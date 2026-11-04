import { useState } from "react";
import { Link, Navigate, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Award, BookOpen, ChevronLeft, FileText,
  LayoutDashboard, Loader2, LogOut, Menu, Moon, Sun, UserRound, UsersRound, Video,
} from "lucide-react";
import Cookies from "js-cookie";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@/api/useGetProfile";
import { NotificationBell } from "@/components/notification-bell";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";
import { getUploadUrl } from "@/lib/axios";
import logo from "@/assets/logo.jpeg";

const menuItems = [
  {
    label: "Visão geral",
    labelCurta: "Visão geral",
    naBarra: true,
    href: "/gestor/estatisticas",
    icon: LayoutDashboard,
    description: "Resumo do teu desempenho",
  },
  {
    label: "Minhas bolsas",
    labelCurta: "Bolsas",
    naBarra: true,
    href: "/gestor/bolsas",
    icon: Award,
    description: "Bolsas que criaste",
  },
  {
    label: "Meus cursos",
    labelCurta: "Cursos",
    naBarra: true,
    href: "/gestor/cursos",
    icon: BookOpen,
    description: "Cursos que publicaste",
  },
  {
    label: "Aulas ao vivo",
    labelCurta: "Aulas",
    naBarra: true,
    href: "/gestor/aulas",
    icon: Video,
    description: "Aulas que agendaste",
  },
  {
    label: "Minhas comunidades",
    labelCurta: "Comunidades",
    naBarra: false,
    href: "/gestor/comunidades",
    icon: UsersRound,
    description: "Comunidades que criaste",
  },
  {
    label: "Documentos",
    labelCurta: "Documentos",
    naBarra: false,
    href: "/gestor/documentos",
    icon: FileText,
    description: "Materiais e ficheiros",
  },
  {
    label: "Perfil do mentor",
    labelCurta: "Perfil",
    naBarra: false,
    href: "/gestor/perfil",
    icon: UserRound,
    description: "Fotografia e descrição",
  },
];

const itensDaBarra = menuItems.filter((item) => item.naBarra);
const itensDeMais = menuItems.filter((item) => !item.naBarra);

export function GestorLayout() {
  const { user, isLoading } = useUser();
  const { theme, setTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [maisAberto, setMaisAberto] = useState(false);
  const hasToken = !!Cookies.get("token");

  if (!hasToken) return <Navigate to="/sign-in" replace />;

  if (isLoading && !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#f6f6f7] dark:bg-[#0a0a0b]">
        <Loader2 className="h-7 w-7 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user) return <Navigate to="/sign-in" replace />;

  if (user.role !== "ADMIN" && user.role !== "GESTOR") {
    return <Navigate to="/" replace />;
  }

  const initials = user.nome?.substring(0, 2).toUpperCase() || "GE";
  const avatarSrc = user.image_path ? getUploadUrl(`/uploads/${user.image_path}`) : "";
  const isDark = theme === "dark";
  const estaAtivo = (href: string) =>
    location.pathname === href || location.pathname.startsWith(href + "/");
  const maisAtivo = itensDeMais.some((item) => estaAtivo(item.href));

  const handleLogout = () => {
    Cookies.remove("token", { path: "/" });
    queryClient.clear();
    navigate("/sign-in");
  };

  return (
    <div className="flex h-dvh w-full overflow-hidden bg-[#f6f6f7] dark:bg-[#0a0a0b]">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-[248px] flex-col border-r border-zinc-200/70 bg-white dark:border-white/[0.06] dark:bg-[#0d0d0f] lg:flex">
        <div className="flex h-16 items-center px-5">
          <Link to="/gestor/estatisticas" className="flex items-center gap-3">
            <div className="size-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10">
              <img src={logo} alt="Afroscholars" className="h-full w-full object-cover" />
            </div>
            <p className="text-[15px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Afroscholars
            </p>
          </Link>
        </div>

        <ScrollArea className="flex-1">
          <nav className="space-y-0.5 px-3 py-4">
            <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-600">
              Gestão
            </p>
            {menuItems.map((item) => {
              const active = estaAtivo(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13.5px] font-medium transition-colors ${
                    active
                      ? "bg-zinc-900 text-white dark:bg-white/[0.08] dark:text-white"
                      : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
                  }`}
                >
                  <item.icon
                    size={17}
                    className={active ? "text-emerald-400" : "text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300"}
                  />
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate">{item.label}</span>
                    <span
                      className={`mt-0.5 block truncate text-[10px] font-normal ${
                        active
                          ? "text-white/55"
                          : "text-zinc-400 dark:text-zinc-600"
                      }`}
                    >
                      {item.description}
                    </span>
                  </span>
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        <div className="space-y-2 border-t border-zinc-100 p-3 dark:border-white/[0.06]">
          <Link
            to="/"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/[0.04] dark:hover:text-zinc-100"
          >
            <ChevronLeft size={16} />
            Ver plataforma
          </Link>

          <div className="flex items-center gap-2.5 rounded-xl bg-zinc-50 px-2.5 py-2 dark:bg-white/[0.04]">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-400 text-[10px] font-bold text-emerald-950">
              {avatarSrc ? (
                <img src={avatarSrc} alt={user.nome} className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1 leading-tight">
              <p className="truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">
                {user.nome}
              </p>
              <p className="text-[10px] uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500">
                {user.role}
              </p>
            </div>
            <button
              onClick={handleLogout}
              aria-label="Terminar sessão"
              className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-red-500/10 hover:text-red-500"
            >
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden transition-all lg:ml-[248px]">
        <header className="z-30 flex h-16 shrink-0 items-center justify-between border-b border-zinc-200/70 bg-white/80 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0a0b]/80 sm:px-8">
          <Link to="/gestor/estatisticas" className="flex items-center gap-2.5 lg:hidden">
            <div className="size-8 shrink-0 overflow-hidden rounded-lg ring-1 ring-black/5 dark:ring-white/10">
              <img src={logo} alt="" className="h-full w-full object-cover" />
            </div>
            <span className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              Afroscholars
            </span>
          </Link>
          <div className="hidden lg:block" />

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              aria-label={isDark ? "Mudar para o modo claro" : "Mudar para o modo escuro"}
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="h-9 w-9 rounded-full text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]"
            >
              {isDark ? <Sun size={17} /> : <Moon size={17} />}
            </Button>
            <NotificationBell userId={user.id} role={user.role} />
            <div className="hidden items-center gap-2.5 rounded-full border border-zinc-200/70 py-1 pl-1 pr-3 dark:border-white/[0.08] sm:flex">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-emerald-400 text-[10px] font-bold text-emerald-950">
                {avatarSrc ? (
                  <img src={avatarSrc} alt={user.nome} className="h-full w-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              <div className="min-w-0 leading-tight">
                <p className="max-w-[180px] truncate text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  {user.nome}
                </p>
                <p className="max-w-[180px] truncate text-[10px] text-zinc-500 dark:text-zinc-500">
                  {user.email}
                </p>
              </div>
            </div>
          </div>
        </header>

        <ScrollArea className="min-h-0 flex-1">
          <div className="mx-auto w-full max-w-[1200px] p-4 sm:p-6 lg:p-10">
            <VoltarAoTopo />
            <Outlet />
          </div>
        </ScrollArea>

        <nav
          aria-label="Navegação do gestor"
          className="z-30 grid shrink-0 grid-cols-5 border-t border-zinc-200/70 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/[0.06] dark:bg-[#0d0d0f] lg:hidden"
        >
          {itensDaBarra.map((item) => {
            const active = estaAtivo(item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                aria-current={active ? "page" : undefined}
                className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none tracking-tight transition-colors ${
                  active
                    ? "text-emerald-700 dark:text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
                }`}
              >
                <item.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
                <span className="max-w-full truncate">{item.labelCurta}</span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMaisAberto(true)}
            aria-haspopup="dialog"
            aria-expanded={maisAberto}
            className={`flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none tracking-tight transition-colors ${
              maisAtivo
                ? "text-emerald-700 dark:text-emerald-400"
                : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            <Menu size={20} strokeWidth={maisAtivo ? 2.25 : 1.75} />
            <span>Mais</span>
          </button>
        </nav>
      </main>

      <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl border-zinc-200/70 bg-white p-0 pb-[env(safe-area-inset-bottom)] text-zinc-900 dark:border-white/[0.06] dark:bg-[#0d0d0f] dark:text-zinc-100"
        >
          <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b border-zinc-100 p-4 pr-12 text-left dark:border-white/[0.06]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-400 text-xs font-bold text-emerald-950">
              {avatarSrc ? (
                <img src={avatarSrc} alt="" className="h-full w-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm font-semibold">{user.nome}</SheetTitle>
              <SheetDescription className="truncate text-xs">{user.email}</SheetDescription>
            </div>
          </SheetHeader>

          <div className="p-2">
            {itensDeMais.map((item) => {
              const active = estaAtivo(item.href);
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMaisAberto(false)}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                    active
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <Link
              to="/"
              onClick={() => setMaisAberto(false)}
              className="flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
            >
              <ChevronLeft size={18} />
              Ver plataforma
            </Link>
            <button
              type="button"
              onClick={handleLogout}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut size={18} />
              Terminar sessão
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

export default GestorLayout;
