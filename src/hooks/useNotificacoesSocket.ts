import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { socket, connectSocket } from '@/lib/socket'; // Certifique-se de importar o connectSocket
import { toast } from 'sonner';



export function useNotificacoesSocket(usuarioId?: string) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!usuarioId) return;

    // 1. Força a conexão (ajuda se o autoConnect estiver false)
    connectSocket();

    const handleNovaNotificacao = (notificacao: any) => {
      if (import.meta.env.DEV) {
        console.log("🔔 [SOCKET] Notificação recebida:", notificacao); // Esse log deve aparecer!
      }
      
      qc.invalidateQueries({ queryKey: ['notificacoes', usuarioId] });
      
      toast.success(notificacao.titulo, {
        description: notificacao.conteudo,
      });
    };

    // ESCUTE O EVENTO CERTO: 'nova_notificacao'
    socket.on('nova_notificacao', handleNovaNotificacao);

    // Logs de debug para ver se pelo menos conecta
    socket.on('connect', () => { if (import.meta.env.DEV) console.log("🔌 [SOCKET] Conectado com ID:", socket.id); });
    socket.on('connect_error', (err) => { if (import.meta.env.DEV) console.error("❌ [SOCKET] Erro na conexão:", err.message); });

    return () => {
      // LIMPE O EVENTO CERTO
      socket.off('nova_notificacao', handleNovaNotificacao);
      socket.off('connect');
      socket.off('connect_error');
    };
  }, [usuarioId, qc]);
}