import { api } from "@/lib/axios";
import type { TipoAfiliado } from "@/lib/afiliado-ref";

export type SaqueStatus = "PENDENTE" | "PAGO" | "REJEITADO";

export interface ProdutoAfiliado {
  tipo: TipoAfiliado;
  id: string;
  titulo: string;
  percentual: number;
  codigo: string | null;
  cliques: number;
}

export interface Saque {
  id: string;
  valor: number;
  iban: string;
  titular: string;
  status: SaqueStatus;
  observacao: string | null;
  created_at: string;
}

export interface ResumoAfiliado {
  saldo: { totalGanho: number; emSaque: number; sacado: number; disponivel: number };
  cliques: number;
  comissoes: {
    id: string;
    produto: string;
    valorVenda: number;
    percentual: number;
    valor: number;
    created_at: string;
  }[];
  saques: Saque[];
}

export interface PainelAfiliadosAdmin {
  percentualGlobal: number;
  saques: (Saque & { usuario: { nome: string; email: string } })[];
  produtos: { id: string; tipo: TipoAfiliado; titulo: string; comissaoAfiliado: number | null }[];
}

export const afiliadosApi = {
  abrirLink: (codigo: string) =>
    api
      .get<{ codigo: string; tipo: TipoAfiliado; itemId: string; destino: string }>(
        `/afiliados/r/${encodeURIComponent(codigo)}`
      )
      .then((r) => r.data),
  produtos: () => api.get<ProdutoAfiliado[]>("/afiliados/produtos").then((r) => r.data),
  resumo: () => api.get<ResumoAfiliado>("/afiliados/resumo").then((r) => r.data),
  gerarLink: (tipo: TipoAfiliado, itemId: string) =>
    api.post<{ codigo: string }>("/afiliados/links", { tipo, itemId }).then((r) => r.data),
  pedirSaque: (payload: { valor: number; iban: string; titular: string }) =>
    api.post<Saque>("/afiliados/saques", payload).then((r) => r.data),

  painelAdmin: () => api.get<PainelAfiliadosAdmin>("/admin/afiliados").then((r) => r.data),
  definirGlobal: (percentual: number) => api.put("/admin/afiliados/config", { percentual }).then((r) => r.data),
  definirProduto: (tipo: TipoAfiliado, id: string, percentual: number | null) =>
    api.patch(`/admin/afiliados/produtos/${tipo}/${id}`, { percentual }).then((r) => r.data),
  processarSaque: (id: string, status: "PAGO" | "REJEITADO", observacao?: string) =>
    api.patch(`/admin/afiliados/saques/${id}`, { status, observacao }).then((r) => r.data),
};

export const ROTULO_TIPO: Record<TipoAfiliado, string> = {
  BOLSA: "Bolsa: inscrição, consultoria e mentoria",
  DOCUMENTO: "E-book",
  CURSO: "Curso",
};

export const linkDeAfiliado = (codigo: string) => `${window.location.origin}/r/${codigo}`;
export const emKz = (valor: number) => `${valor.toLocaleString("pt-PT")} Kz`;
