import { api } from "@/lib/axios";

export interface Notification {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  link?: string | null;
  entidade?: string | null;
  entidadeId?: string | null;
  visualizada: boolean;
  created_at: string;
  usuarioId: string;
}

export async function getNotifications(): Promise<Notification[]> {
  const { data } = await api.get<Notification[]>("/notificacoes");
  return data;
}

export async function markAsRead(id: string): Promise<void> {
  await api.patch(`/notificacoes/${id}/lida`);
}

export async function markAllAsRead(): Promise<void> {
  await api.patch("/notificacoes/marcar-todas-lidas");
}
