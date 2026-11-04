import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { proficienciaApi, type IdiomaProficiencia, type TipoIngles, type PerguntaQuiz, type ResultadoQuiz } from "@/api/proficiencia";
import {
  Globe, Check, X, ArrowRight, ArrowLeft, RotateCcw, Trophy, Target, BookOpen, AlertCircle, Loader2,
} from "lucide-react";
import { UserPageHeader } from "@/components/user-ui";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";

const LETRAS = ["A", "B", "C", "D"] as const;
type Letra = (typeof LETRAS)[number];

const idiomas: { value: IdiomaProficiencia; label: string; native: string }[] = [
  { value: "ingles",   label: "Inglês",   native: "English" },
  { value: "frances",  label: "Francês",  native: "Français" },
  { value: "espanhol", label: "Espanhol", native: "Español" },
  { value: "alemao",   label: "Alemão",   native: "Deutsch" },
  { value: "italiano", label: "Italiano", native: "Italiano" },
  { value: "mandarim", label: "Mandarim", native: "中文" },
  { value: "japones",  label: "Japonês",  native: "日本語" },
  { value: "coreano",  label: "Coreano",  native: "한국어" },
  { value: "arabe",    label: "Árabe",    native: "العربية" },
  { value: "russo",    label: "Russo",    native: "Русский" },
];

const tiposIngles: { value: TipoIngles; label: string; desc: string }[] = [
  { value: "geral",     label: "Inglês geral", desc: "Sem formato de exame específico" },
  { value: "toefl",     label: "TOEFL iBT",    desc: "Perguntas no estilo do TOEFL" },
  { value: "ielts",     label: "IELTS",        desc: "Perguntas no estilo do IELTS" },
  { value: "cambridge", label: "Cambridge",    desc: "Perguntas no estilo FCE, CAE e CPE" },
];

const categoriaLabels: Record<string, string> = {
  vocabulario: "Vocabulário",
  gramatica: "Gramática",
  compreensao: "Compreensão",
  conjugacao: "Conjugação",
  expressoes: "Expressões",
};

const cardBase = "relative rounded-xl border text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500";
const cardOn = "border-emerald-500 bg-emerald-50 dark:border-emerald-500/70 dark:bg-emerald-500/10";
const cardOff = "border-gray-200 bg-white hover:border-emerald-300 dark:border-white/[0.08] dark:bg-white/[0.03] dark:hover:border-emerald-500/40";
const primaryBtn = "inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-40";
const panel = "rounded-2xl border border-gray-200/70 bg-white dark:border-white/[0.07] dark:bg-[#151518]";
const sectionLabel = "mb-3 text-sm font-semibold text-gray-900 dark:text-white";

type Tela = "selecao" | "carregando" | "quiz" | "resultado";

function ErroBanner({ mensagem }: { mensagem: string }) {
  return (
    <div role="alert" className="mb-6 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-600 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-400">
      <AlertCircle className="h-4 w-4 shrink-0" />
      <span>{mensagem}</span>
    </div>
  );
}

function SelectedMark() {
  return (
    <span className="absolute right-2.5 top-2.5 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-white">
      <Check className="h-3 w-3" strokeWidth={3} />
    </span>
  );
}

export function ProficienciaPage() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [tela, setTela] = useState<Tela>("selecao");
  const [selectedIdioma, setSelectedIdioma] = useState<IdiomaProficiencia | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<TipoIngles>("geral");
  const [perguntas, setPerguntas] = useState<PerguntaQuiz[]>([]);
  const [indiceAtual, setIndiceAtual] = useState(0);
  const [respostas, setRespostas] = useState<{ perguntaIndex: number; resposta: Letra }[]>([]);
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
      setErro(err?.response?.data?.message || "Erro ao gerar o teste. Tente novamente.");
      setTela("selecao");
    }
  }, [selectedIdioma, selectedTipo]);

  const selecionarResposta = useCallback((resposta: Letra) => {
    setRespostas((prev) => [
      ...prev.filter((r) => r.perguntaIndex !== indiceAtual),
      { perguntaIndex: indiceAtual, resposta },
    ]);
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
      setErro(err?.response?.data?.message || "Erro ao enviar as respostas. Tente novamente.");
      setTela("quiz");
    }
  }, [selectedIdioma, selectedTipo, perguntas, respostas]);

  const reiniciar = () => {
    setTela("selecao");
    setSelectedIdioma(null);
    setSelectedTipo("geral");
    setPerguntas([]);
    setIndiceAtual(0);
    setRespostas([]);
    setResultado(null);
    setErro(null);
  };

  const cancelarQuiz = async () => {
    if (await confirm("As suas respostas serão perdidas.", "Cancelar o teste?")) reiniciar();
  };

  const respostaAtual = respostas.find((r) => r.perguntaIndex === indiceAtual);
  const respondidas = respostas.length;
  const progresso = perguntas.length > 0 ? (respondidas / perguntas.length) * 100 : 0;
  const emFalta = perguntas.map((_, i) => i).filter((i) => !respostas.some((r) => r.perguntaIndex === i));

  // Calculado a partir das respostas corrigidas, por pergunta, e ordenado pela ordem do teste.
  const revisao = useMemo(
    () => [...(resultado?.resultados ?? [])].sort((a, b) => a.perguntaIndex - b.perguntaIndex),
    [resultado],
  );
  const porCategoria = useMemo(() => {
    const totais: Record<string, { corretas: number; total: number }> = {};
    for (const r of revisao) {
      totais[r.categoria] ??= { corretas: 0, total: 0 };
      totais[r.categoria].total++;
      if (r.correto) totais[r.categoria].corretas++;
    }
    return Object.entries(totais);
  }, [revisao]);

  const textoOpcao = (perguntaIndex: number, letra: string) => {
    const texto = perguntas[perguntaIndex]?.opcoes[LETRAS.indexOf(letra as Letra)];
    return texto ? `${letra}. ${texto}` : letra;
  };

  const aEnviar = perguntas.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-[calc(100vh-4rem)] flex-col bg-white dark:bg-[#111113]"
    >
      <ConfirmDialog />
      <div className="container mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-8 sm:px-6 sm:pt-10">
        <UserPageHeader
          icon={Globe}
          title="Teste de Proficiência"
          description={
            tela === "selecao"
              ? "Avalie o seu nível com o Teacher ERick"
              : `${selectedIdiomaData?.label ?? ""} · Teacher ERick`
          }
          action={
            tela === "quiz" ? (
              <button
                onClick={cancelarQuiz}
                className="h-9 rounded-xl border border-gray-200 px-3 text-xs font-semibold text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
              >
                Cancelar
              </button>
            ) : undefined
          }
        />

        <AnimatePresence mode="wait">
          {tela === "selecao" && (
            <motion.div
              key="selecao"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              {erro && <ErroBanner mensagem={erro} />}

              <section>
                <h2 className={sectionLabel}>Que idioma quer testar?</h2>
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 md:grid-cols-5">
                  {idiomas.map((idioma) => {
                    const ativo = selectedIdioma === idioma.value;
                    return (
                      <button
                        key={idioma.value}
                        type="button"
                        aria-pressed={ativo}
                        onClick={() => setSelectedIdioma(idioma.value)}
                        className={`${cardBase} ${ativo ? cardOn : cardOff} px-4 py-3.5`}
                      >
                        {ativo && <SelectedMark />}
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{idioma.label}</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{idioma.native}</p>
                      </button>
                    );
                  })}
                </div>
              </section>

              {selectedIdioma === "ingles" && (
                <section>
                  <h2 className={sectionLabel}>Tipo de teste</h2>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {tiposIngles.map((tipo) => {
                      const ativo = selectedTipo === tipo.value;
                      return (
                        <button
                          key={tipo.value}
                          type="button"
                          aria-pressed={ativo}
                          onClick={() => setSelectedTipo(tipo.value)}
                          className={`${cardBase} ${ativo ? cardOn : cardOff} px-4 py-3`}
                        >
                          {ativo && <SelectedMark />}
                          <p className="text-sm font-semibold text-gray-900 dark:text-white">{tipo.label}</p>
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">{tipo.desc}</p>
                        </button>
                      );
                    })}
                  </div>
                </section>
              )}

              <div className={`${panel} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">10 perguntas de múltipla escolha</p>
                  <p className="mt-0.5 text-xs text-gray-500 dark:text-zinc-400">
                    Vocabulário, gramática, conjugação e mais. No final recebe o seu nível CEFR estimado.
                  </p>
                </div>
                <button onClick={iniciarQuiz} disabled={!selectedIdioma} className={`${primaryBtn} shrink-0`}>
                  {selectedIdiomaData ? `Iniciar teste de ${selectedIdiomaData.label}` : "Selecione um idioma"}
                  {selectedIdiomaData && <ArrowRight className="h-4 w-4" />}
                </button>
              </div>
            </motion.div>
          )}

          {tela === "carregando" && (
            <motion.div
              key="carregando"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="flex flex-col items-center justify-center py-32 text-center"
              role="status"
            >
              <Loader2 className="mb-5 h-8 w-8 animate-spin text-emerald-500" />
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {aEnviar ? "A avaliar as suas respostas..." : "A preparar o seu teste..."}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">Isto pode demorar alguns segundos.</p>
            </motion.div>
          )}

          {tela === "quiz" && perguntas.length > 0 && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="mx-auto max-w-2xl"
            >
              {erro && <ErroBanner mensagem={erro} />}

              <div className="mb-6">
                <div className="mb-2 flex items-center justify-between text-xs font-medium">
                  <span className="text-gray-500 dark:text-zinc-400">
                    Pergunta {indiceAtual + 1} de {perguntas.length}
                  </span>
                  <span className="text-emerald-600 dark:text-emerald-400">
                    {respondidas} de {perguntas.length} respondidas
                  </span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={false}
                    animate={{ width: `${progresso}%` }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                  />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {perguntas.map((_, i) => {
                    const respondida = !emFalta.includes(i);
                    const atual = i === indiceAtual;
                    return (
                      <button
                        key={i}
                        type="button"
                        aria-label={`Ir para a pergunta ${i + 1}${respondida ? " (respondida)" : ""}`}
                        aria-current={atual ? "step" : undefined}
                        onClick={() => setIndiceAtual(i)}
                        className={`h-7 w-7 rounded-lg text-xs font-semibold transition-colors sm:h-8 sm:w-8 ${
                          atual
                            ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                            : respondida
                              ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200 dark:bg-emerald-500/15 dark:text-emerald-300 dark:hover:bg-emerald-500/25"
                              : "bg-gray-100 text-gray-500 hover:bg-gray-200 dark:bg-white/[0.06] dark:text-zinc-400 dark:hover:bg-white/[0.1]"
                        }`}
                      >
                        {i + 1}
                      </button>
                    );
                  })}
                </div>
              </div>

              <motion.div
                key={indiceAtual}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-5">
                  <div className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
                    <BookOpen className="h-3 w-3" />
                    {categoriaLabels[perguntas[indiceAtual].categoria] || perguntas[indiceAtual].categoria}
                  </div>
                  <h3 dir="auto" className="text-lg font-semibold leading-relaxed text-gray-900 dark:text-white">
                    {perguntas[indiceAtual].pergunta}
                  </h3>
                </div>

                <div className="mb-8 space-y-2.5">
                  {perguntas[indiceAtual].opcoes.map((opcao, idx) => {
                    const letra = LETRAS[idx];
                    const selecionada = respostaAtual?.resposta === letra;
                    return (
                      <button
                        key={letra}
                        type="button"
                        aria-pressed={selecionada}
                        onClick={() => selecionarResposta(letra)}
                        className={`${cardBase} ${selecionada ? cardOn : cardOff} flex w-full items-center gap-3.5 px-4 py-3.5`}
                      >
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-bold ${
                          selecionada
                            ? "bg-emerald-500 text-white"
                            : "bg-gray-100 text-gray-600 dark:bg-white/[0.08] dark:text-zinc-400"
                        }`}>
                          {letra}
                        </span>
                        <span dir="auto" className={`text-sm ${selecionada ? "font-medium text-emerald-800 dark:text-emerald-200" : "text-gray-700 dark:text-zinc-300"}`}>
                          {opcao}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>

              <div className="flex items-center justify-between gap-3">
                <button
                  onClick={() => setIndiceAtual((i) => i - 1)}
                  disabled={indiceAtual === 0}
                  className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-white/[0.04]"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Anterior
                </button>

                {indiceAtual === perguntas.length - 1 ? (
                  <button onClick={finalizarQuiz} disabled={emFalta.length > 0} className={primaryBtn}>
                    <Trophy className="h-4 w-4" />
                    Terminar teste
                  </button>
                ) : (
                  <button onClick={() => setIndiceAtual((i) => i + 1)} className={primaryBtn}>
                    Próxima
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {indiceAtual === perguntas.length - 1 && emFalta.length > 0 && (
                <p className="mt-3 text-right text-xs text-gray-500 dark:text-zinc-400">
                  {emFalta.length === 1 ? "Falta responder à pergunta" : "Falta responder às perguntas"}{" "}
                  {emFalta.map((i) => i + 1).join(", ")}.
                </p>
              )}
            </motion.div>
          )}

          {tela === "resultado" && resultado && (
            <motion.div
              key="resultado"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-8"
            >
              <div className={`${panel} grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/[0.06]`}>
                {[
                  { valor: resultado.nivel, rotulo: "Nível CEFR estimado" },
                  { valor: `${resultado.pontuacao}%`, rotulo: "Pontuação" },
                  { valor: `${resultado.corretas}/${resultado.total}`, rotulo: "Acertos" },
                ].map(({ valor, rotulo }) => (
                  <div key={rotulo} className="px-2 py-5 text-center sm:py-6">
                    <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 sm:text-3xl">{valor}</div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-zinc-400">{rotulo}</p>
                  </div>
                ))}
              </div>

              <section>
                <h2 className={sectionLabel}>Avaliação</h2>
                <div className={`${panel} p-5`}>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700 dark:text-zinc-300">
                    {resultado.avaliacao}
                  </p>
                </div>
              </section>

              <section>
                <h2 className={`${sectionLabel} flex items-center gap-2`}>
                  <Target className="h-4 w-4 text-emerald-500" />
                  Desempenho por categoria
                </h2>
                <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {porCategoria.map(([cat, dados]) => {
                    const pct = Math.round((dados.corretas / dados.total) * 100);
                    return (
                      <div key={cat} className={`${panel} p-4`}>
                        <div className="mb-2 flex items-center justify-between text-xs">
                          <span className="font-medium text-gray-700 dark:text-zinc-300">{categoriaLabels[cat] || cat}</span>
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">{dados.corretas}/{dados.total}</span>
                        </div>
                        <div className="h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section>
                <h2 className={sectionLabel}>Revisão das respostas</h2>
                <div className="space-y-2.5">
                  {revisao.map((r) => (
                    <div key={r.perguntaIndex} className={`${panel} flex items-start gap-3 p-4`}>
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-white ${r.correto ? "bg-emerald-500" : "bg-red-500"}`}>
                        {r.correto ? <Check className="h-3 w-3" strokeWidth={3} /> : <X className="h-3 w-3" strokeWidth={3} />}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 text-xs text-gray-500 dark:text-zinc-400">Pergunta {r.perguntaIndex + 1}</p>
                        <p dir="auto" className="mb-2 text-sm font-medium text-gray-900 dark:text-white">{r.pergunta}</p>
                        {!r.correto && (
                          <div className="space-y-1 text-xs">
                            <p dir="auto" className="text-red-600 dark:text-red-400">A sua resposta: {textoOpcao(r.perguntaIndex, r.respostaUsuario)}</p>
                            <p dir="auto" className="text-emerald-700 dark:text-emerald-400">Resposta correta: {textoOpcao(r.perguntaIndex, r.respostaCorreta)}</p>
                          </div>
                        )}
                        {r.explicacao && (
                          <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-zinc-400">{r.explicacao}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              <div className="text-center">
                <button onClick={reiniciar} className={primaryBtn}>
                  <RotateCcw className="h-4 w-4" />
                  Fazer novo teste
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
