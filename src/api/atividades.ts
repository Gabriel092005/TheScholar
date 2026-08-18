import { api } from "@/lib/axios";

export interface Atividade {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  duracaoMinutos?: number | null;
  local?: string | null;
  tipo?: string;
  criadoPor?: { id: string; nome: string } | null;
  createdAt: string;
  updatedAt: string;
}

export const atividadesApi = {
  list: async () => {
    const { data } = await api.get<{ data: Atividade[] }>("/atividades");
    return data.data ?? [];
  },

  create: async (payload: {
    titulo: string;
    descricao?: string;
    data: string;
    duracaoMinutos?: number;
    local?: string;
    tipo?: string;
  }) => {
    const { data } = await api.post<{ data: Atividade }>("/atividades", payload);
    return data.data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<{ ok: boolean }>(`/atividades/${id}`);
    return data;
  },
};
