import { useMemo } from "react";
import { Link, useLocation, Outlet, Navigate } from "react-router-dom";
import {
  Award,
  BookOpen,
  Users,
  Search,
  LogOut,
  ChevronDown,
  GraduationCap,
  Sun,
  Moon,
  User,
  Shield,
  Settings,
  Check,
  CreditCard,
  Briefcase,
  Newspaper,
  MessageCircle,
  FileText,
  Video,
  Clapperboard,
  Image as ImageIcon,
  BookHeart,
  Globe,
  UserCheck,
  Eye,
  CalendarClock,
  LayoutDashboard,
  Share2,
  Headset,
  School,
  MailCheck,
  Contact,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
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
import { NotificationBell } from "@/components/notification-bell";
import { cn } from "@/lib/utils";
import { AdminSidebar, type SidebarMenuGroup } from "@/components/admin/AdminSidebar";
import { VoltarAoTopo } from "@/components/voltar-ao-topo";
import { SplashLogo } from "@/components/splash-logo";
import { BarraInferior } from "@/components/barra-inferior";
import logo from "@/assets/logo-icone.png";

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
      { label: "Afiliados", href: "/admin/afiliados", icon: Share2, description: "Comissões e saques" },
      { label: "Consultoria", href: "/admin/consultoria", icon: Briefcase, description: "Sessões e especialistas" },
      { label: "Mentoria", href: "/admin/mentoria", icon: GraduationCap, description: "Acompanhamento de alunos" },
    ],
  },
  {
    label: "Conteúdo",
    items: [
      { label: "Aulas ao Vivo", href: "/admin/aulas-online", icon: Video, description: "Sessões em tempo real" },
      { label: "Destaques", href: "/admin/novidades", icon: Newspaper, description: "Novidades da plataforma" },
      { label: "Vídeos explicativos", href: "/admin/videos", icon: Clapperboard, description: "Tutoriais da plataforma" },
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
      { label: "Monitores", href: "/admin/usuarios?papel=MONITOR", icon: School, description: "Acesso de mentoria a todas as bolsas" },
      { label: "CRM", href: "/admin/crm", icon: Contact, description: "Leads e contactos da equipa" },
      { label: "Atendimento", href: "/admin/atendimento", icon: Headset, description: "Vendas canceladas e contactos" },
      { label: "Funil de emails", href: "/admin/funil", icon: MailCheck, description: "Gatilhos diários de vendas" },
      { label: "Gestores & Mentores", href: "/admin/gestores", icon: Shield, description: "Equipa de gestão e formadores" },
    ],
  },
];

const ROTULOS_DA_BARRA: Record<string, string> = {
  "/admin/estatisticas": "Início",
  "/admin/bolsas": "Bolsas",
  "/admin/inscricoes": "Inscrições",
  "/admin/cursos/pagamentos": "Pagamentos",
};

const GESTOR_RESTRICTED = [
  "/admin/usuarios",
  "/admin/atendimento",
  "/admin/crm",
  "/admin/funil",
  "/admin/videos",
  "/admin/cursos/pagamentos",
  "/admin/consultoria",
  "/admin/mentoria",
  "/admin/novidades",
  "/admin/depoimentos",
  "/admin/banners",
  "/admin/atividades",
  "/admin/mapa-global",
];

const isRestrictedForGestor = (href: string) => {
  const caminho = href.split("?")[0];
  return GESTOR_RESTRICTED.some((path) => caminho === path || caminho.startsWith(`${path}/`));
};

export function AdminDashboard() {
  const { theme, setTheme } = useTheme();
  const { user } = useUser();
  const location = useLocation();
  const hasToken = !!Cookies.get("token");

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
    // Itens com filtro na query (ex.: Monitores) só acendem com essa query exata.
    const matches = visibleMenuItems.filter((item) =>
      item.href.includes("?")
        ? location.pathname + location.search === item.href
        : location.pathname === item.href || location.pathname.startsWith(`${item.href}/`),
    );
    return matches.sort((a, b) => b.href.length - a.href.length)[0]?.href;
  }, [location.pathname, location.search, visibleMenuItems]);

  if (!user && !hasToken) {
    return <Navigate to="/sign-in" replace />;
  }

  if (!user) {
    return <SplashLogo />;
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

  return (
    <div className="flex h-dvh overflow-hidden bg-[#f3f6f4] text-gray-900 dark:bg-[#070809] dark:text-white">
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 hidden h-screen w-[272px] flex-col overflow-hidden border-r border-gray-200/80 bg-white/95 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0c0d]/95 lg:flex",
        )}
      >
        <AdminSidebar
          groups={visibleGroups}
          activeHref={activeHref}
          collapsed={false}
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
          <Link to="/admin/estatisticas" className="flex min-w-0 items-center gap-2.5 lg:hidden">
            <img src={logo} alt="" className="size-8 shrink-0 object-contain" />
            <span className="font-marca text-sm font-bold tracking-tight text-gray-900 dark:text-white">Afroscholars</span>
          </Link>

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

            <NotificationBell userId={user.id} role={user.role} />

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

        <BarraInferior
          ariaLabel="Navegação do administrador"
          itens={visibleMenuItems
            .filter((item) => ROTULOS_DA_BARRA[item.href])
            .map((item) => ({ ...item, labelCurta: ROTULOS_DA_BARRA[item.href] }))}
          mais={[
            ...visibleMenuItems.filter((item) => !ROTULOS_DA_BARRA[item.href]),
            { label: "Ver como utilizador", href: "/", icon: Eye },
          ]}
        />
      </main>
    </div>
  );
}

export default AdminDashboard;
