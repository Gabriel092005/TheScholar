import { api } from "@/lib/axios";

export type IdiomaProficiencia =
  | "ingles" | "frances" | "espanhol" | "mandarim" | "japones"
  | "alemao" | "italiano" | "coreano" | "arabe" | "russo";

export type TipoIngles = "toefl" | "ielts" | "cambridge" | "geral";

export interface PerguntaQuiz {
  pergunta: string;
  opcoes: [string, string, string, string];
  correta: "A" | "B" | "C" | "D";
  categoria: "vocabulario" | "gramatica" | "compreensao" | "conjugacao" | "expressoes";
  explicacao: string;
}

export interface ResultadoQuiz {
  pontuacao: number;
  corretas: number;
  total: number;
  nivel: string;
  porCategoria: Record<string, { corretas: number; total: number }>;
  avaliacao: string;
  resultados: {
    perguntaIndex: number;
    pergunta: string;
    respostaUsuario: string;
    respostaCorreta: string;
    correto: boolean;
    explicacao: string;
    categoria: string;
  }[];
}

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

  gerarQuiz: async (payload: {
    idioma: IdiomaProficiencia;
    tipo?: TipoIngles;
  }) => {
    const { data } = await api.post<{ perguntas: PerguntaQuiz[] }>("/proficiencia/quiz", payload);
    return data;
  },

  submeterQuiz: async (payload: {
    idioma: IdiomaProficiencia;
    tipo?: TipoIngles;
    perguntas: PerguntaQuiz[];
    respostas: { perguntaIndex: number; resposta: "A" | "B" | "C" | "D" }[];
  }) => {
    const { data } = await api.post<ResultadoQuiz>("/proficiencia/quiz/submit", payload);
    return data;
  },
};
