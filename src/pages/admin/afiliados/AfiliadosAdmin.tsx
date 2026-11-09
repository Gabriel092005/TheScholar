import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { afiliadosApi, emKz, ROTULO_TIPO, type PainelAfiliadosAdmin } from "@/api/afiliados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const cartao = "rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.06] dark:bg-[#111113]";
const titulo = "font-bold text-gray-900 dark:text-white";
const suave = "text-xs text-gray-500 dark:text-zinc-400";

type ErroApi = { response?: { data?: { message?: string } } };
const avisarErro = (e: ErroApi) => toast.error(e.response?.data?.message || "Não foi possível guardar");

function useAtualizarPainel() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ["afiliados-admin"] });
}

function PercentualGlobal({ atual }: { atual: number }) {
  const atualizar = useAtualizarPainel();
  const [valor, setValor] = useState(String(atual));
  useEffect(() => setValor(String(atual)), [atual]);

  const guardar = useMutation({
    mutationFn: () => afiliadosApi.definirGlobal(Number(valor)),
    onSuccess: () => {
      toast.success("Comissão global atualizada");
      atualizar();
    },
    onError: avisarErro,
  });

  return (
    <form
      className="flex items-end gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        guardar.mutate();
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="comissao-global">Comissão global (%)</Label>
        <Input id="comissao-global" type="number" min="0" max="100" step="0.1" required value={valor} onChange={(e) => setValor(e.target.value)} className="w-32 rounded-xl" />
      </div>
      <Button type="submit" disabled={guardar.isPending} className="rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
        Guardar
      </Button>
    </form>
  );
}

function LinhaProduto({ produto, global }: { produto: PainelAfiliadosAdmin["produtos"][number]; global: number }) {
  const atualizar = useAtualizarPainel();
  const inicial = produto.comissaoAfiliado === null ? "" : String(produto.comissaoAfiliado);
  const [valor, setValor] = useState(inicial);
  useEffect(() => setValor(inicial), [inicial]);

  const guardar = useMutation({
    mutationFn: () => afiliadosApi.definirProduto(produto.tipo, produto.id, valor === "" ? null : Number(valor)),
    onSuccess: () => {
      toast.success("Comissão atualizada");
      atualizar();
    },
    onError: avisarErro,
  });

  return (
    <li className="flex items-center justify-between gap-3 py-2.5">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{produto.titulo}</p>
        <p className={suave}>{ROTULO_TIPO[produto.tipo]}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Input
          type="number"
          min="0"
          max="100"
          step="0.1"
          aria-label={`Comissão de ${produto.titulo}`}
          placeholder={`${global}`}
          value={valor}
          onChange={(e) => setValor(e.target.value)}
          className="w-20 rounded-xl"
        />
        <Button variant="outline" disabled={guardar.isPending || valor === inicial} onClick={() => guardar.mutate()} className="rounded-xl dark:text-white">
          Guardar
        </Button>
      </div>
    </li>
  );
}

function LinhaSaque({ saque }: { saque: PainelAfiliadosAdmin["saques"][number] }) {
  const atualizar = useAtualizarPainel();
  const processar = useMutation({
    mutationFn: (status: "PAGO" | "REJEITADO") => afiliadosApi.processarSaque(saque.id, status),
    onSuccess: atualizar,
    onError: avisarErro,
  });

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="text-sm font-bold text-gray-900 dark:text-white">
          {emKz(saque.valor)} · {saque.usuario.nome}
        </p>
        <p className={`${suave} break-all`}>
          {saque.titular} · {saque.iban} · {new Date(saque.created_at).toLocaleDateString("pt-PT")}
        </p>
      </div>
      {saque.status === "PENDENTE" ? (
        <div className="flex shrink-0 gap-2">
          <Button variant="outline" disabled={processar.isPending} onClick={() => processar.mutate("REJEITADO")} className="rounded-xl dark:text-white">
            Rejeitar
          </Button>
          <Button disabled={processar.isPending} onClick={() => processar.mutate("PAGO")} className="rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
            Marcar como pago
          </Button>
        </div>
      ) : (
        <span className={suave}>{saque.status === "PAGO" ? "Pago" : "Rejeitado"}</span>
      )}
    </li>
  );
}

export function AfiliadosAdmin() {
  const { data, isLoading } = useQuery({ queryKey: ["afiliados-admin"], queryFn: afiliadosApi.painelAdmin });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" aria-label="A carregar" />
      </div>
    );
  }
  if (!data) {
    return <p role="alert" className="p-8 text-center text-sm text-red-600 dark:text-red-400">Não foi possível carregar os afiliados.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 text-gray-900 dark:text-white sm:p-8">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Afiliados</h1>

      <section className={cartao}>
        <PercentualGlobal atual={data.percentualGlobal} />
      </section>

      <section className={cartao}>
        <h2 className={titulo}>Pedidos de saque</h2>
        <p className={`${suave} mt-1`}>Faça a transferência para o IBAN e depois marque o pedido como pago.</p>
        {data.saques.length === 0 ? (
          <p className={`${suave} mt-3`}>Sem pedidos.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {data.saques.map((s) => <LinhaSaque key={s.id} saque={s} />)}
          </ul>
        )}
      </section>

      <section className={cartao}>
        <h2 className={titulo}>Comissão por produto</h2>
        <p className={`${suave} mt-1`}>Deixe vazio para usar a comissão global.</p>
        <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
          {data.produtos.map((p) => <LinhaProduto key={`${p.tipo}:${p.id}`} produto={p} global={data.percentualGlobal} />)}
        </ul>
      </section>
    </div>
  );
}
