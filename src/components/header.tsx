import { Button } from "@/components/ui/button";
import logo from '@/assets/logo.jpeg'
import { Link, useLocation } from "react-router-dom";
import {
  Menu, X, Award, Home, Sun, Moon, GraduationCap, LogOut, ChevronDown, Users, MessageCircle, Shield, BookHeart,
} from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { useUser } from "@/api/useGetProfile";
import { api, getUploadUrl } from "@/lib/axios";
import { NotificationBell } from "@/components/notification-bell";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetClose,
} from "@/components/ui/sheet";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

const navItems = [
  { label: "Home",        href: "/",           icon: Home },
  { label: "Comunidades", href: "/comunidades", icon: Users },
  { label: "Bolsas de Estudos",      href: "/bolsas",     icon: Award },
  { label: "Preparação Pessoal",      href: "/cursos",     icon: GraduationCap },
  { label: "Histórias",   href: "/historias",   icon: BookHeart },
  { label: "Depoimentos", href: "/depoimentos", icon: MessageCircle },
];

export function Header({ sidebarOpen, setSidebarOpen }: { sidebarOpen?: boolean; setSidebarOpen?: (v: boolean) => void }) {
  const { theme, setTheme } = useTheme();
  const isDark = theme === "dark";
  const location = useLocation();

  const { user, isLoading, handleLogout } = useUser();

  const userInitials = user?.nome?.substring(0, 2).toUpperCase() || "U";
  const userColor = COLORS[(user?.nome?.length ?? 0) % COLORS.length] || "bg-emerald-500";
  const userAvatarSrc = getUploadUrl(user?.image_path ? `/uploads/${user.image_path}` : "");

  const toggleTheme = () => {
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <>
      <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white dark:border-white/[0.06] dark:bg-[#111113] shadow-sm transition-colors duration-300">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gray-900 dark:bg-white/10 transition-colors group-hover:bg-gray-700 dark:group-hover:bg-white/20 overflow-hidden">
              <img src={logo} alt="Logo" className="h-full w-full object-cover" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white transition-colors">
              Afroscholars
            </span>
          </Link>

          {/* Desktop Nav - Menu Separado */}
          <div className="hidden md:flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center text-gray-400 dark:text-zinc-500 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors outline-none border-none cursor-pointer p-1">
                  <Menu className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-48 mt-2 p-2 rounded-xl border border-gray-100 dark:border-white/[0.06] dark:bg-[#111113]">
                {navItems.map(({ label, href, icon: Icon }) => {
                  const isActive = location.pathname === href;
                  return (
                    <DropdownMenuItem key={label} asChild>
                      <Link
                        to={href}
                        className={`flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer font-medium transition-colors ${
                          isActive
                            ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                            : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
                {user?.role === "ADMIN" && (
                  <>
                    <div className="h-px bg-gray-100 dark:bg-white/[0.06] my-1" />
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      >
                        <Shield className="h-4 w-4" />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] bg-transparent text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] hover:text-gray-900 dark:hover:text-white transition-all duration-200"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {user && <NotificationBell userId={user.id} />}

            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-lg cursor-pointer outline-none border-none bg-transparent hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors group">
                    <div className="flex flex-col items-end text-right">
                      <span className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-emerald-600 transition-colors leading-tight">
                        {user.nome}
                      </span>
                      <span className="text-[10px] text-gray-500 dark:text-zinc-500 leading-tight">
                        {user.email}
                      </span>
                    </div>
                    <Avatar className="w-9 h-9 border-2 border-gray-200 dark:border-gray-700 group-hover:border-emerald-500 transition-all">
                      <AvatarImage src={userAvatarSrc} className="object-cover" />
                      <AvatarFallback className={`${userColor} text-white text-[10px] font-bold`}>
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400 dark:text-zinc-500" />
                  </button>
                </DropdownMenuTrigger>

                <DropdownMenuContent align="end" className="w-72 mt-2 p-2 rounded-xl border border-gray-100 dark:border-white/[0.06] dark:bg-[#111113]">
                  <DropdownMenuLabel className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 mb-2">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10 border-2 border-white dark:border-gray-700">
                        <AvatarImage src={userAvatarSrc} className="object-cover" />
                        <AvatarFallback className={`${userColor} text-white text-xs font-bold`}>
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col overflow-hidden">
                        <p className="text-sm font-medium dark:text-white truncate">{user.nome}</p>
                        <p className="text-[11px] text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                  </DropdownMenuLabel>

                  {user?.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link
                        to="/admin"
                        className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                      >
                        <Shield size={16} />
                        Painel Admin
                      </Link>
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="my-2" />

                  <DropdownMenuItem
                    onClick={() => { handleLogout(); }}
                    className="flex items-center gap-3 p-2.5 text-sm rounded-lg cursor-pointer text-red-600 font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                  >
                    <LogOut size={16} />
                    Terminar sessão
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : isLoading ? (
              <div className="flex items-center gap-3">
                <div className="w-20 h-4 bg-gray-100 dark:bg-white/[0.06] animate-pulse rounded" />
                <div className="w-9 h-9 bg-gray-100 dark:bg-white/[0.06] animate-pulse rounded-full" />
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/sign-in">
                  <Button variant="ghost" className="text-sm font-medium text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white">
                    Login
                  </Button>
                </Link>
                <Link to="/cursos">
                  <Button className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg">
                    Ver Cursos
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile: dark toggle + hamburger */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="Toggle dark mode"
              className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-all"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              className="flex items-center justify-center h-9 w-9 rounded-lg border border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-zinc-400 hover:bg-gray-50 dark:hover:bg-white/[0.06] transition-colors"
              onClick={() => setSidebarOpen?.(!sidebarOpen)}
              aria-label="Toggle menu"
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      <Sheet open={sidebarOpen} onOpenChange={(open) => setSidebarOpen?.(open)}>
        <SheetContent side="left" className="w-72 p-0 bg-white dark:bg-[#111113]">
          <SheetHeader className="px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
            <SheetTitle className="text-left text-base font-semibold">Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col p-3 gap-0.5">
            {navItems.map(({ label, href, icon: Icon }) => {
              const isActive = location.pathname === href;
              return (
                <SheetClose asChild key={label}>
                  <Link
                    to={href}
                    className={`flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg font-medium transition-colors ${
                      isActive
                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                        : "text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Link>
                </SheetClose>
              );
            })}
            {user?.role === "ADMIN" && (
              <>
                <div className="h-px bg-gray-100 dark:bg-white/[0.06] my-1" />
                <SheetClose asChild>
                  <Link
                    to="/admin"
                    className="flex items-center gap-3 px-3 py-2.5 text-sm rounded-lg font-medium text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                  >
                    <Shield className="h-4 w-4" />
                    Painel Admin
                  </Link>
                </SheetClose>
              </>
            )}
          </nav>
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100 dark:border-white/[0.06]">
            {user ? (
              <button
                onClick={() => { setSidebarOpen?.(false); handleLogout(); }}
                className="flex items-center gap-3 w-full px-3 py-2.5 text-sm rounded-lg font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="h-4 w-4" />
                Terminar sessão
              </button>
            ) : (
              <SheetClose asChild>
                <Link
                  to="/sign-in"
                  className="flex items-center justify-center w-full h-10 rounded-xl bg-emerald-500 text-white text-sm font-bold hover:bg-emerald-600 transition-colors"
                >
                  Login
                </Link>
              </SheetClose>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
