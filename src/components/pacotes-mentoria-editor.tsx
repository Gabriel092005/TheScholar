import { Plus, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import type { PacoteMentoriaForm } from "@/lib/pacotes-mentoria";

export function PacotesMentoriaEditor({
  precoBase,
  pacotes,
  onChange,
}: {
  precoBase: string;
  pacotes: PacoteMentoriaForm[];
  onChange: (pacotes: PacoteMentoriaForm[]) => void;
}) {
  const base = Number(precoBase);
  const atualizar = (indice: number, alteracao: Partial<PacoteMentoriaForm>) =>
    onChange(pacotes.map((p, i) => (i === indice ? { ...p, ...alteracao } : p)));

  return (
    <div className="space-y-2 rounded-xl border border-gray-200 p-3 dark:border-white/[0.08]">
      <div>
        <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Pacotes de mentoria</p>
        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
          O preço de Mentoria vale 1 mês. Exemplo: 3 meses com multiplicador 2,5 custam 2,5 vezes esse preço.
        </p>
      </div>

      {pacotes.map((pacote, i) => {
        const preenchido = base > 0 && Number(pacote.multiplicador) > 0;
        return (
          <div key={i} className="flex flex-wrap items-center gap-2">
            <Input
              type="number"
              min="2"
              max="36"
              step="1"
              aria-label={`Meses do pacote ${i + 1}`}
              placeholder="Meses"
              value={pacote.meses}
              onChange={(e) => atualizar(i, { meses: e.target.value })}
              className="w-24 rounded-xl"
            />
            <span className="text-sm text-gray-500 dark:text-zinc-400">×</span>
            <Input
              type="number"
              min="1.01"
              max="36"
              step="0.01"
              aria-label={`Multiplicador do pacote ${i + 1}`}
              placeholder="2.5"
              value={pacote.multiplicador}
              onChange={(e) => atualizar(i, { multiplicador: e.target.value })}
              className="w-24 rounded-xl"
            />
            <span className="min-w-24 flex-1 text-sm font-semibold text-gray-900 dark:text-white">
              {preenchido ? `${Math.round(base * Number(pacote.multiplicador)).toLocaleString("pt-PT")} Kz` : "—"}
            </span>
            <button
              type="button"
              aria-label={`Remover pacote ${i + 1}`}
              onClick={() => onChange(pacotes.filter((_, j) => j !== i))}
              className="grid h-9 w-9 place-items-center rounded-lg text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10"
            >
              <Trash2 size={15} />
            </button>
          </div>
        );
      })}

      <button
        type="button"
        onClick={() => onChange([...pacotes, { meses: "", multiplicador: "" }])}
        disabled={pacotes.length >= 6}
        className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 hover:underline disabled:opacity-50 dark:text-emerald-400"
      >
        <Plus size={14} />
        Adicionar pacote
      </button>
    </div>
  );
}
