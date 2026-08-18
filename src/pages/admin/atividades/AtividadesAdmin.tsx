import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Trash2, Search, CalendarClock, MapPin, Clock,
  ArrowLeft, Calendar, FileText, Tag,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { atividadesApi, type Atividade } from "@/api/atividades";

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
      toast.success("Atividade criada com sucesso!");
      closeForm();
    },
    onError: () => toast.error("Erro ao criar atividade."),
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

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.titulo.trim()) return toast.error("Insira o título.");
    if (!form.data || !form.hora) return toast.error("Selecione data e hora.");

    const dataISO = `${form.data}T${form.hora}:00`;
    createMutation.mutate({
      titulo: form.titulo.trim(),
      descricao: form.descricao.trim() || undefined,
      data: dataISO,
      duracaoMinutos: form.duracaoMinutos ? parseInt(form.duracaoMinutos) : undefined,
      local: form.local.trim() || undefined,
      tipo: form.tipo,
    });
  }

  const filtered = atividades.filter((a) =>
    a.titulo.toLowerCase().includes(search.toLowerCase()) ||
    a.tipo?.toLowerCase().includes(search.toLowerCase())
  );

  if (showForm) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-3xl mx-auto"
      >
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={closeForm}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              Nova Atividade
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Agende uma nova atividade no calendário.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-6 space-y-5">
            <div>
              <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Título *
              </Label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex: Workshop de Empreendedorismo"
                className="mt-1.5"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Data *
                </Label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Hora *
                </Label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="mt-1.5"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Tipo
                </Label>
                <Select
                  value={form.tipo}
                  onValueChange={(v) => setForm({ ...form, tipo: v })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS.map((t) => (
                      <SelectItem key={t.value} value={t.value}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                  Duração (minutos)
                </Label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracaoMinutos}
                  onChange={(e) => setForm({ ...form, duracaoMinutos: e.target.value })}
                  placeholder="60"
                  className="mt-1.5"
                />
              </div>
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Local
              </Label>
              <Input
                value={form.local}
                onChange={(e) => setForm({ ...form, local: e.target.value })}
                placeholder="Ex: Auditório Principal, Online, etc."
                className="mt-1.5"
              />
            </div>

            <div>
              <Label className="text-[10px] font-bold uppercase tracking-[0.14em] text-zinc-500">
                Descrição
              </Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Descreva brevemente a atividade..."
                className="mt-1.5 min-h-[80px]"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={closeForm}
              className="rounded-xl"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createMutation.isPending}
              className="rounded-xl bg-emerald-600 hover:bg-emerald-500"
            >
              {createMutation.isPending ? "Criando..." : "Criar Atividade"}
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
          className="bg-purple-600 hover:bg-purple-500 rounded-xl"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Atividade
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
            {search ? "Nenhuma atividade encontrada." : "Nenhuma atividade criada ainda."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence mode="popLayout">
            {filtered.map((atv) => {
              const dt = new Date(atv.data);
              const tipoColor = TIPO_COLORS[atv.tipo || "ATIVIDADE"] || TIPO_COLORS.ATIVIDADE;
              return (
                <motion.div
                  key={atv.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5 group hover:border-purple-200 dark:hover:border-purple-500/20 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center">
                        <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${tipoColor}`}>
                        {TIPOS.find((t) => t.value === atv.tipo)?.label || atv.tipo}
                      </span>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm("Remover esta atividade?")) {
                          deleteMutation.mutate(atv.id);
                        }
                      }}
                      className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2 truncate">
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
                      {atv.duracaoMinutos ? ` · ${atv.duracaoMinutos} min` : ""}
                    </p>
                    {atv.local && (
                      <p className="text-[11px] text-gray-400 dark:text-zinc-600 flex items-center gap-1.5">
                        <MapPin className="w-3 h-3 shrink-0" />
                        {atv.local}
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
