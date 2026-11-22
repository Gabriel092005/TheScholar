import { api } from "@/lib/axios";

export const TIPOS_PAGAMENTO_CUPOM = [
  { valor: "BOLSA", nome: "Bolsas (mentoria, inscrição, consultoria)" },
  { valor: "CURSO", nome: "Cursos" },
  { valor: "DOCUMENTO", nome: "Documentos" },
  { valor: "ANALISE", nome: "Análise de documentos" },
  { valor: "MENTORIA", nome: "Mentorias avulsas" },
] as const;

export type TipoPagamentoCupom = (typeof TIPOS_PAGAMENTO_CUPOM)[number]["valor"];
export type TipoDesconto = "PERCENTAGEM" | "VALOR_FIXO";

export interface DadosCupom {
  codigo: string;
  descricao: string | null;
  tipoDesconto: TipoDesconto;
  valor: number;
  tipos: TipoPagamentoCupom[];
  itemId: string | null;
  limiteUsos: number | null;
  limitePorUsuario: number;
  valorMinimo: number | null;
  validoDesde: string | null;
  validoAte: string | null;
  ativo: boolean;
}

export interface Cupom extends DadosCupom {
  id: string;
  usos: number;
  created_at: string;
  totalDescontado: number;
  totalFaturado: number;
}

export interface CupomAplicado {
  codigo: string;
  descricao: string | null;
  tipoDesconto: TipoDesconto;
  percentagem: number | null;
  valorOriginal: number;
  desconto: number;
  valorFinal: number;
}

export const cuponsApi = {
  /** Pré-visualização; o servidor volta a calcular o desconto ao cobrar. */
  validar: async (dados: { codigo: string; tipo: TipoPagamentoCupom; itemId: string; valor: number }) =>
    (await api.post<CupomAplicado>("/cupons/validar", dados)).data,
  listar: async () => (await api.get<Cupom[]>("/admin/cupons")).data,
  criar: async (dados: DadosCupom) => (await api.post<Cupom>("/admin/cupons", dados)).data,
  atualizar: async (id: string, dados: DadosCupom) => (await api.put<Cupom>(`/admin/cupons/${id}`, dados)).data,
  apagar: async (id: string) => {
    await api.delete(`/admin/cupons/${id}`);
  },
};
