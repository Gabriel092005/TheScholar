import { api, getUploadUrl } from "@/lib/axios";

export interface Mentor {
  id: string;
  nome: string;
  imagem: string | null;
  pais: string | null;
  bio: string | null;
}

export const mentoresApi = {
  list: async () => {
    const { data } = await api.get<{ data: Mentor[] }>("/mentores");
    return data.data;
  },
};

export function urlDaImagemDoMentor(imagem: string | null): string | null {
  if (!imagem) return null;
  if (imagem.startsWith("http")) return imagem;
  return getUploadUrl(`/uploads/${imagem.replace(/^\/?(uploads\/)?/, "")}`);
}
