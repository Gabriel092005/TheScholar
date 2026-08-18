import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import {
  addMonths, eachDayOfInterval, endOfMonth, endOfWeek,
  format, isSameDay, isSameMonth, isToday,
  startOfMonth, startOfWeek,
} from "date-fns";
import { pt } from "date-fns/locale";
import {
  CalendarDays, ChevronLeft, ChevronRight, Loader2,
  CalendarClock, MapPin, Clock, ArrowRight, GraduationCap,
} from "lucide-react";
import { Header } from "@/components/header";
import { atividadesApi, type Atividade } from "@/api/atividades";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

const ATIVIDADE_CONFIG: Record<string, { label: string; badge: string }> = {
  ATIVIDADE: { label: "Atividade", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  PALESTRA: { label: "Palestra", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  WORKSHOP: { label: "Workshop", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  EVENTO: { label: "Evento", badge: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400" },
};

export function CalendarioPublico() {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const { data: atividades, isLoading } = useQuery({
    queryKey: ["atividades-publicas"],
    queryFn: atividadesApi.list,
    staleTime: 1000 * 60 * 2,
  });

  const porDia = useMemo(() => {
    const map = new Map<string, Atividade[]>();
    (atividades || []).forEach((atv) => {
      const key = format(new Date(atv.data), "yyyy-MM-dd");
      const arr = map.get(key) || [];
      arr.push(atv);
      map.set(key, arr);
    });
    return map;
  }, [atividades]);

  const doDia = useMemo(() => {
    if (!selectedDate) return [];
    const key = format(selectedDate, "yyyy-MM-dd");
    return (porDia.get(key) || []).slice().sort((a, b) => {
      const da = new Date(a.data).getTime();
      const db = new Date(b.data).getTime();
      return da - db;
    });
  }, [selectedDate, porDia]);

  const proximas = useMemo(() => {
    const now = new Date();
    return (atividades || [])
      .filter((a) => new Date(a.data) >= now)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 5);
  }, [atividades]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  const handlePrev = () => setCurrentMonth((m) => addMonths(m, -1));
  const handleNext = () => setCurrentMonth((m) => addMonths(m, 1));

  return (
    <div className="min-h-screen bg-background">
      <Header sidebarOpen={false} setSidebarOpen={() => {}} />

      <div className="relative bg-gradient-to-br from-purple-600 via-purple-700 to-emerald-900 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_30%,rgba(255,255,255,0.08),transparent_50%)]" />
        <div className="container mx-auto px-4 sm:px-6 py-12 md:py-16 max-w-6xl relative">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-purple-100 text-[11px] mb-4">
              <CalendarDays className="h-3.5 w-3.5" />
              Agendamentos
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-2">
              Calendário de Atividades
            </h1>
            <p className="text-purple-100/80 text-sm md:text-base max-w-lg">
              Consulte as atividades, palestras e eventos agendados pela Afroscholars.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
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
                    className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
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
                  const doDiaAtividades = porDia.get(key) || [];
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
                        isSelected && "bg-purple-50/60 dark:bg-purple-500/[0.08]"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold mb-1",
                          today
                            ? "bg-purple-500 text-white"
                            : inMonth
                            ? "text-gray-700 dark:text-zinc-300"
                            : "text-gray-400 dark:text-zinc-600"
                        )}
                      >
                        {format(day, "d")}
                      </span>

                      <div className="space-y-1">
                        {doDiaAtividades.slice(0, 3).map((atv) => (
                          <div
                            key={atv.id}
                            className="flex items-center gap-1.5 rounded-md px-1.5 py-0.5 truncate bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400"
                          >
                            <CalendarClock className="w-2.5 h-2.5 shrink-0" />
                            <span className="text-[9px] font-semibold truncate text-inherit">
                              {atv.titulo?.substring(0, 14) || "Atividade"}
                            </span>
                          </div>
                        ))}
                        {doDiaAtividades.length > 3 && (
                          <span className="text-[9px] font-semibold text-gray-400 dark:text-zinc-600 px-1.5">
                            +{doDiaAtividades.length - 3} mais
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 px-4 sm:px-5 py-3.5 border-t border-gray-100 dark:border-white/[0.06]">
                <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-500 dark:text-zinc-500">
                  <CalendarClock className="w-3 h-3 text-purple-500" />
                  Atividade agendada
                </span>
              </div>
            </div>

            <div className="mt-6 bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                </div>
              ) : selectedDate ? (
                <>
                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                    {format(selectedDate, "EEEE, d 'de' MMMM", { locale: pt })}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mb-4">
                    {doDia.length} atividade{doDia.length !== 1 ? "s" : ""} neste dia
                  </p>
                  {doDia.length === 0 ? (
                    <p className="text-sm text-gray-400 dark:text-zinc-600 py-6 text-center">
                      Nenhuma atividade agendada neste dia.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {doDia.map((atv, i) => {
                        const config = ATIVIDADE_CONFIG[atv.tipo || "ATIVIDADE"] || ATIVIDADE_CONFIG.ATIVIDADE;
                        return (
                          <motion.div
                            key={atv.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-4 p-4 rounded-2xl border border-purple-100 dark:border-purple-500/20 bg-white dark:bg-[#111113]"
                          >
                            <div className="w-11 h-11 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                              <CalendarClock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                  {atv.titulo}
                                </p>
                                <span
                                  className={cn(
                                    "text-[10px] px-2 py-0.5 rounded-full font-semibold",
                                    config.badge
                                  )}
                                >
                                  {config.label}
                                </span>
                              </div>
                              <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-1.5 mt-1.5">
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
                                <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {atv.local}
                                </p>
                              )}
                              {atv.descricao && (
                                <p className="text-[11px] text-gray-400 dark:text-zinc-600 mt-1">
                                  {atv.descricao}
                                </p>
                              )}
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center gap-3 py-8">
                  <CalendarDays className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    Clique num dia do calendário para ver as atividades.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <CalendarClock className="w-4 h-4 text-purple-500" />
                Próximas Atividades
              </h2>
              {proximas.length === 0 ? (
                <p className="text-xs text-gray-400 dark:text-zinc-600 py-4 text-center">
                  Sem atividades agendadas.
                </p>
              ) : (
                <div className="space-y-3">
                  {proximas.map((atv) => {
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

            <div className="rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] p-5">
              <div className="flex items-center gap-2 mb-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                  Quer acompanhar de perto?
                </h2>
              </div>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mb-4 leading-relaxed">
                Crie a sua conta grátis para receber lembretes e participar das atividades.
              </p>
              <button
                onClick={() => navigate("/sign-up")}
                className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 shadow-lg shadow-emerald-600/20 transition-all duration-200"
              >
                Criar conta grátis
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <footer className="mt-8 bg-gray-950 dark:bg-black py-8">
        <div className="container mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <span className="font-bold text-white text-sm">Afroscholars</span>
          </div>
          <div className="flex items-center gap-4">
            <Link to="/" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              Home
            </Link>
            <Link to="/sign-in" className="text-xs text-gray-500 hover:text-emerald-400 transition-colors">
              Entrar
            </Link>
          </div>
          <p className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Afroscholars. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
}
