import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { bolsasApi } from "@/api/bolsas";
import { perfilAcademicoApi } from "@/api/perfil-academico";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface Props {
  bolsaId?: string;
  bolsaTitulo?: string;
  global?: boolean;
}

/* ─── Typewriter effect ─── */

function TypewriterText({ text, speed = 15 }: { text: string; speed?: number }) {
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
        <span className="inline-block w-[2px] h-[1em] ml-px bg-emerald-500 dark:bg-emerald-400 align-text-bottom animate-pulse" />
      )}
    </span>
  );
}

/* ─── Floating button badge ─── */

function AIIcon() {
  return (
    <img
      src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face"
      alt="Helena"
      className="w-8 h-8 rounded-full ring-2 ring-white/30 object-cover"
    />
  );
}

/* ─── Main component ─── */

export function ScholarshipAIChat({ bolsaId, bolsaTitulo, global }: Props) {
  const [open, setOpen] = useState(false);
  const [dismissed] = useState(() => {
    return localStorage.getItem("helena_dismissed") === "true";
  });
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [typingId, setTypingId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const perfilRef = useRef<any>(null);

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

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await bolsasApi.chat({
        bolsaId,
        mensagem: userMsg.content,
        historico: messages,
        perfilAcademico: perfilRef.current || undefined,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
    } catch (err: any) {
      const serverMsg = err?.response?.data?.message;
      const msg = serverMsg || "Desculpe, ocorreu um erro ao processar a sua pergunta. Tente novamente.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: msg },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, bolsaId, perfilRef]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isLastAssistant = (index: number) =>
    index === messages.length - 1 && messages[index].role === "assistant";

  if (dismissed) {
    return null;
  }

  return (
    <>
      {/* Floating button */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setOpen(true)}
          className="w-14 h-14 rounded-full
            bg-emerald-500 text-white shadow-lg shadow-emerald-500/30
            hover:bg-emerald-400 active:scale-95 hover:scale-110
            flex items-center justify-center
            transition-all duration-200 group relative"
          title="Helena - Assistente IA"
        >
          <span className="group-hover:rotate-12 transition-transform">
            <AIIcon />
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            localStorage.setItem("helena_dismissed", "true");
            toast.success("Helena removida", {
              description: "Reactive-a nas Definições",
              duration: 3000,
            });
            setTimeout(() => window.location.reload(), 500);
          }}
          className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full
            bg-gray-800/70 text-white hover:bg-gray-700
            flex items-center justify-center
            transition-colors text-[10px] font-bold"
          title="Remover assistente IA"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Chat panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="fixed bottom-24 right-6 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[560px] max-h-[calc(100vh-8rem)]
              flex flex-col rounded-2xl overflow-hidden
              border border-gray-200 dark:border-white/[0.08]
              bg-white dark:bg-[#111113]
              shadow-2xl shadow-black/20"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-white/[0.06] bg-emerald-500">
              <div className="flex items-center gap-3">
                <img
                  src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face"
                  alt="Helena"
                  className="w-9 h-9 rounded-full ring-2 ring-white/30 object-cover"
                />
                <div>
                  <p className="text-sm font-semibold text-white">
                    Helena
                  </p>
                  <p className="text-[10px] text-white/70 truncate max-w-[250px]">
                    {bolsaTitulo || (global ? "Todas as bolsas" : "")}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 rounded-lg hover:bg-white/20 transition-colors"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 px-5 py-4">
              <div className="space-y-4 min-h-full">
                {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center px-2 min-h-[300px]">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                      className="w-14 h-14 rounded-full mb-4 overflow-hidden ring-2 ring-emerald-200 dark:ring-emerald-800"
                    >
                      <img
                        src="https://images.unsplash.com/photo-1531123897727-8f129e1688ce?w=150&h=150&fit=crop&crop=face"
                        alt="Helena"
                        className="w-full h-full object-cover"
                      />
                    </motion.div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                      Olá, sou a Helena
                    </p>
                    <p className="text-xs text-gray-400 dark:text-zinc-500 max-w-[240px]">
                      {global
                        ? "Requisitos, prazos, comparar bolsas, recomendações personalizadas e mais."
                        : "Requisitos, prazos, elegibilidade, documentos e mais."}
                    </p>
                  </div>
                )}
                {messages.map((msg, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 12, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.25, ease: "easeOut" }}
                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-emerald-500 text-white rounded-br-md"
                          : "bg-gray-100 dark:bg-white/[0.04] text-gray-900 dark:text-white rounded-bl-md"
                      }`}
                    >
                      {msg.role === "assistant" && isLastAssistant(i) && typingId === i ? (
                        <TypewriterText text={msg.content} speed={15} />
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
                    <div className="rounded-2xl px-4 py-3 bg-gray-100 dark:bg-white/[0.04] rounded-bl-md">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                      </div>
                    </div>
                  </motion.div>
                )}
                <div ref={bottomRef} />
              </div>
            </ScrollArea>

            {/* Input */}
            <div className="border-t border-gray-100 dark:border-white/[0.06] px-4 py-3">
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={global ? "Pergunte sobre qualquer bolsa..." : "Faça uma pergunta..."}
                  disabled={loading}
                  className="flex-1 h-10 px-4 text-sm rounded-xl
                    bg-gray-50 dark:bg-white/[0.04]
                    border border-gray-200 dark:border-white/[0.08]
                    text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600
                    focus:outline-none focus:ring-2 focus:ring-emerald-500/40
                    disabled:opacity-50 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || loading}
                  className="w-10 h-10 rounded-xl bg-emerald-500 text-white
                    hover:bg-emerald-400 active:scale-90
                    disabled:opacity-40 disabled:cursor-not-allowed
                    flex items-center justify-center transition-all"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
