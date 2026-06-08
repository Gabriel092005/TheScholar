import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  BookOpen, Users, Clock, Play, FileText,
  ArrowLeft, CheckCircle, Loader2, CreditCard,
  Lock, X, Monitor, CheckSquare,
  Building2, Upload, ChevronRight, ChevronLeft,
  PlayCircle, BarChart3, Award,
} from "lucide-react";
import { ExpressIcon, MulticaixaIcon } from "@/components/payment-icons";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cursosApi, type Curso, type Aula } from "@/api/cursos";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

const STORAGE_KEY = "scholar-lessons-completed";

function getCompletedLessons(cursoId: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY}-${cursoId}`);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveCompletedLesson(cursoId: string, lessonId: string) {
  const completed = getCompletedLessons(cursoId);
  if (!completed.includes(lessonId)) {
    completed.push(lessonId);
    localStorage.setItem(`${STORAGE_KEY}-${cursoId}`, JSON.stringify(completed));
  }
  return completed;
}

function removeCompletedLesson(cursoId: string, lessonId: string) {
  const completed = getCompletedLessons(cursoId).filter(id => id !== lessonId);
  localStorage.setItem(`${STORAGE_KEY}-${cursoId}`, JSON.stringify(completed));
  return completed;
}

export function CursoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [loading, setLoading] = useState(true);
  const [temAcesso, setTemAcesso] = useState(false);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [showPayment, setShowPayment] = useState(false);
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null);

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return `${api.defaults.baseURL}${url}`;
    return url;
  };

  const isYoutubeUrl = (url?: string) => {
    if (!url) return false;
    return url.includes("youtube.com") || url.includes("youtu.be");
  };

  const getEmbedUrl = (url: string) => {
    const youtubeMatch = url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|v\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/
    );
    if (youtubeMatch) {
      return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
    }
    return url;
  };
  const [metodoPagamento, setMetodoPagamento] = useState<"EXPRESS" | "TRANSFERENCIA" | "MULTICAIXA">("EXPRESS");
  const [referenciaPagamento, setReferenciaPagamento] = useState("");
  const [comprovativo, setComprovativo] = useState<File | null>(null);

  useEffect(() => {
    if (id) {
      setCompletedLessons(getCompletedLessons(id));
      loadCurso();
    }
  }, [id]);

  useEffect(() => {
    if (curso) checkAcesso();
  }, [curso]);

  const loadCurso = async () => {
    try {
      setLoading(true);
      const data = await cursosApi.get(id!);
      setCurso(data);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao carregar curso:", error);
      }
      toast.error("Erro ao carregar curso");
    } finally {
      setLoading(false);
    }
  };

  const checkAcesso = async () => {
    try {
      const meusCursos = await cursosApi.listMeusCursos();
      const acesso = meusCursos.some((c) => c.id === id);
      setTemAcesso(acesso);
    } catch {
      setTemAcesso(false);
    }
  };

  const aderirMutation = useMutation({
    mutationFn: async () => {
      if (!referenciaPagamento.trim()) {
        throw new Error("Informe a referência do pagamento");
      }
      let comprovativoUrl = "";
      if (comprovativo) {
        const form = new FormData();
        form.append("file", comprovativo);
        const { data } = await api.post("/upload", form);
        comprovativoUrl = data.url || data.path || "";
      }
      return cursosApi.aderir(id!, {
        metodo: metodoPagamento,
        referencia: referenciaPagamento,
        comprovativo: comprovativoUrl,
      });
    },
    onSuccess: () => {
      setShowPayment(false);
      setComprovativo(null);
      setReferenciaPagamento("");
      toast.success("Pagamento enviado! Aguarde aprovação do admin.");
    },
    onError: (error: any) => {
      if (error.message === "Informe a referência do pagamento") {
        toast.error(error.message);
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else if (error.response?.data?.error) {
        toast.error(error.response.data.error);
      } else {
        toast.error("Erro ao processar pagamento. Verifique a sua conexão e tente novamente.");
      }
    },
  });

  const handleAderir = () => aderirMutation.mutate();

  const handleConcluirAula = (aulaId: string) => {
    const updated = completedLessons.includes(aulaId)
      ? removeCompletedLesson(id!, aulaId)
      : saveCompletedLesson(id!, aulaId);
    setCompletedLessons(updated);
    if (!completedLessons.includes(aulaId)) {
      toast.success("Aula concluída!");
    }
  };

  const aulas = (curso?.aulas || []).sort((a, b) => a.ordem - b.ordem);
  const aulasGratuitas = aulas.filter(a => a.gratuito);
  const progresso = aulas.length
    ? Math.round((completedLessons.length / aulas.length) * 100)
    : 0;

  const formatPrice = (preco: number) =>
    new Intl.NumberFormat("pt-PT", { style: "currency", currency: "AOA" }).format(preco);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111113] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!curso) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#111113] flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-medium">Curso não encontrado</h2>
          <Button onClick={() => navigate("/cursos")} className="mt-4">
            Voltar aos Cursos
          </Button>
        </div>
      </div>
    );
  }

  // ─── SEÇÃO DE ESTUDOS (quem tem acesso) ─────────────────
  const renderTemAcesso = () => (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <button
              onClick={() => navigate("/cursos")}
              className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Todos os Cursos
            </button>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{curso.titulo}</h1>
          </div>
          <Button
            className="bg-emerald-500 hover:bg-emerald-600 text-white shrink-0"
            onClick={() => navigate(`/cursos/${id}/aulas`)}
          >
            <Monitor className="h-4 w-4 mr-2" />
            Player Completo
          </Button>
        </div>

        {progresso > 0 && (
            <div className="mb-6">
              <div className="flex justify-between text-xs text-gray-500 dark:text-zinc-500 mb-1.5">
                <span>Progresso</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">{progresso}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full transition-all duration-500" style={{ width: `${progresso}%` }} />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            {aulas.map((aula) => {
              const isCompleted = completedLessons.includes(aula.id);
              const isActive = aulaAtual?.id === aula.id;

              return (
                <div
                  key={aula.id}
                  onClick={() => setAulaAtual(aula)}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer group ${
                    isActive
                      ? "bg-emerald-50 dark:bg-emerald-500/10 ring-1 ring-emerald-200 dark:ring-emerald-500/30"
                      : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
                    isCompleted
                      ? "bg-emerald-500 text-white"
                      : isActive
                      ? "bg-emerald-500 text-white"
                      : "bg-gray-100 dark:bg-white/[0.06] text-gray-400 dark:text-zinc-500"
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : aula.tipo === "VIDEO" ? (
                      <Play className="h-3.5 w-3.5 ml-0.5" />
                    ) : (
                      <FileText className="h-3.5 w-3.5" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium transition-colors ${
                      isCompleted
                        ? "text-gray-400 dark:text-zinc-600 line-through"
                        : "text-gray-900 dark:text-white"
                    }`}>
                      {aula.titulo}
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-gray-400 dark:text-zinc-600 mt-0.5">
                      <span>{aula.tipo === "VIDEO" ? "Vídeo" : "PDF"}</span>
                      {aula.duracao && <span>{aula.duracao}</span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleConcluirAula(aula.id)}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isCompleted
                          ? "text-emerald-500"
                          : "text-gray-400 dark:text-zinc-600 hover:text-emerald-500"
                      }`}
                    >
                      <CheckSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}

            {aulas.length === 0 && (
              <div className="text-center py-12 text-gray-400 dark:text-zinc-600">
                <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Nenhuma aula disponível ainda</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );

  // ─── SEÇÃO DE PUBLICIDADE/PROMOÇÃO (quem NÃO tem acesso) ─────────────────
  const renderPromocional = () => (
    <div className="bg-white dark:bg-[#111113]">
      {/* Hero Minimal */}
      <div className="border-b border-gray-100 dark:border-white/[0.06]">
        <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
          <button
            onClick={() => navigate("/cursos")}
            className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-zinc-500 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Todos os Cursos
          </button>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            <div className="md:col-span-2">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="flex flex-wrap gap-2 mb-3">
                  <Badge className="bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none text-xs font-medium">
                    {curso.categoria}
                  </Badge>
                  {curso.nivel && (
                    <Badge className="bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 border-none text-xs font-medium">
                      {curso.nivel}
                    </Badge>
                  )}
                </div>

                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
                  {curso.titulo}
                </h1>
                {curso.subtitulo && (
                  <p className="text-sm text-gray-500 dark:text-zinc-400 mt-2">{curso.subtitulo}</p>
                )}

                <div className="flex flex-wrap items-center gap-4 mt-4 text-xs text-gray-500 dark:text-zinc-500">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5" />
                    {curso.estudantes.toLocaleString()} estudantes
                  </span>
                  <span className="flex items-center gap-1.5">
                    {curso.rating.toFixed(1)}
                  </span>
                  {curso.duracao && (
                    <span className="flex items-center gap-1.5">
                      <BarChart3 className="h-3.5 w-3.5" />
                      {curso.duracao}
                    </span>
                  )}
                  <span className="flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5" />
                    {curso.quantAulas} aulas
                  </span>
                </div>
              </motion.div>
            </div>

            {/* Card Preço */}
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
              <div className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06]">
                <div className="text-center mb-4">
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {formatPrice(Number(curso.preco))}
                  </div>
                  {curso.precoOriginal && (
                    <div className="text-xs text-gray-400 dark:text-zinc-500 line-through mt-0.5">
                      {formatPrice(Number(curso.precoOriginal))}
                    </div>
                  )}
                  {curso.precoOriginal && (
                    <div className="mt-2">
                      <span className="inline-flex px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
                        Economia de {formatPrice(Number(curso.precoOriginal) - Number(curso.preco))}
                      </span>
                    </div>
                  )}
                  {aulasGratuitas.length > 0 && (
                    <p className="text-[11px] text-gray-500 dark:text-zinc-400 mt-3 flex items-center justify-center gap-1.5">
                      <PlayCircle className="h-3.5 w-3.5 text-emerald-500" />
                      {aulasGratuitas.length} aula{aulasGratuitas.length > 1 ? "s" : ""} grátis
                    </p>
                  )}
                </div>

                <Button
                  className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-11 text-sm font-medium"
                  onClick={() => setShowPayment(true)}
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  Aderir Agora
                </Button>

                <p className="text-[10px] text-gray-400 dark:text-zinc-600 text-center mt-3">
                  Pagamento analisado pelo admin
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
          <div className="md:col-span-2 space-y-8">
            {curso.descricao && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
                  Sobre o Curso
                </h2>
                <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400 leading-relaxed" dangerouslySetInnerHTML={{ __html: curso.descricao }} />
              </section>
            )}

            {curso.mentorNome && (
              <section>
                <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-3">
                  Instrutor
                </h2>
                <div className="flex items-center gap-3">
                  {curso.mentorAvatar ? (
                    <img src={curso.mentorAvatar} alt={curso.mentorNome} className="h-10 w-10 rounded-full object-cover" />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">
                      {curso.mentorNome.charAt(0)}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{curso.mentorNome}</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">Instrutor</p>
                  </div>
                </div>
              </section>
            )}

            {curso.tags?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {curso.tags.map((tag) => (
                  <span key={tag} className="px-2.5 py-1 text-[11px] rounded-full bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar Info */}
          <div className="space-y-4 text-sm">
            <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
              <BookOpen className="h-4 w-4" />
              <span>{curso.quantAulas} aulas</span>
            </div>
            {curso.duracao && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
                <Clock className="h-4 w-4" />
                <span>{curso.duracao}</span>
              </div>
            )}
            {curso.nivel && (
              <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
                <BarChart3 className="h-4 w-4" />
                <span>{curso.nivel}</span>
              </div>
            )}
            <div className="flex items-center gap-3 text-gray-600 dark:text-zinc-400">
              <Award className="h-4 w-4" />
              <span>{curso.categoria}</span>
            </div>
          </div>
        </div>

        {/* Prévia das aulas grátis */}
        {aulasGratuitas.length > 0 && (
          <section className="mt-10 pt-10 border-t border-gray-100 dark:border-white/[0.06]">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4">
              Aulas Grátis
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {aulasGratuitas.map((aula) => (
                <div
                  key={aula.id}
                  onClick={() => setAulaAtual(aula)}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] cursor-pointer hover:bg-gray-100 dark:hover:bg-white/[0.08] transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                    {aula.tipo === "VIDEO" ? (
                      <Play className="h-3.5 w-3.5 ml-0.5 text-emerald-600 dark:text-emerald-400" />
                    ) : (
                      <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{aula.titulo}</p>
                    <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                      {aula.tipo === "VIDEO" ? "Vídeo" : "PDF"}{aula.duracao ? ` • ${aula.duracao}` : ""}
                    </p>
                  </div>
                  <Badge className="text-[9px] px-1.5 py-0 h-auto bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-none shrink-0">
                    Grátis
                  </Badge>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Conteúdo bloqueado */}
        {aulas.length > aulasGratuitas.length && (
          <section className="mt-6">
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-zinc-600 bg-gray-50 dark:bg-white/[0.04] rounded-xl px-4 py-3">
              <Lock className="h-3.5 w-3.5 shrink-0" />
              <span>{aulas.length - aulasGratuitas.length} aulas bloqueadas. Adquira o curso para desbloquear.</span>
            </div>
          </section>
        )}
      </div>

      {/* Payment Dialog */}
      {showPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => { if (!aderirMutation.isPending) setShowPayment(false); }}>
          <div className="w-full max-w-lg bg-white dark:bg-[#111113] rounded-3xl overflow-hidden shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/[0.06]">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Pagamento</h2>
                <p className="text-sm text-gray-500 dark:text-zinc-400 mt-0.5">{curso?.titulo}</p>
              </div>
              <button onClick={() => { if (!aderirMutation.isPending) setShowPayment(false); }} className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                <X size={18} className="text-gray-400 dark:text-zinc-500" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4">
                  Método de Pagamento
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {([
                    { value: "EXPRESS" as const, label: "Express", icon: ExpressIcon },
                    { value: "TRANSFERENCIA" as const, label: "Transferência", icon: Building2 },
                    { value: "MULTICAIXA" as const, label: "Multicaixa", icon: MulticaixaIcon },
                  ]).map(({ value, label, icon: Icon }) => (
                    <button
                      key={value} type="button" onClick={() => setMetodoPagamento(value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${
                        metodoPagamento === value
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-500/50"
                      }`}
                    >
                      <Icon className={`w-[34px] h-[34px] shrink-0 ${metodoPagamento === value ? "scale-105" : "opacity-80"}`} />
                      <span className={`text-[10px] font-bold text-center ${metodoPagamento === value ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-zinc-400"}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-2xl p-4">
                <p className="text-xs text-amber-700 dark:text-amber-400 font-bold mb-1">
                  Pagamento via {metodoPagamento === "EXPRESS" ? "Express" : metodoPagamento === "TRANSFERENCIA" ? "Transferência Bancária" : "Multicaixa"}
                </p>
                <p className="text-[10px] text-amber-600 dark:text-amber-500">
                  {metodoPagamento === "EXPRESS"
                    ? "Faça o pagamento para o número 923 456 789 (Express). Insira a referência abaixo."
                    : metodoPagamento === "TRANSFERENCIA"
                    ? "IBAN: AO06 0040 0000 1234 5678 9012 3. Envie o comprovativo após a transferência."
                    : "Pague no Multicaixa (código 12345). Insira a referência após o pagamento."}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 dark:text-zinc-400">Referência *</Label>
                  <Input value={referenciaPagamento} onChange={(e) => setReferenciaPagamento(e.target.value)} placeholder="Código da transação" className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04]" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-gray-600 dark:text-zinc-400">Comprovativo</Label>
                  <label className="flex items-center gap-2 h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 transition-colors">
                    <Upload size={14} className="text-gray-400 shrink-0" />
                    <span className="text-xs text-gray-400 truncate">{comprovativo ? comprovativo.name : "Carregar foto"}</span>
                    <input type="file" accept="image/*,.pdf" onChange={(e) => setComprovativo(e.target.files?.[0] || null)} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-4 border-t border-gray-100 dark:border-white/[0.06]">
                <Button variant="outline" onClick={() => { if (!aderirMutation.isPending) setShowPayment(false); }} disabled={aderirMutation.isPending} className="rounded-xl">
                  Cancelar
                </Button>
                <Button onClick={handleAderir} disabled={aderirMutation.isPending} className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6">
                  {aderirMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Processando...</>
                  ) : (
                    <><CreditCard className="h-4 w-4 mr-2" /> Confirmar Pagamento</>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {temAcesso ? renderTemAcesso() : renderPromocional()}

      {/* ── Shared Video Player Modal ── */}
      {aulaAtual && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setAulaAtual(null)}
        >
          <div
            className="relative w-full max-w-5xl bg-[#0a0a0a] rounded-2xl overflow-hidden border border-white/[0.08] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="aspect-video w-full bg-black">
              {aulaAtual.tipo === "VIDEO" && aulaAtual.videoUrl && isYoutubeUrl(aulaAtual.videoUrl) && (
                <iframe
                  src={getEmbedUrl(aulaAtual.videoUrl)}
                  title={aulaAtual.titulo}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
              {aulaAtual.tipo === "VIDEO" && aulaAtual.videoLocal && (
                <video
                  src={resolveMediaUrl(aulaAtual.videoLocal)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
              {aulaAtual.tipo === "VIDEO" && !isYoutubeUrl(aulaAtual.videoUrl ?? "") && !aulaAtual.videoLocal && (
                <video
                  src={resolveMediaUrl(aulaAtual.videoUrl)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
              {aulaAtual.tipo === "PDF" && aulaAtual.pdfUrl && (
                <iframe
                  src={resolveMediaUrl(aulaAtual.pdfUrl)}
                  className="w-full h-full bg-white"
                  title={aulaAtual.titulo}
                />
              )}
            </div>
            <div className="flex items-center justify-between px-5 py-3 bg-[#0e0e10] border-t border-white/[0.06]">
              <div className="flex items-center gap-3 min-w-0">
                <PlayCircle size={18} className="text-emerald-500 shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-white/90 truncate">{aulaAtual.titulo}</p>
                  <p className="text-[11px] text-white/40">
                    {(aulas.findIndex(a => a.id === aulaAtual.id) + 1)} de {aulas.length}
                    {aulaAtual.duracao && ` · ${aulaAtual.duracao}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    const idx = aulas.findIndex(a => a.id === aulaAtual.id);
                    if (idx > 0) setAulaAtual(aulas[idx - 1]);
                  }}
                  disabled={aulas.findIndex(a => a.id === aulaAtual.id) <= 0}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Aula anterior"
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={() => {
                    const idx = aulas.findIndex(a => a.id === aulaAtual.id);
                    if (idx < aulas.length - 1) setAulaAtual(aulas[idx + 1]);
                  }}
                  disabled={aulas.findIndex(a => a.id === aulaAtual.id) >= aulas.length - 1}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                  title="Próxima aula"
                >
                  <ChevronRight size={16} />
                </button>
                <div className="w-px h-5 bg-white/[0.06] mx-1" />
                <button
                  onClick={() => setAulaAtual(null)}
                  className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-all"
                  title="Fechar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CursoDetail;
