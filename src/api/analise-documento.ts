import { api } from "@/lib/axios";
import type { PagamentoMomenu } from "./pagamentos";

export interface TipoAnalise {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  ativo: boolean;
}

export const tiposAnaliseApi = {
  disponiveis: () => api.get<TipoAnalise[]>("/analise-documento/tipos").then((r) => r.data),
  todos: () => api.get<TipoAnalise[]>("/admin/analise-documento/tipos").then((r) => r.data),
  criar: (payload: { nome: string; descricao?: string; preco: number }) =>
    api.post<TipoAnalise>("/admin/analise-documento/tipos", payload).then((r) => r.data),
  atualizar: (id: string, payload: Partial<Pick<TipoAnalise, "nome" | "preco" | "ativo">>) =>
    api.patch(`/admin/analise-documento/tipos/${id}`, payload).then((r) => r.data),
  apagar: (id: string) => api.delete(`/admin/analise-documento/tipos/${id}`).then((r) => r.data),
};

export interface AnaliseDocumento {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  telefone?: string;
  tipoDocumento: string;
  areaPretendida: string;
  observacao?: string;
  status: "AGUARDANDO_PAGAMENTO" | "CANCELADO" | "PENDENTE" | "EM_ANALISE" | "CONCLUIDO" | "REJEITADO";
  valor?: number | null;
  feedback?: string;
  arquivoUrl?: string;
  created_at: string;
  updated_at: string;
  usuario?: { id: string; nome: string; email: string; image_path: string | null };
}

export const analiseDocumentoApi = {
  criar: async (payload: FormData) => {
    const { data } = await api.post<{ id: string; message: string; pagamento?: PagamentoMomenu }>("/analise-documento", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  listarMinhas: async () => {
    const { data } = await api.get<AnaliseDocumento[]>("/analise-documento");
    return data;
  },

  listarTodas: async (status?: string) => {
    const { data } = await api.get<AnaliseDocumento[]>("/admin/analise-documento", {
      params: status ? { status } : {},
    });
    return data;
  },

  atualizarStatus: async (id: string, body: { status: string; feedback?: string }) => {
    const { data } = await api.patch<AnaliseDocumento>(`/admin/analise-documento/${id}`, body);
    return data;
  },
};
