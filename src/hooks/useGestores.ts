import { getGestores } from "@/api/gestores";
import { useQuery } from "@tanstack/react-query";

export function useGestores() {
  return useQuery({
    queryKey: ["gestores"],
    queryFn: getGestores,
    staleTime: 1000 * 60 * 5, 
  });
}