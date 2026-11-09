import { useState, type ComponentType } from "react";
import { Link, useLocation } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { useUser } from "@/api/useGetProfile";
import { getUploadUrl } from "@/lib/axios";
import {
  Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle,
} from "@/components/ui/sheet";

export interface ItemBarra {
  label: string;
  labelCurta?: string;
  href: string;
  icon: ComponentType<{ size?: number | string; strokeWidth?: number | string }>;
}

const estiloAba = (ativo: boolean) =>
  `flex min-h-14 min-w-0 flex-col items-center justify-center gap-1 text-[10px] font-medium leading-none tracking-tight transition-colors active:opacity-70 ${
    ativo
      ? "text-emerald-700 dark:text-emerald-400"
      : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
  }`;

/** Navegação mobile, igual para utilizador, gestor e administrador. */
export function BarraInferior({
  ariaLabel,
  itens,
  mais,
}: {
  ariaLabel: string;
  /** Até quatro destinos fixos; o quinto lugar é o botão Mais. */
  itens: ItemBarra[];
  mais: ItemBarra[];
}) {
  const { user, handleLogout } = useUser();
  const { pathname } = useLocation();
  const [maisAberto, setMaisAberto] = useState(false);

  // O caminho mais longo vence: /admin/cursos/pagamentos não acende também /admin/cursos.
  const hrefAtivo = [...itens, ...mais]
    .map((item) => item.href)
    .filter((href) => pathname === href || (href !== "/" && pathname.startsWith(`${href}/`)))
    .sort((a, b) => b.length - a.length)[0];

  const maisAtivo = mais.some((item) => item.href === hrefAtivo);
  const iniciais = user?.nome?.substring(0, 2).toUpperCase() || "U";
  const avatar = user?.image_path ? getUploadUrl(`/uploads/${user.image_path}`) : "";

  return (
    <>
      <nav
        aria-label={ariaLabel}
        className="z-30 grid shrink-0 grid-cols-5 border-t border-zinc-200/70 bg-white pb-[env(safe-area-inset-bottom)] dark:border-white/[0.06] dark:bg-[#0d0d0f] lg:hidden"
      >
        {itens.map((item) => {
          const ativo = item.href === hrefAtivo;
          return (
            <Link key={item.href} to={item.href} aria-current={ativo ? "page" : undefined} className={estiloAba(ativo)}>
              <item.icon size={20} strokeWidth={ativo ? 2.25 : 1.75} />
              <span className="max-w-full truncate">{item.labelCurta ?? item.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={() => setMaisAberto(true)}
          aria-haspopup="dialog"
          aria-expanded={maisAberto}
          className={estiloAba(maisAtivo)}
        >
          <Menu size={20} strokeWidth={maisAtivo ? 2.25 : 1.75} />
          <span>Mais</span>
        </button>
      </nav>

      <Sheet open={maisAberto} onOpenChange={setMaisAberto}>
        <SheetContent
          side="bottom"
          className="flex max-h-[85dvh] flex-col rounded-t-2xl border-zinc-200/70 bg-white p-0 pb-[env(safe-area-inset-bottom)] text-zinc-900 dark:border-white/[0.06] dark:bg-[#0d0d0f] dark:text-zinc-100"
        >
          <SheetHeader className="flex-row items-center gap-3 space-y-0 border-b border-zinc-100 p-4 pr-12 text-left dark:border-white/[0.06]">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-400 text-xs font-bold text-emerald-950">
              {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : iniciais}
            </div>
            <div className="min-w-0 flex-1">
              <SheetTitle className="truncate text-sm font-semibold">{user?.nome}</SheetTitle>
              <SheetDescription className="truncate text-xs">{user?.email}</SheetDescription>
            </div>
          </SheetHeader>

          <div className="overflow-y-auto p-2">
            {mais.map((item) => {
              const ativo = item.href === hrefAtivo;
              return (
                <Link
                  key={item.href}
                  to={item.href}
                  onClick={() => setMaisAberto(false)}
                  aria-current={ativo ? "page" : undefined}
                  className={`flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                    ativo
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400"
                      : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-white/[0.06]"
                  }`}
                >
                  <item.icon size={18} />
                  {item.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setMaisAberto(false);
                handleLogout();
              }}
              className="flex min-h-12 w-full items-center gap-3 rounded-xl px-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-500/10 dark:text-red-400"
            >
              <LogOut size={18} />
              Terminar sessão
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
