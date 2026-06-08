import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Search,
  Check,
  X,
  Eye,
  Loader2,
  ChevronUp,
  FileText,
  ExternalLink,
  Award,
  User,
  Mail,
  Phone,
  Trash2,
  LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { bolsasApi, type BolsaInscricao } from "@/api/bolsas";
import { api } from "@/lib/axios";
import { ScrollArea } from "@/components/ui/scroll-area";
import toast from "react-hot-toast";

const COLORS = ["bg-emerald-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500", "bg-rose-500"];

const statusConfig: Record<string, { label: string; classes: string }> = {
  PENDENTE: {
    label: "Pendente",
    classes: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
  },
  APROVADA: {
    label: "Aprovada",
    classes: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  REJEITADA: {
    label: "Rejeitada",
    classes: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
  },
  CANCELADA: {
    label: "Cancelada",
    classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
  },
};

function makeUrl(path?: string) {
  if (!path) return "";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  return `${api.defaults.baseURL}${path.startsWith("/") ? "" : "/"}${path}`;
}

interface InscricoesTableProps {
  tipoInteresse: "CONSULTORIA" | "MENTORIA" | "INSCRICAO";
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
}

export function InscricoesTable({ tipoInteresse, title, description, emptyMessage, icon: EmptyIcon }: InscricoesTableProps) {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [filterBolsa, setFilterBolsa] = useState("todas");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [avaliarModal, setAvaliarModal] = useState<{
    inscricao: BolsaInscricao;
    action: "APROVADA" | "REJEITADA";
  } | null>(null);
  const [observacoes, setObservacoes] = useState("");

  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ["admin-inscricoes", tipoInteresse],
    queryFn: () => bolsasApi.listInscricoesAdmin({ tipoInteresse }),
  });

  const { data: bolsasResponse } = useQuery({
    queryKey: ["admin-bolsas"],
    queryFn: () => bolsasApi.list({}),
  });

  const avaliarMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "APROVADA" | "REJEITADA" }) =>
      bolsasApi.avaliarInscricao(id, { status, observacoes: observacoes || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inscricoes"] });
      toast.success("Registo avaliado com sucesso!");
      setAvaliarModal(null);
      setObservacoes("");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao avaliar");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bolsasApi.deleteInscricao,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-inscricoes"] });
      toast.success("Inscrição eliminada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao eliminar inscrição");
    },
  });

  const filteredInscricoes = (inscricoes || []).filter((i) => {
    const nome = i.usuario?.nome || i.nome || "";
    const email = i.usuario?.email || i.email || "";
    const bolsaTitulo = i.bolsa?.titulo || "";
    const matchesSearch =
      nome.toLowerCase().includes(search.toLowerCase()) ||
      email.toLowerCase().includes(search.toLowerCase()) ||
      bolsaTitulo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "todas" || i.status === filterStatus;
    const matchesBolsa =
      filterBolsa === "todas" || i.bolsaId === filterBolsa;
    return matchesSearch && matchesStatus && matchesBolsa;
  });

  const getUserInitials = (nome?: string) => nome?.substring(0, 2).toUpperCase() || "U";
  const getUserColor = (nome?: string) => COLORS[(nome?.length || 0) % COLORS.length];

  function renderDocuments(inscricao: BolsaInscricao) {
    const docs = [
      { key: "biUrl", label: "Identificação (BI)" },
      { key: "certificadoUrl", label: "Certificado" },
      { key: "historicoUrl", label: "Histórico" },
      { key: "documentoUrl", label: "Documento" },
      { key: "comprovativoUrl", label: "Comprovativo de Pagamento" },
    ] as const;

    const hasDocs = docs.some((d) => inscricao[d.key as keyof BolsaInscricao]);
    if (!hasDocs) {
      return <p className="text-xs text-gray-400 dark:text-zinc-500">Nenhum documento anexado</p>;
    }

    return docs.map(({ key, label }) => {
      const value = inscricao[key as keyof BolsaInscricao] as string | undefined;
      if (!value) return null;
      return (
        <a
          key={key}
          href={makeUrl(value)}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400 hover:underline break-all"
        >
          <ExternalLink size={12} className="shrink-0" />
          {label}
        </a>
      );
    });
  }

  function renderAcoes(inscricao: BolsaInscricao) {
    const isExpanded = expandedId === inscricao.id;
    const podeAvaliar = inscricao.status === "PENDENTE";
    return (
      <div className="flex items-center gap-1">
        <button
          onClick={() => setExpandedId(isExpanded ? null : inscricao.id)}
          className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]"
          title="Ver detalhes"
        >
          {isExpanded ? (
            <ChevronUp size={14} className="text-gray-400" />
          ) : (
            <Eye size={14} className="text-emerald-500" />
          )}
        </button>
        {podeAvaliar && (
          <>
            <button
              onClick={() => { setAvaliarModal({ inscricao, action: "APROVADA" }); setObservacoes(""); }}
              className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
              title="Aprovar"
            >
              <Check size={14} className="text-emerald-500" />
            </button>
            <button
              onClick={() => { setAvaliarModal({ inscricao, action: "REJEITADA" }); setObservacoes(""); }}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
              title="Rejeitar"
            >
              <X size={14} className="text-red-400" />
            </button>
          </>
        )}
        <button
          onClick={() => {
            if (window.confirm(`Tem a certeza que deseja eliminar esta inscrição?`)) {
              deleteMutation.mutate(inscricao.id);
            }
          }}
          className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10"
          title="Eliminar"
        >
          <Trash2 size={14} className="text-red-400" />
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-0 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  const label = tipoInteresse === "INSCRICAO" ? "Inscrição" : tipoInteresse === "CONSULTORIA" ? "Consultoria" : "Mentoria";

  return (
    <div className="p-0">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-zinc-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500">{description}</p>
          </div>

          <div className="p-5 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
            <div className="relative flex-1 min-w-[200px] w-full sm:max-w-md">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar por nome, email ou bolsa..."
                className="pl-10"
              />
            </div>
            <div className="flex flex-wrap gap-4 w-full sm:w-auto">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todos</SelectItem>
                  <SelectItem value="PENDENTE">Pendentes</SelectItem>
                  <SelectItem value="APROVADA">Aprovadas</SelectItem>
                  <SelectItem value="REJEITADA">Rejeitadas</SelectItem>
                  <SelectItem value="CANCELADA">Canceladas</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterBolsa} onValueChange={setFilterBolsa}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Bolsa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todas">Todas as Bolsas</SelectItem>
                  {(bolsasResponse?.data || []).map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.titulo.length > 30 ? b.titulo.substring(0, 30) + "..." : b.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {filteredInscricoes.length === 0 ? (
            <div className="text-center py-16">
              <EmptyIcon size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
              <p className="text-gray-500 dark:text-zinc-500">{emptyMessage}</p>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-zinc-800">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Candidato</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">{label === "Consultoria" ? "Consultoria" : label === "Mentoria" ? "Mentoria" : "Bolsa"}</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Data</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInscricoes.map((inscricao) => {
                      const nome = inscricao.usuario?.nome || inscricao.nome || "—";
                      const email = inscricao.usuario?.email || inscricao.email || "—";
                      const userImage = inscricao.usuario?.image_path
                        ? `${api.defaults.baseURL}/${inscricao.usuario.image_path}`
                        : "";
                      const status = statusConfig[inscricao.status] || statusConfig.PENDENTE;

                      return (
                        <tr
                          key={inscricao.id}
                          className="border-b border-gray-50 dark:border-zinc-800/80 hover:bg-gray-50 dark:hover:bg-zinc-900 transition-colors"
                        >
                          <td className="px-5 py-4">
                            <div className="flex items-center gap-3">
                              <Avatar className="w-9 h-9 border border-gray-200 dark:border-gray-700 shrink-0">
                                <AvatarImage src={userImage} className="object-cover" />
                                <AvatarFallback className={`${getUserColor(nome)} text-white text-[10px] font-bold`}>
                                  {getUserInitials(nome)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{nome}</p>
                                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-600 dark:text-zinc-400 line-clamp-2">
                              {inscricao.bolsa?.titulo || "—"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className="text-sm text-gray-500 dark:text-zinc-500 whitespace-nowrap">
                              {new Date(inscricao.created_at).toLocaleDateString("pt-PT")}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${status.classes}`}>
                              {status.label}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            {renderAcoes(inscricao)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                </ScrollArea>
              </div>

              <div className="md:hidden divide-y divide-gray-100 dark:divide-white/[0.06]">
                {filteredInscricoes.map((inscricao) => {
                  const nome = inscricao.usuario?.nome || inscricao.nome || "—";
                  const email = inscricao.usuario?.email || inscricao.email || "—";
                  const userImage = inscricao.usuario?.image_path
                    ? `${api.defaults.baseURL}/${inscricao.usuario.image_path}`
                    : "";
                  const status = statusConfig[inscricao.status] || statusConfig.PENDENTE;

                  return (
                    <div key={inscricao.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <Avatar className="w-10 h-10 border border-gray-200 dark:border-gray-700 shrink-0">
                            <AvatarImage src={userImage} className="object-cover" />
                            <AvatarFallback className={`${getUserColor(nome)} text-white text-xs font-bold`}>
                              {getUserInitials(nome)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 dark:text-white text-sm truncate">{nome}</p>
                            <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">{email}</p>
                          </div>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full shrink-0 ${status.classes}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{label === "Consultoria" ? "Consultoria" : label === "Mentoria" ? "Mentoria" : "Bolsa"}</p>
                          <p className="text-sm text-gray-700 dark:text-zinc-300 truncate">
                            {inscricao.bolsa?.titulo || "—"}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Data</p>
                          <p className="text-sm text-gray-700 dark:text-zinc-300">
                            {new Date(inscricao.created_at).toLocaleDateString("pt-PT")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        {renderAcoes(inscricao)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {expandedId && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 bg-white dark:bg-zinc-950 rounded-2xl border border-gray-100 dark:border-zinc-800 overflow-hidden"
          >
            {(() => {
              const inscricao = filteredInscricoes.find((i) => i.id === expandedId);
              if (!inscricao) return null;
              const nome = inscricao.usuario?.nome || inscricao.nome || "—";
              const email = inscricao.usuario?.email || inscricao.email || "—";
              const phone = inscricao.usuario?.phone || inscricao.telefone || "—";

              return (
                <div className="p-5 space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-3">
                        <User size={12} />
                        Dados do Candidato
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                          <User size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate">{nome}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                          <Mail size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate">{email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                          <Phone size={14} className="text-gray-400 shrink-0" />
                          <span className="truncate">{phone}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-4">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-3">
                        <Award size={12} />
                        {tipoInteresse === "CONSULTORIA" ? "Consultoria" : tipoInteresse === "MENTORIA" ? "Mentoria" : "Bolsa"}
                      </div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {inscricao.bolsa?.titulo || "—"}
                      </p>
                      {inscricao.bolsa?.instituicao && (
                        <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                          {inscricao.bolsa.instituicao} • {inscricao.bolsa.pais}
                        </p>
                      )}
                    </div>

                    <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-4 sm:col-span-2 lg:col-span-1">
                      <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-3">
                        <FileText size={12} />
                        Documentos
                      </div>
                      <div className="space-y-2">
                        {renderDocuments(inscricao)}
                      </div>
                    </div>
                  </div>

                  {inscricao.observacoes && (
                    <div className="bg-gray-50 dark:bg-zinc-900 rounded-xl p-4">
                      <p className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500 mb-2">Observações</p>
                      <p className="text-sm text-gray-700 dark:text-zinc-300 whitespace-pre-wrap">{inscricao.observacoes}</p>
                    </div>
                  )}
                </div>
              );
            })()}
          </motion.div>
        )}
      </motion.div>

      <Dialog
        open={!!avaliarModal}
        onOpenChange={(open) => {
          if (!open) { setAvaliarModal(null); setObservacoes(""); }
        }}
      >
        <DialogContent className="sm:max-w-lg bg-white dark:bg-zinc-950 border-gray-200 dark:border-zinc-800">
              <div
                className={`absolute top-0 left-0 right-0 h-1.5 rounded-t-lg ${
                  avaliarModal?.action === "APROVADA"
                    ? "bg-emerald-500"
                    : "bg-red-500"
                }`}
              />

              <div className="flex items-center gap-3 pt-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    avaliarModal?.action === "APROVADA"
                      ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                      : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                  }`}
                >
                  {avaliarModal?.action === "APROVADA" ? (
                    <Check size={20} />
                  ) : (
                    <X size={20} />
                  )}
                </div>
                <div>
                  <DialogTitle className="text-gray-900 dark:text-white">
                    {avaliarModal?.action === "APROVADA" ? `Aprovar ${label}` : `Rejeitar ${label}`}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500 dark:text-zinc-400">
                    {avaliarModal?.action === "APROVADA"
                      ? `Esta ação irá aprovar o registo de ${label.toLowerCase()}.`
                      : `Esta ação irá rejeitar o registo de ${label.toLowerCase()}.`}
                  </DialogDescription>
                </div>
              </div>

              <div className="bg-gray-50 dark:bg-zinc-900/80 rounded-xl p-4 flex items-center gap-3">
                <Avatar className="w-12 h-12 border border-gray-200 dark:border-zinc-700 shrink-0">
                  <AvatarImage
                    src={
                      avaliarModal?.inscricao.usuario?.image_path
                        ? `${api.defaults.baseURL}/${avaliarModal?.inscricao.usuario.image_path}`
                        : ""
                    }
                    className="object-cover"
                  />
                  <AvatarFallback
                    className={`${getUserColor(avaliarModal?.inscricao.usuario?.nome || avaliarModal?.inscricao.nome)} text-white text-xs font-bold`}
                  >
                    {getUserInitials(avaliarModal?.inscricao.usuario?.nome || avaliarModal?.inscricao.nome)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {avaliarModal?.inscricao.usuario?.nome || avaliarModal?.inscricao.nome || "—"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                    {avaliarModal?.inscricao.usuario?.email || avaliarModal?.inscricao.email || "—"}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-zinc-500 truncate mt-0.5">
                    <Award size={10} className="inline mr-1" />
                    {avaliarModal?.inscricao.bolsa?.titulo || "—"}
                  </p>
                </div>
                {(() => {
                  const st = avaliarModal?.inscricao.status;
                  const cfg = st ? statusConfig[st] : undefined;
                  return (
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full shrink-0 ${cfg?.classes || statusConfig.PENDENTE.classes}`}
                    >
                      {cfg?.label || "Pendente"}
                    </span>
                  );
                })()}
              </div>

              <div>
                <Label className="text-gray-700 dark:text-zinc-300">
                  Observações
                  {avaliarModal?.action === "REJEITADA" && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <Textarea
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  placeholder={
                    avaliarModal?.action === "APROVADA"
                      ? "Parabéns! O seu registo foi aprovado. Entraremos em contacto consigo em breve..."
                      : "Indique o motivo da rejeição (obrigatório)..."
                  }
                  className={`mt-1.5 ${
                    avaliarModal?.action === "REJEITADA" && !observacoes.trim()
                      ? "border-red-300 dark:border-red-500/50 focus-visible:ring-red-400"
                      : ""
                  }`}
                  rows={3}
                />
                {avaliarModal?.action === "REJEITADA" && (
                  <p className="text-xs text-red-500 dark:text-red-400 mt-1">
                    {observacoes.trim()
                      ? "O candidato será notificado com esta observação."
                      : "A observação é obrigatória para rejeitar."}
                  </p>
                )}
              </div>

              <DialogFooter className="gap-2 flex-col sm:flex-row">
                <Button
                  onClick={() => { setAvaliarModal(null); setObservacoes(""); }}
                  disabled={avaliarMutation.isPending}
                  className="w-full sm:w-auto bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white"
                >
                  Cancelar
                </Button>
                <Button
                  variant={avaliarModal?.action === "APROVADA" ? undefined : "destructive"}
                  className={
                    avaliarModal?.action === "APROVADA"
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white dark:bg-emerald-600 dark:hover:bg-emerald-500 w-full sm:w-auto"
                      : "w-full sm:w-auto dark:bg-red-700 dark:hover:bg-red-600 dark:text-white"
                  }
                  onClick={() => {
                    if (avaliarModal) {
                      if (avaliarModal.action === "REJEITADA" && !observacoes.trim()) {
                        toast.error("Por favor, indique o motivo da rejeição.");
                        return;
                      }
                      avaliarMutation.mutate({ id: avaliarModal.inscricao.id, status: avaliarModal.action });
                    }
                  }}
                  disabled={
                    avaliarMutation.isPending ||
                    (avaliarModal?.action === "REJEITADA" && !observacoes.trim())
                  }
                >
                  {avaliarMutation.isPending ? (
                    <Loader2 size={16} className="mr-2 animate-spin" />
                  ) : avaliarModal?.action === "APROVADA" ? (
                    <Check size={16} className="mr-2" />
                  ) : (
                    <X size={16} className="mr-2" />
                  )}
                  {avaliarModal?.action === "APROVADA" ? "Aprovar" : "Rejeitar"}
                </Button>
              </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}