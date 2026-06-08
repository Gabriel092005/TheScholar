import { api } from "@/lib/axios";

export interface AfroScore {
  score: number;
  maxScore: number;
  pontosFortes: string[];
  pontosMelhorar: string[];
}

export interface PerfilAcademico {
  id: string;
  usuarioId: string;
  nivelEnsino: string;
  instituicao?: string;
  curso?: string;
  nivel?: string;
  anoConclusao?: string;
  media?: string;
  pais?: string;
  genero?: string;
  nacionalidade?: string;
  cidade?: string;
  whatsapp?: string;
  idiomas?: string;
  certificadosIdiomas?: string;
  bolsaIntegral?: string;
  bolsaParcial?: string;
  custeiaPassagem?: string;
  preferenciaDestino?: string;
  mudarPais?: string;
  qualquerContinente?: string;
  documentos?: string;
  biUrl?: string;
  curriculumUrl?: string;
  fotoUrl?: string;
  dataNascimento?: string;
  provincia?: string;
  municipio?: string;
  motivacoes?: string;
  experienciaProfissional?: string;
  areaActuacao?: string;
  cargoOcupado?: string;
  historicoProfissional?: string;
  atividadesExtracurriculares?: string;
  descricaoAtividades?: string;
  producaoCientifica?: string;
  descricaoProducao?: string;
  areaInteresse?: string;
  cursoDesejado?: string;
  objetivosAcademicos?: string;
  quandoPretendeIniciar?: string;
  created_at: string;
  updated_at: string;
}

export const perfilAcademicoApi = {
  obter: async () => {
    const { data } = await api.get<{ perfil: PerfilAcademico | null; afroScore: AfroScore | null; completude: number }>("/perfil-academico");
    return data;
  },

  salvar: async (payload: FormData) => {
    const { data } = await api.put<PerfilAcademico>("/perfil-academico", payload, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return data;
  },
};
