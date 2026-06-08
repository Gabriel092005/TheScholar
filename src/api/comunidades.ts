import { api } from "@/lib/axios";

export type MensagemTipo = "TEXT" | "IMAGE" | "AUDIO" | "VIDEO" | "DOCUMENT";

export interface Community {
  id: string;
  nome: string;
  descricao?: string | null;
  imagem?: string | null;
  capa?: string | null;
  created_at: string;
  criadorId: string;
  criador: { id: string; nome: string; image_path: string | null };
  bolsaId?: string | null;
  bolsa?: { id: string; titulo: string } | null;
  _count: { membros: number; mensagens: number };
  souMembro: boolean;
  solicitacaoPendente: boolean;
  meuPapel: "ADMIN" | "MEMBER" | null;
}

export interface CommunityMember {
  id: string;
  role: "ADMIN" | "MEMBER";
  status: "PENDENTE" | "APROVADO" | "REJEITADO";
  joined_at: string;
  comunidadeId: string;
  usuarioId: string;
  usuario: { id: string; nome: string; email: string; image_path: string | null };
}

export interface CommunityMessage {
  id: string;
  content: string;
  tipo: MensagemTipo;
  anexoUrl?: string | null;
  created_at: string;
  updated_at: string;
  comunidadeId: string;
  usuarioId: string;
  usuario: { id: string; nome: string; image_path: string | null };
}

export async function editarComunidade(id: string, payload: { nome?: string; descricao?: string | null; imagem?: string | null; capa?: string | null; bolsaId?: string | null }): Promise<Community> {
  const { data } = await api.put<Community>(`/comunidades/${id}`, payload);
  return data;
}

export async function listarComunidades(): Promise<Community[]> {
  const { data } = await api.get<Community[]>("/comunidades");
  return data;
}

export async function buscarComunidade(id: string): Promise<Community> {
  const { data } = await api.get<Community>(`/comunidades/${id}`);
  return data;
}

export async function criarComunidade(payload: { nome: string; descricao?: string; imagem?: string; bolsaId?: string }): Promise<Community> {
  const { data } = await api.post<Community>("/comunidades", payload);
  return data;
}

export async function entrarComunidade(id: string): Promise<void> {
  await api.post(`/comunidades/${id}/entrar`);
}

export async function sairComunidade(id: string): Promise<void> {
  await api.post(`/comunidades/${id}/sair`);
}

export async function listarMensagens(comunidadeId: string): Promise<CommunityMessage[]> {
  const { data } = await api.get<CommunityMessage[]>(`/comunidades/${comunidadeId}/mensagens`);
  return data;
}

async function uploadFile(file: File): Promise<string> {
  const formData = new FormData();
  formData.append("file", file);
  const { data } = await api.post<{ url: string; path: string }>("/upload", formData);
  return data.url;
}

export interface UserSearchResult {
  id: string;
  nome: string;
  email: string;
  image_path: string | null;
}

export async function searchUsuarios(query: string): Promise<UserSearchResult[]> {
  const { data } = await api.get<UserSearchResult[]>("/usuarios/search", { params: { q: query } });
  return data;
}

export async function convidarUsuario(comunidadeId: string, usuarioId: string): Promise<void> {
  await api.post(`/comunidades/${comunidadeId}/convidar`, { usuarioId });
}

export async function listarMembros(comunidadeId: string): Promise<CommunityMember[]> {
  const { data } = await api.get<CommunityMember[]>(`/comunidades/${comunidadeId}/membros`);
  return data;
}

export async function listarSolicitacoes(comunidadeId: string): Promise<CommunityMember[]> {
  const { data } = await api.get<CommunityMember[]>(`/comunidades/${comunidadeId}/solicitacoes`);
  return data;
}

export async function responderSolicitacao(comunidadeId: string, membroId: string, acao: "APROVAR" | "REJEITAR"): Promise<void> {
  await api.put(`/comunidades/${comunidadeId}/solicitacoes/${membroId}`, { acao });
}

export interface CommunityQuestion {
  id: string;
  titulo: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
  comunidadeId: string;
  usuarioId: string;
  usuario: { id: string; nome: string; image_path: string | null };
  respostas: CommunityAnswer[];
}

export interface CommunityAnswer {
  id: string;
  conteudo: string;
  created_at: string;
  updated_at: string;
  duvidaId: string;
  usuarioId: string;
  usuario: { id: string; nome: string; image_path: string | null };
}

export async function listarDuvidas(comunidadeId: string): Promise<CommunityQuestion[]> {
  const { data } = await api.get<CommunityQuestion[]>(`/comunidades/${comunidadeId}/duvidas`);
  return data;
}

export async function criarDuvida(comunidadeId: string, titulo: string, conteudo: string): Promise<CommunityQuestion> {
  const { data } = await api.post<CommunityQuestion>(`/comunidades/${comunidadeId}/duvidas`, { titulo, conteudo });
  return data;
}

export async function removerDuvida(comunidadeId: string, duvidaId: string): Promise<void> {
  await api.delete(`/comunidades/${comunidadeId}/duvidas/${duvidaId}`);
}

export async function criarResposta(comunidadeId: string, duvidaId: string, conteudo: string): Promise<CommunityAnswer> {
  const { data } = await api.post<CommunityAnswer>(`/comunidades/${comunidadeId}/duvidas/${duvidaId}/respostas`, { conteudo });
  return data;
}

export async function removerResposta(comunidadeId: string, duvidaId: string, respostaId: string): Promise<void> {
  await api.delete(`/comunidades/${comunidadeId}/duvidas/${duvidaId}/respostas/${respostaId}`);
}

export async function removerMembro(comunidadeId: string, membroId: string): Promise<void> {
  await api.delete(`/comunidades/${comunidadeId}/membros/${membroId}`);
}

export async function removerMensagem(comunidadeId: string, mensagemId: string): Promise<void> {
  await api.delete(`/comunidades/${comunidadeId}/mensagens/${mensagemId}`);
}

export async function enviarMensagem(
  comunidadeId: string,
  content: string,
  tipo?: MensagemTipo,
  file?: File | null
): Promise<CommunityMessage> {
  let anexoUrl: string | undefined;

  if (file) {
    anexoUrl = await uploadFile(file);
    tipo = tipo || "DOCUMENT";
  }

  const { data } = await api.post<CommunityMessage>(`/comunidades/${comunidadeId}/mensagens`, {
    content,
    tipo: tipo || "TEXT",
    anexoUrl,
  });
  return data;
}
