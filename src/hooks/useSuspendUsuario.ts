import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";
import { toast } from "sonner"; // ou a biblioteca que você usa

export function useSuspendUsuario() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await api.patch(`/usuarios/${id}/status`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["gestores-metrics"] });
      // Mensagem dinâmica baseada no novo estado
      const acao = data.estado_conta === 'ACTIVA' ? 'activada' : 'suspensa';
      toast.success(`Conta ${acao} com sucesso!`);
    },
    onError: () => {
      toast.error("Erro ao alterar estado da conta.");
    }
  });
}