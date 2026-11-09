export type TipoAfiliado = "BOLSA" | "DOCUMENTO" | "CURSO";

const VALIDADE_MS = 30 * 24 * 60 * 60 * 1000;
const CHAVE_DESTINO = "afiliado:destino";
const chave = (tipo: TipoAfiliado, itemId: string) => `afiliado:${tipo}:${itemId}`;

/** O último link aberto para um produto é o que conta. */
export function guardarRef(tipo: TipoAfiliado, itemId: string, codigo: string) {
  try {
    localStorage.setItem(chave(tipo, itemId), JSON.stringify({ codigo, expira: Date.now() + VALIDADE_MS }));
  } catch {
    // Sem armazenamento, a compra continua, só não é atribuída.
  }
}

/** Cabeçalho a enviar na compra deste produto, se chegou por um link válido. */
export function headersAfiliado(tipo: TipoAfiliado, itemId: string): Record<string, string> {
  try {
    const guardado = JSON.parse(localStorage.getItem(chave(tipo, itemId)) ?? "null");
    if (guardado && guardado.expira > Date.now()) return { "X-Afiliado-Ref": guardado.codigo };
  } catch {
    // Valor inválido: trata-se como compra sem afiliado.
  }
  return {};
}

export function guardarDestino(destino: string) {
  try {
    localStorage.setItem(CHAVE_DESTINO, destino);
  } catch {
    // Sem armazenamento, o utilizador fica na página inicial depois de entrar.
  }
}

/** Devolve o produto que quem ainda não tinha sessão queria ver, uma única vez. */
export function consumirDestino(): string | null {
  try {
    const destino = localStorage.getItem(CHAVE_DESTINO);
    if (destino) localStorage.removeItem(CHAVE_DESTINO);
    return destino;
  } catch {
    return null;
  }
}
