import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ExpressIcon, MulticaixaIcon } from "@/components/payment-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { pagamentosApi, type MetodoPagamento, type PagamentoMomenu } from "@/api/pagamentos";

const INTERVALO_ESTADO_MS = 5000;

/** Aceita "+244 923 456 789" e devolve "923456789". */
export function normalizarTelefone(valor: string): string {
  return valor.replace(/\D/g, "").replace(/^244(?=9\d{8}$)/, "");
}

export function telefoneValido(valor: string): boolean {
  return /^9\d{8}$/.test(normalizarTelefone(valor));
}

function formatarValor(valor: number): string {
  return `${valor.toLocaleString("pt-PT")} Kz`;
}

const METODOS: { value: MetodoPagamento; label: string; icon: React.ElementType; ajuda: string }[] = [
  {
    value: "momenu-mcx",
    label: "Multicaixa Express",
    icon: ExpressIcon,
    ajuda: "Vai receber um pedido de pagamento na app Multicaixa Express.",
  },
  {
    value: "reference",
    label: "Referência",
    icon: MulticaixaIcon,
    ajuda: "Vamos gerar uma entidade e referência para pagar no ATM ou no homebanking.",
  },
];

export function SeletorPagamento({
  metodo,
  onMetodo,
  telefone,
  onTelefone,
}: {
  metodo: MetodoPagamento;
  onMetodo: (metodo: MetodoPagamento) => void;
  telefone: string;
  onTelefone: (telefone: string) => void;
}) {
  const atual = METODOS.find((m) => m.value === metodo);

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        {METODOS.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            type="button"
            aria-pressed={metodo === value}
            onClick={() => onMetodo(value)}
            className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
              metodo === value
                ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-500/50"
            }`}
          >
            <Icon className={`w-[34px] h-[34px] shrink-0 ${metodo === value ? "scale-105" : "opacity-80"}`} />
            <span
              className={`text-[11px] font-bold text-center ${
                metodo === value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"
              }`}
            >
              {label}
            </span>
          </button>
        ))}
      </div>

      <p className="text-xs text-gray-500 dark:text-zinc-400">{atual?.ajuda}</p>

      {metodo === "momenu-mcx" && (
        <div className="space-y-1.5">
          <Label htmlFor="telefone-pagamento" className="text-xs text-gray-600 dark:text-zinc-400">
            Telefone do Multicaixa Express *
          </Label>
          <Input
            id="telefone-pagamento"
            type="tel"
            inputMode="numeric"
            value={telefone}
            onChange={(e) => onTelefone(e.target.value)}
            placeholder="923 456 789"
            className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04]"
          />
        </div>
      )}
    </div>
  );
}

function LinhaCopiavel({ label, valor }: { label: string; valor: string }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(valor);
      toast.success(`${label} copiada`);
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="text-[11px] text-gray-500 dark:text-zinc-400">{label}</p>
        <p className="text-lg font-bold tracking-wide text-gray-900 dark:text-white break-all">{valor}</p>
      </div>
      <button
        type="button"
        onClick={copiar}
        aria-label={`Copiar ${label}`}
        className="p-2 rounded-lg text-gray-400 hover:text-emerald-600 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
      >
        <Copy size={15} />
      </button>
    </div>
  );
}

export function EstadoPagamento({
  pagamento: inicial,
  onConfirmado,
  onFechar,
}: {
  pagamento: PagamentoMomenu;
  onConfirmado: () => void;
  onFechar: (status: PagamentoMomenu["status"]) => void;
}) {
  const { data } = useQuery({
    queryKey: ["pagamento-momenu", inicial.id],
    queryFn: () => pagamentosApi.estado(inicial.id),
    initialData: inicial,
    refetchInterval: (query) =>
      query.state.data?.status === "PENDENTE" ? INTERVALO_ESTADO_MS : false,
  });

  const pagamento = data ?? inicial;

  const notificado = useRef(false);
  useEffect(() => {
    if (pagamento.status === "PAGO" && !notificado.current) {
      notificado.current = true;
      onConfirmado();
    }
  }, [pagamento.status, onConfirmado]);

  if (pagamento.status === "PAGO") {
    return (
      <div className="text-center py-4" role="status">
        <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
        <p className="font-bold text-gray-900 dark:text-white">Pagamento confirmado</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">{formatarValor(pagamento.valor)}</p>
        {pagamento.invoiceUrl && (
          <a
            href={pagamento.invoiceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:underline mt-3"
          >
            Ver fatura
          </a>
        )}
        <Button onClick={() => onFechar(pagamento.status)} className="mt-5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
          Continuar
        </Button>
      </div>
    );
  }

  if (pagamento.status === "FALHADO") {
    return (
      <div className="text-center py-4" role="alert">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-3" />
        <p className="font-bold text-gray-900 dark:text-white">O pagamento não foi concluído</p>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          {pagamento.falhaMotivo || "Falhou ou expirou. Pode tentar novamente."}
        </p>
        <Button onClick={() => onFechar(pagamento.status)} variant="outline" className="mt-5 rounded-xl dark:text-white">
          Tentar novamente
        </Button>
      </div>
    );
  }

  if (pagamento.metodo === "reference") {
    return (
      <div className="space-y-4">
        <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-[55dvh]">
        <div className="space-y-4 pr-3">
        <div className="rounded-2xl border border-gray-100 dark:border-white/[0.08] px-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {pagamento.entity && <LinhaCopiavel label="Entidade" valor={pagamento.entity} />}
          {pagamento.referenceNumber && <LinhaCopiavel label="Referência" valor={pagamento.referenceNumber} />}
          <div className="py-2.5">
            <p className="text-[11px] text-gray-500 dark:text-zinc-400">Valor</p>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{formatarValor(pagamento.valor)}</p>
          </div>
          {pagamento.dueDate && (
            <div className="py-2.5">
              <p className="text-[11px] text-gray-500 dark:text-zinc-400">Pagar até</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(pagamento.dueDate).toLocaleDateString("pt-PT")}
              </p>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-gray-50 dark:bg-white/[0.03] px-4 py-3">
          <p className="text-xs font-semibold text-gray-900 dark:text-white mb-1.5">Como pagar</p>
          <ol className="list-decimal list-inside space-y-1 text-xs text-gray-600 dark:text-zinc-400">
            <li>No ATM ou no homebanking, escolha Pagamentos e depois Pagamento por Referência.</li>
            <li>Introduza a entidade, a referência e o valor exato.</li>
            <li>Confirme: o acesso é libertado automaticamente quando o pagamento for recebido.</li>
          </ol>
        </div>
        <p className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-400" role="status">
          <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" />
          À espera do pagamento. Também guardámos estes dados nas suas notificações.
        </p>
        </div>
        </ScrollArea>
        <Button onClick={() => onFechar(pagamento.status)} variant="outline" className="w-full rounded-xl dark:text-white">
          Pago mais tarde
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-4" role="status">
      <Loader2 className="h-10 w-10 animate-spin text-emerald-500 mx-auto mb-3" />
      <p className="font-bold text-gray-900 dark:text-white">Confirme o pagamento no telemóvel</p>
      <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
        Abra a app Multicaixa Express e autorize {formatarValor(pagamento.valor)}.
      </p>
      <Button onClick={() => onFechar(pagamento.status)} variant="outline" className="mt-5 rounded-xl dark:text-white">
        Fechar
      </Button>
    </div>
  );
}
