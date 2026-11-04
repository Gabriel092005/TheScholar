import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Star } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/**
 * Superfície base dos cards da área do utilizador. Inclui `group`, para que os
 * elementos internos possam reagir ao hover, e `relative` para o CardAccent.
 * O hover é feito em CSS porque o framer-motion escreve `transform` inline no
 * elemento que anima: por isso a entrada fica no Reveal, à volta do card.
 */
export const userCard =
  "group relative overflow-hidden rounded-2xl border border-gray-200/70 bg-white text-left " +
  "shadow-[0_1px_2px_rgba(16,24,40,0.05)] transition-all duration-300 ease-out " +
  "hover:-translate-y-1 hover:border-emerald-300/80 hover:shadow-[0_20px_40px_-22px_rgba(5,150,105,0.45)] " +
  "active:translate-y-0 active:scale-[0.99] motion-reduce:transform-none " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 " +
  "dark:border-white/[0.07] dark:bg-[#151518] dark:hover:border-emerald-500/40 " +
  "dark:hover:shadow-[0_20px_40px_-22px_rgba(16,185,129,0.5)] dark:focus-visible:ring-offset-[#111113]";

/** Ícone em destaque dentro de um card: acende e inclina no hover do card. */
export const iconTile =
  "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 " +
  "ring-1 ring-emerald-100 transition-all duration-300 group-hover:-rotate-3 group-hover:scale-110 " +
  "group-hover:bg-emerald-500 group-hover:text-white group-hover:ring-emerald-500 motion-reduce:transform-none " +
  "dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20";

/** Título do card, que muda de cor no hover. */
export const cardTitle =
  "font-semibold leading-snug tracking-tight text-gray-900 transition-colors duration-200 " +
  "group-hover:text-emerald-600 dark:text-white dark:group-hover:text-emerald-400";

/** Pequena seta circular de ação no rodapé dos cards. */
export const cardArrow =
  "flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-500 transition-all duration-300 " +
  "group-hover:translate-x-0.5 group-hover:bg-emerald-500 group-hover:text-white dark:bg-white/[0.06] dark:text-zinc-400";

/** Linha fina no topo do card que se desenha da esquerda para a direita no hover. */
export function CardAccent() {
  return (
    <span
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[2px] origin-left scale-x-0 bg-gradient-to-r from-emerald-400 to-teal-400 transition-transform duration-500 ease-out group-hover:scale-x-100 motion-reduce:transition-none"
    />
  );
}

/** Faz o conteúdo aparecer em fade-up quando entra no ecrã, com pequeno atraso por posição. */
export function Reveal({
  index = 0,
  className,
  children,
}: {
  index?: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      className={cn("h-full", className)}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Título de página da área do utilizador, sem banner. */
export function UserPageHeader({
  title,
  description,
  icon: Icon,
  action,
  className,
}: {
  title: string;
  description?: ReactNode;
  icon?: LucideIcon;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: EASE }}
      className={cn("mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between", className)}
    >
      <div className="flex min-w-0 items-center gap-4">
        {Icon && (
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:ring-emerald-500/20">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">{description}</p>
          )}
        </div>
      </div>
      {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
    </motion.header>
  );
}

/** Ponto pulsante para indicar conteúdo ao vivo. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} aria-hidden="true">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75 motion-reduce:animate-none" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
    </span>
  );
}

/** Avaliação de 0 a 5 em estrelas. */
export function RatingStars({ count }: { count: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`Avaliação: ${count} de 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={cn(
            "h-3.5 w-3.5",
            n <= count ? "fill-amber-400 text-amber-400" : "text-gray-200 dark:text-zinc-700",
          )}
        />
      ))}
    </span>
  );
}
