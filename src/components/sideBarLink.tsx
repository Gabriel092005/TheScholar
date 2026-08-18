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

  const navLinks = (isExpanded: boolean) => (
    <>
      <SidebarLink icon={<LayoutDashboard size={18} />} to="/" active={isActive('/')} label="Home" expanded={isExpanded} />
      <SidebarLink icon={<Award size={18} />} to="/bolsas" active={isActive('/bolsas')} label="Bolsas de Estudos" expanded={isExpanded} />
      <SidebarLink icon={<UserCheck size={18} />} to="/entrevista" active={location.pathname.startsWith('/entrevista')} label="Entrevista IA" expanded={isExpanded} />
      <SidebarLink icon={<Globe size={18} />} to="/proficiencia" active={isActive('/proficiencia')} label="Proficiência EN" expanded={isExpanded} />
      <SidebarLink icon={<GraduationCap size={18} />} to="/cursos" active={isActive('/cursos')} label="Preparação Pessoal" expanded={isExpanded} />
      <SidebarLink icon={<History size={18} />} to="/minhas-atividades" active={isActive('/minhas-atividades')} label="Minhas Atividades" expanded={isExpanded} />
      <SidebarLink icon={<CalendarDays size={18} />} to="/minhas-consultorias" active={isActive('/minhas-consultorias')} label="Agendamentos" expanded={isExpanded} />
      <SidebarLink icon={<Video size={18} />} to="/aulas" active={isActive('/aulas')} label="Aulas ao Vivo" expanded={isExpanded} />
      <SidebarLink icon={<Users size={18} />} to="/comunidades" active={isActive('/comunidades')} label="Comunidades" expanded={isExpanded} />
      <SidebarLink icon={<BookHeart size={18} />} to="/historias" active={isActive('/historias')} label="Histórias" expanded={isExpanded} />
      <SidebarLink icon={<MessageCircle size={18} />} to="/depoimentos" active={isActive('/depoimentos')} label="Depoimentos" expanded={isExpanded} />
      <SidebarLink icon={<FileText size={18} />} to="/analise-documento" active={isActive('/analise-documento')} label="Análise de Documentos" expanded={isExpanded} />
      <SidebarLink icon={<BookOpen size={18} />} to="/perfil-academico" active={isActive('/perfil-academico')} label="Perfil Académico" expanded={isExpanded} />
      <SidebarLink icon={<Newspaper size={18} />} to="/novidades" active={isActive('/novidades')} label="Destaques" expanded={isExpanded} />
      <SidebarLink icon={<Settings size={18} />} to="/settings" active={isActive('/settings')} label="Configurações" expanded={isExpanded} />
      {user?.role === "ADMIN" && (
        <>
          <div className="h-px bg-gray-100 dark:bg-white/[0.06] my-2" />
          <SidebarLink icon={<Shield size={18} />} to="/admin" active={location.pathname.startsWith('/admin')} label="Painel Admin" expanded={isExpanded} />
        </>
      )}
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className={`hidden lg:flex flex-col h-screen bg-white dark:bg-[#111113] border-r border-gray-100 dark:border-white/[0.06] transition-all duration-300 ${expanded ? 'w-56' : 'w-16'}`}>
        <div className="h-14 flex items-center justify-center px-4 border-b border-gray-100 dark:border-white/[0.06]">
          <button onClick={() => setExpanded(!expanded)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors">
            {expanded ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
        </div>

        <ScrollArea className="flex-1">
          <nav className="p-3 space-y-1">
            {navLinks(expanded)}
          </nav>
        </ScrollArea>

        <div className="p-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <ModeToggle />
          <Button
            onClick={() => handleLogout?.()}
            variant="ghost"
            className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium"
          >
            <LogOut size={16} />
            {expanded && <span>Sair</span>}
          </Button>
        </div>
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/40" onClick={() => setMobileOpen?.(false)} />
          <aside className="fixed left-0 top-0 bottom-0 w-64 bg-white dark:bg-[#111113] border-r border-gray-100 dark:border-white/[0.06] flex flex-col">
            <div className="h-14 flex items-center justify-between px-4 border-b border-gray-100 dark:border-white/[0.06]">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
                <GraduationCap size={16} className="text-white" />
              </div>
              <button onClick={() => setMobileOpen?.(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300">
                <X size={18} />
              </button>
            </div>

            <ScrollArea className="flex-1">
              <nav className="p-3 space-y-1">
                {navLinks(true)}
              </nav>
            </ScrollArea>

            <div className="p-3 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <ModeToggle />
              <Button
                onClick={() => { handleLogout?.(); setMobileOpen?.(false); }}
                variant="ghost"
                className="flex items-center gap-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 text-sm font-medium"
              >
                <LogOut size={16} />
                Sair
              </Button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}

function SidebarLink({ icon, to, active, label, expanded }: {
  icon: React.ReactNode;
  to: string;
  active: boolean;
  label: string;
  expanded: boolean;
}) {
  return (
    <Link
      to={to}
      title={!expanded ? label : undefined}
      className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
        active
          ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
          : 'text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06]'
      }`}
    >
      <span className="shrink-0">{icon}</span>
      {expanded && <span>{label}</span>}
      {!expanded && (
        <div className="absolute left-16 px-2.5 py-1.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap shadow-lg z-50">
          {label}
          <div className="absolute left-0 top-1/2 -translate-x-1 -translate-y-1/2 w-1.5 h-1.5 bg-gray-900 dark:bg-gray-100 rotate-45" />
        </div>
      )}
    </Link>
  );
}
