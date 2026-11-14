import { api } from "@/lib/axios";

export const PUBLICOS_VIDEO = [
  { valor: "TODOS", nome: "Todos" },
  { valor: "USUARIO", nome: "Estudantes" },
  { valor: "MENTORANDO", nome: "Mentorandos" },
  { valor: "ATENDIMENTO", nome: "Atendentes" },
  { valor: "MONITOR", nome: "Monitores" },
  { valor: "GESTOR", nome: "Gestores" },
] as const;

export const LOCAIS_VIDEO = [
  { valor: "GERAL", nome: "Só em Como funciona" },
  { valor: "MENTORIA", nome: "Página da bolsa (serviços)" },
  { valor: "PAGAMENTOS", nome: "Ecrã de pagamento" },
  { valor: "CRM", nome: "CRM (atendimento)" },
] as const;

export type PublicoVideo = (typeof PUBLICOS_VIDEO)[number]["valor"];
export type LocalVideo = (typeof LOCAIS_VIDEO)[number]["valor"];

export interface VideoExplicativo {
  id: string;
  titulo: string;
  descricao: string | null;
  url: string;
  youtubeId: string | null;
  publico: PublicoVideo;
  local: LocalVideo;
  ordem: number;
  publicado: boolean;
  created_at: string;
}

export type DadosVideo = {
  titulo: string;
  descricao?: string | null;
  url: string;
  publico: PublicoVideo;
  local: LocalVideo;
  ordem: number;
  publicado: boolean;
  notificar?: boolean;
};

export const videosApi = {
  listar: async (local?: LocalVideo) =>
    (await api.get<VideoExplicativo[]>("/videos", { params: local ? { local } : {} })).data,
  admin: async () => (await api.get<VideoExplicativo[]>("/admin/videos")).data,
  criar: async (dados: DadosVideo) => (await api.post<VideoExplicativo>("/admin/videos", dados)).data,
  atualizar: async (id: string, dados: Partial<DadosVideo>) =>
    (await api.put<VideoExplicativo>(`/admin/videos/${id}`, dados)).data,
  apagar: async (id: string) => {
    await api.delete(`/admin/videos/${id}`);
  },
};

/** Mesmo critério do servidor: o id do vídeo num link do YouTube. */
export function idDoYoutube(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Vídeo carregado do computador (guardado no servidor em /uploads). */
export function eFicheiroLocal(url: string) {
  return /^\/uploads\/[\w.-]+\.(mp4|webm|mov|m4v)$/i.test(url);
}

/** Carrega um vídeo do computador (até 500 MB) e devolve a url a guardar no vídeo. */
export async function carregarVideo(ficheiro: File, onProgresso?: (percentagem: number) => void) {
  const form = new FormData();
  form.append("file", ficheiro);
  const { data } = await api.post<{ url: string }>("/admin/videos/upload", form, {
    timeout: 0,
    onUploadProgress: (e) => {
      if (e.total) onProgresso?.(Math.round((e.loaded / e.total) * 100));
    },
  });
  return data.url;
}
