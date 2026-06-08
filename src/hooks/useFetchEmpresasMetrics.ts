// src/hooks/useEmpresas.ts
import { getEmpresasMetrics } from '@/api/get-empresas-metrics';
import { useQuery } from '@tanstack/react-query';


export function useEmpresas() {
  return useQuery({
    queryKey: ['empresas-list-metrics'],
    queryFn: getEmpresasMetrics,
    staleTime: 1000 * 60 * 10, // Dados considerados "frescos" por 10 minutos
  });
}