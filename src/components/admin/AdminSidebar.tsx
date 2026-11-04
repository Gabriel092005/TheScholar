import type { ComponentType, ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  Award,
  BookHeart,
  BookOpen,
  Briefcase,
  CalendarClock,
  CreditCard,
  FileCheck2,
  FileText,
  Globe,
  GraduationCap,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Map,
  MessagesSquare,
  Newspaper,
  Quote,
  UserCheck,
  Users,
  Video,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import logo from "@/assets/logo.jpeg";

export type SidebarBadgeTone = "emerald" | "blue" | "amber";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  description?: string;
  badge?: string;
  badgeTone?: SidebarBadgeTone;
  disabled?: boolean;
}

export interface SidebarMenuGroup {
  label: string;
  items: SidebarMenuItem[];
}

export interface SidebarFooterLink {
  label: string;
  href: string;
  icon: ComponentType<{ className?: string; size?: number | string }>;
  tone?: "default" | "danger";
}

export interface AdminSidebarProps {
  groups?: SidebarMenuGroup[];
  activeHref?: string;
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onNavigate?: () => void;
  onClose?: () => void;
  className?: string;
  brand?: {
    name: string;
    tagline: string;
    href: string;
    icon?: ComponentType<{ className?: string; size?: number | string }>;
    logo?: string;
  };
  footerLinks?: SidebarFooterLink[];
  footerExtra?: ReactNode;
  helpCard?: ReactNode;
  showHelpCard?: boolean;
}

const badgeTones: Record<SidebarBadgeTone, string> = {
  emerald:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  blue: "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
  amber: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
};

export const adminMenuGroups: SidebarMenuGroup[] = [
  {
    label: "Operações",
    items: [
      {
        label: "Dashboard",
        href: "/admin/estatisticas",
        icon: LayoutDashboard,
        description: "Resumo geral do negócio",
      },
      {
        label: "Inscrições",
        href: "/admin/inscricoes",
        icon: FileText,
        description: "Candidaturas recebidas",
      },
      {
        label: "Pagamentos",
        href: "/admin/cursos/pagamentos",
        icon: CreditCard,
        description: "Receita e transações",
      },
      {
        label: "Análise Documentos",
        href: "/admin/analise-documento",
        icon: FileCheck2,
        description: "Validação de candidaturas",
      },
    ],
  },
  {
    label: "Gestão",
    items: [
      {
        label: "Bolsas de Estudos",
        href: "/admin/bolsas",
        icon: Award,
        description: "Oportunidades publicadas",
      },
      {
        label: "Preparação Pessoal",
        href: "/admin/cursos",
        icon: BookOpen,
        description: "Cursos e conteúdos",
      },
      {
        label: "Consultoria",
        href: "/admin/consultoria",
        icon: Briefcase,
        description: "Sessões e especialistas",
      },
      {
        label: "Mentoria",
        href: "/admin/mentoria",
        icon: GraduationCap,
        description: "Acompanhamento de alunos",
      },
      {
        label: "Utilizadores",
        href: "/admin/usuarios",
        icon: Users,
        description: "Contas e permissões",
      },
    ],
  },
  {
    label: "Crescer",
    items: [
      {
        label: "Comunidades",
        href: "/admin/comunidades",
        icon: MessagesSquare,
        description: "Grupos e discussões",
      },
      {
        label: "Depoimentos",
        href: "/admin/depoimentos",
        icon: Quote,
        description: "Prova social da plataforma",
      },
      {
        label: "Histórias",
        href: "/historias",
        icon: BookHeart,
        description: "Casos de sucesso",
      },
      {
        label: "Destaques",
        href: "/admin/novidades",
        icon: Newspaper,
        description: "Novidades da plataforma",
      },
      {
        label: "Aulas ao Vivo",
        href: "/admin/aulas-online",
        icon: Video,
        description: "Sessões em tempo real",
      },
      {
        label: "Entrevista IA",
        href: "/entrevista",
        icon: UserCheck,
        description: "Simulação inteligente",
        badge: "NOVO",
        badgeTone: "emerald",
      },
      {
        label: "Proficiência EN",
        href: "/proficiencia",
        icon: Globe,
        description: "Testes de inglês",
        badge: "BETA",
        badgeTone: "blue",
      },
    ],
  },
  {
    label: "Configuração",
    items: [
      {
        label: "Banners Home",
        href: "/admin/banners",
        icon: ImageIcon,
        description: "Destaques da homepage",
      },
      {
        label: "Atividades",
        href: "/admin/atividades",
        icon: CalendarClock,
        description: "Calendário e eventos",
      },
      {
        label: "Mapa Global",
        href: "/admin/mapa-global",
        icon: Map,
        description: "Presença internacional",
      },
    ],
  },
];

export function AdminSidebar({
  groups = adminMenuGroups,
  activeHref,
  collapsed = true,
  onNavigate,
  onClose,
  className,
  brand = {
    name: "Afroscholars",
    tagline: "",
    href: "/admin/estatisticas",
    icon: GraduationCap,
  },
  footerLinks = [],
  footerExtra,
  helpCard,
  showHelpCard = true,
}: AdminSidebarProps) {
  return (
    <aside
      className={cn(
        "flex h-full w-72 shrink-0 flex-col border-r border-gray-200/80 bg-white/95 text-gray-900 backdrop-blur-xl dark:border-white/[0.06] dark:bg-[#0a0c0d]/95 dark:text-white",
        className,
      )}
    >
      <div
        className={cn(
          "flex h-16 shrink-0 items-center border-b border-gray-100 px-4 dark:border-white/[0.06]",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link to={brand.href} className="flex min-w-0 items-center gap-2.5 overflow-hidden">
          <div className="size-9 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/5 dark:ring-white/10">
            <img src={logo} alt="Afroscholars" className="h-full w-full object-cover" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-bold leading-tight text-gray-900 dark:text-white">
                {brand.name}
              </p>
              {brand.tagline && (
                <p className="truncate text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-zinc-600">
                  {brand.tagline}
                </p>
              )}
            </div>
          )}
        </Link>

        {onClose && (
          <button
            onClick={onClose}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white lg:hidden"
            aria-label="Fechar menu"
          >
            <X className="size-4" />
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5 [scrollbar-color:rgba(113,113,122,0.25)_transparent] [scrollbar-width:thin]">
        <nav className="space-y-6">
          {groups.map((group) => (
            <div key={group.label}>
              {!collapsed && (
                <p className="mb-2 px-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-gray-400 dark:text-zinc-600">
                  {group.label}
                </p>
              )}
              <div className="space-y-1">
                {group.items.map((item) => {
                  const isActive =
                    item.href === activeHref ||
                    (activeHref?.startsWith(`${item.href}/`) ?? false);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      onClick={onNavigate}
                      aria-current={isActive ? "page" : undefined}
                      title={
                        collapsed
                          ? item.description
                            ? `${item.label} — ${item.description}`
                            : item.label
                          : undefined
                      }
                      className={cn(
                        "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 transition-all duration-200",
                        collapsed && "justify-center",
                        isActive
                          ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/[0.12] dark:text-emerald-300"
                          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
                        item.disabled && "pointer-events-none opacity-40",
                      )}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full bg-emerald-500 dark:bg-emerald-400" />
                      )}

                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-xl transition-colors",
                          isActive
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400"
                            : "bg-gray-100 text-gray-500 group-hover:bg-gray-200/70 group-hover:text-gray-700 dark:bg-white/[0.05] dark:text-zinc-500 dark:group-hover:bg-white/[0.08] dark:group-hover:text-zinc-300",
                        )}
                      >
                        <Icon className="size-4" />
                      </span>

                      {!collapsed && (
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-[13px] font-semibold leading-tight">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span
                                className={cn(
                                  "shrink-0 rounded-full px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide",
                                  badgeTones[item.badgeTone ?? "emerald"],
                                )}
                              >
                                {item.badge}
                              </span>
                            )}
                          </span>
                          {item.description && (
                            <span
                              className={cn(
                                "mt-0.5 block truncate text-[10px] font-normal leading-tight",
                                isActive
                                  ? "text-emerald-600/70 dark:text-emerald-300/60"
                                  : "text-gray-400 dark:text-zinc-600",
                              )}
                            >
                              {item.description}
                            </span>
                          )}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {showHelpCard &&
          !collapsed &&
          (helpCard ?? (
            <div className="mt-6 overflow-hidden rounded-2xl border border-emerald-200/60 bg-gradient-to-br from-emerald-50 via-white to-white p-4 dark:border-emerald-500/15 dark:from-emerald-500/10 dark:via-transparent dark:to-transparent">
              <div className="flex items-center gap-2">
                <span className="grid size-7 place-items-center rounded-lg bg-emerald-100 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                  <LifeBuoy className="size-3.5" />
                </span>
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  Precisa de ajuda?
                </p>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-500 dark:text-zinc-500">
                Consulte o guia da plataforma ou fale com a equipa de suporte.
              </p>
              <Link
                to="/admin/atividades"
                className="mt-3 inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
              >
                Falar com suporte
                <ArrowUpRight className="size-3" />
              </Link>
            </div>
          ))}
      </div>

      {footerLinks.length > 0 && (
        <div className="space-y-1 border-t border-gray-100 p-3 dark:border-white/[0.06]">
          {footerLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.label}
                to={link.href}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-medium transition-colors",
                  collapsed && "justify-center",
                  link.tone === "danger"
                    ? "text-gray-500 hover:bg-rose-50 hover:text-rose-600 dark:text-zinc-400 dark:hover:bg-rose-500/10 dark:hover:text-rose-400"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-zinc-400 dark:hover:bg-white/[0.05] dark:hover:text-white",
                )}
                title={collapsed ? link.label : undefined}
              >
                <Icon className="size-[17px] shrink-0" />
                {!collapsed && <span>{link.label}</span>}
              </Link>
            );
          })}
          {!collapsed && footerExtra && <div className="mt-2">{footerExtra}</div>}
        </div>
      )}
    </aside>
  );
}

export default AdminSidebar;
