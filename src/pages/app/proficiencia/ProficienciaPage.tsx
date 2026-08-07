import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { proficienciaApi, type IdiomaProficiencia, type TipoIngles, type PerguntaQuiz, type ResultadoQuiz } from "@/api/proficiencia";
import {
  Globe, CheckCircle, ArrowRight, ArrowLeft, RotateCcw, Trophy, Target, BookOpen, AlertCircle,
} from "lucide-react";

interface IdiomaOption {
  value: IdiomaProficiencia;
  label: string;
  native: string;
  flag: string;
  exame: string;
}

const tiposIngles: { value: TipoIngles; label: string; desc: string }[] = [
  { value: "toefl",     label: "TOEFL iBT",     desc: "0-120 pontos (Reading, Listening, Speaking, Writing)" },
  { value: "ielts",     label: "IELTS",          desc: "1.0-9.0 Band Score" },
  { value: "cambridge", label: "Cambridge",      desc: "FCE (B2), CAE (C1), CPE (C2)" },
  { value: "geral",     label: "Inglês Geral",   desc: "Nível CEFR (A1-C2)" },
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

const categoriaLabels: Record<string, string> = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  compreensao: "Compreensão",
  conjugacao: "Conjugação",
  expressoes: "Expressões",
};

type Tela = "selecao" | "carregando" | "quiz" | "resultado";

export function ProficienciaPage() {
  const [tela, setTela] = useState<Tela>("selecao");
  const [selectedIdioma, setSelectedIdioma] = useState<IdiomaProficiencia | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngles>("geral");
  const [perguntas, setPerguntas] = useState<PerguntaQuiz[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<{ perguntaIndex: number; resposta: "A" | "B" | "C" | "D" }[]>([]);
  const [resultado, setResultado] = useState<ResultadoQuiz | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const selectedIdiomaData = idiomas.find((i) => i.value === selectedIdioma);

  const iniciarQuiz = useCallback(async () => {
    if (!selectedIdioma) return;
    setTela("carregando");
    setErro(null);
    try {
      const data = await proficienciaApi.gerarQuiz({
        idioma: selectedIdioma,
        tipo: selectedIdioma === "ingles" ? selectedTipo : undefined,
      });
      setPerguntas(data.perguntas);
      setIndiceAtual(0);
      setRespostas([]);
      setTela("quiz");
    } catch (err: any) {
      setErro(err?.response?.data?.message || "Erro ao gerar o quiz. Tente novamente.");
      setTela("selecao");
    }
  }, [selectedIdioma, selectedTipo]);

  const selecionarResposta = useCallback((resposta: "A" | "B" | "C" | "D") => {
    setRespostas((prev) => {
      const existente = prev.findIndex((r) => r.perguntaIndex === indiceAtual);
      if (existente >= 0) {
        const novas = [...prev];
        novas[existente] = { perguntaIndex: indiceAtual, resposta };
        return novas;
      }
      return [...prev, { perguntaIndex: indiceAtual, resposta }];
    });
  }, [indiceAtual]);

  const proximaPergunta = useCallback(() => {
    if (indiceAtual < perguntas.length - 1) {
      setIndiceAtual((prev) => prev + 1);
    }
  }, [indiceAtual, perguntas.length]);

  const perguntaAnterior = useCallback(() => {
    if (indiceAtual > 0) {
      setIndiceAtual((prev) => prev - 1);
    }
  }, [indiceAtual]);

  const finalizarQuiz = useCallback(async () => {
    setTela("carregando");
    setErro(null);
    try {
      const data = await proficienciaApi.submeterQuiz({
        idioma: selectedIdioma!,
        tipo: selectedIdioma === "ingles" ? selectedTipo : undefined,
        perguntas,
        respostas,
      });
      setResultado(data);
      setTela("resultado");
    } catch (err: any) {
      setErro(err?.response?.data?.message || "Erro ao enviar respostas. Tente novamente.");
      setTela("quiz");
    }
  }, [selectedIdioma, selectedTipo, perguntas, respostas]);

  const reiniciar = () => {
    setTela("selecao");
    setSelectedIdioma(null);
    setPerguntas([]);
    setIndiceAtual(0);
    setRespostas([]);
    setResultado(null);
    setErro(null);
  };

  const respostaAtual = respostas.find((r) => r.perguntaIndex === indiceAtual);
  const progresso = perguntas.length > 0 ? ((indiceAtual + 1) / perguntas.length) * 100 : 0;
  const respondidas = respostas.length;
  const todasRespondidas = respondidas === perguntas.length;

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
                  {tela === "quiz" ? `Pergunta ${indiceAtual + 1} de ${perguntas.length}` : "Avaliação de Proficiência"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {tela === "quiz" && (
                <button
                  onClick={reiniciar}
                  className="text-[10px] px-3 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                  Cancelar
                </button>
              )}
              {tela === "resultado" && (
                <button
                  onClick={reiniciar}
                  className="text-[10px] px-3 py-1 rounded-lg bg-white/10 text-white/60 hover:bg-white/20 transition-colors"
                >
                  Novo Quiz
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 container mx-auto px-6 max-w-4xl w-full">
        <AnimatePresence mode="wait">
          {tela === "selecao" && (
            <motion.div
              key="selecao"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center mb-6 shadow-lg shadow-emerald-500/20">
                <Globe className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Teste de Proficiência
              </h2>
              <p className="text-sm text-gray-500 dark:text-zinc-500 max-w-md mb-8">
                Responda 10 perguntas de múltipla escolha para avaliar seu nível no idioma escolhido.
              </p>

              {erro && (
                <div className="w-full max-w-lg mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20">
                  <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span>{erro}</span>
                  </div>
                </div>
              )}

              <div className="w-full max-w-lg mb-8">
                <p className="text-xs font-semibold text-gray-600 dark:text-zinc-400 mb-3 text-left uppercase tracking-wider">
                  Selecione o Idioma
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
                    Tipo de Teste
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
                  <span>10 perguntas de múltipla escolha</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Vocabulário, gramática, conjugação e mais</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-zinc-500">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                  <span>Nível CEFR estimado ao final</span>
                </div>
              </div>

              <button
                onClick={iniciarQuiz}
                disabled={!selectedIdioma}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {selectedIdioma ? `Iniciar Quiz em ${idiomas.find((i) => i.value === selectedIdioma)?.native}` : "Selecione um Idioma"}
              </button>
            </motion.div>
          )}

          {tela === "carregando" && (
            <motion.div
              key="carregando"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center py-32"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center mb-6">
                <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
              </div>
              <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                Preparando seu quiz...
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500">
                Teacher ERick está preparando as perguntas
              </p>
            </motion.div>
          )}

          {tela === "quiz" && perguntas.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-zinc-500">
                    Pergunta {indiceAtual + 1} de {perguntas.length}
                  </span>
                  <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400">
                    {respondidas} respondida{respondidas !== 1 ? "s" : ""}
                  </span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-white/[0.06] rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${progresso}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
              </div>

              <motion.div
                key={indiceAtual}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-[10px] font-medium mb-3">
                    <BookOpen className="w-3 h-3" />
                    {categoriaLabels[perguntas[indiceAtual].categoria] || perguntas[indiceAtual].categoria}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white leading-relaxed">
                    {perguntas[indiceAtual].pergunta}
                  </h3>
                </div>

                <div className="space-y-3 mb-8">
                  {perguntas[indiceAtual].opcoes.map((opcao, idx) => {
                    const letra = ["A", "B", "C", "D"][idx] as "A" | "B" | "C" | "D";
                    const selecionada = respostaAtual?.resposta === letra;
                    return (
                      <button
                        key={letra}
                        onClick={() => selecionarResposta(letra)}
                        className={`w-full flex items-center gap-4 px-5 py-4 rounded-xl text-left transition-all duration-200 border ${
                          selecionada
                            ? "bg-emerald-50 dark:bg-emerald-500/10 border-emerald-300 dark:border-emerald-700 ring-2 ring-emerald-500/20"
                            : "bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] hover:border-emerald-200 dark:hover:border-emerald-700"
                        }`}
                      >
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                          selecionada
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-200 dark:bg-white/[0.08] text-gray-600 dark:text-zinc-400"
                        }`}>
                          {letra}
                        </span>
                        <span className={`text-sm ${selecionada ? "text-emerald-700 dark:text-emerald-300 font-medium" : "text-gray-700 dark:text-zinc-300"}`}>
                          {opcao}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <div className="flex items-center justify-between">
                <button
                  onClick={perguntaAnterior}
                  disabled={indiceAtual === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-white/[0.04] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Anterior
                </button>

                {indiceAtual === perguntas.length - 1 ? (
                  <button
                    onClick={finalizarQuiz}
                    disabled={!todasRespondidas}
                    className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white text-sm font-semibold hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <Trophy className="w-4 h-4" />
                    Finalizar Quiz
                  </button>
                ) : (
                  <button
                    onClick={proximaPergunta}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 text-white text-sm font-medium hover:bg-emerald-400 active:scale-[0.98] transition-all"
                  >
                    Próxima
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {tela === "resultado" && resultado && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="py-8"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-emerald-500/30"
                >
                  <Trophy className="w-12 h-12 text-white" />
                </motion.div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Resultado do Quiz
                </h2>
                <p className="text-sm text-gray-500 dark:text-zinc-500">
                  {selectedIdiomaData?.flag} {selectedIdiomaData?.native}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-5 text-center border border-gray-100 dark:border-white/[0.06]">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {resultado.corretas}/{resultado.total}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Acertos</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-5 text-center border border-gray-100 dark:border-white/[0.06]">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {resultado.pontuacao}%
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Pontuação</p>
                </div>
                <div className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-5 text-center border border-gray-100 dark:border-white/[0.06]">
                  <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                    {resultado.nivel}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-zinc-500">Nível CEFR</p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-500" />
                  Desempenho por Categoria
                </h3>
                <div className="space-y-3">
                  {Object.entries(resultado.porCategoria).map(([cat, dados]) => {
                    const pct = dados.total > 0 ? Math.round((dados.corretas / dados.total) * 100) : 0;
                    return (
                      <div key={cat} className="bg-gray-50 dark:bg-white/[0.04] rounded-xl p-4 border border-gray-100 dark:border-white/[0.06]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-medium text-gray-700 dark:text-zinc-300">
                            {categoriaLabels[cat] || cat}
                          </span>
                          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {dados.corretas}/{dados.total} ({pct}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-gray-200 dark:bg-white/[0.06] rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Avaliação
                </h3>
                <div className="bg-gray-50 dark:bg-white/[0.04] rounded-2xl p-6 border border-gray-100 dark:border-white/[0.06]">
                  <p className="text-sm text-gray-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {resultado.avaliacao}
                  </p>
                </div>
              </div>

              <div className="mb-8">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
                  Revisão das Respostas
                </h3>
                <div className="space-y-3">
                  {resultado.resultados.map((r, idx) => (
                    <div
                      key={idx}
                      className={`rounded-xl p-4 border ${
                        r.correto
                          ? "bg-emerald-50 dark:bg-emerald-500/5 border-emerald-200 dark:border-emerald-500/20"
                          : "bg-red-50 dark:bg-red-500/5 border-red-200 dark:border-red-500/20"
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5 ${
                          r.correto
                            ? "bg-emerald-500 text-white"
                            : "bg-red-500 text-white"
                        }`}>
                          {r.correto ? "✓" : "✗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-1">
                            Pergunta {idx + 1}
                          </p>
                          <p className="text-sm text-gray-900 dark:text-white font-medium mb-2">
                            {r.pergunta}
                          </p>
                          {!r.correto && (
                            <div className="text-xs space-y-1">
                              <p className="text-red-600 dark:text-red-400">
                                Sua resposta: {r.respostaUsuario}
                              </p>
                              <p className="text-emerald-600 dark:text-emerald-400">
                                Resposta correta: {r.respostaCorreta}
                              </p>
                            </div>
                          )}
                          <p className="text-xs text-gray-600 dark:text-zinc-400 mt-2 italic">
                            {r.explicacao}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-center">
                <button
                  onClick={reiniciar}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold text-sm hover:from-emerald-500 hover:to-emerald-600 transition-all duration-200 shadow-lg shadow-emerald-500/20"
                >
                  <RotateCcw className="w-4 h-4" />
                  Realizar Novo Quiz
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
