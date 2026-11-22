import { api } from "@/lib/axios";

export type MetodoPagamento = "momenu-mcx" | "reference";

export interface PagamentoMomenu {
  id: string;
  transactionId?: string | null;
  /** "cupom": pago a 100% com cupão, sem MoMenu. */
  metodo: MetodoPagamento | "cupom";
  status: "PENDENTE" | "PAGO" | "FALHADO";
  valor: number;
  referenceNumber?: string | null;
  entity?: string | null;
  dueDate?: string | null;
  invoiceUrl?: string | null;
  falhaMotivo?: string | null;
  valorOriginal?: number | null;
  desconto?: number | null;
}

export const pagamentosApi = {
  estado: async (id: string) => {
    const { data } = await api.get<PagamentoMomenu>(`/pagamentos/momenu/${encodeURIComponent(id)}`);
    return data;
  },
};

/** Pago pela MoMenu: confirma-se sozinho. Só o que veio do sistema antigo precisa de um administrador. */
export const cobrancaMomenu = (metodo?: string | null) =>
  metodo === "momenu-mcx" || metodo === "reference";
