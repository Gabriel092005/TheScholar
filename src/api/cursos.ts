import { api } from "@/lib/axios";

export interface Curso {
  id: string;
  titulo: string;
  subtitulo?: string;
  categoria: string;
  nivel?: string;
  duracao?: string;
  quantAulas: number;
  estudantes: number;
  rating: number;
  preco: number;
  precoOriginal?: number;
  idioma?: string;
  tags: string[];
  descricao?: string;
  capaUrl?: string;
  status: "RASCUNHO" | "PUBLICADO";
  mentorNome?: string;
  mentorAvatar?: string;
  created_at: string;
  updated_at: string;
  aulas?: Aula[];
}

export interface Aula {
  id: string;
  titulo: string;
  tipo: "VIDEO" | "PDF" | "QUIZ";
  duracao?: string;
  ordem: number;
  gratuito: boolean;
  videoUrl?: string;
  videoLocal?: string;
  pdfUrl?: string;
  created_at: string;
}

export interface CursoPagamento {
  id: string;
  cursoId: string;
  usuarioId: string;
  valor: number;
  metodo?: string;
  referencia?: string;
  status: "PENDENTE" | "APROVADO" | "REJEITADO" | "CANCELADO";
  comprovativo?: string;
  observacoes?: string;
  created_at: string;
  updated_at: string;
  curso?: Curso;
  usuario?: {
    id: string;
    nome: string;
    email: string;
    image_path?: string;
  };
}

export const cursosApi = {
  list: async (params?: { search?: string; categoria?: string; nivel?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ data: Curso[]; meta: any }>("/cursos", { params });
    return data;
  },

  get: async (id: string) => {
    const { data } = await api.get<Curso>(`/cursos/${id}`);
    return data;
  },

  create: async (payload: Partial<Curso>) => {
    const { data } = await api.post<{ id: string; titulo: string }>("/cursos", payload);
    return data;
  },

  update: async (id: string, payload: Partial<Curso>) => {
    const { data } = await api.put<{ id: string; titulo: string }>(`/cursos/${id}`, payload);
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/cursos/${id}`);
    return data;
  },

  addAula: async (cursoId: string, payload: { titulo: string; tipo?: "VIDEO" | "PDF" | "QUIZ"; duracao?: string; gratuito?: boolean; videoUrl?: string; pdfUrl?: string; videoLocal?: string }) => {
    const { data } = await api.post<{ id: string; titulo: string; message: string }>(`/cursos/${cursoId}/aulas`, payload);
    return data;
  },

  removeAula: async (cursoId: string, aulaId: string) => {
    const { data } = await api.delete(`/cursos/${cursoId}/aulas/${aulaId}`);
    return data;
  },

  publish: async (id: string) => {
    const { data } = await api.post(`/cursos/${id}/publicar`);
    return data;
  },

  aderir: async (id: string, payload?: { metodo?: string; referencia?: string; comprovativo?: string }) => {
    const { data } = await api.post<{ id: string; status: string; message: string }>(`/cursos/${id}/aderir`, payload);
    return data;
  },

  listMeusCursos: async () => {
    const { data } = await api.get<Curso[]>("/cursos/comprados");
    return data;
  },

  listMeusPagamentos: async () => {
    const { data } = await api.get<CursoPagamento[]>("/meus-pagamentos");
    return data;
  },

  listPagamentos: async (params?: { status?: string; cursoId?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<{ data: CursoPagamento[]; meta: any }>("/cursos/pagamentos", { params });
    return data;
  },

  getPagamento: async (id: string) => {
    const { data } = await api.get<CursoPagamento>(`/cursos/pagamentos/${id}`);
    return data;
  },

  avaliarPagamento: async (id: string, payload: { status: "APROVADO" | "REJEITADO" | "CANCELADO"; observacoes?: string }) => {
    const { data } = await api.put(`/cursos/pagamentos/${id}/avaliar`, payload);
    return data;
  },

  deletePagamento: async (id: string) => {
    const { data } = await api.delete(`/admin/pagamentos/${id}`);
    return data;
  },
};