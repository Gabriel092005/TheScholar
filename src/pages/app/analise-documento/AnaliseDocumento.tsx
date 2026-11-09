import { useCallback, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { FileText, Upload, Loader2, Clock, CheckCircle, XCircle, AlertCircle, FileUp } from "lucide-react";
import { CardAccent, Reveal, UserPageHeader, iconTile, userCard } from "@/components/user-ui";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useUser } from "@/api/useGetProfile";
import { analiseDocumentoApi, tiposAnaliseApi } from "@/api/analise-documento";
import type { MetodoPagamento, PagamentoMomenu } from "@/api/pagamentos";
import {
  EstadoPagamento, SeletorPagamento, normalizarTelefone, telefoneValido,
} from "@/components/pagamento-momenu";
import { toast } from "sonner";

const statusConfig: Record<string, { label: string; class: string; icon: React.ReactNode }> = {
  AGUARDANDO_PAGAMENTO: { label: "A aguardar pagamento", class: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400", icon: <Clock size={14} /> },
  CANCELADO: { label: "Pagamento não concluído", class: "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-zinc-400", icon: <XCircle size={14} /> },
  PENDENTE: { label: "Pendente", class: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400", icon: <Clock size={14} /> },
  EM_ANALISE: { label: "Em Análise", class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400", icon: <AlertCircle size={14} /> },
  CONCLUIDO: { label: "Concluído", class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400", icon: <CheckCircle size={14} /> },
  REJEITADO: { label: "Rejeitado", class: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400", icon: <XCircle size={14} /> },
};

const NOMES_ANTIGOS: Record<string, string> = {
  CV: "Currículo (CV)",
  CARTA_MOTIVACAO: "Carta de Motivação",
  CERTIFICADO: "Certificado",
  OUTRO: "Outro",
};

const emKz = (valor: number) => `${valor.toLocaleString("pt-PT")} Kz`;

export function AnaliseDocumentoPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState(user?.nome || "");
  const [email, setEmail] = useState(user?.email || "");
  const [telefone, setTelefone] = useState("");
  const [areaPretendida, setAreaPretendida] = useState("");
  const [observacao, setObservacao] = useState("");
  // Cada documento marcado fica aqui, com o ficheiro quando já foi escolhido.
  const [selecionados, setSelecionados] = useState<Record<string, File | null>>({});
  const [metodo, setMetodo] = useState<MetodoPagamento>("momenu-mcx");
  const [telefonePagamento, setTelefonePagamento] = useState("");
  const [pagamento, setPagamento] = useState<PagamentoMomenu | null>(null);

  const { data: analises = [], isLoading } = useQuery({
    queryKey: ["minhas-analises"],
    queryFn: analiseDocumentoApi.listarMinhas,
  });

  const { data: tipos = [], isLoading: aCarregarTipos } = useQuery({
    queryKey: ["analise-tipos"],
    queryFn: tiposAnaliseApi.disponiveis,
    enabled: showForm,
  });

  const atualizarLista = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["minhas-analises"] });
  }, [queryClient]);

  const limparFormulario = () => {
    setShowForm(false);
    setPagamento(null);
    setNome(user?.nome || "");
    setEmail(user?.email || "");
    setTelefone("");
    setAreaPretendida("");
    setObservacao("");
    setSelecionados({});
    setTelefonePagamento("");
  };

  const criarMutation = useMutation({
    mutationFn: analiseDocumentoApi.criar,
    onSuccess: ({ pagamento: novo }) => {
      atualizarLista();
      if (novo) {
        setPagamento(novo);
        return;
      }
      toast.success("Pedido de análise enviado com sucesso!");
      limparFormulario();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao enviar pedido");
    },
  });

  const confirmado = useCallback(() => {
    toast.success("Pagamento confirmado! Os documentos já estão na fila de análise.");
    atualizarLista();
  }, [atualizarLista]);

  const idsSelecionados = Object.keys(selecionados);
  const total = tipos
    .filter((t) => idsSelecionados.includes(t.id))
    .reduce((soma, t) => soma + t.preco, 0);

  const alternarTipo = (id: string) =>
    setSelecionados((atual) => {
      const { [id]: existente, ...resto } = atual;
      return existente === undefined ? { ...atual, [id]: null } : resto;
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim() || !email.trim() || !areaPretendida.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (idsSelecionados.length === 0) {
      toast.error("Selecione pelo menos um documento");
      return;
    }
    if (idsSelecionados.some((id) => !selecionados[id])) {
      toast.error("Envie um ficheiro para cada documento selecionado");
      return;
    }
    if (metodo === "momenu-mcx" && !telefoneValido(telefonePagamento)) {
      toast.error("Indique um telefone válido com 9 dígitos, a começar por 9.");
      return;
    }

    const formData = new FormData();
    formData.append("nome", nome);
    formData.append("email", email);
    formData.append("areaPretendida", areaPretendida);
    if (telefone) formData.append("telefone", telefone);
    if (observacao) formData.append("observacao", observacao);
    formData.append("metodoPagamento", metodo);
    if (metodo === "momenu-mcx") formData.append("phoneNumber", normalizarTelefone(telefonePagamento));
    // A API emparelha cada tipoId com o ficheiro na mesma posição.
    for (const id of idsSelecionados) {
      formData.append("tipoId", id);
      formData.append("arquivo", selecionados[id]!);
    }

    criarMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <UserPageHeader
          icon={FileText}
          title="Análise de Documentos"
          description="Submeta o seu documento para correção e análise pela nossa equipa."
          action={
            <Button onClick={() => (showForm ? limparFormulario() : setShowForm(true))} className="gap-2 rounded-xl">
              <Upload className="h-4 w-4" />
              {showForm ? "Cancelar" : "Submeter Documento"}
            </Button>
          }
        />

        {showForm && pagamento && (
          <div className="max-w-xl mx-auto mb-12 p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]">
            <EstadoPagamento
              pagamento={pagamento}
              onConfirmado={confirmado}
              onFechar={(status) => (status === "FALHADO" ? setPagamento(null) : limparFormulario())}
            />
          </div>
        )}

        {showForm && !pagamento && (
          <motion.form
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit}
            className="max-w-xl mx-auto mb-12 p-6 sm:p-8 rounded-3xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
          >
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              Novo Pedido de Análise
            </h2>
            <div className="space-y-4">
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Nome *</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Seu nome" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Email *</Label>
                <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Seu email" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Telefone</Label>
                <Input value={telefone} onChange={(e) => setTelefone(e.target.value)} placeholder="Seu telefone" className="mt-1" />
              </div>
              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Área Pretendida *</Label>
                <Input
                  value={areaPretendida}
                  onChange={(e) => setAreaPretendida(e.target.value)}
                  placeholder="Ex: Medicina, Engenharia Informática, Bolsa Erasmus..."
                  className="mt-1"
                />
              </div>

              <fieldset>
                <legend className="text-sm text-gray-600 dark:text-zinc-400">Documentos a analisar *</legend>
                {aCarregarTipos ? (
                  <Loader2 className="mt-2 h-5 w-5 animate-spin text-emerald-500" aria-label="A carregar" />
                ) : tipos.length === 0 ? (
                  <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                    De momento não há documentos disponíveis para análise.
                  </p>
                ) : (
                  <div className="mt-2 space-y-2">
                    {tipos.map((tipo) => {
                      const marcado = selecionados[tipo.id] !== undefined;
                      const ficheiro = selecionados[tipo.id];
                      return (
                        <div key={tipo.id} className="rounded-xl border border-gray-200 dark:border-zinc-700 p-3">
                          <label className="flex cursor-pointer items-center justify-between gap-3">
                            <span className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                              <input
                                type="checkbox"
                                checked={marcado}
                                onChange={() => alternarTipo(tipo.id)}
                                className="h-4 w-4 accent-emerald-500"
                              />
                              {tipo.nome}
                            </span>
                            <span className="shrink-0 text-sm font-semibold text-gray-700 dark:text-zinc-300">{emKz(tipo.preco)}</span>
                          </label>
                          {marcado && (
                            <div className="mt-2">
                              <Label
                                htmlFor={`arquivo-${tipo.id}`}
                                className="flex items-center justify-center gap-2 p-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-700 cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors"
                              >
                                <FileUp size={18} className="text-gray-400 shrink-0" />
                                <span className="text-sm text-gray-500 dark:text-zinc-400 break-all">
                                  {ficheiro ? ficheiro.name : "Clique para selecionar o ficheiro"}
                                </span>
                              </Label>
                              <input
                                id={`arquivo-${tipo.id}`}
                                type="file"
                                className="hidden"
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={(e) =>
                                  setSelecionados((atual) => ({ ...atual, [tipo.id]: e.target.files?.[0] || null }))
                                }
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </fieldset>

              <div>
                <Label className="text-sm text-gray-600 dark:text-zinc-400">Observação</Label>
                <Textarea
                  value={observacao}
                  onChange={(e) => setObservacao(e.target.value)}
                  placeholder="Informações adicionais..."
                  className="mt-1 min-h-[80px]"
                />
              </div>

              {idsSelecionados.length > 0 && (
                <>
                  <div className="flex items-center justify-between rounded-2xl bg-white dark:bg-white/[0.03] px-4 py-3">
                    <span className="text-sm text-gray-500 dark:text-zinc-400">Total</span>
                    <span className="font-bold text-gray-900 dark:text-white">{emKz(total)}</span>
                  </div>
                  <SeletorPagamento
                    metodo={metodo}
                    onMetodo={setMetodo}
                    telefone={telefonePagamento}
                    onTelefone={setTelefonePagamento}
                  />
                </>
              )}

              <Button type="submit" disabled={criarMutation.isPending || tipos.length === 0} className="w-full gap-2">
                {criarMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {criarMutation.isPending ? "A processar..." : metodo === "reference" ? "Gerar referência" : "Pagar e enviar"}
              </Button>
            </div>
          </motion.form>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
          </div>
        ) : analises.length === 0 ? (
          <div className="text-center py-20">
            <FileText size={48} className="mx-auto text-gray-300 dark:text-zinc-700 mb-4" />
            <p className="text-gray-500 dark:text-zinc-500">Nenhum pedido de análise encontrado</p>
          </div>
        ) : (
          <div className="space-y-4">
            {analises.map((a, i) => (
              <Reveal key={a.id} index={i}>
              <div className={`${userCard} p-5 sm:p-6`}>
                <CardAccent />
                <div className="flex items-start gap-4">
                  <div className={iconTile}>
                    <FileText className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {NOMES_ANTIGOS[a.tipoDocumento] ?? a.tipoDocumento}
                      </h3>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[a.status]?.class}`}>
                        {statusConfig[a.status]?.icon}
                        {statusConfig[a.status]?.label}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-zinc-400 mb-1">
                      <span className="font-medium text-gray-700 dark:text-zinc-300">Área:</span> {a.areaPretendida}
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {new Date(a.created_at).toLocaleDateString("pt-PT")}
                    </p>
                    {a.feedback && (
                      <div className="mt-3 p-3 rounded-xl bg-blue-50 dark:bg-blue-500/5 border border-blue-100 dark:border-blue-500/10">
                        <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Feedback:</p>
                        <p className="text-sm text-gray-700 dark:text-zinc-300">{a.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default AnaliseDocumentoPage;
