import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { criarComunidade, type Community } from "@/api/comunidades";
import { gestorApi } from "@/api/gestor";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const NOME_MINIMO = 3;
const NOME_MAXIMO = 80;
const DESCRICAO_MAXIMA = 300;
const SEM_BOLSA = "none";

const campo =
  "rounded-xl border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500";
const rotulo = "text-sm font-medium text-gray-800 dark:text-zinc-100";
const ajuda = "text-xs text-gray-500 dark:text-zinc-400";

export function CriarComunidadeDialog({
  open,
  onOpenChange,
  onCriada,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCriada?: (comunidade: Community) => void;
}) {
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [bolsaId, setBolsaId] = useState(SEM_BOLSA);
  const [nomeTocado, setNomeTocado] = useState(false);

  // O servidor já devolve todas as bolsas ao admin e só as próprias ao mentor.
  const { data: bolsasData, isLoading: aCarregarBolsas } = useQuery({
    queryKey: ["bolsas-para-comunidade"],
    queryFn: () => gestorApi.listBolsas({ limit: 100 }),
    enabled: open,
  });
  const bolsas = bolsasData?.data ?? [];

  const criar = useMutation({
    mutationFn: () =>
      criarComunidade({
        nome: nome.trim(),
        descricao: descricao.trim() || undefined,
        bolsaId: bolsaId === SEM_BOLSA ? undefined : bolsaId,
      }),
    onSuccess: (comunidade) => {
      queryClient.invalidateQueries({ queryKey: ["comunidades"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-comunidades"] });
      queryClient.invalidateQueries({ queryKey: ["admin-comunidades"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-dashboard"] });
      toast.success("Comunidade criada!");
      onOpenChange(false);
      onCriada?.(comunidade);
    },
  });
  const { reset: limparErro } = criar;

  // Cada abertura começa com o formulário limpo.
  useEffect(() => {
    if (!open) return;
    setNome("");
    setDescricao("");
    setBolsaId(SEM_BOLSA);
    setNomeTocado(false);
    limparErro();
  }, [open, limparErro]);

  const nomeLimpo = nome.trim();
  const nomeValido = nomeLimpo.length >= NOME_MINIMO;
  const mostrarErroNome = nomeTocado && !nomeValido;
  const erroServidor =
    (criar.error as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;

  function submeter(evento: FormEvent) {
    evento.preventDefault();
    setNomeTocado(true);
    if (nomeValido && !criar.isPending) criar.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(aberto) => !criar.isPending && onOpenChange(aberto)}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
            Nova comunidade
          </DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
            Um espaço para partilhar ideias, tirar dúvidas e acompanhar os estudantes.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submeter} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="comunidade-nome" className={rotulo}>Nome</Label>
            <Input
              id="comunidade-nome"
              autoFocus
              value={nome}
              maxLength={NOME_MAXIMO}
              onChange={(e) => setNome(e.target.value)}
              onBlur={() => setNomeTocado(true)}
              aria-invalid={mostrarErroNome}
              aria-describedby={mostrarErroNome ? "comunidade-nome-erro" : undefined}
              placeholder="Ex: Bolsas Europa 2026"
              className={`h-11 ${campo} ${mostrarErroNome ? "border-red-500 focus-visible:ring-red-500/40 dark:border-red-500" : ""}`}
            />
            {mostrarErroNome && (
              <p id="comunidade-nome-erro" className="text-xs text-red-600 dark:text-red-400">
                O nome precisa de pelo menos {NOME_MINIMO} caracteres.
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor="comunidade-descricao" className={rotulo}>
                Descrição <span className="font-normal text-gray-500 dark:text-zinc-400">(opcional)</span>
              </Label>
              <span className={`${ajuda} tabular-nums`} aria-hidden="true">
                {descricao.length}/{DESCRICAO_MAXIMA}
              </span>
            </div>
            <Textarea
              id="comunidade-descricao"
              value={descricao}
              maxLength={DESCRICAO_MAXIMA}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Para quem é e o que vão discutir aqui?"
              rows={3}
              className={`resize-none ${campo}`}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comunidade-bolsa" className={rotulo}>Quem pode ver</Label>
            <Select value={bolsaId} onValueChange={setBolsaId}>
              <SelectTrigger id="comunidade-bolsa" className={`h-11 ${campo}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_BOLSA}>Todos os estudantes</SelectItem>
                {bolsas.map((bolsa) => (
                  <SelectItem key={bolsa.id} value={bolsa.id}>{bolsa.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className={ajuda}>
              {bolsaId !== SEM_BOLSA
                ? "Só os estudantes com mentoria nesta bolsa a podem ver."
                : aCarregarBolsas
                  ? "A carregar as bolsas..."
                  : bolsas.length > 0
                    ? "Escolha uma bolsa para a limitar aos estudantes com mentoria nela."
                    : "Fica visível para todos. Ainda não há bolsas para associar."}
            </p>
          </div>

          {criar.isError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {erroServidor || "Não foi possível criar a comunidade. Tente novamente."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={criar.isPending}
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-gray-200 dark:border-white/[0.08] dark:text-white dark:hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criar.isPending}
              className="h-11 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            >
              {criar.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A criar...
                </>
              ) : (
                "Criar comunidade"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
