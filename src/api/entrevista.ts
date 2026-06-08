import { api } from "@/lib/axios";

export const entrevistaApi = {
  enviar: async (payload: {
    bolsaId: string;
    mensagem: string;
    historico?: { role: "user" | "assistant"; content: string }[];
    finalizar?: boolean;
    perfilAcademico?: Record<string, string | undefined>;
  }) => {
    const { data } = await api.post<{ resposta: string; historico: { role: "user" | "assistant"; content: string }[] }>("/entrevista", payload);
    return data;
  },
};
