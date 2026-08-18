import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { entrevistaApi } from "@/api/entrevista";
import { perfilAcademicoApi } from "@/api/perfil-academico";
import { ScholarshipCard } from "@/pages/app/scholarShip/ScholarshipCard";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { api, getUploadUrl } from "@/lib/axios";
import {
  Send, Loader2, ArrowLeft, Briefcase, AlertTriangle,
  RefreshCw, X, GraduationCap, User,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Scholarship {
  id: string;
  title: string;
  university: string;
  country: string;
  flag: string;
  deadline: string;
  level: string;
  area: string;
  slots: number;
  description: string;
  requirements: string[];
  benefits: string[];
  tags: string[];
  bgImage?: string;
  inscriptionPrice?: number;
  consultoriaPrice?: number;
  mentoriaPrice?: number;
  currency: string;
  originalPrice?: number;
}

function formataData(data?: string): string {
  if (!data) return "";
  try {
    return format(parseISO(data), "dd 'de' MMMM 'de' yyyy", { locale: pt });
  } catch {
    return data || "";
  }
}

function getTags(bolsa: Bolsa): string[] {
  const tags = [];
  if (bolsa.valor > 0) tags.push("Integral");
  if (bolsa.modalidade) tags.push(bolsa.modalidade);
  if (bolsa.pais) tags.push(bolsa.pais);
  return tags.length ? tags : ["Estudo"];
}

function getNivelLabel(nivel?: string): string {
  if (!nivel) return "Graduação";
  const map: Record<string, string> = {
    GRADUACAO: "Graduação",
    MESTRADO: "Mestrado",
    DOUTORAMENTO: "Doutoramento",
    POSDOC: "Pós-Doutorado",
    MBA: "MBA",
  };
  return map[nivel] || nivel;
}

function mapBolsaToScholarship(bolsa: Bolsa): Scholarship {
  return {
    id: bolsa.id,
    title: bolsa.titulo,
    university: bolsa.instituicao || "Não especificada",
    country: bolsa.pais || "",
    flag: "",
    deadline: formataData(bolsa.datasImportantes?.fechamento)
      || formataData(bolsa.datasImportantes?.abertura)
      || formataData(bolsa.prazo)
      || "—",
    level: getNivelLabel(bolsa.nivel),
    area: bolsa.categoria || "",
    slots: 0,
    description: bolsa.descricao || "",
    requirements: bolsa.requisitos ? [bolsa.requisitos] : [],
    benefits: bolsa.valor > 0 ? [`AOA ${Number(bolsa.valor).toLocaleString()}`] : [],
    tags: getTags(bolsa),
    bgImage: bolsa.imagemUrl
      || (bolsa.imagemBg
        ? (bolsa.imagemBg.startsWith("http") ? bolsa.imagemBg : getUploadUrl(`/uploads/${bolsa.imagemBg}`))
        : undefined),
    inscriptionPrice: bolsa.precoInscricao ?? undefined,
    consultoriaPrice: bolsa.precoConsultoria ?? undefined,
    mentoriaPrice: bolsa.precoMentoria ?? undefined,
    currency: "AOA",
    originalPrice: bolsa.precoOriginal ?? undefined,
  };
}

function TypewriterText({ text, speed = 12 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  useEffect(() => {
    setDisplayed("");
    setDone(false);
    indexRef.current = 0;
    timerRef.current = setInterval(() => {
      if (indexRef.current < text.length) {
        setDisplayed(text.slice(0, indexRef.current + 1));
        indexRef.current++;
      } else {
        setDone(true);
        clearInterval(timerRef.current);
      }
    }, speed);
    return () => clearInterval(timerRef.current);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && (
        <span className="inline-block w-[2px] h-[1em] ml-px bg-emerald-500 align-text-bottom animate-pulse" />
      )}
    </span>
  );
}

function SelecaoBolsas({ onSelect }: { onSelect: (id: string) => void }) {
  const { data: response, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["bolsas-entrevista"],
    queryFn: () => bolsasApi.list({ status: "PUBLICADA" }),
    retry: 2,
  });

  const scholarships = (response?.data || []).map(mapBolsaToScholarship);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white dark:bg-[#111113]"
    >
      <div className="relative bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-[#0a1a14] dark:via-[#0d2420] dark:to-[#0a0a0a]">
        <div className="relative container mx-auto px-6 py-8 md:py-10 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-xl"
          >
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-emerald-100 text-[9px] font-medium mb-3">
              Entrevista de Bolsas
            </div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white leading-[1.15] mb-2 tracking-tight">
              Ernesto
            </h1>
            <p className="text-emerald-100/80 text-xs md:text-sm max-w-lg leading-relaxed">
              Selecione uma bolsa para iniciar a entrevista de avaliação com o nosso entrevistador oficial.
              Será avaliado criteriosamente com base no seu perfil e nas suas respostas.
            </p>
          </motion.div>

          <div className="flex items-center gap-2 mt-4 text-emerald-100/70 text-[11px]">
            <Briefcase className="h-3 w-3" />
            <span className="font-semibold text-white">{scholarships.length}</span>
            <span>bolsas disponíveis</span>
          </div>
        </div>
        <div className="h-12 bg-gradient-to-t from-white dark:from-[#111113] to-transparent" />
      </div>

      <section className="container mx-auto px-6 py-12 max-w-6xl">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-100 dark:bg-white/[0.04] h-48 rounded-t-2xl" />
                <div className="p-5 space-y-3 bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06] border-t-0 rounded-b-2xl">
                  <div className="h-4 bg-gray-100 dark:bg-white/[0.06] rounded w-3/4" />
                  <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-1/2" />
                  <div className="flex gap-4">
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-16" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-12" />
                    <div className="h-3 bg-gray-100 dark:bg-white/[0.06] rounded w-14" />
                  </div>
                  <div className="h-9 bg-gray-100 dark:bg-white/[0.06] rounded-xl mt-4" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">
              Erro ao carregar bolsas
            </p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm mb-6 max-w-md mx-auto">
              {(error as any)?.response?.data?.message || "Não foi possível carregar as bolsas."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-sm font-medium hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              Tentar novamente
            </button>
          </motion.div>
        ) : scholarships.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-20"
          >
            <div className="mx-auto mb-6 h-16 w-16 rounded-2xl bg-gray-50 dark:bg-white/5 flex items-center justify-center">
              <GraduationCap className="h-8 w-8 text-gray-300 dark:text-zinc-600" />
            </div>
            <p className="text-gray-900 dark:text-white font-semibold text-lg mb-1">Nenhuma bolsa disponível</p>
            <p className="text-gray-500 dark:text-zinc-500 text-sm">
              Não há bolsas disponíveis para entrevista de momento.
            </p>
          </motion.div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholarships.map((s, i) => (
              <ScholarshipCard
                key={s.id}
                scholarship={s}
                onSelect={() => onSelect(s.id)}
                index={i}
              />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function EntrevistaChat({
  bolsaId,
  bolsaTitulo,
  onVoltar,
}: {
  bolsaId: string;
  bolsaTitulo: string;
  onVoltar: () => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [typingId, setTypingId] = useState<number | null>(null);
  const perfilRef = useRef<any>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    perfilAcademicoApi.obter().then((data) => {
      const raw = data?.perfil;
      if (raw) {
        const cleaned = Object.fromEntries(Object.entries(raw).filter(([_, v]) => v != null));
        perfilRef.current = cleaned;
      } else {
        perfilRef.current = null;
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingId]);

  const iniciarEntrevista = useCallback(async () => {
    setStarted(true);
    setLoading(true);
    try {
      const data = await entrevistaApi.enviar({
        bolsaId,
        mensagem: "Olá, estou pronto para a entrevista.",
        perfilAcademico: perfilRef.current || undefined,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao iniciar entrevista.";
      setMessages([{ role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [bolsaId]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || finalizado) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await entrevistaApi.enviar({
        bolsaId,
        mensagem: userMsg.content,
        historico: messages,
        perfilAcademico: perfilRef.current || undefined,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao processar resposta.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, bolsaId, finalizado]);

  const handleFinalizar = useCallback(async () => {
    if (loading || finalizado) return;
    setLoading(true);
    try {
      const data = await entrevistaApi.enviar({
        bolsaId,
        mensagem: "Gostaria de finalizar a entrevista.",
        historico: messages,
        finalizar: true,
        perfilAcademico: perfilRef.current || undefined,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
      setFinalizado(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Erro ao finalizar entrevista.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, bolsaId, finalizado]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLastAssistant = (index: number) =>
    index === messages.length - 1 && messages[index].role === "assistant";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-white dark:bg-[#111113] flex flex-col"
    >
      <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-emerald-900 dark:from-[#0a1a14] dark:via-[#0d2420] dark:to-[#0a0a0a]">
        <div className="container mx-auto px-6 py-4 max-w-6xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={onVoltar}
                className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/70 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/20">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Ernesto</p>
                  <p className="text-[10px] text-white/60">Entrevistador Oficial</p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-white/80 font-medium truncate max-w-[200px]">
                {bolsaTitulo}
              </p>
              {!finalizado && started && (
                <button
                  onClick={handleFinalizar}
                  disabled={loading}
                  className="mt-1 text-[10px] px-3 py-1 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  Finalizar Entrevista
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 max-w-4xl w-full flex flex-col">
        <ScrollArea className="flex-1 py-6">
          <div className="space-y-4">
            {!started ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-20 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Entrevista com Ernesto
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-md mb-8">
                  Será submetido a uma entrevista formal de avaliação para a bolsa
                  &ldquo;{bolsaTitulo}&rdquo;. Responda a todas as perguntas com sinceridade
                  e profissionalismo.
                </p>
                <button
                  onClick={iniciarEntrevista}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  Iniciar Entrevista
                </button>
              </motion.div>
            ) : (
              <>
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl px-5 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-md"
                          : "bg-gray-50 dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-bl-md border border-gray-100 dark:border-white/[0.06]"
                      }`}
                    >
                      {msg.role === "assistant" && isLastAssistant(i) && typingId === i ? (
                        <TypewriterText text={msg.content} speed={12} />
                      ) : (
                        msg.content
                      )}
                    </div>
                  </motion.div>
                ))}
                {loading && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="flex justify-start"
                  >
                    <div className="rounded-2xl px-5 py-3 bg-gray-50 dark:bg-white/[0.04] rounded-bl-md border border-gray-100 dark:border-white/[0.06]">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>
        </ScrollArea>

        {started && (
          <div className="border-t border-gray-100 dark:border-white/[0.06] px-0 py-4">
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={finalizado ? "Entrevista finalizada" : "A sua resposta..."}
                disabled={loading || finalizado}
                className="flex-1 h-12 px-5 text-sm rounded-xl
                  bg-gray-50 dark:bg-white/[0.04]
                  border border-gray-200 dark:border-white/[0.08]
                  text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600
                   focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                  disabled:opacity-50 transition-all"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading || finalizado}
                className="w-12 h-12 rounded-xl bg-emerald-500 text-white
                  hover:bg-emerald-400 active:scale-90
                  disabled:opacity-40 disabled:cursor-not-allowed
                  flex items-center justify-center transition-all"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Send className="w-5 h-5" />
                )}
              </button>
            </div>
            {finalizado && (
              <p className="text-xs text-gray-400 dark:text-zinc-600 text-center mt-3">
                Entrevista concluída. Pode voltar e selecionar outra bolsa.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

export function EntrevistaPage() {
  const { bolsaId } = useParams<{ bolsaId?: string }>();
  const navigate = useNavigate();
  const [selectedBolsaId, setSelectedBolsaId] = useState<string | undefined>(bolsaId);
  const [selectedTitulo, setSelectedTitulo] = useState("");

  const { data: bolsa } = useQuery({
    queryKey: ["bolsa", selectedBolsaId],
    queryFn: () => bolsasApi.get(selectedBolsaId!),
    enabled: !!selectedBolsaId,
  });

  useEffect(() => {
    if (bolsa) {
      setSelectedTitulo(bolsa.titulo);
    }
  }, [bolsa]);

  const handleSelectBolsa = (id: string) => {
    setSelectedBolsaId(id);
    navigate(`/entrevista/${id}`, { replace: true });
  };

  const handleVoltar = () => {
    setSelectedBolsaId(undefined);
    setSelectedTitulo("");
    navigate("/entrevista", { replace: true });
  };

  if (!selectedBolsaId) {
    return <SelecaoBolsas onSelect={handleSelectBolsa} />;
  }

  return (
    <EntrevistaChat
      bolsaId={selectedBolsaId}
      bolsaTitulo={selectedTitulo}
      onVoltar={handleVoltar}
    />
  );
}
