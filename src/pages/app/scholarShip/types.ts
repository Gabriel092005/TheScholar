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
}
