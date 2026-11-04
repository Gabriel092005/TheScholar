import { useState, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Plus, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";

export const surface =
  "rounded-2xl border border-zinc-200/70 bg-white dark:border-white/[0.06] dark:bg-[#141416]";

export const softText = "text-zinc-500 dark:text-zinc-400";
export const faintText = "text-zinc-400 dark:text-zinc-500";

export const primaryButton =
  "rounded-full bg-emerald-400 font-semibold text-emerald-950 transition-colors hover:bg-emerald-300 disabled:opacity-50";

export const inputClass =
  "h-10 rounded-xl border-zinc-200/80 bg-white text-sm placeholder:text-zinc-400 dark:border-white/[0.08] dark:bg-white/[0.03]";

export const selectClass =
  "h-10 rounded-full border-zinc-200/80 bg-white text-sm dark:border-white/[0.08] dark:bg-[#141416]";

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow && (
          <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-emerald-600 dark:text-emerald-400">
            {eyebrow}
          </p>
        )}
        <h1 className="mt-1 text-[22px] font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          {title}
        </h1>
        {description && <p className={`mt-1 text-sm ${softText}`}>{description}</p>}
      </div>
      {action && <div className="flex shrink-0 items-center gap-2">{action}</div>}
    </div>
  );
}

export function SectionCard({
  title,
  description,
  action,
  children,
  className = "",
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`${surface} ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
          <div>
            {title && (
              <h3 className="text-sm font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                {title}
              </h3>
            )}
            {description && <p className={`mt-0.5 text-xs ${faintText}`}>{description}</p>}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  highlight = false,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  highlight?: boolean;
}) {
  return (
    <div className={`${surface} p-5`}>
      <div className="flex items-center justify-between">
        <p className={`text-[11px] font-medium uppercase tracking-[0.14em] ${faintText}`}>
          {label}
        </p>
        <div
          className={
            highlight
              ? "flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
              : "flex h-8 w-8 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-white/[0.05] dark:text-zinc-400"
          }
        >
          <Icon size={14} />
        </div>
      </div>
      <p className="mt-3 text-[26px] font-semibold leading-none tracking-tight text-zinc-900 dark:text-zinc-50">
        {value}
      </p>
      {hint && <p className={`mt-2 text-[11px] ${faintText}`}>{hint}</p>}
    </div>
  );
}

const statusStyles: Record<string, string> = {
  PUBLICADA: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  PUBLICADO: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  RASCUNHO: "border-zinc-400/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  INATIVA: "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400",
  AGENDADA: "border-blue-500/20 bg-blue-500/10 text-blue-600 dark:text-blue-400",
  AO_VIVO: "border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  FINALIZADA: "border-zinc-400/20 bg-zinc-500/10 text-zinc-500 dark:text-zinc-400",
  CANCELADA: "border-red-500/20 bg-red-500/10 text-red-500 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  PUBLICADA: "Publicada",
  PUBLICADO: "Publicado",
  RASCUNHO: "Rascunho",
  INATIVA: "Inativa",
  AGENDADA: "Agendada",
  AO_VIVO: "Ao vivo",
  FINALIZADA: "Finalizada",
  CANCELADA: "Cancelada",
};

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[10px] font-medium tracking-wide ${
        statusStyles[status] ?? statusStyles.RASCUNHO
      }`}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-400 dark:bg-white/[0.05] dark:text-zinc-500">
        <Icon size={20} />
      </div>
      <p className="mt-4 text-sm font-medium text-zinc-700 dark:text-zinc-300">{title}</p>
      {description && <p className={`mt-1 max-w-xs text-xs ${faintText}`}>{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-10 rounded-full border-zinc-200 bg-zinc-50/70 pl-9 text-sm dark:border-white/[0.06] dark:bg-white/[0.04]"
      />
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
        {label}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  placeholder = "Escreva e prima Enter",
}: {
  value: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  const hasTag = (tags: string[], tag: string) =>
    tags.some((t) => t.toLowerCase() === tag.toLowerCase());

  const addTags = (raw: string) => {
    const next = [...value];
    for (const part of raw.split(",")) {
      const tag = part.trim();
      if (tag && !hasTag(next, tag)) next.push(tag);
    }
    if (next.length !== value.length) onChange(next);
  };

  // Uma vírgula (escrita ou colada) fecha a tag; o que vier depois continua no rascunho.
  const handleChange = (text: string) => {
    const lastComma = text.lastIndexOf(",");
    if (lastComma === -1) {
      setDraft(text);
      return;
    }
    addTags(text.slice(0, lastComma));
    setDraft(text.slice(lastComma + 1).trimStart());
  };

  const commitDraft = () => {
    addTags(draft);
    setDraft("");
  };

  const available = suggestions.filter((s) => !hasTag(value, s));

  return (
    <div className="space-y-2">
      <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-xl border border-zinc-200/80 bg-white px-2 py-1.5 transition-colors focus-within:border-emerald-400 dark:border-white/[0.08] dark:bg-white/[0.03]">
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 py-0.5 pl-2.5 pr-1 text-xs font-medium text-emerald-800 dark:text-emerald-300"
          >
            {tag}
            <button
              type="button"
              aria-label={`Remover ${tag}`}
              onClick={() => onChange(value.filter((t) => t !== tag))}
              className="rounded-full p-0.5 transition-colors hover:bg-emerald-400/25"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          aria-label="Adicionar tag"
          value={draft}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitDraft();
            } else if (e.key === "Backspace" && !draft && value.length > 0) {
              onChange(value.slice(0, -1));
            }
          }}
          placeholder={value.length === 0 ? placeholder : "Adicionar tag"}
          className="h-6 min-w-[120px] flex-1 bg-transparent px-1 text-sm outline-none placeholder:text-zinc-400"
        />
      </div>
      {available.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {available.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => addTags(tag)}
              className="inline-flex items-center gap-1 rounded-full border border-zinc-200/80 px-2.5 py-0.5 text-xs text-zinc-500 transition-colors hover:border-emerald-400 hover:text-emerald-700 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:text-emerald-300"
            >
              <Plus size={11} />
              {tag}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className={`${surface} flex flex-col gap-3 p-3 sm:flex-row sm:items-center`}>
      {children}
    </div>
  );
}

export function IconAction({
  onClick,
  icon: Icon,
  label,
  danger = false,
  disabled = false,
}: {
  onClick: () => void;
  icon: LucideIcon;
  label: string;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`flex h-8 w-8 items-center justify-center rounded-full transition-colors disabled:opacity-40 ${
        danger
          ? "text-zinc-400 hover:bg-red-500/10 hover:text-red-500"
          : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-white/[0.06] dark:hover:text-zinc-200"
      }`}
    >
      <Icon size={15} />
    </button>
  );
}
