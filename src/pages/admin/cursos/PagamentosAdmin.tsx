import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CreditCard, Search, CheckCircle, XCircle, Clock,
  Loader2, Smartphone, Landmark, Eye, ChevronUp,
  User, FileText, ExternalLink, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cursosApi, type CursoPagamento } from "@/api/cursos";
import { api } from "@/lib/axios";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import toast from "react-hot-toast";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

type StatusType = "APROVADO" | "REJEITADO" | "CANCELADO";

const PAYMENT_METHODS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  EXPRESS:       { label: "Express",       icon: Smartphone, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  MULTICAIXA:    { label: "Multicaixa",    icon: CreditCard, color: "text-blue-600",    bg: "bg-blue-50 dark:bg-blue-500/10" },
  TRANSFERENCIA: { label: "Transferência", icon: Landmark,   color: "text-purple-600",  bg: "bg-purple-50 dark:bg-purple-500/10" },
};

const COLORS = ["bg-emerald-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500", "bg-rose-500"];

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDENTE:  { label: "Pendente",  classes: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400" },
  APROVADO:  { label: "Aprovado",  classes: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  REJEITADO: { label: "Rejeitado", classes: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" },
  CANCELADO: { label: "Cancelado", classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400" },
};

export function PagamentosAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [avaliando, setAvaliando] = useState<string | null>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-pagamentos", statusFilter],
    queryFn: () => cursosApi.listPagamentos({ status: statusFilter !== "todos" ? statusFilter : undefined }),
  });

  const pagamentos = (response?.data || []) as CursoPagamento[];

  const avaliarMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: StatusType }) =>
      cursosApi.avaliarPagamento(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pagamentos"] });
      toast.success("Pagamento avaliado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao avaliar pagamento");
    },
    onSettled: () => setAvaliando(null),
  });

  const deletePagamentoMutation = useMutation({
    mutationFn: cursosApi.deletePagamento,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-pagamentos"] });
      toast.success("Pagamento eliminado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao eliminar pagamento");
    },
  });

  const filteredPagamentos = pagamentos.filter(p => {
    const matchSearch = !search ||
      p.usuario?.nome?.toLowerCase().includes(search.toLowerCase()) ||
      p.curso?.titulo?.toLowerCase().includes(search.toLowerCase()) ||
      p.referencia?.toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const handleAvaliar = (id: string, novoStatus: StatusType) => {
    setAvaliando(id);
    avaliarMutation.mutate({ id, status: novoStatus });
  };

  const formatPrice = (preco: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "AOA",
    }).format(preco);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleString("pt-PT", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const pendentes = pagamentos.filter(p => p.status === "PENDENTE");
  const aprovados = pagamentos.filter(p => p.status === "APROVADO");
  const rejeitados = pagamentos.filter(p => p.status === "REJEITADO" || p.status === "CANCELADO");

  const getUserInitials = (nome?: string) => nome?.substring(0, 2).toUpperCase() || "U";
  const getUserColor = (nome?: string) => COLORS[(nome?.length || 0) % COLORS.length];

  function renderPaymentMethod(metodo?: string | null) {
    if (!metodo) return <span className="text-gray-400">—</span>;
    const method = PAYMENT_METHODS[metodo];
    if (!method) return <span className="text-sm text-gray-500">{metodo}</span>;
    const Icon = method.icon;
    return (
      <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold uppercase tracking-wider ${method.bg} ${method.color}`}>
        <Icon className="w-4 h-4" />
        {method.label}
      </span>
    );
  }

  function renderDetails(pagamento: CursoPagamento) {
    const nome = pagamento.usuario?.nome || "Usuário";
    const email = pagamento.usuario?.email || "";
    const userImage = pagamento.usuario?.image_path
      ? `${api.defaults.baseURL}/${pagamento.usuario.image_path}`
      : "";

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
      >
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-4">
                <User size={14} />
                Dados do Usuário
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700">
                    <AvatarImage src={userImage} className="object-cover" />
                    <AvatarFallback className={`${getUserColor(nome)} text-white text-xs font-bold`}>
                      {getUserInitials(nome)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{nome}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">{email}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-4">
                <CreditCard size={14} />
                Detalhes do Pagamento
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">Valor</span>
                  <span className="font-medium text-gray-900 dark:text-white">{formatPrice(Number(pagamento.valor))}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">Método</span>
                  <span>{renderPaymentMethod(pagamento.metodo)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-zinc-500">Referência</span>
                  <span className="font-mono text-gray-900 dark:text-white">{pagamento.referencia || "-"}</span>
                </div>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-5">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-4">
                <FileText size={14} />
                Curso
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">{pagamento.curso?.titulo || "-"}</p>
              {pagamento.comprovativo && (
                <a
                  href={pagamento.comprovativo.startsWith("http") ? pagamento.comprovativo : `${api.defaults.baseURL}/${pagamento.comprovativo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline mt-3"
                >
                  <ExternalLink size={12} />
                  Ver comprovativo
                </a>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pagamentos de Cursos</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-0.5">
            Aprovar ou rejeitar pagamentos dos usuários
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shrink-0">
              <Clock className="h-7 w-7 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{pendentes.length}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Pendentes</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
              <CheckCircle className="h-7 w-7 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{aprovados.length}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Aprovados</p>
            </div>
          </div>
          <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 p-5 flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
              <XCircle className="h-7 w-7 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{rejeitados.length}</p>
              <p className="text-sm text-gray-500 dark:text-zinc-400">Rejeitados</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-semibold text-gray-900 dark:text-white">Lista de Pagamentos</h3>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <div className="relative flex-1 sm:flex-none">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10 w-full sm:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Filtrar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendentes</SelectItem>
                  <SelectItem value="APROVADO">Aprovados</SelectItem>
                  <SelectItem value="REJEITADO">Rejeitados</SelectItem>
                  <SelectItem value="CANCELADO">Cancelados</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredPagamentos.length === 0 ? (
            <div className="text-center py-16">
              <CreditCard size={44} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
              <p className="text-gray-500 dark:text-zinc-500">Nenhum pagamento encontrado</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800">
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Usuário</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Curso</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Valor</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Método</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Referência</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                      <th className="text-left px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Data</th>
                      <th className="text-right px-5 py-4 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPagamentos.map((pagamento) => {
                      const nome = pagamento.usuario?.nome || "Usuário";
                      const email = pagamento.usuario?.email || "";
                      const userImage = pagamento.usuario?.image_path
                        ? `${api.defaults.baseURL}/${pagamento.usuario.image_path}`
                        : "";
                      return (
                        <tr
                          key={pagamento.id}
                          className="border-b border-gray-50 dark:border-zinc-800/80 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700 shrink-0">
                                <AvatarImage src={userImage} className="object-cover" />
                                <AvatarFallback className={`${getUserColor(nome)} text-white text-xs font-bold`}>
                                  {getUserInitials(nome)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm">{nome}</p>
                                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2 max-w-[200px]">
                              {pagamento.curso?.titulo || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="font-semibold text-gray-900 dark:text-white">
                              {formatPrice(Number(pagamento.valor))}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {renderPaymentMethod(pagamento.metodo)}
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500 dark:text-zinc-400 font-mono">
                              {pagamento.referencia || "-"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full ${statusConfig[pagamento.status]?.classes || statusConfig.PENDENTE.classes}`}>
                              {statusConfig[pagamento.status]?.label || pagamento.status}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500 dark:text-zinc-500 whitespace-nowrap">
                              {formatDate(pagamento.created_at)}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => setExpandedId(expandedId === pagamento.id ? null : pagamento.id)}
                                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                                title="Ver detalhes"
                              >
                                {expandedId === pagamento.id ? (
                                  <ChevronUp size={16} className="text-gray-400" />
                                ) : (
                                  <Eye size={16} className="text-emerald-500" />
                                )}
                              </button>
                              {pagamento.status === "PENDENTE" && (
                                <>
                                  <Button
                                    size="sm"
                                    className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4"
                                    onClick={() => handleAvaliar(pagamento.id, "APROVADO")}
                                    disabled={avaliando === pagamento.id}
                                  >
                                    {avaliando === pagamento.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <CheckCircle className="h-4 w-4 mr-1.5" />
                                    )}
                                    Aprovar
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    className="h-9 px-4"
                                    onClick={() => handleAvaliar(pagamento.id, "REJEITADO")}
                                    disabled={avaliando === pagamento.id}
                                  >
                                    {avaliando === pagamento.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <XCircle className="h-4 w-4 mr-1.5" />
                                    )}
                                    Rejeitar
                                  </Button>
                                </>
                              )}
                              {pagamento.status === "APROVADO" && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="border-zinc-400 text-zinc-600 hover:bg-zinc-50 dark:border-zinc-600 dark:text-zinc-400 dark:hover:bg-zinc-800 h-9 px-4"
                                  onClick={() => handleAvaliar(pagamento.id, "CANCELADO")}
                                  disabled={avaliando === pagamento.id}
                                >
                                  {avaliando === pagamento.id ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                  ) : (
                                    <XCircle className="h-4 w-4 mr-1.5" />
                                  )}
                                  Cancelar
                                </Button>
                              )}
                              {pagamento.status !== "PENDENTE" && pagamento.status !== "APROVADO" && (
                                <span className="text-sm text-gray-400 dark:text-zinc-500 italic">
                                  {pagamento.observacoes || "—"}
                                </span>
                              )}
                              <button
                                onClick={() => {
                                  if (window.confirm(`Tem a certeza que deseja eliminar este pagamento?`)) {
                                    deletePagamentoMutation.mutate(pagamento.id);
                                  }
                                }}
                                className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                                title="Eliminar"
                              >
                                <Trash2 size={16} className="text-red-400" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </ScrollArea>
              </div>

              <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
                {filteredPagamentos.map((pagamento) => {
                  const nome = pagamento.usuario?.nome || "Usuário";
                  const email = pagamento.usuario?.email || "";
                  const userImage = pagamento.usuario?.image_path
                    ? `${api.defaults.baseURL}/${pagamento.usuario.image_path}`
                    : "";
                  return (
                    <div key={pagamento.id} className="p-5 space-y-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-11 h-11 border border-gray-200 dark:border-gray-700 shrink-0">
                            <AvatarImage src={userImage} className="object-cover" />
                            <AvatarFallback className={`${getUserColor(nome)} text-white text-xs font-bold`}>
                              {getUserInitials(nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white">{nome}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-3 py-1.5 text-xs font-medium rounded-full shrink-0 ${statusConfig[pagamento.status]?.classes || statusConfig.PENDENTE.classes}`}>
                          {statusConfig[pagamento.status]?.label || pagamento.status}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Curso</p>
                          <p className="text-gray-700 dark:text-zinc-300 truncate">{pagamento.curso?.titulo || "-"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Valor</p>
                          <p className="font-semibold text-gray-900 dark:text-white">{formatPrice(Number(pagamento.valor))}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Método</p>
                          <div className="mt-0.5">{renderPaymentMethod(pagamento.metodo)}</div>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Data</p>
                          <p className="text-gray-700 dark:text-zinc-300">{formatDate(pagamento.created_at)}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => setExpandedId(expandedId === pagamento.id ? null : pagamento.id)}
                          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
                        >
                          {expandedId === pagamento.id ? (
                            <ChevronUp size={16} className="text-gray-400" />
                          ) : (
                            <Eye size={16} className="text-emerald-500" />
                          )}
                        </button>
                        {pagamento.status === "PENDENTE" && (
                          <>
                            <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white h-9 px-4 flex-1"
                              onClick={() => handleAvaliar(pagamento.id, "APROVADO")}
                              disabled={avaliando === pagamento.id}
                            >
                              {avaliando === pagamento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                              Aprovar
                            </Button>
                            <Button size="sm" variant="destructive" className="h-9 px-4 flex-1"
                              onClick={() => handleAvaliar(pagamento.id, "REJEITADO")}
                              disabled={avaliando === pagamento.id}
                            >
                              {avaliando === pagamento.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1.5" />}
                              Rejeitar
                            </Button>
                          </>
                        )}
                        <button
                          onClick={() => {
                            if (window.confirm(`Tem a certeza que deseja eliminar este pagamento?`)) {
                              deletePagamentoMutation.mutate(pagamento.id);
                            }
                          }}
                          className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Eliminar"
                        >
                          <Trash2 size={16} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {expandedId && renderDetails(filteredPagamentos.find(p => p.id === expandedId)!)}
      </motion.div>
    </div>
  );
}

export default PagamentosAdmin;