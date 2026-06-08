import { api } from "@/lib/axios";

export interface AnaliseDocumento {
  id: string;
  usuarioId: string;
  nome: string;
  email: string;
  telefone?: string;
  tipoDocumento: string;
  areaPretendida: string;
  observacao?: string;
  status: "PENDENTE" | "EM_ANALISE" | "CONCLUIDO" | "REJEITADO";
  feedback?: string;
  arquivoUrl?: string;
  created_at: string;
  updated_at: string;
  usuario?: { id: string; nome: string; email: string; image_path: string | null };
}

export const analiseDocumentoApi = {
  criar: async (payload: FormData) => {
    const { data } = await api.post<{ id: string; message: string }>("/analise-documento", payload, {
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
