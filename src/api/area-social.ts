import { api } from "@/lib/axios";

export const PERMISSOES_SOCIAIS = [
  { chave: "documentos", nome: "Documentos", ajuda: "Documentos incluídos na mentoria das bolsas" },
  { chave: "cursos", nome: "Cursos", ajuda: "Cursos ligados às bolsas" },
  { chave: "comunidades", nome: "Comunidades", ajuda: "Entra nas comunidades das bolsas" },
  { chave: "aulas", nome: "Aulas ao vivo", ajuda: "Aulas das bolsas e das mentorias" },
  { chave: "ia", nome: "Inteligência artificial", ajuda: "Assistente IA, entrevista e proficiência" },
] as const;

export type PermissaoSocial = (typeof PERMISSOES_SOCIAIS)[number]["chave"];

export interface PermissoesSociais {
  todasBolsas: boolean;
  bolsaIds: string[];
  documentos: boolean;
  cursos: boolean;
  comunidades: boolean;
  aulas: boolean;
  ia: boolean;
  ativo: boolean;
  expiraEm: string | null;
  observacao: string | null;
}

export interface MembroSocial extends PermissoesSociais {
  id: string;
  usuarioId: string;
  created_at: string;
  usuario: { id: string; nome: string; email: string; image_path: string | null; role: string };
}

export const areaSocialApi = {
  listar: async () => (await api.get<MembroSocial[]>("/admin/area-social")).data,
  adicionar: async (dados: PermissoesSociais & { usuarioId: string }) =>
    (await api.post<MembroSocial>("/admin/area-social", dados)).data,
  atualizar: async (id: string, dados: PermissoesSociais) =>
    (await api.put<MembroSocial>(`/admin/area-social/${id}`, dados)).data,
  remover: async (id: string) => {
    await api.delete(`/admin/area-social/${id}`);
  },
};
