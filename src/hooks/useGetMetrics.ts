import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/axios";

export function useUserMetrics() {
  return useQuery({
    queryKey: ["user-dashboard-metrics"],
    queryFn: async () => {
      const response = await api.get('/metrics');
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}