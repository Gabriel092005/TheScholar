import { api } from "@/lib/axios";

export interface MapaGlobalItem {
  id: string;
  nome: string;
  curso: string;
  pais: string;
  bandeira: string;
  latitude: number;
  longitude: number;
  imagem: string | null;
  texto: string | null;
  ativo: boolean;
  createdAt: string;
}

export const mapaGlobalApi = {
  list: async () => {
    const { data } = await api.get<{ data: MapaGlobalItem[] }>("/mapa-global");
    return data.data;
  },
  create: async (body: {
    nome: string;
    curso: string;
    pais: string;
    bandeira?: string;
    latitude: number;
    longitude: number;
    imagem?: string;
    texto?: string;
  }) => {
    const { data } = await api.post<{ data: MapaGlobalItem }>("/mapa-global", body);
    return data.data;
  },
  delete: async (id: string) => {
    await api.delete(`/mapa-global/${id}`);
  },
};
