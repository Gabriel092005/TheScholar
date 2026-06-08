import { api } from "@/lib/axios";

export interface Gestor {
  id: number;
  nome: string;
  email: string;
  status: "ATIVO" | "INATIVO";
}

export async function getGestores(): Promise<Gestor[]> {
  const { data } = await api.get<Gestor[]>("/gestores");
  return data;
}