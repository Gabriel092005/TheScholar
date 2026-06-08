import { api } from "@/lib/axios";

export type AulaOnlineStatus = "AGENDADA" | "AO_VIVO" | "FINALIZADA" | "CANCELADA";

export interface AulaOnline {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  duracao?: number | null;
  roomId: string;
  status: AulaOnlineStatus;
  gravacaoUrl?: string | null;
  hostId: string;
  bolsaId?: string | null;
  bolsa?: { id: string; titulo: string } | null;
  created_at: string;
  updated_at: string;
  host: { id: string; nome: string; image_path: string | null };
  _count: { participantes: number };
  jitsiToken?: string | null;
}

export interface AulaOnlineParticipante {
  id: string;
  joined_at: string;
  aulaId: string;
  usuarioId: string;
  usuario: { id: string; nome: string; email: string; image_path: string | null };
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const aulasApi = {
  list: async (params?: { page?: number; limit?: number }) => {
    const { data } = await api.get<PaginatedResponse<AulaOnline>>("/aulas", { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<AulaOnline>(`/aulas/${id}`);
    return data;
  },

  create: async (payload: { titulo: string; descricao?: string; data: string; duracao?: number; bolsaId?: string }) => {
    const { data } = await api.post<AulaOnline>("/aulas", payload);
    return data;
  },

  updateStatus: async (id: string, payload: { status?: AulaOnlineStatus; gravacaoUrl?: string | null }) => {
    const { data } = await api.patch<AulaOnline>(`/aulas/${id}/status`, payload);
    return data;
  },

  participar: async (id: string) => {
    const { data } = await api.post<{ message: string }>(`/aulas/${id}/participar`);
    return data;
  },

  listParticipantes: async (id: string) => {
    const { data } = await api.get<AulaOnlineParticipante[]>(`/aulas/${id}/participantes`);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete<{ message: string }>(`/aulas/${id}`);
    return data;
  },
};
