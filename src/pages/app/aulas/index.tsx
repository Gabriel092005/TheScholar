import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Video, Plus, Calendar, Clock, Users,
  Loader2, X, Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUser } from "@/api/useGetProfile";
import { aulasApi, type AulaOnline } from "@/api/aulas";
import { bolsasApi } from "@/api/bolsas";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";

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

const STATUS_CONFIG: Record<string, { label: string; class: string }> = {
  AGENDADA: { label: "Agendada", class: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" },
  AO_VIVO: { label: "Ao Vivo", class: "bg-green-50 text-green-700 dark:bg-green-500/10 dark:text-green-400 animate-pulse" },
  FINALIZADA: { label: "Finalizada", class: "bg-gray-50 text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400" },
  CANCELADA: { label: "Cancelada", class: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" },
};

function AulaCard({ aula, isHost }: { aula: AulaOnline; isHost: boolean }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const statusCfg = STATUS_CONFIG[aula.status] || STATUS_CONFIG.AGENDADA;

  const participarMutation = useMutation({
    mutationFn: () => aulasApi.participar(aula.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      navigate(`/aulas/${aula.id}`);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.message || "Erro ao entrar na aula";
      toast.error(msg);
    },
  });

  const isLive = aula.status === "AO_VIVO";
  const isUpcoming = aula.status === "AGENDADA";
  const dataAula = new Date(aula.data);
  const jaPassou = dataAula < new Date();
  const podeEntrar = isLive || (isUpcoming && jaPassou);

  return (
    <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-white/[0.02] p-5 active:scale-[0.98] transition-all">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            isLive ? "bg-green-500" : "bg-gray-100 dark:bg-white/[0.06]"
          }`}>
            <Video className={`h-5 w-5 ${isLive ? "text-white" : "text-gray-400"}`} />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white truncate">
              {aula.titulo}
            </h3>
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              {aula.host.nome}
            </p>
          </div>
        </div>
        <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-lg ${statusCfg.class}`}>
          {statusCfg.label}
        </span>
      </div>

      {aula.descricao && (
        <p className="text-xs text-gray-500 dark:text-zinc-400 mb-3 line-clamp-2 leading-relaxed">
          {aula.descricao}
        </p>
      )}

      <div className="flex items-center gap-4 text-[11px] text-gray-400 dark:text-zinc-500 mb-4">
        <span className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {formataData(aula.data)}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" />
          {formataHora(aula.data)}
        </span>
        <span className="flex items-center gap-1">
          <Users className="h-3.5 w-3.5" />
          {aula._count.participantes}
        </span>
        {aula.bolsa && (
          <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
            {aula.bolsa.titulo}
          </span>
        )}
      </div>

      <div className="flex gap-2">
        {(isLive || podeEntrar) && (
          <Button
            size="sm"
            onClick={() => navigate(`/aulas/${aula.id}`)}
            className="flex-1 h-9 text-xs font-bold rounded-xl bg-emerald-500 text-black hover:bg-emerald-400"
          >
            <Play className="h-3.5 w-3.5 mr-1" />
            Entrar
          </Button>
        )}
        {isUpcoming && !jaPassou && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => participarMutation.mutate()}
            disabled={participarMutation.isPending}
            className="flex-1 h-9 text-xs font-bold rounded-xl dark:text-white"
          >
            {participarMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              "Participar"
            )}
          </Button>
        )}
        {isLive && isHost && (
          <Button
            size="sm"
            variant="outline"
            onClick={() => aulasApi.updateStatus(aula.id, { status: "FINALIZADA" }).then(() => {
              queryClient.invalidateQueries({ queryKey: ["aulas"] });
            })}
            className="h-9 text-xs font-bold rounded-xl text-red-600 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
          >
            <X className="h-3.5 w-3.5 mr-1" />
            Encerrar
          </Button>
        )}
      </div>
    </div>
  );
}

function CreateAulaDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", hora: "", duracao: 60, bolsaId: "none" });

  const { data: bolsasData } = useQuery({
    queryKey: ["bolsas"],
    queryFn: () => bolsasApi.list(),
  });
  const bolsas = bolsasData?.data || [];

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
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast.success("Aula criada com sucesso!");
      setForm({ titulo: "", descricao: "", data: "", hora: "", duracao: 60, bolsaId: "none" });
      onClose();
    },
    onError: () => toast.error("Erro ao criar aula"),
  });

  const podeCriar = form.titulo.trim() && form.data && form.hora;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md rounded-2xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Nova Aula Online</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 block">Título</label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Aula de Matemática"
                className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 block">Descrição (opcional)</label>
              <Input
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Breve descrição da aula"
                className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 block">Data</label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="rounded-xl dark:text-white [color-scheme:dark]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 block">Hora</label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="rounded-xl dark:text-white [color-scheme:dark]"
                />
            </div>
          </div>
          <div>
            <label className="text-xs font-semibold text-gray-500 dark:text-zinc-400 mb-1 block">Duração (minutos)</label>
            <Input
              type="number"
              value={form.duracao}
              onChange={(e) => setForm({ ...form, duracao: Number(e.target.value) })}
              min={15}
              step={15}
              className="rounded-xl dark:text-white placeholder:dark:text-zinc-500"
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
          <Button
            onClick={() => createMutation.mutate()}
            disabled={!podeCriar || createMutation.isPending}
            className="w-full h-11 text-sm font-bold rounded-xl bg-emerald-500 text-black dark:text-white hover:bg-emerald-400"
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Criar Aula"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AulasOnlinePage() {
  const { user } = useUser();
  const [criarOpen, setCriarOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["aulas"],
    queryFn: () => aulasApi.list(),
  });

  const aulas = data?.data || [];
  const agora = new Date();

  const aoVivo = aulas.filter((a) => a.status === "AO_VIVO");
  const agendadas = aulas.filter((a) => a.status === "AGENDADA" && new Date(a.data) >= agora);
  const passadas = aulas.filter((a) =>
    a.status === "FINALIZADA" || a.status === "CANCELADA" ||
    (a.status === "AGENDADA" && new Date(a.data) < agora)
  );

  function podeCriar() {
    return user?.role === "ADMIN";
  }

  return (
    <div className="pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white dark:bg-[#111113] border-b border-gray-100 dark:border-white/[0.06] px-5 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900 dark:text-white">Aulas ao Vivo</h1>
            <p className="text-xs text-gray-400 dark:text-zinc-500">Aulas ao vivo com videochamada</p>
          </div>
          {podeCriar() && (
            <Button
              onClick={() => setCriarOpen(true)}
              className="h-10 px-4 text-xs font-bold rounded-xl bg-emerald-500 text-black hover:bg-emerald-400 shadow-lg shadow-emerald-500/20"
            >
              <Plus className="h-4 w-4 mr-1" />
              Criar
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : aulas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-5 text-center">
          <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center mb-4">
            <Video className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
          </div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Nenhuma aula</h3>
          <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-xs">
            Crie a sua primeira aula online ou aguarde por convites.
          </p>
        </div>
      ) : (
        <div className="px-5 space-y-6 pt-5">
          {aoVivo.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                Ao Vivo
              </h2>
              <div className="space-y-3">
                {aoVivo.map((aula) => (
                  <AulaCard key={aula.id} aula={aula} isHost={aula.hostId === user?.id} />
                ))}
              </div>
            </section>
          )}

          {agendadas.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Próximas Aulas</h2>
              <div className="space-y-3">
                {agendadas.map((aula) => (
                  <AulaCard key={aula.id} aula={aula} isHost={aula.hostId === user?.id} />
                ))}
              </div>
            </section>
          )}

          {passadas.length > 0 && (
            <section>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-3">Anteriores</h2>
              <div className="space-y-3">
                {passadas.map((aula) => (
                  <AulaCard key={aula.id} aula={aula} isHost={aula.hostId === user?.id} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      <CreateAulaDialog open={criarOpen} onClose={() => setCriarOpen(false)} />
    </div>
  );
}
