import { api } from "@/lib/axios";

export interface Usuario {
  id: string;
  nome: string;
  email: string;
  role: "ADMIN" | "GESTOR" | "USUARIO";
  estado_conta: "ACTIVA" | "INACTIVA";
  image_path: string | null;
  phone: string | null;
  created_at: string;
  last_active_at: string;
}

export interface ListUsuariosParams {
  search?: string;
  role?: string;
  estado?: string;
  page?: string;
  limit?: string;
}

export interface ListUsuariosResponse {
  data: Usuario[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const usuariosApi = {
  list: async (params?: ListUsuariosParams) => {
    const { data } = await api.get<ListUsuariosResponse>("/admin/usuarios", { params });
    return data;
  },

  alterarRole: async (userId: string, role: "ADMIN" | "GESTOR" | "USUARIO") => {
    const { data } = await api.patch<Usuario>(`/admin/usuarios/${userId}/role`, { role });
    return data;
  },

  suspender: async (userId: string) => {
    const { data } = await api.patch<Usuario>(`/usuarios/${userId}/status`);
    return data;
  },

  delete: async (userId: string) => {
    const { data } = await api.delete(`/admin/usuarios/${userId}`);
    return data;
  },
};
