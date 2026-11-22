import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Copy, Loader2, Pencil, Plus, TicketPercent, Trash2 } from "lucide-react";
import {
  TIPOS_PAGAMENTO_CUPOM,
  cuponsApi,
  type Cupom,
  type DadosCupom,
  type TipoPagamentoCupom,
} from "@/api/cupons";
import { bolsasApi } from "@/api/bolsas";
import { cursosApi } from "@/api/cursos";
import { AdminPageHeader, AdminPanel, adminMuted } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";

const VAZIO: DadosCupom = {
  codigo: "",
  descricao: "",
  tipoDesconto: "PERCENTAGEM",
  valor: 10,
  tipos: [],
  itemId: null,
  limiteUsos: null,
  limitePorUsuario: 1,
  valorMinimo: null,
  validoDesde: null,
  validoAte: null,
  ativo: true,
};

const TODOS_OS_PRODUTOS = "__todos__";

const kz = (v: number) => `${v.toLocaleString("pt-PT")} Kz`;
const nomeTipo = (t: string) => TIPOS_PAGAMENTO_CUPOM.find((x) => x.valor === t)?.nome.split(" (")[0] ?? t;

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

const paraInputData = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
const inicioDoDia = (v: string) => (v ? new Date(`${v}T00:00:00`).toISOString() : null);
const fimDoDia = (v: string) => (v ? new Date(`${v}T23:59:59`).toISOString() : null);

function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => letras[Math.floor(Math.random() * letras.length)]).join("");
}

function estadoDe(c: Cupom): { texto: string; classe: string } {
  const agora = new Date();
  if (!c.ativo) return { texto: "Inativo", classe: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400" };
  if (c.validoAte && new Date(c.validoAte) < agora) {
    return { texto: "Expirado", classe: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" };
  }
  if (c.limiteUsos !== null && c.usos >= c.limiteUsos) {
    return { texto: "Esgotado", classe: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" };
  }
  if (c.validoDesde && new Date(c.validoDesde) > agora) {
    return { texto: "Agendado", classe: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" };
  }
  return { texto: "Ativo", classe: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" };
}

/** Cupões de desconto aplicados no ecrã de pagamento (MoMenu). */
export function CuponsAdmin() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formAberto, setFormAberto] = useState(false);
  const [editar, setEditar] = useState<Cupom | null>(null);
  const [dados, setDados] = useState<DadosCupom>(VAZIO);

  const { data: cupons, isLoading } = useQuery({ queryKey: ["admin-cupons"], queryFn: cuponsApi.listar });

  // Produto específico só quando o cupão vale para um único tipo com catálogo.
  const tipoUnico = dados.tipos.length === 1 ? dados.tipos[0] : null;
  const { data: produtos } = useQuery({
    queryKey: ["admin-cupons-produtos", tipoUnico],
    queryFn: async () => {
      if (tipoUnico === "BOLSA") return (await bolsasApi.list({ limit: 500 })).data.map((b) => ({ id: b.id, nome: b.titulo }));
      return (await cursosApi.list({ limit: 500 })).data.map((c) => ({ id: c.id, nome: c.titulo }));
    },
    enabled: formAberto && (tipoUnico === "BOLSA" || tipoUnico === "CURSO"),
  });

  const atualizarLista = () => queryClient.invalidateQueries({ queryKey: ["admin-cupons"] });

  const guardar = useMutation({
    mutationFn: () => {
      const corpo: DadosCupom = {
        ...dados,
        descricao: dados.descricao?.trim() || null,
        itemId: tipoUnico === "BOLSA" || tipoUnico === "CURSO" ? dados.itemId : null,
      };
      return editar ? cuponsApi.atualizar(editar.id, corpo) : cuponsApi.criar(corpo);
    },
    onSuccess: () => {
      atualizarLista();
      setFormAberto(false);
      toast.success(editar ? "Cupão atualizado" : "Cupão criado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível guardar o cupão.")),
  });

  const alternarAtivo = useMutation({
    mutationFn: (c: Cupom) => {
      const { id: _id, usos: _u, created_at: _c, totalDescontado: _d, totalFaturado: _f, ...resto } = c;
      return cuponsApi.atualizar(c.id, { ...resto, ativo: !c.ativo });
    },
    onSuccess: atualizarLista,
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível alterar.")),
  });

  const apagar = useMutation({
    mutationFn: cuponsApi.apagar,
    onSuccess: () => {
      atualizarLista();
      toast.success("Cupão apagado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível apagar.")),
  });

  const abrirNovo = () => {
    setEditar(null);
    setDados({ ...VAZIO, codigo: gerarCodigo() });
    setFormAberto(true);
  };

  const abrirEditar = (c: Cupom) => {
    setEditar(c);
    setDados({
      codigo: c.codigo,
      descricao: c.descricao ?? "",
      tipoDesconto: c.tipoDesconto,
      valor: c.valor,
      tipos: c.tipos,
      itemId: c.itemId,
      limiteUsos: c.limiteUsos,
      limitePorUsuario: c.limitePorUsuario,
      valorMinimo: c.valorMinimo,
      validoDesde: c.validoDesde,
      validoAte: c.validoAte,
      ativo: c.ativo,
    });
    setFormAberto(true);
  };

  const alternarTipo = (tipo: TipoPagamentoCupom, marcado: boolean) =>
    setDados((d) => ({
      ...d,
      itemId: null,
      tipos: marcado ? [...d.tipos, tipo] : d.tipos.filter((t) => t !== tipo),
    }));

  const copiar = async (codigo: string) => {
    try {
      await navigator.clipboard.writeText(codigo);
      toast.success("Código copiado");
    } catch {
      toast.error("Não foi possível copiar");
    }
  };

  const percentagemInvalida = dados.tipoDesconto === "PERCENTAGEM" && dados.valor > 100;
  const valido = /^[A-Z0-9_-]{3,40}$/.test(dados.codigo) && dados.valor > 0 && !percentagemInvalida;

  const numeroOuNull = (v: string) => (v === "" ? null : Number(v));

  return (
    <div className="space-y-5">
      <ConfirmDialog />
      <AdminPageHeader
        eyebrow="Vendas"
        title="Cupões de desconto"
        description="Crie códigos que os clientes escrevem no ecrã de pagamento. O desconto é calculado no servidor e o uso só conta quando o pagamento é confirmado."
        actions={
          <Button onClick={abrirNovo} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
            <Plus className="size-4" /> Novo cupão
          </Button>
        }
      />

      <AdminPanel title="Cupões" subtitle={`${cupons?.length ?? 0} cupão(ões)`} icon={TicketPercent} bodyClassName="px-0 pb-1">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-emerald-500" />
          </div>
        ) : !cupons || cupons.length === 0 ? (
          <p className={cn("px-4 py-8 text-center text-sm", adminMuted)}>
            Ainda não há cupões. Carregue em "Novo cupão".
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {cupons.map((c) => {
              const estado = estadoDe(c);
              return (
                <li key={c.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => void copiar(c.codigo)}
                        className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-2 py-1 font-mono text-sm font-bold tracking-wide text-gray-900 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-white dark:hover:bg-white/[0.1]"
                        title="Copiar código"
                      >
                        {c.codigo} <Copy className="size-3 opacity-60" />
                      </button>
                      <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        {c.tipoDesconto === "PERCENTAGEM" ? `-${c.valor}%` : `-${kz(c.valor)}`}
                      </span>
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", estado.classe)}>{estado.texto}</span>
                    </div>
                    {c.descricao && <p className={cn("mt-1 text-xs", adminMuted)}>{c.descricao}</p>}
                    <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                      <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                        {c.tipos.length === 0 ? "Todos os pagamentos" : c.tipos.map(nomeTipo).join(", ")}
                        {c.itemId ? " · 1 produto" : ""}
                      </span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400">
                        {c.usos}
                        {c.limiteUsos !== null ? `/${c.limiteUsos}` : ""} uso(s)
                      </span>
                      {c.validoAte && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400">
                          Até {new Date(c.validoAte).toLocaleDateString("pt-PT")}
                        </span>
                      )}
                      {c.totalDescontado > 0 && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400">
                          Descontado {kz(c.totalDescontado)} · Faturado {kz(c.totalFaturado)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <label className="mr-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                      <Switch
                        checked={c.ativo}
                        disabled={alternarAtivo.isPending}
                        onCheckedChange={() => alternarAtivo.mutate(c)}
                        aria-label={c.ativo ? "Desativar" : "Ativar"}
                      />
                      {c.ativo ? "Ativo" : "Inativo"}
                    </label>
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(c)} aria-label="Editar">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Apagar"
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        const aviso =
                          c.usos > 0
                            ? `O cupão ${c.codigo} já foi usado ${c.usos} vez(es). Os pagamentos ficam, mas perdem a ligação ao cupão e os totais deixam de aparecer aqui. Para o parar, pode simplesmente desativá-lo.`
                            : `O cupão ${c.codigo} deixa de funcionar.`;
                        if (await confirm(aviso, "Apagar o cupão?")) apagar.mutate(c.id);
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{editar ? "Editar cupão" : "Novo cupão"}</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              O cliente escreve o código no ecrã de pagamento.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 [&_label]:text-gray-700 dark:[&_label]:text-zinc-300 dark:[&_input]:border-white/[0.1] dark:[&_input]:bg-white/[0.04] dark:[&_input]:text-white dark:[&_button[role=combobox]]:border-white/[0.1] dark:[&_button[role=combobox]]:bg-white/[0.04] dark:[&_button[role=combobox]]:text-white"
            onSubmit={(e) => {
              e.preventDefault();
              if (valido) guardar.mutate();
            }}
          >
            <div className="space-y-1.5">
              <Label htmlFor="cupom-codigo">Código *</Label>
              <div className="flex gap-2">
                <Input
                  id="cupom-codigo"
                  value={dados.codigo}
                  maxLength={40}
                  onChange={(e) => setDados({ ...dados, codigo: e.target.value.toUpperCase().replace(/\s+/g, "") })}
                  placeholder="BEMVINDO10"
                  className="font-mono uppercase"
                />
                <Button type="button" variant="outline" onClick={() => setDados({ ...dados, codigo: gerarCodigo() })} className="dark:text-white">
                  Gerar
                </Button>
              </div>
              {dados.codigo && !/^[A-Z0-9_-]{3,40}$/.test(dados.codigo) && (
                <p className="text-xs text-red-600">Use 3 a 40 letras, números, - ou _.</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cupom-descricao">Descrição interna</Label>
              <Input
                id="cupom-descricao"
                value={dados.descricao ?? ""}
                maxLength={300}
                onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                placeholder="Ex.: campanha de Dezembro no Instagram"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Tipo de desconto</Label>
                <Select
                  value={dados.tipoDesconto}
                  onValueChange={(v) => setDados({ ...dados, tipoDesconto: v as DadosCupom["tipoDesconto"] })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PERCENTAGEM">Percentagem (%)</SelectItem>
                    <SelectItem value="VALOR_FIXO">Valor fixo (Kz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cupom-valor">{dados.tipoDesconto === "PERCENTAGEM" ? "Percentagem *" : "Valor em Kz *"}</Label>
                <Input
                  id="cupom-valor"
                  type="number"
                  min={1}
                  max={dados.tipoDesconto === "PERCENTAGEM" ? 100 : undefined}
                  value={dados.valor || ""}
                  onChange={(e) => setDados({ ...dados, valor: Number(e.target.value) })}
                />
                {percentagemInvalida && <p className="text-xs text-red-600">Máximo 100%.</p>}
                {dados.tipoDesconto === "PERCENTAGEM" && dados.valor === 100 && (
                  <p className={cn("text-xs", adminMuted)}>100%: o cliente obtém o produto sem pagar.</p>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Vale para</Label>
              <div className="space-y-0.5 rounded-xl border border-gray-100 p-1.5 dark:border-white/[0.06]">
                {TIPOS_PAGAMENTO_CUPOM.map((t) => (
                  <label
                    key={t.valor}
                    className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                  >
                    <Checkbox checked={dados.tipos.includes(t.valor)} onCheckedChange={(c) => alternarTipo(t.valor, c === true)} />
                    {t.nome}
                  </label>
                ))}
              </div>
              <p className={cn("text-xs", adminMuted)}>
                {dados.tipos.length === 0 ? "Nada marcado: vale para todos os pagamentos." : "Só para os tipos marcados."}
              </p>
            </div>

            {(tipoUnico === "BOLSA" || tipoUnico === "CURSO") && (
              <div className="space-y-1.5">
                <Label>{tipoUnico === "BOLSA" ? "Só para esta bolsa" : "Só para este curso"}</Label>
                <Select
                  value={dados.itemId ?? TODOS_OS_PRODUTOS}
                  onValueChange={(v) => setDados({ ...dados, itemId: v === TODOS_OS_PRODUTOS ? null : v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={TODOS_OS_PRODUTOS}>{tipoUnico === "BOLSA" ? "Todas as bolsas" : "Todos os cursos"}</SelectItem>
                    {produtos?.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cupom-limite">Limite total de usos</Label>
                <Input
                  id="cupom-limite"
                  type="number"
                  min={1}
                  value={dados.limiteUsos ?? ""}
                  onChange={(e) => setDados({ ...dados, limiteUsos: numeroOuNull(e.target.value) })}
                  placeholder="Ilimitado"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cupom-por-pessoa">Usos por pessoa</Label>
                <Input
                  id="cupom-por-pessoa"
                  type="number"
                  min={1}
                  value={dados.limitePorUsuario}
                  onChange={(e) => setDados({ ...dados, limitePorUsuario: Math.max(1, Number(e.target.value) || 1) })}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cupom-minimo">Compra mínima (Kz)</Label>
              <Input
                id="cupom-minimo"
                type="number"
                min={0}
                value={dados.valorMinimo ?? ""}
                onChange={(e) => setDados({ ...dados, valorMinimo: numeroOuNull(e.target.value) })}
                placeholder="Sem mínimo"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="cupom-desde">Válido a partir de</Label>
                <Input
                  id="cupom-desde"
                  type="date"
                  value={paraInputData(dados.validoDesde)}
                  onChange={(e) => setDados({ ...dados, validoDesde: inicioDoDia(e.target.value) })}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cupom-ate">Válido até</Label>
                <Input
                  id="cupom-ate"
                  type="date"
                  value={paraInputData(dados.validoAte)}
                  onChange={(e) => setDados({ ...dados, validoAte: fimDoDia(e.target.value) })}
                />
              </div>
            </div>

            <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
              <span className="text-sm">Ativo</span>
              <Switch checked={dados.ativo} onCheckedChange={(c) => setDados({ ...dados, ativo: c })} />
            </label>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormAberto(false)}
                className="w-full dark:border-white/[0.1] dark:text-white sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!valido || guardar.isPending}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
              >
                {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
                {editar ? "Guardar" : "Criar cupão"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
