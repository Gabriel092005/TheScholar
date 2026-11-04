import { api } from "@/lib/axios";
import type { MetodoPagamento, PagamentoMomenu } from "./pagamentos";

export interface Mentoria {
  id: string;
  nome: string;
  descricao?: string | null;
  preco: number;
  created_at: string;
  updated_at: string;
  bolsaId?: string | null;
  bolsa?: { id: string; titulo: string } | null;
  _count: { aulas: number; inscricoes: number };
  inscrito: string | null;
  /** Até quando dura o acesso, se a mentoria estiver ativa. */
  expiraEm: string | null;
}

export const mentoriasApi = {
  list: (params?: { bolsaId?: string }) => api.get<{ data: Mentoria[] }>("/mentorias", { params }).then((r) => r.data.data),
  create: (data: { nome: string; descricao?: string; bolsaId?: string }) => api.post("/mentorias", data).then((r) => r.data),
  inscrever: (id: string, payload?: { metodoPagamento?: MetodoPagamento; phoneNumber?: string }) =>
    api.post<{ id: string; status: string; pagamento?: PagamentoMomenu }>(`/mentorias/${id}/inscrever`, payload).then((r) => r.data),
  delete: (id: string) => api.delete(`/admin/mentorias/${id}`).then((r) => r.data),
  deleteInscricao: (id: string) => api.delete(`/admin/mentorias-inscricoes/${id}`).then((r) => r.data),
};
