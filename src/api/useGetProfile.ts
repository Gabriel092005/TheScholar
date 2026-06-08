import { useQuery, useQueryClient } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useNavigate } from "react-router-dom";
import { getProfile, getProfileDemo, User } from "./auth";

export function useUser() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const query = useQuery<User | null>({
    queryKey: ["user-profile"],
    queryFn: async () => {
      const token = Cookies.get("token");
      if (!token) return null;

      try {
        // Tenta buscar o perfil real
        return await getProfile();
      } catch (error) {
        try {
          // Se falhar (ex: token de demo), tenta o perfil demo
          return await getProfileDemo();
        } catch {
          // Se ambos falharem, o token é inválido
          Cookies.remove("token", { path: "/" });
          return null;
        }
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutos antes de considerar dados desactualizados
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: false, // Não tenta novamente se der erro de 401/invalid
  });

  const handleLogout = () => {
    Cookies.remove("token", { path: "/" });
    queryClient.setQueryData(["user-profile"], null); // Limpa o cache imediatamente
    navigate("/");
  };

  return {
    user: query.data,
    isLoading: query.isLoading,
    handleLogout,
  };
}
