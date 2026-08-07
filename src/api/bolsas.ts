import { api } from "@/lib/axios";

export interface Bolsa {
  id: string;
  titulo: string;
  subtitulo?: string;
  categoria: string;
  instituicao?: string;
  pais?: string;
  nivel?: string;
  requisitos?: string;
  valor: number;
  moeda: string;
  precoOriginal?: number;
  precoInscricao?: number;
  precoConsultoria?: number;
  precoMentoria?: number;
  idioma?: string;
  tags: string[];
  descricao?: string;
  imagemUrl?: string;
  linkAplicar?: string;
  status: "RASCUNHO" | "PUBLICADA" | "INATIVA";
  modalidade?: string;
  datasImportantes?: Record<string, string>;
  prazo?: string;
  numeroVagas?: number;
  imagemBg?: string;
  created_at: string;
  updated_at: string;
}

export interface BolsaInscricao {
  id: string;
  bolsaId: string;
  usuarioId: string;
  tipoInteresse?: "CONSULTORIA" | "MENTORIA" | "INSCRICAO";
  status: "PENDENTE" | "APROVADA" | "REJEITADA" | "CANCELADA";
  observacoes?: string;
  nome?: string;
  email?: string;
  telefone?: string;
  documentoUrl?: string;
  certificadoUrl?: string;
  historicoUrl?: string;
  biUrl?: string;
  metodoPagamento?: string;
  referenciaPagamento?: string;
  comprovativoUrl?: string;
  dataAgendada?: string;
  duracaoMinutos?: number;
  created_at: string;
  updated_at: string;
  bolsa?: Bolsa;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    phone?: string;
    image_path?: string;
  };
}

export interface ConsultoriaSlot {
  data: string;
  horarios: string[];
}

export const bolsasApi = {
  destaques: async () => {
    const { data } = await api.get<{ data: Bolsa[] }>("/bolsas/destaques");
    return data.data;
  },

  list: async (params?: { search?: string; categoria?: string; nivel?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ data: Bolsa[]; meta: any }>("/bolsas", { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Bolsa>(`/bolsas/${id}`);
    return data;
  },

  create: async (payload: Partial<Bolsa> | FormData) => {
    const isFormData = payload instanceof FormData;
    const { data } = await api.post<{ id: string; titulo: string }>("/bolsas", payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  },

  update: async (id: string, payload: Partial<Bolsa> | FormData) => {
    const isFormData = payload instanceof FormData;
    const { data } = await api.put<{ id: string; titulo: string }>(`/bolsas/${id}`, payload, {
      headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
    });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/bolsas/${id}`);
    return data;
  },

  inscribir: async (id: string, payload: FormData) => {
    const { data } = await api.post<{ id: string; message: string }>(`/bolsas/${id}/inscrever`, payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },

  consultoriaSlots: async (id: string) => {
    const { data } = await api.get<{ dias: ConsultoriaSlot[] }>(`/bolsas/${id}/consultoria/slots`);
    return data.dias;
  },

  listMinhasInscricoes: async (params?: { status?: string }) => {
    const { data } = await api.get<BolsaInscricao[]>("/inscricoes", { params });
    return data;
  },

  getInscricao: async (id: string) => {
    const { data } = await api.get<BolsaInscricao>(`/inscricoes/${id}`);
    return data;
  },

  cancelarInscricao: async (id: string) => {
    const { data } = await api.put(`/inscricoes/${id}/cancelar`);
    return data;
  },

  avaliarInscricao: async (id: string, payload: { status: "APROVADA" | "REJEITADA"; observacoes?: string }) => {
    const { data } = await api.put(`/inscricoes/${id}/avaliar`, payload);
    return data;
  },

  deleteInscricao: async (id: string) => {
    const { data } = await api.delete(`/admin/inscricoes/${id}`);
    return data;
  },

  listInscricoesAdmin: async (params?: { bolsaId?: string; status?: string; tipoInteresse?: "CONSULTORIA" | "MENTORIA" | "INSCRICAO" }) => {
    const { data } = await api.get<BolsaInscricao[]>("/admin/inscricoes", { params });
    return data;
  },

  chat: async (payload: {
    bolsaId?: string;
    mensagem: string;
    historico?: { role: "user" | "assistant"; content: string }[];
    perfilAcademico?: {
      nivelEnsino: string;
      instituicao?: string;
      curso?: string;
      anoConclusao?: string;
      media?: string;
      pais?: string;
      provincia?: string;
      municipio?: string;
      idiomas?: string;
      dataNascimento?: string;
      motivacoes?: string;
      experienciaProfissional?: string;
    };
  }) => {
    const { data } = await api.post<{ resposta: string; historico: { role: "user" | "assistant"; content: string }[] }>("/bolsas/chat", payload);
    return data;
  },
};