import { useMemo, useState } from "react";
import { useLocation, useNavigate, Outlet, Navigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Users,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sun,
  Moon,
  User,
  Shield,
  Settings,
  Check,
  Clock,
  CreditCard,
  Menu,
  X,
  Briefcase,
  Loader2,
  Newspaper,
  MessageCircle,
  FileText,
  Video,
  Image as ImageIcon,
  BookHeart,
  Globe,
  UserCheck,
  Eye,
  CalendarClock,
  LayoutDashboard,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme/theme-provider";
import { useUser } from "@/api/useGetProfile";
import Cookies from "js-cookie";
import { getNotifications, markAsRead, markAllAsRead } from "@/api/notifications";
import { cn } from "@/lib/utils";
import { AdminSidebar, type SidebarMenuGroup } from "@/components/admin/AdminSidebar";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-teal-500"];

const NAV_GROUPS: SidebarMenuGroup[] = [
  {
    label: "Visão geral",
    items: [
      {
        label: "Dashboard",
        href: "/admin/estatisticas",
        icon: LayoutDashboard,
        description: "Resumo geral do negócio",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      { label: "Bolsas de Estudos", href: "/admin/bolsas", icon: Award, description: "Oportunidades publicadas" },
      { label: "Inscrições", href: "/admin/inscricoes", icon: FileText, description: "Candidaturas recebidas" },
      { label: "Preparação Pessoal", href: "/admin/cursos", icon: BookOpen, description: "Cursos e conteúdos" },
      { label: "Pagamentos", href: "/admin/cursos/pagamentos", icon: CreditCard, description: "Receita e transações" },
      { label: "Consultoria", href: "/admin/consultoria", icon: Briefcase, description: "Sessões e especialistas" },
      { label: "Mentoria", href: "/admin/mentoria", icon: GraduationCap, description: "Acompanhamento de alunos" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "Aulas ao Vivo", href: "/admin/aulas-online", icon: Video, description: "Sessões em tempo real" },
      { label: "Destaques", href: "/admin/novidades", icon: Newspaper, description: "Novidades da plataforma" },
      { label: "Banners Home", href: "/admin/banners", icon: ImageIcon, description: "Destaques da homepage" },
      { label: "Atividades", href: "/admin/atividades", icon: CalendarClock, description: "Calendário e eventos" },
      { label: "Mapa Global", href: "/admin/mapa-global", icon: Globe, description: "Presença internacional" },
    ],
  },
  {
    label: "Comunidade",
    items: [
      { label: "Comunidades", href: "/admin/comunidades", icon: Users, description: "Grupos e discussões" },
      { label: "Depoimentos", href: "/admin/depoimentos", icon: MessageCircle, description: "Prova social da plataforma" },
      { label: "Histórias", href: "/historias", icon: BookHeart, description: "Casos de sucesso" },
      { label: "Análise Documentos", href: "/admin/analise-documento", icon: FileText, description: "Validação de candidaturas" },
    ],
  },
  {
    label: "Plataforma",
    items: [
      { label: "Entrevista IA", href: "/entrevista", icon: UserCheck, description: "Simulação inteligente" },
      { label: "Proficiência EN", href: "/proficiencia", icon: Globe, description: "Testes de inglês" },
      { label: "Utilizadores", href: "/admin/usuarios", icon: User, description: "Contas e permissões" },
      { label: "Gestores & Mentores", href: "/admin/gestores", icon: Shield, description: "Equipa de gestão e formadores" },
    ],
  },
];

const GESTOR_RESTRICTED = [
  "/admin/usuarios",
  "/admin/cursos/pagamentos",
  "/admin/consultoria",
  "/admin/mentoria",
  "/admin/novidades",
  "/admin/depoimentos",
  "/admin/banners",
  "/admin/atividades",
  "/admin/mapa-global",
];

const isRestrictedForGestor = (href: string) =>
  GESTOR_RESTRICTED.some((path) => href === path || href.startsWith(`${path}/`));

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();
  const hasToken = !!Cookies.get("token");

  const { data: notifs = [], isLoading: notifsLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: getNotifications,
    enabled: !!user,
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: markAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: markAllAsRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const isAdminUser = user?.role === "ADMIN";

  const visibleGroups = useMemo(
    () =>
      NAV_GROUPS.map((group) => ({
        ...group,
        items: group.items.filter(
          (item) => isAdminUser || !isRestrictedForGestor(item.href),
        ),
      })).filter((group) => group.items.length > 0),
    [isAdminUser],
  );

  const visibleMenuItems = useMemo(
    () => visibleGroups.flatMap((group) => group.items),
    [visibleGroups],
  );

  const activeHref = useMemo(() => {
    const matches = visibleMenuItems.filter(
      (item) => location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
    );
    return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [location.pathname, visibleMenuItems]);

  if (!user && !hasToken) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return (
      <Navigate
        to={user.role === "GESTOR" ? "/gestor/estatisticas" : "/"}
        replace
      />
    );
  }

  const userInitials = user?.nome?.substring(0, 2).toUpperCase() || "AD";
  const userColor = COLORS[user?.nome?.length % COLORS.length] || "bg-emerald-500";
  const userName = user?.nome || "Administrador";
  const userEmail = user?.email || "admin@thescholar.ao";

  const unreadCount = notifs.filter((n) => !n.visualizada).length;

  const getNotificationIcon = (type: string) => {
    const t = (type || "").toLowerCase();
    if (t.includes("curso") || t.includes("aula")) return <BookOpen size={14} className="text-blue-500" />;
    if (t.includes("bolsa") || t.includes("inscricao")) return <Award size={14} className="text-emerald-500" />;
    if (t.includes("candidatura")) return <Users size={14} className="text-violet-500" />;
    if (t.includes("sucesso")) return <Check size={14} className="text-emerald-500" />;
    if (t.includes("erro")) return <X size={14} className="text-rose-500" />;
    return <Bell size={14} className="text-gray-500" />;
  };

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f3f6f4] text-gray-900 dark:bg-[#070809] dark:text-white">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen w-[272px] flex-col overflow-hidden border-r border-gray-200/80 bg-white/95 backdrop-blur-xl transition-all duration-300 dark:border-white/[0.06] dark:bg-[#0a0c0d]/95",
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full",
          "lg:translate-x-0",
        )}
      >
        <AdminSidebar
          groups={visibleGroups}
          activeHref={activeHref}
          collapsed={false}
          onClose={() => setMobileSidebarOpen(false)}
          onNavigate={() => setMobileSidebarOpen(false)}
          className="w-full border-r-0 bg-transparent dark:bg-transparent"
          showHelpCard={false}
          footerLinks={[
            { label: "Ver como utilizador", href: "/", icon: Eye },
            { label: "Terminar sessão", href: "/", icon: LogOut, tone: "danger" },
          ]}
        />
      </aside>

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:ml-[272px]">
        <header className="z-40 flex h-16 shrink-0 items-center justify-between border-b border-gray-200/80 bg-white/80 px-4 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0c0d]/80 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="grid size-9 place-items-center rounded-xl text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06] lg:hidden"
            >
              <Menu size={18} />
            </button>
          </div>

          <div className="flex flex-1 items-center justify-end gap-1.5 sm:gap-2">
            <div className="relative mr-1 hidden max-w-xs flex-1 sm:block sm:max-w-[280px]">
              <Search
                size={15}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-600"
              />
              <Input
                placeholder="Pesquisar..."
                className="h-9 rounded-xl border-gray-200/80 bg-gray-50/80 pl-9 text-xs dark:border-white/[0.06] dark:bg-white/[0.04]"
              />
            </div>

            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative size-9 rounded-xl">
                  <Bell size={17} className="text-gray-500 dark:text-zinc-400" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1 top-1 grid size-4 place-items-center rounded-full bg-emerald-500 text-[9px] font-bold text-black">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="flex w-full flex-col border-gray-200 bg-[#f7f9f8] dark:border-white/[0.06] dark:bg-[#0a0c0d] sm:max-w-md">
                <SheetHeader className="flex-shrink-0 border-b border-gray-200 pb-4 dark:border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-gray-900 dark:text-white">
                      Notificações
                      {unreadCount > 0 && (
                        <span className="ml-2 text-xs font-normal text-gray-400">
                          ({unreadCount} nova{unreadCount > 1 ? "s" : ""})
                        </span>
                      )}
                    </SheetTitle>
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={markAllReadMutation.isPending}
                        className="text-xs text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
                      >
                        {markAllReadMutation.isPending ? "..." : "Marcar tudo lido"}
                      </button>
                    )}
                  </div>
                </SheetHeader>
                <ScrollArea className="mt-4 flex-1">
                  <div className="space-y-2 pr-1">
                    {notifsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      </div>
                    ) : notifs.length === 0 ? (
                      <div className="py-8 text-center text-gray-400 dark:text-zinc-500">
                        Sem notificações
                      </div>
                    ) : (
                      notifs.map((notif) => {
                        const timeAgo = () => {
                          const diff = Date.now() - new Date(notif.created_at).getTime();
                          const mins = Math.floor(diff / 60000);
                          if (mins < 1) return "agora";
                          if (mins < 60) return `há ${mins} min`;
                          const hrs = Math.floor(mins / 60);
                          if (hrs < 24) return `há ${hrs} hora${hrs > 1 ? "s" : ""}`;
                          const days = Math.floor(hrs / 24);
                          return `há ${days} dia${days > 1 ? "s" : ""}`;
                        };
                        return (
                          <div
                            key={notif.id}
                            className={cn(
                              "cursor-pointer rounded-2xl border p-3 transition-all",
                              notif.visualizada
                                ? "border-gray-200/70 bg-transparent dark:border-white/[0.05]"
                                : "border-emerald-200/60 bg-white dark:border-emerald-500/20 dark:bg-white/[0.04]",
                            )}
                            onClick={() => {
                              if (!notif.visualizada) markReadMutation.mutate(notif.id);
                              if (notif.link) {
                                setNotificationsOpen(false);
                                navigate(notif.link);
                              }
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-gray-100 dark:bg-white/[0.06]">
                                {getNotificationIcon(notif.tipo)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p
                                  className={cn(
                                    "text-sm font-medium",
                                    notif.visualizada
                                      ? "text-gray-500 dark:text-zinc-400"
                                      : "text-gray-900 dark:text-white",
                                  )}
                                >
                                  {notif.titulo}
                                </p>
                                <p className="mt-0.5 line-clamp-3 text-xs text-gray-400 dark:text-zinc-500">
                                  {notif.conteudo}
                                </p>
                                <p className="mt-1 flex items-center gap-1 text-[10px] text-gray-400 dark:text-zinc-600">
                                  <Clock size={10} />
                                  {timeAgo()}
                                </p>
                              </div>
                              {!notif.visualizada && (
                                <div className="mt-1.5 size-2 shrink-0 rounded-full bg-emerald-500" />
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-9 rounded-xl">
                  {theme === "dark" ? (
                    <Moon size={17} className="text-gray-500 dark:text-zinc-400" />
                  ) : (
                    <Sun size={17} className="text-gray-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111416]"
              >
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Sun size={14} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Claro</span>
                  {theme === "light" && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="flex cursor-pointer items-center gap-2"
                >
                  <Moon size={14} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Escuro</span>
                  {theme === "dark" && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-xl px-1.5 py-1 transition-colors hover:bg-gray-100 dark:hover:bg-white/[0.06] sm:pr-2">
                  <div
                    className={cn(
                      "grid size-8 place-items-center rounded-full text-xs font-bold text-white shadow-sm",
                      userColor,
                    )}
                  >
                    {userInitials}
                  </div>
                  <span className="hidden min-w-0 flex-col text-left leading-tight md:flex">
                    <span className="max-w-[180px] truncate text-xs font-medium text-gray-700 dark:text-gray-200">
                      {userName}
                    </span>
                    <span className="max-w-[180px] truncate text-[10px] text-gray-500 dark:text-zinc-500">
                      {userEmail}
                    </span>
                  </span>
                  <ChevronDown size={13} className="hidden text-gray-400 sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111416]"
              >
                <div className="border-b border-gray-100 px-3 py-2 dark:border-white/[0.06]">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-zinc-500">{userEmail}</p>
                </div>
                <DropdownMenuItem className="cursor-pointer">
                  <User size={14} className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Meu Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Settings size={14} className="mr-2 text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Configurações</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
                <DropdownMenuItem className="cursor-pointer text-red-600 dark:text-red-400">
                  <LogOut size={14} className="mr-2" />
                  <span>Sair</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <ScrollArea className="min-h-0 w-full flex-1">
          <div className="min-h-full bg-[radial-gradient(900px_420px_at_15%_-10%,rgba(16,185,129,0.10),transparent)] dark:bg-[radial-gradient(900px_420px_at_15%_-10%,rgba(16,185,129,0.10),transparent)]">
            <div className="mx-auto w-full max-w-[1600px] p-4 sm:p-6 lg:p-8">
              <VoltarAoTopo />
              <Outlet />
            </div>
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

export default AdminDashboard;
