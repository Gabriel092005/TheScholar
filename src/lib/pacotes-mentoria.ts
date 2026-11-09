export interface PacoteMentoria {
  meses: number;
  multiplicador: number;
}

export interface PacoteMentoriaForm {
  meses: string;
  multiplicador: string;
}

/** O servidor faz a mesma conta (api/src/lib/pacotes-mentoria.ts) e é ele que define o valor cobrado. */
export function opcoesMentoria(precoBase: number | undefined, pacotes?: PacoteMentoria[] | null) {
  if (precoBase === undefined) return [];
  const base = { meses: 1, valor: precoBase };
  if (precoBase <= 0 || !pacotes) return [base];
  return [
    base,
    ...pacotes
      .map((p) => ({ meses: p.meses, valor: Math.round(precoBase * p.multiplicador) }))
      .sort((a, b) => a.meses - b.meses),
  ];
}

export const duracaoEmTexto = (meses: number) => (meses === 1 ? "1 mês" : `${meses} meses`);

export function pacotesParaFormulario(pacotes?: PacoteMentoria[] | null): PacoteMentoriaForm[] {
  return (pacotes ?? []).map((p) => ({ meses: String(p.meses), multiplicador: String(p.multiplicador) }));
}

/** As mesmas regras do servidor, para dizer logo qual pacote está errado. Devolve null se estiver tudo bem. */
export function erroNosPacotes(linhas: PacoteMentoriaForm[], precoBase: string): string | null {
  const preenchidas = linhas.filter((l) => l.meses !== "" || l.multiplicador !== "");
  if (preenchidas.length === 0) return null;

  if (!(Number(precoBase) > 0)) {
    return "Defina o preço da Mentoria (1 mês): os pacotes são calculados a partir dele.";
  }

  for (const [i, linha] of preenchidas.entries()) {
    const nome = `Pacote ${i + 1}`;
    if (linha.meses === "" || linha.multiplicador === "") {
      return `${nome}: preencha os meses e o multiplicador.`;
    }
    const meses = Number(linha.meses);
    const multiplicador = Number(linha.multiplicador);
    if (!Number.isInteger(meses) || meses < 2 || meses > 36) {
      return `${nome}: os meses têm de ser um número inteiro entre 2 e 36.`;
    }
    if (!(multiplicador > 1)) {
      return `${nome}: o multiplicador tem de ser maior que 1 (ex.: 2,5).`;
    }
    if (multiplicador > 36) {
      return `${nome}: use o multiplicador, não o preço final. O máximo é 36.`;
    }
  }

  const repetido = (valores: string[]) => new Set(valores.map(Number)).size !== valores.length;
  if (repetido(preenchidas.map((l) => l.meses))) return "Há dois pacotes com a mesma duração.";
  if (repetido(preenchidas.map((l) => l.multiplicador))) return "Cada pacote tem de ter um multiplicador diferente.";
  return null;
}

/** Linhas por preencher não são pacotes; os valores são validados no servidor. */
export function pacotesParaEnvio(linhas: PacoteMentoriaForm[]): string {
  return JSON.stringify(
    linhas
      .filter((l) => l.meses !== "" && l.multiplicador !== "")
      .map((l) => ({ meses: Number(l.meses), multiplicador: Number(l.multiplicador) }))
  );
}
