import logo from "@/assets/logo-icone.png";
import { cn } from "@/lib/utils";

function Chip() {
  return (
    <svg viewBox="0 0 48 36" aria-hidden className="h-7 w-9 shrink-0 sm:h-8 sm:w-11">
      <defs>
        <linearGradient id="cartao-chip" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#f6dfa0" />
          <stop offset="0.5" stopColor="#d9ae55" />
          <stop offset="1" stopColor="#a97c2c" />
        </linearGradient>
      </defs>
      <rect x="0.5" y="0.5" width="47" height="35" rx="6" fill="url(#cartao-chip)" stroke="#8a6524" />
      <path
        d="M16 1v10c0 3-3 4-15 4M16 35V25c0-3-3-4-15-4M32 1v10c0 3 3 4 15 4M32 35V25c0-3 3-4 15-4M16 13h16v10H16z"
        fill="none"
        stroke="#8a6524"
        strokeWidth="1.2"
      />
    </svg>
  );
}

function SemContacto() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden className="size-6 shrink-0 text-white" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 9a7 7 0 0 1 0 6M10.5 6.5a12 12 0 0 1 0 11M15 4a17 17 0 0 1 0 16" />
    </svg>
  );
}

/** Tem proporção de cartão bancário, por isso é igual no admin e no gestor em qualquer largura. */
export function CartaoFaturacao({
  rotulo,
  valor,
  titular,
  valorMes,
  className,
}: {
  rotulo: string;
  valor: string;
  titular: string;
  valorMes?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative isolate flex aspect-[1.586/1] w-full max-w-md flex-col justify-between overflow-hidden rounded-2xl bg-gradient-to-br from-[#2b2b2d] via-[#19191b] to-[#0c0c0d] p-4 text-white shadow-xl shadow-black/30 ring-1 ring-white/10 sm:p-5",
        className,
      )}
    >
      {/* A faixa laranja fica só no canto superior: o texto assenta sempre no fundo escuro. */}
      <svg
        viewBox="0 0 400 252"
        preserveAspectRatio="none"
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 size-full"
      >
        <path d="M205 0C255 70 330 118 400 128V0Z" fill="#f58220" opacity="0.35" />
        <path d="M262 0C298 46 350 76 400 84V0Z" fill="#f58220" />
      </svg>

      <div className="flex items-center justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-white p-0.5">
            <img src={logo} alt="" className="size-full object-contain" />
          </span>
          <span className="font-marca truncate text-sm font-bold tracking-tight">Afroscholars</span>
        </div>
        <SemContacto />
      </div>

      <Chip />

      <div className="min-w-0">
        <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-zinc-400">{rotulo}</p>
        <p className="mt-0.5 whitespace-nowrap font-mono text-xl font-semibold tracking-wide tabular-nums [text-shadow:0_1px_1px_rgba(0,0,0,0.7)] sm:text-2xl">
          {valor}
        </p>
      </div>

      <div className="flex items-end justify-between gap-3">
        <p className="min-w-0 truncate text-[11px] font-medium uppercase tracking-[0.12em] text-zinc-200">
          {titular}
        </p>
        {valorMes !== undefined && (
          <div className="shrink-0 text-right">
            <p className="text-[8px] uppercase tracking-[0.14em] text-zinc-400">Este mês</p>
            <p className="whitespace-nowrap font-mono text-[11px] font-semibold tabular-nums">{valorMes}</p>
          </div>
        )}
      </div>
    </div>
  );
}
