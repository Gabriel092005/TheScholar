import {
  LayoutDashboard,
  Settings,
  Award,
  GraduationCap,
  Users,
  MessageCircle,
  PanelLeftClose,
  PanelLeftOpen,
  History,
  CalendarDays,
  Shield,
  Newspaper,
  FileText,
  BookOpen,
  BookHeart,
  X,
  LogOut,
  Video,
  UserCheck,
  Globe,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ScrollArea } from './ui/scroll-area';
import { ModeToggle } from './theme/theme-toggle';
import { useUser } from '@/api/useGetProfile';
import { Button } from './ui/button';

const STORAGE_KEY = 'sidebar-expanded';

export function Sidebar({ mobileOpen, setMobileOpen }: { mobileOpen?: boolean; setMobileOpen?: (v: boolean) => void }) {
  const { user, handleLogout } = useUser();
  const location = useLocation();
  const isActive = (path: string) => location.pathname === path;

  const [expanded, setExpanded] = useState(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : false;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(expanded));
  }, [expanded]);

  const mainLinks = (isExpanded: boolean) => (
    <>
      <SidebarLink icon={<LayoutDashboard size={18} />} to="/" active={isActive('/')} label="Home" expanded={isExpanded} />
      <SidebarLink icon={<Award size={18} />} to="/bolsas" active={isActive('/bolsas')} label="Bolsas de Estudos" expanded={isExpanded} />
      <SidebarLink icon={<UserCheck size={18} />} to="/entrevista" active={location.pathname.startsWith('/entrevista')} label="Entrevista IA" expanded={isExpanded} />
      <SidebarLink icon={<Globe size={18} />} to="/proficiencia" active={isActive('/proficiencia')} label="Proficiência EN" expanded={isExpanded} />
      <SidebarLink icon={<GraduationCap size={18} />} to="/cursos" active={isActive('/cursos')} label="Preparação Pessoal" expanded={isExpanded} />
      <SidebarLink icon={<History size={18} />} to="/minhas-atividades" active={isActive('/minhas-atividades')} label="Minhas Atividades" expanded={isExpanded} />
      <SidebarLink icon={<CalendarDays size={18} />} to="/minhas-consultorias" active={isActive('/minhas-consultorias')} label="Agendamentos" expanded={isExpanded} />
      <SidebarLink icon={<Video size={18} />} to="/aulas" active={isActive('/aulas')} label="Aulas ao Vivo" expanded={isExpanded} />
    </>
  );

  const communityLinks = (isExpanded: boolean) => (
    <>
      <SidebarLink icon={<Users size={18} />} to="/comunidades" active={isActive('/comunidades')} label="Comunidades" expanded={isExpanded} />
      <SidebarLink icon={<BookHeart size={18} />} to="/historias" active={isActive('/historias')} label="Histórias" expanded={isExpanded} />
      <SidebarLink icon={<MessageCircle size={18} />} to="/depoimentos" active={isActive('/depoimentos')} label="Depoimentos" expanded={isExpanded} />
    </>
  );

  const toolsLinks = (isExpanded: boolean) => (
    <>
      <SidebarLink icon={<FileText size={18} />} to="/analise-documento" active={isActive('/analise-documento')} label="Análise de Documentos" expanded={isExpanded} />
      <SidebarLink icon={<BookOpen size={18} />} to="/perfil-academico" active={isActive('/perfil-academico')} label="Perfil Académico" expanded={isExpanded} />
      <SidebarLink icon={<Newspaper size={18} />} to="/novidades" active={isActive('/novidades')} label="Destaques" expanded={isExpanded} />
    </>
  );

  const SidebarGroup = ({ title, children, isExpanded }: { title: string; children: React.ReactNode; isExpanded: boolean }) => (
    <div className="mb-1">
      {isExpanded && (
        <p className="px-3 pt-4 pb-1.5 text-[10px] font-semibold uppercase tracking-widest text-gray-400 dark:text-zinc-500 select-none">
          {title}
        </p>
      )}
      {!isExpanded && <div className="mx-3 my-2 h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-white/[0.08] to-transparent" />}
      <div className="space-y-0.5">{children}</div>
    </div>
  );

  const sidebarContent = (isExpanded: boolean, isMobile: boolean) => (
    <div className="flex flex-col h-full">
      {/* Logo / Brand */}
      <div className={`h-14 flex items-center border-b border-gray-100/80 dark:border-white/[0.06] ${isExpanded ? 'px-4 gap-3' : 'justify-center px-2'}`}>
        <div className="relative shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 dark:shadow-emerald-500/10">
          <GraduationCap size={16} className="text-white" />
          <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 rounded-full border-2 border-white dark:border-[#111113]">
            <Sparkles size={7} className="absolute -top-[1px] -left-[1px] text-white" />
          </div>
        </div>
        {isExpanded && (
          <div className="flex flex-col overflow-hidden">
            <span className="text-sm font-bold text-gray-900 dark:text-white tracking-tight leading-none">Schoolar</span>
            <span className="text-[10px] text-gray-400 dark:text-zinc-500 font-medium">Sua jornada académica</span>
          </div>
        )}
      </div>

      {/* Nav */}
      <ScrollArea className="flex-1 py-2">
        <nav className={`space-y-0 ${isExpanded ? 'px-2' : 'px-1.5'}`}>
          <SidebarGroup title="Principal" children={mainLinks(isExpanded)} isExpanded={isExpanded} />
          <SidebarGroup title="Comunidade" children={communityLinks(isExpanded)} isExpanded={isExpanded} />
          <SidebarGroup title="Ferramentas" children={toolsLinks(isExpanded)} isExpanded={isExpanded} />
          {user?.role === "ADMIN" && (
            <SidebarGroup
              title="Administração"
              isExpanded={isExpanded}
              children={
                <SidebarLink
                  icon={<Shield size={18} className="text-amber-500 dark:text-amber-400" />}
                  to="/admin"
                  active={location.pathname.startsWith('/admin')}
                  label="Painel Admin"
                  expanded={isExpanded}
                  accentColor="amber"
                />
              }
            />
          )}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="border-t border-gray-100/80 dark:border-white/[0.06] p-2.5 space-y-1">
        <div className={`flex items-center ${isExpanded ? 'justify-between' : 'justify-center'}`}>
          <ModeToggle />
          {isExpanded ? (
            <Button
              onClick={() => { handleLogout?.(); if (isMobile) setMobileOpen?.(false); }}
              variant="ghost"
              size="sm"
              className="h-8 gap-1.5 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 text-xs font-medium rounded-lg transition-all"
            >
              <LogOut size={14} />
              <span>Sair</span>
            </Button>
          ) : (
            <Button
              onClick={() => { handleLogout?.(); if (isMobile) setMobileOpen?.(false); }}
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-gray-400 hover:text-red-500 dark:text-zinc-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
              title="Sair"
            >
              <LogOut size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen bg-gray-50/70 dark:bg-[#0e0e10] border-r border-gray-100 dark:border-white/[0.06] transition-all duration-300 ease-in-out ${expanded ? 'w-60' : 'w-[68px]'}`}>
        {sidebarContent(expanded, false)}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen?.(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-gray-50 dark:bg-[#0e0e10] border-r border-gray-100 dark:border-white/[0.06] flex flex-col shadow-2xl shadow-black/20">
            {sidebarContent(true, true)}
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarLink({ icon, to, active, label, expanded, accentColor = 'emerald' }: {
  icon: React.ReactNode;
  to: string;
  active: boolean;
  label: string;
  expanded: boolean;
  accentColor?: 'emerald' | 'amber';
}) {
  const colorClasses = {
    emerald: {
      active: 'bg-emerald-50 dark:bg-emerald-500/[0.08] text-emerald-600 dark:text-emerald-400 shadow-sm shadow-emerald-500/5',
      indicator: 'bg-emerald-500 dark:bg-emerald-400',
      hover: 'hover:bg-gray-100/80 dark:hover:bg-white/[0.05]',
    },
    amber: {
      active: 'bg-amber-50 dark:bg-amber-500/[0.08] text-amber-600 dark:text-amber-400 shadow-sm shadow-amber-500/5',
      indicator: 'bg-amber-500 dark:bg-amber-400',
      hover: 'hover:bg-gray-100/80 dark:hover:bg-white/[0.05]',
    },
  };

  const colors = colorClasses[accentColor];

  return (
    <Link
      to={to}
      title={!expanded ? label : undefined}
      className={`group relative flex items-center gap-2.5 rounded-xl text-[13px] font-medium transition-all duration-200 ${
        expanded ? 'px-3 py-2.5' : 'px-0 py-2.5 justify-center'
      } ${
        active
          ? colors.active
          : `text-gray-500 dark:text-zinc-400 ${colors.hover}`
      }`}
    >
      {/* Active indicator bar */}
      {active && (
        <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full ${colors.indicator}`} />
      )}

      <span className="shrink-0 transition-transform duration-200 group-hover:scale-105">{icon}</span>
      {expanded && <span className="truncate">{label}</span>}

      {/* Tooltip when collapsed */}
      {!expanded && (
        <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 whitespace-nowrap shadow-xl z-50 flex items-center gap-1.5">
          {label}
          <ChevronRight size={10} className="opacity-50" />
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-100 rotate-45 rounded-[1px]" />
        </div>
      )}
    </Link>
  );
}
