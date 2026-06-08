import { api } from "@/lib/axios";

export async function getEmpresasMetrics() {
  const { data } = await api.get("/metrics/empresas");
  return data;
}