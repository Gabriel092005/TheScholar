import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Play, FileText, CheckCircle, Lock,
  Menu, ChevronRight, Loader2, Maximize2, Minimize2,
  BookOpen, ListVideo, ChevronLeft, ChevronDown,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cursosApi, type Curso, type Aula } from "@/api/cursos";
import { api } from "@/lib/axios";
import toast from "react-hot-toast";

export function PlayerAulas() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [curso, setCurso] = useState<Curso | null>(null);
  const [aulas, setAulas] = useState<Aula[]>([]);
  const [aulaAtual, setAulaAtual] = useState<Aula | null>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [temAcesso, setTemAcesso] = useState(false);

  useEffect(() => {
    if (id) loadCurso();
  }, [id]);

  const loadCurso = async () => {
    try {
      setLoading(true);
      const [data, meusCursos] = await Promise.all([
        cursosApi.get(id!),
        cursosApi.listMeusCursos().catch(() => []),
      ]);
      setCurso(data);
      const sorted = (data.aulas || []).sort((a, b) => a.ordem - b.ordem);
      setAulas(sorted);
      const acesso = meusCursos.some((c: any) => c.id === id);
      setTemAcesso(acesso);
      if (sorted.length > 0) {
        setAulaAtual(sorted[0]);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error("Erro ao carregar curso:", error);
      }
      toast.error("Erro ao carregar curso");
    } finally {
      setLoading(false);
    }
  };

  const selectAula = (aula: Aula) => {
    setAulaAtual(aula);
    setShowMobileSidebar(false);
  };

  const totalAulas = aulas.length;
  const aulaIndex = aulaAtual ? aulas.findIndex((a) => a.id === aulaAtual.id) + 1 : 0;
  const progresso = totalAulas > 0 ? Math.round((aulaIndex / totalAulas) * 100) : 0;
  const aulasCompletadas = aulas.filter((_, idx) => idx < aulaIndex - 1).length;

  const resolveMediaUrl = (url?: string) => {
    if (!url) return "";
    if (url.startsWith("/uploads/")) return `${api.defaults.baseURL}${url}`;
    return url;
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

  const renderVideoPlayer = () => {
    if (!aulaAtual) return null;

    if (aulaAtual.tipo === "VIDEO" && aulaAtual.videoUrl) {
      const isYoutube = /(?:youtube\.com|youtu\.be)/.test(aulaAtual.videoUrl);
      if (isYoutube) {
        return (
          <iframe
            width="100%"
            height="100%"
            src={getEmbedUrl(aulaAtual.videoUrl)}
            title={aulaAtual.titulo}
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        );
      }
      return (
        <video
          src={resolveMediaUrl(aulaAtual.videoUrl)}
          controls
          className="w-full h-full object-contain bg-black"
          autoPlay
        />
      );
    }

    if (aulaAtual.tipo === "PDF" && aulaAtual.pdfUrl) {
      return (
        <iframe
          src={resolveMediaUrl(aulaAtual.pdfUrl)}
          className="w-full h-full bg-white"
          title={aulaAtual.titulo}
        />
      );
    }

    if (aulaAtual.tipo === "VIDEO" && aulaAtual.videoLocal) {
      return (
        <video
          src={resolveMediaUrl(aulaAtual.videoLocal)}
          controls
          className="w-full h-full object-contain bg-black"
          autoPlay
        />
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-900 text-gray-400 gap-4">
        {aulaAtual.tipo === "QUIZ" ? (
          <>
            <FileText className="h-16 w-16" />
            <div className="text-center">
              <p className="text-lg font-medium text-gray-600 dark:text-zinc-400">Quiz Interativo</p>
              <p className="text-sm mt-1">Em breve disponível</p>
            </div>
          </>
        ) : (
          <>
            <FileText className="h-16 w-16" />
            <p className="text-lg font-medium">Material não disponível</p>
          </>
        )}
      </div>
    );
  };

  const getTipoIcon = (tipo: string) => {
    switch (tipo) {
      case "VIDEO": return <Play className="h-3.5 w-3.5" />;
      case "PDF": return <FileText className="h-3.5 w-3.5" />;
      case "QUIZ": return <FileText className="h-3.5 w-3.5" />;
      default: return <Play className="h-3.5 w-3.5" />;
    }
  };

  const getTipoColor = (tipo: string) => {
    switch (tipo) {
      case "VIDEO": return "text-emerald-500";
      case "PDF": return "text-blue-500";
      case "QUIZ": return "text-amber-500";
      default: return "text-gray-500";
    }
  };

  const getTipoLabel = (tipo: string) => {
    switch (tipo) {
      case "VIDEO": return "Vídeo";
      case "PDF": return "PDF";
      case "QUIZ": return "Quiz";
      default: return tipo;
    }
  };

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

  return (
    <div className="h-screen flex flex-col bg-[#0a0a0a] text-gray-900 dark:text-white overflow-hidden">
      {/* Top Bar - YouTube style */}
      <header className="flex items-center justify-between px-3 lg:px-5 py-2 bg-[#0a0a0a] border-b border-white/[0.06] shrink-0 z-30">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(`/cursos/${id}`)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium hidden sm:inline">Voltar</span>
          </button>

          <div className="h-5 w-px bg-white/[0.08]" />

          <div className="hidden sm:block">
            <h1 className="text-sm font-semibold text-white/90 truncate max-w-[200px] lg:max-w-[400px]">
              {curso.titulo}
            </h1>
            {aulaAtual && (
              <p className="text-[11px] text-white/40 truncate max-w-[200px] lg:max-w-[400px]">
                {aulaAtual.titulo}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 text-[11px] text-white/50">
            <div className="w-20 h-1 bg-white/[0.08] rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                style={{ width: `${progresso}%` }}
              />
            </div>
            <span className="font-medium text-white/60">{progresso}%</span>
          </div>

          <button
            onClick={() => setFullscreen(!fullscreen)}
            className="p-2 rounded-lg hover:bg-white/[0.06] text-white/60 hover:text-white transition-all"
            title="Tela cheia"
          >
            {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar Toggle - Desktop */}
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="hidden lg:flex absolute left-2 top-2 z-20 p-1.5 rounded-lg bg-black/50 hover:bg-black/70 text-white/60 hover:text-white transition-all"
        >
          {sidebarOpen ? <ChevronRight className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>

        {/* Video Player Area */}
        <main className="flex-1 flex flex-col overflow-hidden">
          <div className={`relative bg-black ${fullscreen ? "fixed inset-0 z-50" : ""}`}>
            <div className="aspect-video w-full max-h-[65vh] mx-auto">
              {aulaAtual ? (
                <div className="w-full h-full">
                  {renderVideoPlayer()}
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-zinc-900">
                  <div className="text-center text-zinc-600">
                    <Play className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-base font-medium">Selecione uma aula</p>
                    <p className="text-sm mt-1">Escolha uma aula na lista ao lado</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Video Info & Actions */}
          {aulaAtual && !fullscreen && (
            <div className="flex-1 overflow-y-auto bg-white dark:bg-[#111113]">
              <div className="max-w-[1280px] mx-auto w-full px-4 lg:px-6 py-4 space-y-5">
                {/* Title & Meta */}
                <div>
                  <h1 className="text-lg lg:text-xl font-bold text-gray-900 dark:text-white">
                    {aulaAtual.titulo}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-gray-500 dark:text-zinc-500">
                    <span className="flex items-center gap-1.5">
                      <ListVideo className="h-4 w-4" />
                      Aula {aulaIndex} de {totalAulas}
                    </span>
                    {aulaAtual.duracao && (
                      <span className="flex items-center gap-1.5">
                        <Clock className="h-4 w-4" />
                        {aulaAtual.duracao}
                      </span>
                    )}
                    <span className={`flex items-center gap-1.5 ${getTipoColor(aulaAtual.tipo)}`}>
                      {getTipoIcon(aulaAtual.tipo)}
                      {getTipoLabel(aulaAtual.tipo)}
                    </span>
                  </div>
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = aulas.findIndex((a) => a.id === aulaAtual.id);
                      if (idx > 0) selectAula(aulas[idx - 1]);
                    }}
                    disabled={aulaIndex <= 1}
                    className="text-xs gap-1.5"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Anterior
                  </Button>

                  <div className="hidden md:flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                    <BookOpen className="h-3.5 w-3.5" />
                    <span className="text-gray-700 dark:text-zinc-300 font-medium">{curso.titulo}</span>
                    <ChevronRight className="h-3 w-3" />
                    <span className="text-gray-500 dark:text-zinc-400 truncate max-w-[200px]">{aulaAtual.titulo}</span>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const idx = aulas.findIndex((a) => a.id === aulaAtual.id);
                      if (idx < aulas.length - 1) selectAula(aulas[idx + 1]);
                    }}
                    disabled={aulaIndex >= totalAulas}
                    className="text-xs gap-1.5"
                  >
                    Próxima
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>

                {/* Mobile: Show lesson list inline */}
                <div className="lg:hidden">
                  <button
                    onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/[0.06] text-sm font-medium text-gray-700 dark:text-zinc-300"
                  >
                    <span className="flex items-center gap-2">
                      <ListVideo className="h-4 w-4" />
                      Conteúdo do Curso ({totalAulas} aulas)
                    </span>
                    <ChevronDown className={`h-4 w-4 transition-transform ${showMobileSidebar ? "rotate-180" : ""}`} />
                  </button>

                  <AnimatePresence>
                    {showMobileSidebar && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden rounded-xl border border-gray-100 dark:border-white/[0.06] mt-2"
                      >
                        {renderLessonList()}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Sidebar - Desktop */}
        <AnimatePresence initial={false}>
          {sidebarOpen && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 380, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden lg:flex border-l border-white/[0.06] bg-[#0e0e10] overflow-hidden shrink-0"
            >
              <div className="w-[380px] h-full flex flex-col">
                <div className="p-4 border-b border-white/[0.06]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-white/90">
                        Conteúdo do Curso
                      </h2>
                      <p className="text-[11px] text-white/40 mt-0.5">
                        {aulasCompletadas} de {totalAulas} concluídas
                      </p>
                    </div>
                    <span className="text-xs text-emerald-400 font-medium">
                      {progresso}%
                    </span>
                  </div>
                  <div className="mt-2 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                      style={{ width: `${progresso}%` }}
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-thin">
                  {aulas.map((aula, idx) => {
                    const isActive = aulaAtual?.id === aula.id;
                    const isCompleted = idx < aulaIndex - 1;
                    const isLocked = !temAcesso && !aula.gratuito && !isCompleted && !isActive;

                    return (
                      <button
                        key={aula.id}
                        onClick={() => (!isLocked || isActive) ? selectAula(aula) : null}
                        className={`w-full text-left flex items-start gap-3 px-4 py-3.5 transition-all ${
                          isActive
                            ? "bg-emerald-500/10 border-l-2 border-emerald-500"
                            : "hover:bg-white/[0.03] border-l-2 border-transparent"
                        } ${isLocked ? "opacity-40 cursor-not-allowed" : ""}`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                          isCompleted
                            ? "bg-emerald-500/20 text-emerald-400"
                            : isActive
                            ? "bg-emerald-500 text-white"
                            : temAcesso
                            ? "bg-white/[0.10] text-white/60"
                            : "bg-white/[0.06] text-white/40"
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : isLocked ? (
                            <Lock className="h-3.5 w-3.5" />
                          ) : (
                            idx + 1
                          )}
                        </div>

                        <div className="flex-1 min-w-0 pt-0.5">
                          <p className={`text-sm font-medium leading-snug ${
                            isActive
                              ? "text-emerald-300"
                              : isCompleted
                              ? "text-white/60"
                              : "text-white/80"
                          }`}>
                            {aula.titulo}
                          </p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className={`flex items-center gap-1 text-[10px] ${getTipoColor(aula.tipo)}`}>
                              {getTipoIcon(aula.tipo)}
                              {getTipoLabel(aula.tipo)}
                            </span>
                            {aula.duracao && aula.tipo !== "PDF" && (
                              <span className="flex items-center gap-1 text-[10px] text-white/30">
                                <Clock className="h-3 w-3" />
                                {aula.duracao}
                              </span>
                            )}
                            {aula.gratuito && (
                              <Badge className="text-[9px] px-1.5 py-0 h-auto bg-emerald-500/20 text-emerald-400 border-none">
                                Grátis
                              </Badge>
                            )}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Sidebar Overlay */}
      {showMobileSidebar && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setShowMobileSidebar(false)}
        />
      )}
    </div>
  );

  function renderLessonList() {
    return (
      <div className="divide-y divide-gray-100 dark:divide-white/[0.06] max-h-[50vh] overflow-y-auto">
        {aulas.map((aula, idx) => {
          const isActive = aulaAtual?.id === aula.id;
          const isCompleted = idx < aulaIndex - 1;
          const isLocked = !temAcesso && !aula.gratuito && !isCompleted && !isActive;

          return (
            <button
              key={aula.id}
              onClick={() => (!isLocked || isActive) ? selectAula(aula) : null}
              className={`w-full text-left flex items-start gap-3 px-4 py-3 transition-all ${
                isActive
                  ? "bg-emerald-50 dark:bg-emerald-500/10"
                  : "hover:bg-gray-50 dark:hover:bg-white/[0.03]"
              } ${isLocked ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold mt-0.5 ${
                isCompleted
                  ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                  : isActive
                  ? "bg-emerald-500 text-white"
                  : temAcesso
                  ? "bg-gray-300 dark:bg-white/[0.10] text-gray-500 dark:text-white/60"
                  : "bg-gray-200 dark:bg-white/[0.06] text-gray-500 dark:text-white/40"
              }`}>
                {isCompleted ? (
                  <CheckCircle className="h-3.5 w-3.5" />
                ) : isLocked ? (
                  <Lock className="h-3 w-3" />
                ) : (
                  idx + 1
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`text-xs font-medium ${
                  isActive
                    ? "text-emerald-700 dark:text-emerald-300"
                    : "text-gray-700 dark:text-white/80"
                }`}>
                  {aula.titulo}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`flex items-center gap-1 text-[10px] ${getTipoColor(aula.tipo)}`}>
                    {getTipoIcon(aula.tipo)}
                    {getTipoLabel(aula.tipo)}
                  </span>
                  {aula.duracao && aula.tipo !== "PDF" && (
                    <span className="text-[10px] text-gray-400 dark:text-white/30">{aula.duracao}</span>
                  )}
                  {aula.gratuito && (
                    <Badge className="text-[9px] px-1.5 py-0 h-auto bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-none">
                      Grátis
                    </Badge>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }
}

export default PlayerAulas;
