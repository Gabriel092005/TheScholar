import { api } from "@/lib/axios";

export interface Depoimento {
  id: string;
  nome: string;
  curso: string;
  texto: string;
  rating: number;
  imagem?: string;
  usuarioId?: string;
  status: "RASCUNHO" | "PUBLICADO";
  created_at: string;
  usuario?: { id: string; nome: string; email: string; image_path: string | null };
}

export const depoimentosApi = {
  list: async () => {
    const { data } = await api.get<Depoimento[]>("/depoimentos");
    return data;
  },
  create: async (body: { nome: string; curso: string; texto: string; rating: number }) => {
    const { data } = await api.post<{ message: string; depoimento: Depoimento }>("/depoimentos", body);
    return data;
  },
  delete: async (id: string) => {
    const { data } = await api.delete(`/admin/depoimentos/${id}`);
    return data;
  },
  listAll: async (status?: string) => {
    const { data } = await api.get<Depoimento[]>("/admin/depoimentos", {
      params: status ? { status } : {},
    });
    return data;
  },
  aprovar: async (id: string, status: "PUBLICADO" | "RASCUNHO") => {
    const { data } = await api.patch<Depoimento>(`/admin/depoimentos/${id}/aprovar`, { status });
    return data;
  },
};
