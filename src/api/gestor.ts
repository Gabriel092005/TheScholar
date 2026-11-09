import { api } from "@/lib/axios";
import { headersAfiliado } from "@/lib/afiliado-ref";
import type { Bolsa } from "./bolsas";
import type { Curso } from "./cursos";
import type { MetodoPagamento, PagamentoMomenu } from "./pagamentos";

export interface GestorMetrics {
  bolsasTotal: number;
  bolsasPublicadas: number;
  bolsasRascunho: number;
  bolsasInativas: number;
  cursosTotal: number;
  cursosPublicados: number;
  cursosRascunho: number;
  inscricoesTotal: number;
  inscricoesPendentes: number;
  inscricoesAprovadas: number;
  inscricoesRejeitadas: number;
  inscricoesCanceladas: number;
  consultorias: number;
  mentorias: number;
  receitaInscricoes: number;
  pagamentosAprovados: number;
  pagamentosPendentes: number;
  receitaCursos: number;
  estudantes: number;
  documentosTotal: number;
  documentosPublicados: number;
  receitaDocumentos: number;
  receitaTotal: number;
}

export interface GestorDashboard {
  gestor: { nome: string; role: string };
  metrics: GestorMetrics;
  crescimentoMensal: { month: string; bolsas: number; cursos: number; inscricoes: number }[];
  ultimasBolsas: {
    id: string;
    titulo: string;
    status: string;
    pais?: string | null;
    prazo?: string | null;
    created_at: string;
    inscricoes: number;
  }[];
  ultimosCursos: {
    id: string;
    titulo: string;
    status: string;
    estudantes: number;
    preco: number;
    created_at: string;
    compras: number;
  }[];
  cursosPopulares: { id: string; titulo: string; estudantes: number; receita: number }[];
  cursosPorCategoria: { nome: string; total: number }[];
}

export interface MentoriaGestor {
  id: string;
  status: string;
  valorPago: number | null;
  dataAgendada: string | null;
  created_at: string;
  nome: string | null;
  email: string | null;
  telefone: string | null;
  usuario?: { id: string; nome: string; email: string } | null;
  bolsa: { id: string; titulo: string };
}

export interface FaturacaoItem {
  id: string;
  titulo: string;
  total: number;
  mes: number;
  pagamentos: number;
}

export interface FaturacaoGestor {
  total: number;
  mes: number;
  pagamentos: number;
  bolsas: FaturacaoItem[];
  cursos: FaturacaoItem[];
  documentos: FaturacaoItem[];
}

export type BolsaGestor = Bolsa & { _count?: { inscricoes: number }; faturado?: number };
export type CursoGestor = Curso & { _count?: { compras: number; pagamentos: number } };

export interface Documento {
  id: string;
  titulo: string;
  descricao?: string | null;
  categoria?: string | null;
  fileName?: string | null;
  fileType?: string | null;
  fileSize?: number | null;
  status: "RASCUNHO" | "PUBLICADO";
  preco: number;
  bolsaId?: string | null;
  bolsa?: { id: string; titulo: string } | null;
  criadoPorId: string;
  criadoPor?: { id: string; nome: string; email?: string };
  created_at: string;
  updated_at: string;
}

export type DocumentoGestor = Documento & {
  fileUrl: string;
  _count?: { compras: number };
};

export type DocumentoPublico = Documento & {
  linkExterno: string | null;
  temAcesso: boolean;
  pagamentoPendente: boolean;
};

interface Paginated<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export const gestorApi = {
  getDashboard: async () => {
    const { data } = await api.get<GestorDashboard>("/gestor/dashboard");
    return data;
  },

  getFaturacao: async () => {
    const { data } = await api.get<FaturacaoGestor>("/gestor/faturacao");
    return data;
  },

  listBolsas: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<Paginated<BolsaGestor>>("/gestor/bolsas", { params });
    return data;
  },

  listCursos: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<Paginated<CursoGestor>>("/gestor/cursos", { params });
    return data;
  },

  listMentorias: async () => {
    const { data } = await api.get<{ data: MentoriaGestor[]; quantidade: number; receita: number }>(
      "/gestor/mentorias"
    );
    return data;
  },

  listDocumentos: async (params?: { search?: string; status?: string; page?: number; limit?: number }) => {
    const { data } = await api.get<Paginated<DocumentoGestor>>("/gestor/documentos", { params });
    return data;
  },

  listDocumentosPublicos: async (params?: { search?: string; categoria?: string }) => {
    const { data } = await api.get<DocumentoPublico[]>("/documentos", { params });
    return data;
  },

  comprarDocumento: async (id: string, payload: { metodo: MetodoPagamento; phoneNumber?: string }) => {
    const { data } = await api.post<{ id: string; pagamento: PagamentoMomenu; message: string }>(
      `/documentos/${id}/comprar`,
      payload,
      { headers: headersAfiliado("DOCUMENTO", id) }
    );
    return data;
  },

  /** Passa pela API, que confere o acesso. O ficheiro não tem um link público. */
  abrirDocumento: async (documento: Pick<Documento, "id" | "titulo" | "fileName">) => {
    const { data } = await api.get<Blob>(`/documentos/${documento.id}/ficheiro`, { responseType: "blob" });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = documento.fileName || documento.titulo;
    link.click();
    URL.revokeObjectURL(url);
  },

  createDocumento: async (payload: FormData) => {
    const { data } = await api.post<{ id: string; titulo: string; message: string }>(
      "/gestor/documentos",
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  updateDocumento: async (id: string, payload: FormData) => {
    const { data } = await api.put<{ id: string; titulo: string; message: string }>(
      `/gestor/documentos/${id}`,
      payload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  },

  deleteDocumento: async (id: string) => {
    const { data } = await api.delete(`/gestor/documentos/${id}`);
    return data;
  },
};
