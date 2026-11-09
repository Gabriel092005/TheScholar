import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { afiliadosApi, emKz, linkDeAfiliado, ROTULO_TIPO, type ProdutoAfiliado, type SaqueStatus } from "@/api/afiliados";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const cartao = "rounded-2xl border border-gray-100 bg-white p-5 dark:border-white/[0.06] dark:bg-[#111113]";
const titulo = "font-bold text-gray-900 dark:text-white";
const suave = "text-xs text-gray-500 dark:text-zinc-400";

const ESTADOS: Record<SaqueStatus, string> = {
  PENDENTE: "Em análise",
  PAGO: "Pago",
  REJEITADO: "Rejeitado",
};

type ErroApi = { response?: { data?: { message?: string } } };

async function copiar(codigo: string) {
  try {
    await navigator.clipboard.writeText(linkDeAfiliado(codigo));
    toast.success("Link copiado");
  } catch {
    toast.error("Não foi possível copiar");
  }
}

function LinhaProduto({ produto }: { produto: ProdutoAfiliado }) {
  const queryClient = useQueryClient();
  const gerar = useMutation({
    mutationFn: () => afiliadosApi.gerarLink(produto.tipo, produto.id),
    onSuccess: ({ codigo }) => {
      queryClient.invalidateQueries({ queryKey: ["afiliados-produtos"] });
      copiar(codigo);
    },
    onError: (e: ErroApi) => toast.error(e.response?.data?.message || "Não foi possível gerar o link"),
  });

  return (
    <li className="flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{produto.titulo}</p>
        <p className={suave}>
          {ROTULO_TIPO[produto.tipo]} ·{produto.percentual}% de comissão
          {produto.codigo ? ` · ${produto.cliques} cliques` : ""}
        </p>
      </div>
      {produto.codigo ? (
        <Button variant="outline" onClick={() => copiar(produto.codigo!)} className="shrink-0 rounded-xl dark:text-white">
          <Copy className="mr-2 h-4 w-4" /> Copiar link
        </Button>
      ) : (
        <Button
          onClick={() => gerar.mutate()}
          disabled={gerar.isPending}
          className="shrink-0 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
        >
          {gerar.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Link2 className="mr-2 h-4 w-4" />}
          Gerar link
        </Button>
      )}
    </li>
  );
}

function FormularioSaque({ disponivel }: { disponivel: number }) {
  const queryClient = useQueryClient();
  const [valor, setValor] = useState("");
  const [iban, setIban] = useState("");
  const [titular, setTitular] = useState("");
  const [erro, setErro] = useState("");

  const pedir = useMutation({
    mutationFn: () => afiliadosApi.pedirSaque({ valor: Number(valor), iban, titular }),
    onSuccess: () => {
      toast.success("Pedido de saque enviado");
      setValor("");
      setErro("");
      queryClient.invalidateQueries({ queryKey: ["afiliados-resumo"] });
    },
    onError: (e: ErroApi) => setErro(e.response?.data?.message || "Não foi possível pedir o saque."),
  });

  return (
    <form
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        setErro("");
        pedir.mutate();
      }}
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="saque-valor">Valor (Kz)</Label>
          <Input id="saque-valor" type="number" min="1" step="0.01" max={disponivel} required value={valor} onChange={(e) => setValor(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saque-iban">IBAN</Label>
          <Input id="saque-iban" required value={iban} onChange={(e) => setIban(e.target.value)} className="rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="saque-titular">Titular da conta</Label>
          <Input id="saque-titular" required value={titular} onChange={(e) => setTitular(e.target.value)} className="rounded-xl" />
        </div>
      </div>
      {erro && <p role="alert" className="text-sm text-red-600 dark:text-red-400">{erro}</p>}
      <Button type="submit" disabled={pedir.isPending || disponivel <= 0} className="rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600">
        {pedir.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Pedir saque
      </Button>
    </form>
  );
}

export function AfiliadosPage() {
  const resumo = useQuery({ queryKey: ["afiliados-resumo"], queryFn: afiliadosApi.resumo });
  const produtos = useQuery({ queryKey: ["afiliados-produtos"], queryFn: afiliadosApi.produtos });

  if (resumo.isLoading || produtos.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" aria-label="A carregar" />
      </div>
    );
  }

  if (!resumo.data || !produtos.data) {
    return <p role="alert" className="p-8 text-center text-sm text-red-600 dark:text-red-400">Não foi possível carregar os afiliados.</p>;
  }

  const { saldo, cliques, comissoes, saques } = resumo.data;
  const indicadores = [
    { label: "Saldo disponível", valor: emKz(saldo.disponivel) },
    { label: "Total ganho", valor: emKz(saldo.totalGanho) },
    { label: "Em saque", valor: emKz(saldo.emSaque) },
    { label: "Cliques nos links", valor: cliques.toLocaleString("pt-PT") },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-4 text-gray-900 dark:text-white sm:p-8">
      <header>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Afiliados</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
          Partilhe o seu link. Quando alguém pagar através dele, recebe uma comissão.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {indicadores.map((i) => (
          <div key={i.label} className={cartao}>
            <p className={suave}>{i.label}</p>
            <p className="mt-1 text-lg font-bold text-gray-900 dark:text-white">{i.valor}</p>
          </div>
        ))}
      </div>

      <section className={cartao}>
        <h2 className={titulo}>Produtos para divulgar</h2>
        {produtos.data.length === 0 ? (
          <p className={`${suave} mt-2`}>Ainda não há produtos disponíveis.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {produtos.data.map((p) => <LinhaProduto key={`${p.tipo}:${p.id}`} produto={p} />)}
          </ul>
        )}
      </section>

      <section className={cartao}>
        <h2 className={`${titulo} mb-3`}>Pedir saque</h2>
        <FormularioSaque disponivel={saldo.disponivel} />
        {saques.length > 0 && (
          <ul className="mt-4 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {saques.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                <span className="text-gray-900 dark:text-white">{emKz(s.valor)}</span>
                <span className={suave}>
                  {new Date(s.created_at).toLocaleDateString("pt-PT")} · {ESTADOS[s.status]}
                  {s.observacao ? ` · ${s.observacao}` : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className={cartao}>
        <h2 className={titulo}>Comissões</h2>
        {comissoes.length === 0 ? (
          <p className={`${suave} mt-2`}>Ainda não tem vendas pagas através dos seus links.</p>
        ) : (
          <ul className="mt-2 divide-y divide-gray-100 dark:divide-white/[0.06]">
            {comissoes.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{c.produto}</p>
                  <p className={suave}>
                    {new Date(c.created_at).toLocaleDateString("pt-PT")} · {c.percentual}% de {emKz(c.valorVenda)}
                  </p>
                </div>
                <span className="shrink-0 text-sm font-bold text-emerald-600 dark:text-emerald-400">+{emKz(c.valor)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
