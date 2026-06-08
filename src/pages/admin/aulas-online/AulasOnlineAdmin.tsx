import { useState } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Video, Search, Loader2, Trash2, Calendar, Clock, Users,
  Play, X, CheckCircle, ArrowRight, Plus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { adminApi } from "@/api/admin";
import { aulasApi } from "@/api/aulas";
import { bolsasApi } from "@/api/bolsas";
import toast from "react-hot-toast";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";

type AulaOnlineStatus = "AGENDADA" | "AO_VIVO" | "FINALIZADA" | "CANCELADA";

const STATUS_FILTERS = [
  { label: "Todas", value: "" },
  { label: "Ao Vivo", value: "AO_VIVO" },
  { label: "Agendada", value: "AGENDADA" },
  { label: "Finalizada", value: "FINALIZADA" },
  { label: "Cancelada", value: "CANCELADA" },
];

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  AGENDADA: { label: "Agendada", class: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  AO_VIVO: { label: "Ao Vivo", class: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400" },
  FINALIZADA: { label: "Finalizada", class: "bg-gray-50 text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400" },
  CANCELADA: { label: "Cancelada", class: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
};

function formataData(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "dd MMM yyyy", { locale: pt });
  } catch {
    return data;
  }
}

function formataHora(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "HH:mm", { locale: pt });
  } catch {
    return data;
  }
}

export function AulasOnlineAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [criarOpen, setCriarOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", hora: "", duracao: 60, bolsaId: "none" });

  const { data: bolsasData } = useQuery({
    queryKey: ["bolsas"],
    queryFn: () => bolsasApi.list(),
  });
  const bolsas = bolsasData?.data || [];

  const { data, isLoading } = useQuery({
    queryKey: ["admin-aulas", statusFilter],
    queryFn: () => adminApi.listAulas({ status: statusFilter || undefined }),
  });

  const aulas = data?.data || [];

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AulaOnlineStatus }) =>
      aulasApi.updateStatus(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-aulas"] });
      toast.success("Status atualizado!");
    },
    onError: () => toast.error("Erro ao atualizar status"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => aulasApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-aulas"] });
      toast.success("Aula removida");
    },
    onError: () => toast.error("Erro ao remover aula"),
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const dataStr = `${form.data}T${form.hora}:00`;
      return aulasApi.create({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        data: dataStr,
        duracao: form.duracao,
        bolsaId: form.bolsaId === "none" ? undefined : form.bolsaId,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-aulas"] });
      toast.success("Aula criada com sucesso!");
      setForm({ titulo: "", descricao: "", data: "", hora: "", duracao: 60, bolsaId: "none" });
      setCriarOpen(false);
    },
    onError: () => toast.error("Erro ao criar aula"),
  });

  const filtered = aulas.filter((a) =>
    a.titulo.toLowerCase().includes(search.toLowerCase()) ||
    a.host.nome.toLowerCase().includes(search.toLowerCase())
  );
  const { confirm, ConfirmDialog } = useConfirmDialog();

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Aulas ao Vivo
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Gerir todas as aulas ao vivo da plataforma
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 dark:text-zinc-500">
              Total: {data?.meta.total || 0}
            </span>
            <Button
              onClick={() => setCriarOpen(true)}
              className="h-10 px-4 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Pesquisar por título ou anfitrião..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-sm"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  statusFilter === f.value
                    ? "bg-emerald-500 text-white shadow-sm"
                    : "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/[0.1]"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Video className="h-10 w-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-zinc-500">Nenhuma aula encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {filtered.map((aula) => {
                const statusCfg = STATUS_CONFIG[aula.status] || STATUS_CONFIG.AGENDADA;
                return (
                  <div
                    key={aula.id}
                    className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      aula.status === "AO_VIVO" ? "bg-green-500" : "bg-gray-100 dark:bg-white/[0.06]"
                    }`}>
                      <Video className={`h-5 w-5 ${aula.status === "AO_VIVO" ? "text-white" : "text-gray-400"}`} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 dark:text-white truncate text-sm">
                          {aula.titulo}
                        </p>
                        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg ${statusCfg.class}`}>
                          {statusCfg.label}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-zinc-400 mt-0.5">
                        Anfitrião: {aula.host.nome}
                      </p>
                      <div className="flex items-center gap-3 text-[11px] text-gray-400 dark:text-zinc-500 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {formataData(aula.data)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formataHora(aula.data)}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {aula._count.participantes}
                        </span>
                        {aula.bolsa && (
                          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                            {aula.bolsa.titulo}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {(aula.status === "AO_VIVO" || aula.status === "AGENDADA") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/aulas/${aula.id}`)}
                          className="h-9 w-9 p-0 rounded-xl text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                          title="Entrar na aula"
                        >
                          <ArrowRight className="h-4 w-4" />
                        </Button>
                      )}
                      {aula.status === "AGENDADA" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: aula.id, status: "AO_VIVO" })}
                          disabled={updateStatusMutation.isPending}
                          className="h-9 w-9 p-0 rounded-xl text-green-600 hover:text-green-700 hover:bg-green-50 dark:hover:bg-green-500/10"
                          title="Iniciar aula"
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                      )}
                      {aula.status === "AO_VIVO" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: aula.id, status: "FINALIZADA" })}
                          disabled={updateStatusMutation.isPending}
                          className="h-9 w-9 p-0 rounded-xl text-gray-600 hover:text-gray-700 hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                          title="Finalizar aula"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      {(aula.status === "AGENDADA" || aula.status === "AO_VIVO") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateStatusMutation.mutate({ id: aula.id, status: "CANCELADA" })}
                          disabled={updateStatusMutation.isPending}
                          className="h-9 w-9 p-0 rounded-xl text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                          title="Cancelar aula"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={async () => {
                          const ok = await confirm(`Remover "${aula.titulo}"?`);
                          if (ok) {
                            deleteMutation.mutate(aula.id);
                          }
                        }}
                        disabled={deleteMutation.isPending}
                        className="h-9 w-9 p-0 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                        title="Excluir aula"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
      <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Nova Aula Online</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Título</label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Aula de Matemática"
                className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Descrição (opcional)</label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Breve descrição da aula"
                className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Data</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="rounded-xl dark:text-white [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Hora</label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="rounded-xl dark:text-white [color-scheme:dark]"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Duração (minutos)</label>
              <Input
                type="number"
                value={form.duracao}
                onChange={(e) => setForm({ ...form, duracao: Number(e.target.value) })}
                className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
                min={15}
                step={5}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-white mb-1 block">Bolsa</label>
              <Select value={form.bolsaId} onValueChange={(v) => setForm({ ...form, bolsaId: v })}>
                <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-white/[0.06] border-0 text-gray-700 dark:text-white">
                  <SelectValue placeholder="Nenhuma" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {bolsas.map((b) => (
                    <SelectItem key={b.id} value={b.id}>{b.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCriarOpen(false)}
              className="rounded-xl h-10 font-bold text-sm dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => createMutation.mutate()}
              disabled={!form.titulo.trim() || !form.data || !form.hora || createMutation.isPending}
              className="rounded-xl h-10 font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white"
            >
              {createMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Plus className="h-4 w-4 mr-1" />
              )}
              Criar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
