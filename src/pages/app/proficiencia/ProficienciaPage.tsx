import { useState, useRef, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { proficienciaApi, type IdiomaProficiencia, type TipoIngles } from "@/api/proficiencia";
import {
  Send, Loader2, Globe, CheckCircle,
} from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface IdiomaOption {
  value: IdiomaProficiencia;
  label: string;
  native: string;
  flag: string;
  exame: string;
}

const tiposIngles: { value: TipoIngles; label: string; desc: string }[] = [
  { value: "toefl",     label: "TOEFL iBT",     desc: "0-120 points (Reading, Listening, Speaking, Writing)" },
  { value: "ielts",     label: "IELTS",          desc: "1.0-9.0 Band Score" },
  { value: "cambridge", label: "Cambridge",      desc: "FCE (B2), CAE (C1), CPE (C2)" },
  { value: "geral",     label: "General English", desc: "CEFR Level (A1-C2)" },
];

const idiomas: IdiomaOption[] = [
  { value: "ingles",   label: "Inglês",   native: "English",        flag: "🇬🇧", exame: "TOEFL / IELTS / Cambridge" },
  { value: "frances",  label: "Francês",  native: "Français",      flag: "🇫🇷", exame: "CEFR/DELF (A1-C2)" },
  { value: "espanhol", label: "Espanhol", native: "Español",       flag: "🇪🇸", exame: "CEFR/DELE (A1-C2)" },
  { value: "mandarim", label: "Mandarim", native: "中文",          flag: "🇨🇳", exame: "HSK (1-6)" },
  { value: "japones",  label: "Japonês",  native: "日本語",        flag: "🇯🇵", exame: "JLPT (N5-N1)" },
  { value: "alemao",   label: "Alemão",   native: "Deutsch",       flag: "🇩🇪", exame: "CEFR/Goethe (A1-C2)" },
  { value: "italiano", label: "Italiano", native: "Italiano",      flag: "🇮🇹", exame: "CEFR/CELI (A1-C2)" },
  { value: "coreano",  label: "Coreano",  native: "한국어",        flag: "🇰🇷", exame: "TOPIK (1-6)" },
  { value: "arabe",    label: "Árabe",    native: "العربية",      flag: "🇸🇦", exame: "CEFR/ALPT (A1-C2)" },
  { value: "russo",    label: "Russo",    native: "Русский",      flag: "🇷🇺", exame: "CEFR/ТРКИ (A1-C2)" },
];

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

export function ProficienciaPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [typingId, setTypingId] = useState<number | null>(null);
  const [selectedIdioma, setSelectedIdioma] = useState<IdiomaProficiencia | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngles>("geral");
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, typingId]);

  useEffect(() => {
    if (started) setTimeout(() => inputRef.current?.focus(), 300);
  }, [started]);

  const selectedIdiomaData = idiomas.find((i) => i.value === selectedIdioma);

  const iniciarTeste = useCallback(async () => {
    if (!selectedIdioma) return;
    setStarted(true);
    setLoading(true);
    const lang = idiomas.find((i) => i.value === selectedIdioma);
    const msg = `Hello, I am ready to begin the ${lang?.native || "language"} proficiency test.`;
    try {
      const data = await proficienciaApi.enviar({
        idioma: selectedIdioma,
        tipo: selectedIdioma === "ingles" ? selectedTipo : undefined,
        mensagem: msg,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Sorry, there was an error starting the test.";
      setMessages([{ role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [selectedIdioma, selectedTipo]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || loading || finalizado || !selectedIdioma) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const data = await proficienciaApi.enviar({
        idioma: selectedIdioma,
        tipo: selectedIdioma === "ingles" ? selectedTipo : undefined,
        mensagem: userMsg.content,
        historico: messages,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Sorry, an error occurred.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, finalizado, selectedIdioma, selectedTipo]);

  const handleFinalizar = useCallback(async () => {
    if (loading || finalizado || !selectedIdioma) return;
    setLoading(true);
    try {
      const data = await proficienciaApi.enviar({
        idioma: selectedIdioma,
        tipo: selectedIdioma === "ingles" ? selectedTipo : undefined,
        mensagem: "I would like to end the test and receive my evaluation.",
        historico: messages,
        finalizar: true,
      });
      setMessages(data.historico);
      setTypingId(data.historico.length - 1);
      setFinalizado(true);
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Error ending the test.";
      setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
    } finally {
      setLoading(false);
    }
  }, [loading, messages, finalizado, selectedIdioma]);

  const handleVoltar = () => {
    setMessages([]);
    setStarted(false);
    setFinalizado(false);
    setSelectedIdioma(null);
  };

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
              <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-white/20">
                <Globe className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">
                  Teacher ERick
                  {selectedIdiomaData && <span className="ml-2 font-normal text-white/60">{selectedIdiomaData.flag}</span>}
                </p>
                <p className="text-[10px] text-white/60">
                  {selectedIdiomaData ? `${selectedIdiomaData.native} Proficiency Examiner` : "Language Proficiency Examiner"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {started && !finalizado && (
                <button
                  onClick={handleFinalizar}
                  disabled={loading}
                  className="text-[10px] px-3 py-1 rounded-lg bg-white/10 text-white/80 hover:bg-white/20 transition-colors disabled:opacity-50"
                >
                  End Test
                </button>
              )}
              {started && (
                <button
                  onClick={handleVoltar}
                  className="text-[10px] px-3 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                  New Test
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
                className="flex flex-col items-center justify-center py-16 text-center"
              >
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                  <Globe className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  Language Proficiency Test
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-md mb-8">
                  Choose a language to test. Teacher ERick will evaluate your speaking, vocabulary,
                  grammar, pronunciation, and comprehension skills.
                </p>

                <div className="w-full max-w-lg mb-8">
                  <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-3 text-left uppercase tracking-wider">
                    Select Language
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {idiomas.map((idioma) => (
                      <button
                        key={idioma.value}
                        onClick={() => setSelectedIdioma(idioma.value)}
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                          selectedIdioma === idioma.value
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                            : "bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300 hover:border-emerald-200 dark:hover:border-emerald-700"
                        }`}
                      >
                        <span className="text-lg">{idioma.flag}</span>
                        <div className="text-left">
                          <p className="font-semibold text-xs">{idioma.label}</p>
                          <p className="text-[10px] opacity-60">{idioma.exame}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {selectedIdioma === "ingles" && (
                  <div className="w-full max-w-lg mb-8">
                    <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-3 text-left uppercase tracking-wider">
                      Test Type
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                      {tiposIngles.map((tipo) => (
                        <button
                          key={tipo.value}
                          onClick={() => setSelectedTipo(tipo.value)}
                          className={`text-left px-4 py-3 rounded-xl text-sm font-medium transition-all border ${
                            selectedTipo === tipo.value
                              ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300"
                              : "bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300 hover:border-emerald-200 dark:hover:border-emerald-700"
                          }`}
                        >
                          <p className="font-semibold text-xs">{tipo.label}</p>
                          <p className="text-[10px] opacity-60 mt-0.5">{tipo.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col items-center gap-2 mb-8">
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Approximately 10-15 minutes</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>6 questions covering different skills</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                    <span>Detailed evaluation with proficiency level</span>
                  </div>
                </div>

                <button
                  onClick={iniciarTeste}
                  disabled={!selectedIdioma}
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {selectedIdioma ? `Start ${idiomas.find((i) => i.value === selectedIdioma)?.native} Test` : "Select a Language"}
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
                placeholder={finalizado ? "Test completed" : `Answer in ${selectedIdiomaData?.native || "the language"}...`}
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
                Test completed. Click "New Test" to practice another language.
              </p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
