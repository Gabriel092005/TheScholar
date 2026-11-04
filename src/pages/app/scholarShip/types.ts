export interface Scholarship {
  id: string;
  title: string;
  university: string;
  country: string;
  flag: string;
  deadline: string;
  level: string;
  area: string;
  slots: number;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  bgImage?: string;
  inscriptionPrice?: number;
  consultoriaPrice?: number;
  mentoriaPrice?: number;
  currency?: string;
  originalPrice?: number;
  linkAplicar?: string;
  /** Data do prazo em ISO, usada para calcular os dias que faltam. */
  deadlineISO?: string;
  /** Valor da bolsa já formatado com a moeda. */
  valor?: string;
  modalidade?: string;
  idioma?: string;
}
