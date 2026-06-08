import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/axios';

export interface NotificacaoItem {
  id: string;
  titulo: string;
  conteudo: string;
  tipo: string;
  link?: string;
  visualizada: boolean;
  created_at: string;
}

export function useNotificacoes(usuarioId?: string) {
  return useQuery({
    queryKey: ['notificacoes', usuarioId],
    queryFn: () =>
      api.get<NotificacaoItem[]>('/notificacoes').then(r => r.data),
    enabled: !!usuarioId,
    refetchInterval: 30_000,
  });
}

export function useMarcarTodasLidas() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => api.patch('/notificacoes/marcar-todas-lidas'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}

export function useMarcarLida() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.patch(`/notificacoes/${id}/lida`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notificacoes'] }),
  });
}