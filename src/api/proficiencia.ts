import { api } from "@/lib/axios";

export type IdiomaProficiencia =
  | "ingles" | "frances" | "espanhol" | "mandarim" | "japones"
  | "alemao" | "italiano" | "coreano" | "arabe" | "russo";

export type TipoIngles = "toefl" | "ielts" | "cambridge" | "geral";

export const proficienciaApi = {
  enviar: async (payload: {
    idioma?: IdiomaProficiencia;
    tipo?: TipoIngles;
    mensagem: string;
    historico?: { role: "user" | "assistant"; content: string }[];
    finalizar?: boolean;
  }) => {
    const { data } = await api.post<{ resposta: string; historico: { role: "user" | "assistant"; content: string }[] }>("/proficiencia", payload);
    return data;
  },
};
