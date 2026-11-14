import { api } from "@/lib/axios";

export type EtapaLead = "NOVO" | "CONTACTADO" | "INTERESSADO" | "CONVERTIDO" | "PERDIDO";
export type TipoInteracao = "NOTA" | "CHAMADA" | "WHATSAPP" | "EMAIL";

export interface Lead {
  id: string;
  etapa: EtapaLead;
  origem: string;
  produto: string | null;
  caminho: string | null;
  valorPotencial: number | null;
  proximoContacto: string | null;
  ultimoContacto: string | null;
  created_at: string;
  updated_at: string;
  usuario: { id: string; nome: string; email: string; phone: string | null; image_path: string | null };
  atendente: { id: string; nome: string } | null;
}

export interface InteracaoLead {
  id: string;
  tipo: TipoInteracao | "ETAPA" | "SISTEMA";
  texto: string;
  created_at: string;
  autor: { id: string; nome: string } | null;
}

export interface LeadDetalhe extends Lead {
  interacoes: InteracaoLead[];
  pagamentos: { id: string; tipo: string; valor: number; status: "PENDENTE" | "PAGO" | "FALHADO"; metodo: string; created_at: string }[];
}

export interface ResumoCrm {
  admin: boolean;
  hoje: number;
  convertidos30: number;
  porEtapa: Partial<Record<EtapaLead, number>>;
}

export interface Atendente {
  id: string;
  nome: string;
  email: string;
  phone: string | null;
  estado_conta: "ACTIVA" | "INACTIVA";
  leadsAbertos: number;
}

export interface FiltrosLeads {
  escopo?: "hoje" | "abertos" | "todos";
  etapa?: EtapaLead;
  busca?: string;
  atendenteId?: string;
}

export const crmApi = {
  leads: async (filtros: FiltrosLeads) => (await api.get<Lead[]>("/crm/leads", { params: filtros })).data,
  resumo: async () => (await api.get<ResumoCrm>("/crm/resumo")).data,
  lead: async (id: string) => (await api.get<LeadDetalhe>(`/crm/leads/${id}`)).data,
  atualizar: async (id: string, dados: { etapa?: EtapaLead; proximoContacto?: string | null; atendenteId?: string | null }) =>
    (await api.patch<Lead>(`/crm/leads/${id}`, dados)).data,
  registarContacto: async (id: string, dados: { tipo: TipoInteracao; texto: string; proximoContacto?: string | null }) =>
    (await api.post<InteracaoLead>(`/crm/leads/${id}/interacoes`, dados)).data,
  atendentes: async () => (await api.get<Atendente[]>("/crm/atendentes")).data,
  sincronizar: async () => (await api.post<{ criados: number }>("/crm/sincronizar")).data,
  enviarResumoDiario: async () =>
    (await api.post<{ atendentes: number; emails: number; whatsapp: number }>("/crm/resumo-diario")).data,
};

/** "923 456 789" ou "+244923456789" → "244923456789" (formato do wa.me). */
export function numeroWhatsapp(telefone: string | null | undefined): string | null {
  if (!telefone) return null;
  const digitos = telefone.replace(/\D/g, "");
  if (/^9\d{8}$/.test(digitos)) return `244${digitos}`;
  return digitos.length >= 9 ? digitos : null;
}
