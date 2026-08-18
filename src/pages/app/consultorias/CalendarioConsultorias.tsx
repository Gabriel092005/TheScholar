import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek,
} from "date-fns";
import { pt } from "date-fns/locale";
import {
  Calendar, ChevronLeft, ChevronRight, CheckCircle2, XCircle,
  Clock, AlertCircle, Loader2, MessageSquare, CalendarDays, ArrowRight,
  Plus, GraduationCap, Video, Users, CalendarClock, MapPin, Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { bolsasApi, type BolsaInscricao } from "@/api/bolsas";
import { aulasApi, type AulaOnline } from "@/api/aulas";
import { atividadesApi, type Atividade } from "@/api/atividades";
import { useUser } from "@/api/useGetProfile";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const ATIVIDADE_TIPOS = [
  { value: "ATIVIDADE", label: "Atividade" },
  { value: "PALESTRA", label: "Palestra" },
  { value: "WORKSHOP", label: "Workshop" },
  { value: "EVENTO", label: "Evento" },
];

const ATIVIDADE_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  ATIVIDADE: { label: "Atividade", dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  PALESTRA: { label: "Palestra", dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  WORKSHOP: { label: "Workshop", dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  EVENTO: { label: "Evento", dot: "bg-purple-500", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
};

const STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string; icon: any }> = {
  APROVADA: {
    label: "Aceite",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
    icon: CheckCircle2,
  },
  REJEITADA: {
    label: "Rejeitada",
    dot: "bg-red-500",
    badge: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400",
    icon: XCircle,
  },
  PENDENTE: {
    label: "Pendente",
    dot: "bg-yellow-500",
    badge: "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400",
    icon: Clock,
  },
  CANCELADA: {
    label: "Cancelada",
    dot: "bg-gray-400",
    badge: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400",
    icon: AlertCircle,
  },
};

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const AULA_STATUS_CONFIG: Record<string, { label: string; dot: string; badge: string }> = {
  AGENDADA: {
    label: "Agendada",
    dot: "bg-blue-500",
    badge: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  AO_VIVO: {
    label: "Ao Vivo",
    dot: "bg-emerald-500",
    badge: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
  },
  FINALIZADA: {
    label: "Finalizada",
    dot: "bg-gray-400",
    badge: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400",
  },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.PENDENTE;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider", config.badge)}>
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

export function CalendarioConsultorias() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filterStatus, setFilterStatus] = useState("TODAS");
  const [agendarOpen, setAgendarOpen] = useState(false);
  const [criarOpen, setCriarOpen] = useState(false);
  const [form, setForm] = useState({ titulo: "", descricao: "", data: "", hora: "", duracao: "", local: "", tipo: "ATIVIDADE" });

  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ["minhas-inscricoes"],
    queryFn: () => bolsasApi.listMinhasInscricoes(),
  });

  const { data: bolsasResponse, isLoading: bolsasLoading } = useQuery({
    queryKey: ["bolsas-consultoria"],
    queryFn: () => bolsasApi.list({ status: "PUBLICADA" }),
  });

  const { data: aulas } = useQuery({
    queryKey: ["aulas", "calendario"],
    queryFn: () => aulasApi.list({ limit: 100 }),
  });

  const { data: atividades } = useQuery({
    queryKey: ["atividades"],
    queryFn: atividadesApi.list,
  });

  const createMutation = useMutation({
    mutationFn: () => {
      const dataStr = `${form.data}T${form.hora}:00`;
      return atividadesApi.create({
        titulo: form.titulo,
        descricao: form.descricao || undefined,
        data: dataStr,
        duracaoMinutos: form.duracao ? Number(form.duracao) : undefined,
        local: form.local || undefined,
        tipo: form.tipo,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast.success("Atividade criada com sucesso!");
      setForm({ titulo: "", descricao: "", data: "", hora: "", duracao: "", local: "", tipo: "ATIVIDADE" });
      setCriarOpen(false);
    },
    onError: () => toast.error("Erro ao criar atividade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => atividadesApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["atividades"] });
      toast.success("Atividade removida");
    },
    onError: () => toast.error("Erro ao remover atividade"),
  });

  const bolsasComConsultoria = useMemo(
    () => (bolsasResponse?.data || []).filter((b) => b.precoConsultoria !== undefined),
    [bolsasResponse]
  );

  const consultorias = useMemo(() => {
    const list = (inscricoes || []).filter(
      (i) => i.tipoInteresse === "CONSULTORIA" && i.dataAgendada
    );
    return list.sort((a, b) => {
      const da = new Date(a.dataAgendada!).getTime();
      const db = new Date(b.dataAgendada!).getTime();
      return da - db;
    });
  }, [inscricoes]);

  const filteredConsultorias = useMemo(() => {
    if (filterStatus === "TODAS") return consultorias;
    return consultorias.filter((i) => i.status === filterStatus);
  }, [consultorias, filterStatus]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const consultoriasPorDia = useMemo(() => {
    const map = new Map<string, BolsaInscricao[]>();
    filteredConsultorias.forEach((insc) => {
      const key = format(new Date(insc.dataAgendada!), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(insc);
      map.set(key, arr);
    });
    return map;
  }, [filteredConsultorias]);

  const aulasAgendadas = useMemo(
    () =>
      (aulas?.data || []).filter((a) =>
        ["AGENDADA", "AO_VIVO", "FINALIZADA"].includes(a.status)
      ),
    [aulas]
  );

  const aulasPorDia = useMemo(() => {
    const map = new Map<string, AulaOnline[]>();
    aulasAgendadas.forEach((aula) => {
      const key = format(new Date(aula.data), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(aula);
      map.set(key, arr);
    });
    return map;
  }, [aulasAgendadas]);

  const atividadesPorDia = useMemo(() => {
    const map = new Map<string, Atividade[]>();
    (atividades || []).forEach((atv) => {
      const key = format(new Date(atv.data), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(atv);
      map.set(key, arr);
    });
    return map;
  }, [atividades]);

  const selecionadas = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (consultoriasPorDia.get(key) || []).slice().sort((a, b) => {
      const da = new Date(a.dataAgendada!).getTime();
      const db = new Date(b.dataAgendada!).getTime();
      return da - db;
    });
  }, [selectedDate, consultoriasPorDia]);

  const aulasDoDia = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (aulasPorDia.get(key) || []).slice().sort((a, b) => {
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      return da - db;
    });
  }, [selectedDate, aulasPorDia]);

  const atividadesDoDia = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (atividadesPorDia.get(key) || []).slice().sort((a, b) => {
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      return da - db;
    });
  }, [selectedDate, atividadesPorDia]);

  const proximas = useMemo(() => {
    const now = new Date();
    return filteredConsultorias
      .filter((i) => new Date(i.dataAgendada!) >= now && i.status === "APROVADA")
      .slice(0, 4);
  }, [filteredConsultorias]);

  const proximasAulas = useMemo(() => {
    const now = new Date();
    return aulasAgendadas
      .filter(
        (a) =>
          (a.status === "AGENDADA" || a.status === "AO_VIVO") &&
          new Date(a.data) >= now
      )
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 4);
  }, [aulasAgendadas]);

  const proximasAtividades = useMemo(() => {
    const now = new Date();
    return (atividades || [])
      .filter((a) => new Date(a.data) >= now)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 4);
  }, [atividades]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  const handlePrev = () => setCurrentMonth((m) => addMonths(m, -1));
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </div>
          Calendário de Atividades
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Acompanhe as suas consultorias, aulas ao vivo e atividades agendadas.
        </p>
      </motion.div>

      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setAgendarOpen(true)}
            className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Agendar Consultoria
          </button>
          {isAdmin && (
            <button
              onClick={() => setCriarOpen(true)}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 shadow-lg shadow-purple-600/20 transition-all duration-200"
            >
              <CalendarClock className="w-4 h-4" />
              Criar Atividade
            </button>
          )}
        </div>
        <Link
          to="/bolsas"
          className="text-xs font-semibold text-gray-500 dark:text-zinc-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1"
        >
          Ver bolsas disponíveis
          <ArrowRight className="w-3 h-3" />
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
            <div className="flex items-center justify-between px-4 sm:px-5 py-4 border-b border-gray-100 dark:border-white/[0.06]">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                {format(currentMonth, "MMMM yyyy", { locale: pt })}
              </h2>
              <div className="flex items-center gap-1">
                <button
                  onClick={handlePrev}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-500 dark:text-zinc-400 transition-colors"
                  aria-label="Mês anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setCurrentMonth(new Date())}
                  className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 transition-colors"
                >
                  Hoje
                </button>
                <button
                  onClick={handleNext}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-500 dark:text-zinc-400 transition-colors"
                  aria-label="Próximo mês"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 border-b border-gray-100 dark:border-white/[0.06]">
              {WEEKDAYS.map((day) => (
                <div
                  key={day}
                  className="py-2 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-600"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7">
              {days.map((day, index) => {
                const key = format(day, "yyyy-MM-dd");
                const doDiaConsultorias = consultoriasPorDia.get(key) || [];
                const doDiaAulas = aulasPorDia.get(key) || [];
                const doDiaAtividades = atividadesPorDia.get(key) || [];
                const totalDoDia = doDiaConsultorias.length + doDiaAulas.length + doDiaAtividades.length;
                const aulasUsadas = Math.min(doDiaAulas.length, Math.max(0, 3 - doDiaConsultorias.length));
                const inMonth = isSameMonth(day, currentMonth);
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
                const today = isToday(day);
                const isLastCol = index % 7 === 6;
                const isLastRow = index >= days.length - 7;

                return (
                  <button
                    key={key}
                    onClick={() => setSelectedDate(day)}
                    className={cn(
                      "min-h-[76px] sm:min-h-[96px] p-1.5 sm:p-2 border-r border-b border-gray-50 dark:border-white/[0.04] text-left align-top transition-colors hover:bg-gray-50 dark:hover:bg-white/[0.03]",
                      isLastCol && "border-r-0",
                      isLastRow && "border-b-0",
                      !inMonth && "opacity-40",
                      isSelected && "bg-emerald-50/60 dark:bg-emerald-500/[0.08]"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1",
                        today
                          ? "bg-emerald-500 text-white"
                          : inMonth
                          ? "text-gray-700 dark:text-zinc-300"
                          : "text-gray-400 dark:text-zinc-600"
                      )}
                    >
                      {format(day, "d")}
                    </span>

                    <div className="space-y-1">
                      {doDiaConsultorias.slice(0, 3).map((insc) => {
                        const config = STATUS_CONFIG[insc.status] || STATUS_CONFIG.PENDENTE;
                        return (
                          <div
                            key={insc.id}
                            className={cn(
                              "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 truncate",
                              isSelected ? "bg-emerald-100/70 dark:bg-emerald-500/15" : config.badge
                            )}
                          >
                            <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", config.dot)} />
                            <span className="text-[9px] font-semibold truncate text-inherit">
                              {insc.bolsa?.titulo?.substring(0, 14) || "Consultoria"}
                            </span>
                          </div>
                        );
                      })}
                      {doDiaAulas
                        .slice(0, aulasUsadas)
                        .map((aula) => {
                          const config = AULA_STATUS_CONFIG[aula.status] || AULA_STATUS_CONFIG.AGENDADA;
                          return (
                            <div
                              key={aula.id}
                              className={cn(
                                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 truncate",
                                isSelected ? "bg-blue-100/70 dark:bg-blue-500/15" : config.badge
                              )}
                            >
                              <Video className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[9px] font-semibold truncate text-inherit">
                                {aula.titulo?.substring(0, 14) || "Aula ao Vivo"}
                              </span>
                            </div>
                          );
                        })}
                      {doDiaAtividades
                        .slice(0, Math.max(0, 3 - doDiaConsultorias.length - aulasUsadas))
                        .map((atv) => {
                          const config = ATIVIDADE_CONFIG[atv.tipo || "ATIVIDADE"] || ATIVIDADE_CONFIG.ATIVIDADE;
                          return (
                            <div
                              key={atv.id}
                              className={cn(
                                "flex items-center gap-1.5 rounded-md px-1.5 py-0.5 truncate",
                                isSelected ? "bg-purple-100/70 dark:bg-purple-500/15" : config.badge
                              )}
                            >
                              <CalendarClock className="w-2.5 h-2.5 shrink-0" />
                              <span className="text-[9px] font-semibold truncate text-inherit">
                                {atv.titulo?.substring(0, 14) || "Atividade"}
                              </span>
                            </div>
                          );
                        })}
                      {totalDoDia > 3 && (
                        <span className="text-[9px] font-semibold text-gray-400 dark:text-zinc-600 px-1.5">
                          +{totalDoDia - 3} mais
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3.5 border-t border-gray-100 dark:border-white/[0.06]">
              {Object.entries(STATUS_CONFIG).map(([status, config]) => (
                <span key={status} className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                  <span className={cn("w-2 h-2 rounded-full", config.dot)} />
                  {config.label}
                </span>
              ))}
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                <Video className="w-3 h-3 text-blue-500" />
                Aula ao Vivo
              </span>
              <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                <CalendarClock className="w-3 h-3 text-purple-500" />
                Atividade
              </span>
            </div>
          </div>

          <div className="mt-6 bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  {selectedDate
                    ? format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })
                    : "Consultorias Agendadas"}
                </h2>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                  {selectedDate
                    ? `${selecionadas.length + aulasDoDia.length + atividadesDoDia.length} atividade${selecionadas.length + aulasDoDia.length + atividadesDoDia.length !== 1 ? "s" : ""} neste dia`
                    : "Selecione um dia no calendário para ver os detalhes."}
                </p>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="h-9 px-3 rounded-xl text-xs font-semibold bg-gray-50 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300 outline-none focus:border-emerald-400"
              >
                <option value="TODAS">Todos os estados</option>
                <option value="APROVADA">Aceites</option>
                <option value="PENDENTE">Pendentes</option>
                <option value="REJEITADA">Rejeitadas</option>
                <option value="CANCELADA">Canceladas</option>
              </select>
            </div>

            {selectedDate && selecionadas.length === 0 && aulasDoDia.length === 0 && atividadesDoDia.length === 0 ? (
              <p className="text-sm text-gray-400 dark:text-zinc-600 py-6 text-center">
                Nenhum evento agendado neste dia.
              </p>
            ) : !selectedDate ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <Calendar className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  Clique num dia do calendário para ver os detalhes.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {selecionadas.map((insc, i) => (
                  <motion.div
                    key={insc.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113]"
                  >
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {insc.bolsa?.titulo || "Consultoria"}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                        <Clock className="w-3 h-3 shrink-0" />
                        {new Date(insc.dataAgendada!).toLocaleString("pt-PT", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                        {insc.duracaoMinutos ? ` · ${insc.duracaoMinutos} min` : ""}
                      </p>
                      {insc.observacoes && (
                        <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1 truncate">
                          {insc.observacoes}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 flex items-center gap-2">
                      <StatusBadge status={insc.status} />
                      <Link
                        to={`/bolsas/${insc.bolsaId}`}
                        className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                        title="Ver bolsa"
                      >
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </motion.div>
              ))}

              {aulasDoDia.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <Video className="w-3.5 h-3.5 text-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      Aulas ao Vivo
                    </h3>
                  </div>
                  {aulasDoDia.map((aula, i) => {
                    const config = AULA_STATUS_CONFIG[aula.status] || AULA_STATUS_CONFIG.AGENDADA;
                    return (
                      <motion.div
                        key={aula.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-white dark:bg-[#111113]"
                      >
                        <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                          <Video className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {aula.titulo}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            {new Date(aula.data).toLocaleString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {aula.duracao ? ` · ${aula.duracao} min` : ""}
                          </p>
                          {aula.host?.nome && (
                            <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-0.5 flex items-center gap-1">
                              <Users className="w-3 h-3" />
                              {aula.host.nome}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                              config.badge
                            )}
                          >
                            {config.label}
                          </span>
                          <Link
                            to={`/aulas/${aula.id}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-500/10 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                            title="Ver aula"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}

              {atividadesDoDia.length > 0 && (
                <>
                  <div className="flex items-center gap-2 pt-2">
                    <CalendarClock className="w-3.5 h-3.5 text-purple-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-zinc-500">
                      Atividades
                    </h3>
                  </div>
                  {atividadesDoDia.map((atv, i) => {
                    const config = ATIVIDADE_CONFIG[atv.tipo || "ATIVIDADE"] || ATIVIDADE_CONFIG.ATIVIDADE;
                    return (
                      <motion.div
                        key={atv.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-white dark:bg-[#111113]"
                      >
                        <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                          <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                            {atv.titulo}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5 mt-0.5">
                            <Clock className="w-3 h-3 shrink-0" />
                            {new Date(atv.data).toLocaleString("pt-PT", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {atv.duracaoMinutos ? ` · ${atv.duracaoMinutos} min` : ""}
                          </p>
                          {atv.local && (
                            <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-0.5 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {atv.local}
                            </p>
                          )}
                          {atv.descricao && (
                            <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1 truncate">
                              {atv.descricao}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0 flex items-center gap-2">
                          <span
                            className={cn(
                              "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                              config.badge
                            )}
                          >
                            {config.label}
                          </span>
                          {isAdmin && (
                            <button
                              onClick={() => deleteMutation.mutate(atv.id)}
                              disabled={deleteMutation.isPending}
                              className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                              title="Remover atividade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                </>
              )}
            </div>
          )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              Próximas Consultorias
            </h2>
            {proximas.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-600 py-4 text-center">
                Sem consultorias aceites no futuro.
              </p>
            ) : (
              <div className="space-y-3">
                {proximas.map((insc) => {
                  const dt = new Date(insc.dataAgendada!);
                  return (
                    <div
                      key={insc.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-emerald-100 dark:border-emerald-500/15 bg-emerald-50/50 dark:bg-emerald-500/[0.06]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold leading-none">{format(dt, "dd")}</span>
                        <span className="text-[9px] font-medium leading-tight uppercase">{format(dt, "MMM", { locale: pt })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {insc.bolsa?.titulo || "Consultoria"}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                          {format(dt, "EEEE 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Video className="w-4 h-4 text-blue-500" />
              Próximas Aulas ao Vivo
            </h2>
            {proximasAulas.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-600 py-4 text-center">
                Sem aulas ao vivo agendadas.
              </p>
            ) : (
              <div className="space-y-3">
                {proximasAulas.map((aula) => {
                  const dt = new Date(aula.data);
                  return (
                    <Link
                      key={aula.id}
                      to={`/aulas/${aula.id}`}
                      className="flex items-center gap-3 p-3 rounded-xl border border-blue-100 dark:border-blue-500/15 bg-blue-50/50 dark:bg-blue-500/[0.06] hover:border-blue-300 dark:hover:border-blue-500/30 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold leading-none">{format(dt, "dd")}</span>
                        <span className="text-[9px] font-medium leading-tight uppercase">{format(dt, "MMM", { locale: pt })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {aula.titulo}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                          {format(dt, "EEEE 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-purple-500" />
              Próximas Atividades
            </h2>
            {proximasAtividades.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-600 py-4 text-center">
                Sem atividades agendadas.
              </p>
            ) : (
              <div className="space-y-3">
                {proximasAtividades.map((atv) => {
                  const dt = new Date(atv.data);
                  return (
                    <div
                      key={atv.id}
                      className="flex items-center gap-3 p-3 rounded-xl border border-purple-100 dark:border-purple-500/15 bg-purple-50/50 dark:bg-purple-500/[0.06]"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500 text-white flex flex-col items-center justify-center shrink-0">
                        <span className="text-[10px] font-bold leading-none">{format(dt, "dd")}</span>
                        <span className="text-[9px] font-medium leading-tight uppercase">{format(dt, "MMM", { locale: pt })}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-gray-900 dark:text-white truncate">
                          {atv.titulo}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-zinc-500">
                          {format(dt, "EEEE 'às' HH:mm", { locale: pt })}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
            <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
              Todas as Consultorias
            </h2>
            {filteredConsultorias.length === 0 ? (
              <p className="text-xs text-gray-400 dark:text-zinc-600 py-4 text-center">
                Nenhuma consultoria agendada.
              </p>
            ) : (
              <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
                {filteredConsultorias.map((insc) => {
                  const config = STATUS_CONFIG[insc.status] || STATUS_CONFIG.PENDENTE;
                  return (
                    <div
                      key={insc.id}
                      className="flex items-center gap-2.5 p-3 rounded-xl border border-gray-100 dark:border-white/[0.06]"
                    >
                      <span className={cn("w-2 h-2 rounded-full shrink-0", config.dot)} />
                      <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-semibold text-gray-800 dark:text-zinc-200 truncate">
                          {insc.bolsa?.titulo || "Consultoria"}
                        </p>
                        <p className="text-[10px] text-gray-400 dark:text-zinc-600">
                          {new Date(insc.dataAgendada!).toLocaleString("pt-PT", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <StatusBadge status={insc.status} />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      <Dialog open={agendarOpen} onOpenChange={setAgendarOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-[#111113] border-gray-100 dark:border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Agendar Consultoria
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              Escolha uma bolsa para agendar a sua consultoria.
            </DialogDescription>
          </DialogHeader>

          {bolsasLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
            </div>
          ) : bolsasComConsultoria.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <GraduationCap className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Sem consultorias disponíveis
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1 max-w-xs">
                  De momento não há bolsas com consultoria disponível.
                </p>
              </div>
            </div>
          ) : (
            <ScrollArea className="max-h-[420px] pr-2">
              <div className="space-y-2.5">
                {bolsasComConsultoria.map((bolsa) => (
                  <button
                    key={bolsa.id}
                    onClick={() => {
                      setAgendarOpen(false);
                      navigate(`/bolsas/${bolsa.id}?servico=consultoria`);
                    }}
                    className="w-full flex items-center gap-3 p-3.5 rounded-xl border border-gray-100 dark:border-white/[0.08] bg-white dark:bg-white/[0.02] hover:border-emerald-200 dark:hover:border-emerald-500/30 hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.06] transition-all text-left"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                      <MessageSquare className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {bolsa.titulo}
                      </p>
                      <p className="text-[11px] text-gray-500 dark:text-zinc-500 mt-0.5 flex items-center gap-2">
                        {bolsa.instituicao && <span className="truncate">{bolsa.instituicao}</span>}
                        {bolsa.instituicao && bolsa.pais && <span>·</span>}
                        {bolsa.pais && <span>{bolsa.pais}</span>}
                        <span className="ml-auto shrink-0 font-bold text-emerald-600 dark:text-emerald-400">
                          AOA {bolsa.precoConsultoria?.toLocaleString()}
                        </span>
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-gray-300 dark:text-zinc-600 shrink-0" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
        <DialogContent className="sm:max-w-lg bg-white dark:bg-[#111113] border-gray-100 dark:border-white/[0.08]">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              Criar Atividade
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              Agende uma nova atividade que aparecerá no calendário para todos.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                Título *
              </label>
              <Input
                value={form.titulo}
                onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                placeholder="Ex.: Sessão de mentoria sobre bolsas"
                className="bg-white dark:bg-white/[0.03]"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                Tipo
              </label>
              <Select value={form.tipo} onValueChange={(v) => setForm({ ...form, tipo: v })}>
                <SelectTrigger className="bg-white dark:bg-white/[0.03]">
                  <SelectValue placeholder="Tipo de atividade" />
                </SelectTrigger>
                <SelectContent>
                  {ATIVIDADE_TIPOS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                  Data *
                </label>
                <Input
                  type="date"
                  value={form.data}
                  onChange={(e) => setForm({ ...form, data: e.target.value })}
                  className="bg-white dark:bg-white/[0.03]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                  Hora *
                </label>
                <Input
                  type="time"
                  value={form.hora}
                  onChange={(e) => setForm({ ...form, hora: e.target.value })}
                  className="bg-white dark:bg-white/[0.03]"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                  Duração (minutos)
                </label>
                <Input
                  type="number"
                  min={1}
                  value={form.duracao}
                  onChange={(e) => setForm({ ...form, duracao: e.target.value })}
                  placeholder="Ex.: 60"
                  className="bg-white dark:bg-white/[0.03]"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                  Local
                </label>
                <Input
                  value={form.local}
                  onChange={(e) => setForm({ ...form, local: e.target.value })}
                  placeholder="Ex.: Sala 2 / Online"
                  className="bg-white dark:bg-white/[0.03]"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-1.5 block">
                Descrição
              </label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes da atividade..."
                rows={3}
                className="bg-white dark:bg-white/[0.03]"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={() => setCriarOpen(false)}
              className="h-10 px-4 rounded-xl text-sm font-semibold text-gray-500 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={() => createMutation.mutate()}
              disabled={!form.titulo || !form.data || !form.hora || createMutation.isPending}
              className="inline-flex items-center gap-2 h-10 px-5 rounded-xl bg-purple-600 text-white text-sm font-bold hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 transition-all duration-200"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarClock className="w-4 h-4" />
              )}
              Criar Atividade
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

export default CalendarioConsultorias;
