import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Search, CalendarClock, MapPin, Clock,
  ArrowLeft, Calendar,
} from "lucide-react";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { atividadesApi } from "@/api/atividades";
import { cn } from "@/lib/utils";

const TIPOS = [
  { value: "ATIVIDADE", label: "Atividade" },
  { value: "PALESTRA", label: "Palestra" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "EVENTO", label: "Evento" },
];

const TIPO_COLORS: Record<string, string> = {
  ATIVIDADE: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  PALESTRA: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  WORKSHOP: "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
  EVENTO: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
};

const DURACOES = [30, 60, 90, 120];

const rotulo = "text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500 dark:text-zinc-400";

function nomeDuracao(minutos: number) {
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto ? `${horas}h ${resto}min` : `${horas}h`;
}

interface FormData {
  titulo: string;
  descricao: string;
  data: string;
  hora: string;
  duracaoMinutos: string;
  local: string;
  tipo: string;
}

const defaultForm: FormData = {
  titulo: "",
  descricao: "",
  data: "",
  hora: "",
  duracaoMinutos: "",
  local: "",
  tipo: "ATIVIDADE",
};

export function AtividadesAdmin() {
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormData>(defaultForm);
  const queryClient = useQueryClient();

  const { data: atividades = [], isLoading } = useQuery({
    queryKey: ["admin-atividades"],
    queryFn: atividadesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: (payload: { titulo: string; descricao?: string; data: string; duracaoMinutos?: number; local?: string; tipo?: string }) =>
     atividadesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-atividades"] });
      toast.success("Atividade agendada com sucesso!");
      closeForm();
    },
    onError: (err: any) => toast.error(err?.response?.data?.message || "Erro ao agendar atividade."),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => atividadesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-atividades"] });
      toast.success("Atividade removida.");
    },
    onError: () => toast.error("Erro ao remover atividade."),
  });

  function closeForm() {
    setShowForm(false);
    setForm(defaultForm);
  }

  const inicio = form.data && form.hora ? new Date(`${form.data}T${form.hora}`) : null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error("Insira o título.");
    if (!inicio) return toast.error("Selecione data e hora.");
    if (inicio.getTime() < Date.now()) return toast.error("Escolha uma data e hora futuras.");

    createMutation.mutate({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      // Em UTC: sem fuso, o servidor leria esta hora como sendo a dele e o calendário mostraria outra.
      data: inicio.toISOString(),
      duracaoMinutos: form.duracaoMinutos ? parseInt(form.duracaoMinutos) : undefined,
      local: form.local.trim() || undefined,
      tipo: form.tipo,
    });
  }

  const agora = Date.now();
  const termo = search.toLowerCase();
  const filtered = atividades
    .filter((a) => a.titulo.toLowerCase().includes(termo) || a.tipo?.toLowerCase().includes(termo))
    // Primeiro o que está para acontecer, do mais próximo ao mais distante; depois o que já passou.
    .sort((a, b) => {
      const [ta, tb] = [new Date(a.data).getTime(), new Date(b.data).getTime()];
      const [passadaA, passadaB] = [ta < agora, tb < agora];
      if (passadaA !== passadaB) return passadaA ? 1 : -1;
      return passadaA ? tb - ta : ta - tb;
    });

  if (showForm) {
    const duracaoSelecionada = form.duracaoMinutos ? parseInt(form.duracaoMinutos) : null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <button
            type="button"
            onClick={closeForm}
            aria-label="Voltar às atividades"
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              Agendar atividade
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Fica visível no calendário público assim que for agendada.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4 sm:p-6 space-y-5">
            <div>
              <Label htmlFor="atividade-titulo" className={rotulo}>Título *</Label>
              <Input
                id="atividade-titulo"
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Workshop de Empreendedorismo"
                className="mt-1.5"
                required
              />
            </div>

            <fieldset>
              <legend className={rotulo}>Tipo</legend>
              <div className="mt-1.5 grid grid-cols-2 sm:grid-cols-4 gap-2">
                {TIPOS.map((t) => {
                  const ativo = form.tipo === t.value;
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => setForm({ ...form, tipo: t.value })}
                      className={cn(
                        "h-10 rounded-xl border text-sm font-medium transition-colors",
                        ativo
                          ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      {t.label}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="atividade-data" className={rotulo}>Data *</Label>
                <Input
                  id="atividade-data"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="mt-1.5 dark:[color-scheme:dark]"
                  required
                />
              </div>
              <div>
                <Label htmlFor="atividade-hora" className={rotulo}>Hora *</Label>
                <Input
                  id="atividade-hora"
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="mt-1.5 dark:[color-scheme:dark]"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="atividade-duracao" className={rotulo}>Duração (minutos)</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                {DURACOES.map((minutos) => {
                  const ativo = duracaoSelecionada === minutos;
                  return (
                    <button
                      key={minutos}
                      type="button"
                      aria-pressed={ativo}
                      onClick={() => setForm({ ...form, duracaoMinutos: ativo ? "" : String(minutos) })}
                      className={cn(
                        "h-10 rounded-xl border px-3 text-sm font-medium transition-colors",
                        ativo
                          ? "border-purple-500 bg-purple-50 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300"
                          : "border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-400 dark:hover:bg-white/[0.04]"
                      )}
                    >
                      {nomeDuracao(minutos)}
                    </button>
                  );
                })}
                <Input
                  id="atividade-duracao"
                  type="number"
                  min={1}
                  value={form.duracaoMinutos}
                  onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })}
                  placeholder="Outra"
                  className="w-24"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="atividade-local" className={rotulo}>Local</Label>
              <Input
                id="atividade-local"
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Ex: Auditório Principal, Online, etc."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label htmlFor="atividade-descricao" className={rotulo}>Descrição</Label>
              <Textarea
                id="atividade-descricao"
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva brevemente a atividade..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>

            {inicio && (
              <div className="flex items-start gap-3 rounded-xl bg-purple-50 p-3.5 text-sm text-purple-900 dark:bg-purple-500/10 dark:text-purple-200">
                <CalendarClock className="mt-0.5 h-4 w-4 shrink-0" />
                <p className="min-w-0 break-words">
                  <span className="first-letter:uppercase inline-block">
                    {format(inicio, "EEEE, d 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: pt })}
                  </span>
                  {duracaoSelecionada ? ` · ${nomeDuracao(duracaoSelecionada)}` : ""}
                  {form.local.trim() ? ` · ${form.local.trim()}` : ""}
                </p>
              </div>
            )}
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              className="rounded-xl dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-purple-600 hover:bg-purple-500 text-white"
            >
              {createMutation.isPending ? "A agendar..." : "Agendar atividade"}
            </Button>
          </div>
        </form>
      </motion.div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <CalendarClock className="w-7 h-7 text-purple-500" />
            Atividades
          </h1>
          <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1">
            Gerir as atividades, palestras e eventos.
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-purple-600 hover:bg-purple-500 rounded-xl text-white"
        >
          <Plus className="w-4 h-4 mr-2" />
          Agendar atividade
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Pesquisar atividades..."
          className="pl-10 rounded-xl"
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 bg-gray-100 dark:bg-white/[0.04] rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <CalendarClock className="w-10 h-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
          <p className="text-sm text-gray-400 dark:text-zinc-600">
            {search ? "Nenhuma atividade encontrada." : "Nenhuma atividade agendada ainda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((atv) => {
              const dt = new Date(atv.data);
              const passada = dt.getTime() < agora;
              const tipoColor = TIPO_COLORS[atv.tipo || "ATIVIDADE"] || TIPO_COLORS.ATIVIDADE;
              return (
                <motion.div
                  key={atv.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={cn(
                    "bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 group hover:border-purple-200 dark:hover:border-purple-500/20 transition-colors",
                    passada && "opacity-70"
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tipoColor}`}>
                        {TIPOS.find((t) => t.value === atv.tipo)?.label || atv.tipo}
                      </span>
                      {passada && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400">
                          Terminada
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Remover esta atividade?")) {
                          deleteMutation.mutate(atv.id);
                        }
                      }}
                      aria-label={`Remover ${atv.titulo}`}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 break-words">
                    {atv.titulo}
                  </h3>

                  <div className="space-y-1.5">
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 shrink-0" />
                      {dt.toLocaleDateString("pt-PT", { weekday: "long", day: "2-digit", month: "long", year: "numeric" })}
                    </p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5">
                      <Clock className="w-3 h-3 shrink-0" />
                      {dt.toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" })}
                      {atv.duracaoMinutos ? ` · ${nomeDuracao(atv.duracaoMinutos)}` : ""}
                    </p>
                    {atv.local && (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-600 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{atv.local}</span>
                      </p>
                    )}
                  </div>

                  {atv.descricao && (
                    <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-2 line-clamp-2">
                      {atv.descricao}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
