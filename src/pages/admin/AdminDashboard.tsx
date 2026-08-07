import { useState } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Users,
  BarChart3,
  Search,
  Bell,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sun,
  Moon,
  User,
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

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

const menuItems = [
  { label: "Dashboard", href: "/admin/estatisticas", icon: BarChart3 },
  { label: "Bolsas de Estudos", href: "/admin/bolsas", icon: Award },
  { label: "Entrevista IA", href: "/entrevista", icon: UserCheck },
  { label: "Proficiência EN", href: "/proficiencia", icon: Globe },
  { label: "Inscrições", href: "/admin/inscricoes", icon: FileText },
  { label: "Consultoria", href: "/admin/consultoria", icon: Briefcase },
  { label: "Mentoria", href: "/admin/mentoria", icon: GraduationCap },
  { label: "Preparação Pessoal", href: "/admin/cursos", icon: BookOpen },
  { label: "Pagamentos", href: "/admin/cursos/pagamentos", icon: CreditCard },
  { label: "Destaques", href: "/admin/novidades", icon: Newspaper },
  { label: "Comunidades", href: "/admin/comunidades", icon: Users },
  { label: "Histórias", href: "/historias", icon: BookHeart },
  { label: "Depoimentos", href: "/admin/depoimentos", icon: MessageCircle },
  { label: "Análise Documentos", href: "/admin/analise-documento", icon: FileText },
  { label: "Aulas ao Vivo", href: "/admin/aulas-online", icon: Video },
  { label: "Mapa Global", href: "/admin/mapa-global", icon: Globe },
  { label: "Banners Home", href: "/admin/banners", icon: ImageIcon },
  { label: "Utilizadores", href: "/admin/usuarios", icon: User },
];

export function AdminDashboard() {
  const queryClient = useQueryClient();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const location = useLocation();
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

  if (!user && !hasToken) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!user) {
    return null;
  }

  if (user.role !== "ADMIN") {
    return <Navigate to="/" replace />;
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
    if (t.includes("candidatura")) return <Users size={14} className="text-purple-500" />;
    if (t.includes("sucesso")) return <Check size={14} className="text-emerald-500" />;
    if (t.includes("erro")) return <X size={14} className="text-red-500" />;
    return <Bell size={14} className="text-gray-500" />;
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-[#111113]">
      {/* Mobile overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}
      <aside
        className={`
          fixed left-0 top-0 h-screen bg-white dark:bg-[#111113] border-r border-gray-200 dark:border-white/[0.06] flex flex-col transition-all duration-300 z-50
          ${mobileSidebarOpen || sidebarOpen ? "w-64" : "w-20"}
          ${mobileSidebarOpen ? "translate-x-0" : "-translate-x-full"}
          lg:translate-x-0
        `}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/[0.06]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            {(mobileSidebarOpen || sidebarOpen) && (
              <span className="font-bold text-gray-900 dark:text-white">Afroscholars</span>
            )}
          </div>
          <button
            onClick={() => setMobileSidebarOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] lg:hidden"
          >
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <item.icon size={18} />
                  {(mobileSidebarOpen || sidebarOpen) && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* Footer */}
        <div className="p-3 border-t border-gray-100 dark:border-white/[0.06] space-y-1">
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 w-full transition-colors"
          >
            <Eye size={18} />
            {(mobileSidebarOpen || sidebarOpen) && <span>Ver como Utilizador</span>}
          </Link>
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] w-full transition-colors"
          >
            <LogOut size={18} />
            {(mobileSidebarOpen || sidebarOpen) && <span>Sair do Admin</span>}
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main
        className={`flex-1 flex flex-col min-h-0 transition-all duration-300 overflow-hidden ${
          sidebarOpen ? "lg:ml-64" : "lg:ml-20"
        }`}
      >
        {/* Header */}
        <header className="h-16 shrink-0 bg-white dark:bg-[#111113] border-b border-gray-200 dark:border-white/[0.06] flex items-center justify-between px-4 sm:px-6 z-40">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] lg:hidden"
            >
              <Menu size={18} className="text-gray-500 dark:text-zinc-500" />
            </button>

            {/* Desktop toggle */}
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="hidden lg:flex p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]"
            >
              <ChevronDown
                size={18}
                className={`text-gray-500 dark:text-zinc-500 transition-transform ${
                  sidebarOpen ? "rotate-90" : "-rotate-90"
                }`}
              />
            </button>
            <div className="relative flex-1 max-w-xs sm:max-w-sm">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <Input
                placeholder="Pesquisar..."
                className="pl-10 bg-gray-50 dark:bg-white/[0.06] border-none w-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-3 shrink-0">
            <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell size={18} className="text-gray-500 dark:text-zinc-500" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-full sm:max-w-md flex flex-col bg-gray-50 dark:bg-[#111113]">
                <SheetHeader className="flex-shrink-0 border-b border-gray-200 dark:border-white/[0.06] pb-4">
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-gray-700 dark:text-white">
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
                        className="text-xs text-gray-500 dark:text-zinc-400 hover:underline disabled:opacity-50"
                      >
                        {markAllReadMutation.isPending ? "..." : "Marcar tudo lido"}
                      </button>
                    )}
                  </div>
                </SheetHeader>
                <ScrollArea className="flex-1 mt-4">
                  <div className="space-y-2">
                    {notifsLoading ? (
                      <div className="flex items-center justify-center py-8">
                        <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                      </div>
                    ) : notifs.length === 0 ? (
                      <div className="text-center py-8 text-gray-400 dark:text-zinc-500">
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
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            notif.visualizada
                              ? "bg-transparent border-gray-200 dark:border-white/[0.06]"
                              : "bg-gray-100 dark:bg-white/[0.06] border-gray-200 dark:border-white/[0.06]"
                          }`}
                          onClick={() => { if (!notif.visualizada) markReadMutation.mutate(notif.id); }}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                              {getNotificationIcon(notif.tipo)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${
                                notif.visualizada
                                  ? "text-gray-500 dark:text-zinc-400"
                                  : "text-gray-700 dark:text-white"
                              }`}>
                                {notif.titulo}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-zinc-500 mt-0.5 truncate">
                                {notif.conteudo}
                              </p>
                              <p className="text-xs text-gray-400 dark:text-zinc-600 mt-1 flex items-center gap-1">
                                <Clock size={10} />
                                {timeAgo()}
                              </p>
                            </div>
                            {!notif.visualizada && (
                              <div className="w-2 h-2 rounded-full bg-gray-500 dark:bg-gray-400 shrink-0 mt-1.5" />
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

            {/* Theme Toggle Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9">
                  {theme === "dark" ? (
                    <Moon size={18} className="text-gray-500 dark:text-zinc-400" />
                  ) : (
                    <Sun size={18} className="text-gray-500" />
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-white dark:bg-[#111113] border-gray-200 dark:border-white/[0.1]">
                <DropdownMenuItem
                  onClick={() => setTheme("light")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Sun size={14} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Claro</span>
                  {theme === "light" && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setTheme("dark")}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Moon size={14} className="text-gray-500" />
                  <span className="text-gray-700 dark:text-gray-200">Escuro</span>
                  {theme === "dark" && <Check size={14} className="ml-auto text-emerald-500" />}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Admin Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors">
                  <div className={`w-8 h-8 rounded-full ${userColor} flex items-center justify-center text-white font-bold text-sm`}>
                    {userInitials}
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden md:block">
                    {userName}
                  </span>
                  <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-[#111113] border-gray-200 dark:border-white/[0.1]">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-white/[0.06]">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{userName}</p>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">{userEmail}</p>
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

        {/* Content with shadcn ScrollArea */}
        <ScrollArea className="flex-1 min-h-0 w-full">
          <div className="p-4 sm:p-6 lg:p-8">
            <Outlet />
          </div>
        </ScrollArea>
      </main>
    </div>
  );
}

export default AdminDashboard;
