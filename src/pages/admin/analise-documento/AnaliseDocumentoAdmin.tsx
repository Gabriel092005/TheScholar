import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { FileText, Loader2, Search, ExternalLink, MessageSquare } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { analiseDocumentoApi, type AnaliseDocumento } from "@/api/analise-documento";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

const statusConfig: Record<string, { label: string; class: string }> = {
  PENDENTE: { label: "Pendente", class: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  EM_ANALISE: { label: "Em Análise", class: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  CONCLUIDO: { label: "Concluído", class: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  REJEITADO: { label: "Rejeitado", class: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
};

export function AnaliseDocumentoAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [selected, setSelected] = useState<AnaliseDocumento | null>(null);
  const [feedback, setFeedback] = useState("");
  const [newStatus, setNewStatus] = useState("");

  const { data: analises = [], isLoading } = useQuery({
    queryKey: ["admin-analises", filterStatus],
    queryFn: () => analiseDocumentoApi.listarTodas(filterStatus !== "todas" ? filterStatus : undefined),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, feedback }: { id: string; status: string; feedback?: string }) =>
      analiseDocumentoApi.atualizarStatus(id, { status, feedback }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-analises"] });
      toast.success("Análise atualizada!");
      setSelected(null);
      setFeedback("");
      setNewStatus("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar análise");
    },
  });

  const filtered = analises.filter((a) =>
    !search || a.nome.toLowerCase().includes(search.toLowerCase()) ||
    a.areaPretendida.toLowerCase().includes(search.toLowerCase())
  );

  const openDialog = (a: AnaliseDocumento) => {
    setSelected(a);
    setFeedback(a.feedback || "");
    setNewStatus(a.status);
  };

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Análise de Documentos</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Gerir pedidos de correção e análise de documentos
            </p>
          </div>
          <FileText size={20} className="text-gray-400 dark:text-zinc-600" />
        </div>

        <div className="p-5 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome ou área..."
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos</SelectItem>
              <SelectItem value="PENDENTE">Pendentes</SelectItem>
              <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
              <SelectItem value="CONCLUIDO">Concluídos</SelectItem>
              <SelectItem value="REJEITADO">Rejeitados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Utilizador</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Documento</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Área Pretendida</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Data</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 dark:text-zinc-500">Nenhum pedido encontrado</td></tr>
              ) : (
                filtered.map((a) => (
                  <tr key={a.id} className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          {a.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{a.nome}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{a.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        {a.tipoDocumento === "CV" ? "Currículo (CV)" :
                         a.tipoDocumento === "CARTA_MOTIVACAO" ? "Carta de Motivação" :
                         a.tipoDocumento === "CERTIFICADO" ? "Certificado" : a.tipoDocumento}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-600 dark:text-zinc-400">{a.areaPretendida}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${statusConfig[a.status]?.class}`}>
                        {statusConfig[a.status]?.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500 dark:text-zinc-500">
                        {new Date(a.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {a.arquivoUrl && (
                          <a
                            href={`${api.defaults.baseURL}/uploads/${a.arquivoUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-gray-600 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400"
                          >
                            <ExternalLink size={14} /> Ver
                          </a>
                        )}
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                              onClick={() => openDialog(a)}
                            >
                              <MessageSquare size={14} className="mr-1" /> Analisar
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="sm:max-w-md bg-white dark:bg-[#111113]">
                            <DialogHeader>
                              <DialogTitle className="text-gray-900 dark:text-white">
                                Analisar Documento
                              </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 pt-2">
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Utilizador</p>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">{selected?.nome} ({selected?.email})</p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Documento</p>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">
                                  {selected?.tipoDocumento === "CV" ? "Currículo (CV)" :
                                   selected?.tipoDocumento === "CARTA_MOTIVACAO" ? "Carta de Motivação" :
                                   selected?.tipoDocumento === "CERTIFICADO" ? "Certificado" : selected?.tipoDocumento}
                                </p>
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Área Pretendida</p>
                                <p className="text-sm text-gray-500 dark:text-zinc-400">{selected?.areaPretendida}</p>
                              </div>
                              {selected?.observacao && (
                                <div>
                                  <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">Observação</p>
                                  <p className="text-sm text-gray-500 dark:text-zinc-400">{selected.observacao}</p>
                                </div>
                              )}
                              {selected?.arquivoUrl && (
                                <a
                                  href={`${api.defaults.baseURL}/uploads/${selected.arquivoUrl}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                                >
                                  <ExternalLink size={14} /> Abrir documento
                                </a>
                              )}
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Estado</label>
                                <Select value={newStatus} onValueChange={setNewStatus}>
                                  <SelectTrigger className="mt-1">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="PENDENTE">Pendente</SelectItem>
                                    <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                                    <SelectItem value="CONCLUIDO">Concluído</SelectItem>
                                    <SelectItem value="REJEITADO">Rejeitado</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <label className="text-sm font-medium text-gray-700 dark:text-zinc-300">Feedback</label>
                                <Textarea
                                  value={feedback}
                                  onChange={(e) => setFeedback(e.target.value)}
                                  placeholder="Correções, sugestões e observações..."
                                  className="mt-1 min-h-[120px]"
                                />
                              </div>
                              <Button
                                className="w-full"
                                disabled={updateMutation.isPending}
                                onClick={() => {
                                  if (!selected) return;
                                  updateMutation.mutate({ id: selected.id, status: newStatus, feedback });
                                }}
                              >
                                {updateMutation.isPending ? "A guardar..." : "Guardar"}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
}

export default AnaliseDocumentoAdmin;
