import { api } from "@/lib/axios";

export interface DashboardStatsCard {
  label: string;
  value: number;
  icon: string;
  color: string;
}

export interface CrescimentoMensal {
  month: string;
  users: number;
  courses: number;
  bolsas: number;
}

export interface UsuarioRecente {
  id: string;
  nome: string;
  email: string;
  image_path: string | null;
  created_at: string;
}

export interface CursoPopular {
  titulo: string;
  estudantes: number;
  receita: number;
}

export interface DashboardData {
  statsCards: DashboardStatsCard[];
  receitaTotal: number;
  totalPagamentosAprovados: number;
  crescimentoMensal: CrescimentoMensal[];
  usuariosRecentes: UsuarioRecente[];
  cursosPopulares: CursoPopular[];
}

interface PaginatedResponse<T> {
  data: T[];
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface AulaOnlineAdmin {
  id: string;
  titulo: string;
  descricao?: string | null;
  data: string;
  duracao?: number | null;
  status: "AGENDADA" | "AO_VIVO" | "FINALIZADA" | "CANCELADA";
  hostId: string;
  bolsaId?: string | null;
  bolsa?: { id: string; titulo: string } | null;
  created_at: string;
  host: { id: string; nome: string; image_path: string | null };
  _count: { participantes: number };
}

export const adminApi = {
  getDashboard: async () => {
    const { data } = await api.get<DashboardData>("/admin/dashboard");
    return data;
  },

  listAulas: async (params?: { page?: number; limit?: number; status?: string }) => {
    const { data } = await api.get<PaginatedResponse<AulaOnlineAdmin>>("/admin/aulas", { params });
    return data;
  },
};
