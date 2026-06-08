import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useDeleteEmpresa() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/empresas/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["empresas-list-metrics"] });
      alert("Empresa removida com sucesso!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.message || "Erro ao deletar");
    }
  });
}