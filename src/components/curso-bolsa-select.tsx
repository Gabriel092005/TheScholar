import { useQuery } from "@tanstack/react-query";
import { gestorApi } from "@/api/gestor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

export const SEM_BOLSA = "sem-bolsa";

/** Converte o valor do campo no que a API espera. */
export const bolsaIdDoCampo = (valor: string) =>
  !valor || valor === SEM_BOLSA ? null : valor;

export const campoDaBolsaId = (bolsaId?: string | null) => bolsaId ?? SEM_BOLSA;

/** O curso só tem preço próprio quando não pertence a uma bolsa. */
export function erroNoCampoDoCurso(bolsa: string, preco: string): string | null {
  if (bolsa && bolsa !== SEM_BOLSA) return null;
  if (preco.trim() === "") return "Indique o valor do curso";
  const valor = Number(preco);
  if (Number.isNaN(valor) || valor < 0 || (valor > 0 && valor < 100)) {
    return "O valor deve ser 0 (gratuito) ou pelo menos 100 Kz";
  }
  return null;
}

/**
 * Escolha opcional da bolsa de um curso. Sem bolsa, o curso é vendido à parte.
 * A API devolve as bolsas do próprio gestor, ou todas para o administrador.
 */
export function CursoBolsaSelect({
  value,
  onChange,
  bolsaAtual,
  triggerClassName,
}: {
  value: string;
  onChange: (valor: string) => void;
  /** Bolsa já vinculada, que pode não estar na lista (inativa ou de outro gestor). */
  bolsaAtual?: { id: string; titulo: string } | null;
  triggerClassName?: string;
}) {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["bolsas-para-curso"],
    queryFn: () => gestorApi.listBolsas({ status: "TODAS", limit: 200 }),
  });

  const bolsas = (data?.data ?? [])
    .filter((b) => b.status !== "INATIVA" || b.id === value)
    .map((b) => ({ id: b.id, titulo: b.titulo }));
  const opcoes =
    bolsaAtual && !bolsas.some((b) => b.id === bolsaAtual.id) ? [bolsaAtual, ...bolsas] : bolsas;

  return (
    <div>
      <Select value={value} onValueChange={onChange} disabled={isLoading}>
        <SelectTrigger className={triggerClassName} aria-label="Bolsa vinculada (opcional)">
          <SelectValue placeholder={isLoading ? "A carregar bolsas..." : "Sem bolsa (curso independente)"} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={SEM_BOLSA}>Sem bolsa (curso independente)</SelectItem>
          {opcoes.map((bolsa) => (
            <SelectItem key={bolsa.id} value={bolsa.id}>
              {bolsa.titulo}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className={`mt-1.5 text-[11px] ${isError ? "text-red-600 dark:text-red-400" : "text-zinc-500 dark:text-zinc-400"}`}>
        {isError
          ? "Não foi possível carregar as bolsas. Tente novamente."
          : value && value !== SEM_BOLSA
            ? "Sem preço próprio: quem for aprovado nesta bolsa recebe acesso ao curso."
            : !isLoading && opcoes.length === 0
              ? "Opcional. Ainda não há bolsas criadas para vincular."
              : "Opcional. Sem bolsa, o curso é vendido à parte com o preço definido abaixo."}
      </p>
    </div>
  );
}
