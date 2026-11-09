import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { tiposAnaliseApi, type TipoAnalise } from "@/api/analise-documento";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type ErroApi = { response?: { data?: { message?: string } } };
const avisarErro = (e: ErroApi) => toast.error(e.response?.data?.message || "Não foi possível guardar");
const CHAVE = ["analise-tipos-admin"];

function LinhaTipo({ tipo }: { tipo: TipoAnalise }) {
  const queryClient = useQueryClient();
  const atualizarLista = () => queryClient.invalidateQueries({ queryKey: CHAVE });
  const [preco, setPreco] = useState(String(tipo.preco));
  useEffect(() => setPreco(String(tipo.preco)), [tipo.preco]);

  const guardar = useMutation({
    mutationFn: (payload: { preco?: number; ativo?: boolean }) => tiposAnaliseApi.atualizar(tipo.id, payload),
    onSuccess: atualizarLista,
    onError: avisarErro,
  });
  const apagar = useMutation({
    mutationFn: () => tiposAnaliseApi.apagar(tipo.id),
    onSuccess: atualizarLista,
    onError: avisarErro,
  });

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className={`min-w-0 truncate text-sm font-semibold ${tipo.ativo ? "text-gray-900 dark:text-white" : "text-gray-400 dark:text-zinc-600"}`}>
        {tipo.nome}
        {!tipo.ativo && " (inativo)"}
      </p>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          type="number"
          min="100"
          aria-label={`Preço de ${tipo.nome} em Kz`}
          value={preco}
          onChange={(e) => setPreco(e.target.value)}
          className="w-28 rounded-xl"
        />
        <Button
          variant="outline"
          disabled={guardar.isPending || Number(preco) === tipo.preco}
          onClick={() => guardar.mutate({ preco: Number(preco) })}
          className="rounded-xl dark:text-white"
        >
          Guardar
        </Button>
        <Button variant="outline" disabled={guardar.isPending} onClick={() => guardar.mutate({ ativo: !tipo.ativo })} className="rounded-xl dark:text-white">
          {tipo.ativo ? "Desativar" : "Ativar"}
        </Button>
        <Button variant="outline" disabled={apagar.isPending} onClick={() => apagar.mutate()} aria-label={`Apagar ${tipo.nome}`} className="rounded-xl dark:text-white">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </li>
  );
}

export function TiposAnaliseConfig() {
  const queryClient = useQueryClient();
  const { data: tipos = [], isLoading } = useQuery({ queryKey: CHAVE, queryFn: tiposAnaliseApi.todos });
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");

  const criar = useMutation({
    mutationFn: () => tiposAnaliseApi.criar({ nome, preco: Number(preco) }),
    onSuccess: () => {
      toast.success("Documento adicionado");
      setNome("");
      setPreco("");
      queryClient.invalidateQueries({ queryKey: CHAVE });
    },
    onError: avisarErro,
  });

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.06] dark:bg-[#111113]">
      <h2 className="text-lg font-bold text-gray-900 dark:text-white">Documentos e preços</h2>
      <p className="text-sm text-gray-500 dark:text-zinc-500">
        O utilizador só pode pedir a análise dos documentos ativos desta lista.
      </p>

      <form
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={(e) => {
          e.preventDefault();
          criar.mutate();
        }}
      >
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="tipo-nome">Documento</Label>
          <Input id="tipo-nome" required value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Currículo (CV)" className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="tipo-preco">Preço (Kz)</Label>
          <Input id="tipo-preco" type="number" min="100" required value={preco} onChange={(e) => setPreco(e.target.value)} className="rounded-xl sm:w-32" />
        </div>
        <Button type="submit" disabled={criar.isPending} className="rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
          Adicionar
        </Button>
      </form>

      {isLoading ? (
        <Loader2 className="mx-auto mt-4 h-6 w-6 animate-spin text-emerald-500" aria-label="A carregar" />
      ) : tipos.length === 0 ? (
        <p className="mt-4 text-sm text-amber-600 dark:text-amber-400">
          Sem documentos na lista: os utilizadores não conseguem pedir análises.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {tipos.map((t) => <LinhaTipo key={t.id} tipo={t} />)}
        </ul>
      )}
    </section>
  );
}
