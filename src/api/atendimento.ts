import { api } from "@/lib/axios";

export interface ResumoAtendimento {
  dias: number;
  equipa: { id: string; nome: string; email: string; phone: string | null; estado_conta: "ACTIVA" | "INACTIVA" }[];
  total: number;
  pagaram: number;
  naoPagaram: number;
}

export interface ResultadoEnvio {
  enviados: number;
  destinatarios: number;
  contactos: number;
  pagaram: number;
  naoPagaram: number;
}

export const atendimentoApi = {
  resumo: async (dias: number) => {
    const { data } = await api.get<ResumoAtendimento>("/admin/atendimento/resumo", { params: { dias } });
    return data;
  },

  /** Descarrega o PDF de contactos (o mesmo que vai por email). */
  descarregarPdf: async (dias: number) => {
    const { data } = await api.get<Blob>("/admin/atendimento/contactos.pdf", {
      params: { dias },
      responseType: "blob",
    });
    const url = URL.createObjectURL(data);
    const link = document.createElement("a");
    link.href = url;
    link.download = `contactos-vendas-${new Date().toISOString().slice(0, 10)}.pdf`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  },

  enviarContactos: async (dias: number, mensagem?: string) => {
    const { data } = await api.post<ResultadoEnvio>("/admin/atendimento/enviar-contactos", { dias, mensagem });
    return data;
  },
};

export interface WhatsappEquipa {
  apiConfigurada: boolean;
  equipa: { id: string; nome: string; phone: string | null; link: string | null }[];
}

export const atendimentoWhatsappApi = {
  /** Links wa.me prontos, com o resumo e um link seguro (48h) para o PDF. */
  links: async (dias: number, mensagem?: string) => {
    const { data } = await api.get<WhatsappEquipa>("/admin/atendimento/whatsapp", {
      params: { dias, ...(mensagem ? { mensagem } : {}) },
    });
    return data;
  },
  /** Envio automático pela API oficial do WhatsApp (se configurada no servidor). */
  enviar: async (dias: number, mensagem?: string) => {
    const { data } = await api.post<{ enviados: number; falhados: string[]; semNumero: number }>(
      "/admin/atendimento/enviar-whatsapp",
      { dias, mensagem }
    );
    return data;
  },
};
