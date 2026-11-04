import { api } from "@/lib/axios";

export interface Gestor {
  id: string;
  nome: string;
  email: string;
  estado_conta: "ACTIVA" | "INACTIVA";
  image_path?: string | null;
  last_active_at?: string | null;
  created_at: string;
  paisMentoria?: string | null;
  _count: { novidades: number; bolsasCriadas: number; cursosCriados: number };
}

export interface GestoresMetrics {
  total: number;
  activos: number;
  suspensos: number;
}

export interface GestoresResponse {
  gestores: Gestor[];
  metrics: GestoresMetrics;
}

export async function getGestores(): Promise<Gestor[]> {
  const { data } = await api.get<Gestor[]>("/gestores");
  return data;
}

export async function getGestoresMetrics(): Promise<GestoresResponse> {
  const { data } = await api.get<GestoresResponse>("/gestores/metrics");
  return data;
}
