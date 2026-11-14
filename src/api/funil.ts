import { api } from "@/lib/axios";

export type Gatilho =
  | "PAGAMENTO_ABANDONADO"
  | "MENTORIA_A_EXPIRAR"
  | "MENTORIA_EXPIRADA"
  | "BOAS_VINDAS"
  | "PRAZO_BOLSA"
  | "REATIVACAO";

export interface ResumoFunil {
  ativo: boolean;
  emailConfigurado: boolean;
  horario: string;
  enviados30Dias: Partial<Record<Gatilho, number>>;
  cancelados: number;
  ultimoEnvio: string | null;
}

export interface ResultadoFunil {
  planeados: number;
  enviados: number;
  falhados: number;
  porGatilho: Partial<Record<Gatilho, number>>;
  simulacao: boolean;
}

export const funilApi = {
  resumo: async () => (await api.get<ResumoFunil>("/admin/funil/resumo")).data,
  simular: async () => (await api.post<ResultadoFunil>("/admin/funil/simular")).data,
  executar: async () => (await api.post<ResultadoFunil>("/admin/funil/executar")).data,
};
