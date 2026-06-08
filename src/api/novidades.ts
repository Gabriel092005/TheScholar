import { api } from "@/lib/axios";

export interface Novidade {
  id: string;
  title: string;
  introduction: string;
  sobre: string;
  description: string;
  image_path?: string;
  image_url?: string;
  destaque: boolean;
  status: string;
  temInscricao: boolean;
  usuarioId: string;
  created_at: string;
  updated_at: string;
  usuario?: { nome: string };
  anexos?: Anexo[];
  _count?: { anexos: number; inscricoes?: number };
}

export interface Anexo {
  id: string;
  novidadeId: string;
  file: string;
  type: string;
  created_at: string;
}

export interface NovidadeInscricao {
  id: string;
  novidadeId: string;
  usuarioId: string;
  nome: string;
  email: string;
  telefone?: string;
  observacao?: string;
  metodoPagamento?: string;
  referenciaPagamento?: string;
  comprovativoUrl?: string;
  valorPago?: number;
  status: string;
  created_at: string;
  updated_at: string;
}

export const novidadesApi = {
  list: async (params?: { destaque?: boolean; status?: string }) => {
    const { data } = await api.get<Novidade[]>("/novidades", { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Novidade>(`/novidades/${id}`);
    return data;
  },

  create: async (payload: FormData) => {
    const { data } = await api.post<Novidade>("/novidades", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  update: async (id: string, payload: FormData) => {
    const { data } = await api.put<Novidade>(`/novidades/${id}`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/novidades/${id}`);
    return data;
  },

  inscrever: async (id: string, payload: FormData) => {
    const { data } = await api.post(`/novidades/${id}/inscrever`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
