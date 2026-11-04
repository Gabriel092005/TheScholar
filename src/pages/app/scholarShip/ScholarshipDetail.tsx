import { useCallback, useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, FileText, CheckCircle2, Clock,
  ShieldCheck, Users, BookOpen, X,
  Upload, CreditCard, Loader2,
  AlertTriangle, Calendar, MapPin, GraduationCap,
  MessageSquare, Plus, Zap,
  Globe, Banknote, Layers, Languages, ExternalLink,
} from "lucide-react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { Link } from "react-router-dom";
import { useUser } from "@/api/useGetProfile";
import { CardAccent, Reveal, iconTile, userCard } from "@/components/user-ui";
import { EstadoPagamento, SeletorPagamento, normalizarTelefone, telefoneValido } from "@/components/pagamento-momenu";
import type { MetodoPagamento, PagamentoMomenu } from "@/api/pagamentos";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bolsasApi } from "@/api/bolsas";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUploadUrl } from "@/lib/axios";
import Cookies from "js-cookie";
import { toast } from "sonner";
import type { Scholarship } from "./types";


function formatPrice(value: number, _currency?: string): string {
  if (value <= 0) return "Grátis";
  return `AOA ${value.toLocaleString()}`;
}

interface ScholarshipDetailProps {
  scholarship: Scholarship;
  onBack: () => void;
  bolsaId?: string;
  autoServico?: TipoInteresse;
}

type TipoInteresse = "CONSULTORIA" | "MENTORIA" | "INSCRICAO";

const CONSULTORIA_PRECO = 5000;
const CONSULTORIA_DURACAO_MINUTOS = 60;

export function ScholarshipDetail({ scholarship, onBack, bolsaId, autoServico }: ScholarshipDetailProps) {
  const [showForm, setShowForm] = useState(false);
  const [inscricaoError, setInscricaoError] = useState<string | null>(null);
  const [inscricaoSuccess, setInscricaoSuccess] = useState(false);
  const [tipoInteresse, setTipoInteresse] = useState<TipoInteresse | null>(null);

  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [observacaoConsultoria, setObservacaoConsultoria] = useState("");
  const [documentos, setDocumentos] = useState<{ nome: string; file: File | null }[]>([]);
  const [metodoPagamento, setMetodoPagamento] = useState<MetodoPagamento>("momenu-mcx");
  const [telefonePagamento, setTelefonePagamento] = useState("");
  const [pagamentoAtivo, setPagamentoAtivo] = useState<PagamentoMomenu | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);

  const isDemoToken = Cookies.get("token")?.startsWith("demo.");

  useEffect(() => {
    if (autoServico) {
      setTipoInteresse(autoServico);
      setShowForm(true);
    }
  }, [autoServico]);
  const { user } = useUser();

  useEffect(() => {
    if (!user) return;
    setNome((atual) => atual || user.nome || "");
    setEmail((atual) => atual || user.email || "");
    setTelefone((atual) => atual || user.phone || "");
  }, [user]);

  const { data: slotsDias, isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useQuery({
    queryKey: ["consultoria-slots", bolsaId],
    queryFn: () => bolsasApi.consultoriaSlots(bolsaId!),
    enabled: !!bolsaId && tipoInteresse === "CONSULTORIA" && showForm,
  });

  const queryClient = useQueryClient();
  const { data: meuEstado } = useQuery({
    queryKey: ["bolsa-estado", bolsaId],
    queryFn: () => bolsasApi.meuEstado(bolsaId!),
    enabled: !!bolsaId && !!user,
  });
  const jaInscrito = !!meuEstado?.inscrito;
  const mentoriaAte = meuEstado?.mentoriaExpiraEm ?? null;

  const atualizarEstado = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["bolsa-estado", bolsaId] });
    queryClient.invalidateQueries({ queryKey: ["bolsas"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-bolsas"] });
  }, [queryClient, bolsaId]);

  // Um link direto para o formulário não pode abrir um serviço que a pessoa já tem.
  useEffect(() => {
    if ((jaInscrito && tipoInteresse === "INSCRICAO") || (mentoriaAte && tipoInteresse === "MENTORIA")) {
      setTipoInteresse(null);
      setShowForm(false);
    }
  }, [jaInscrito, mentoriaAte, tipoInteresse]);

  const valorServico =
    tipoInteresse === "CONSULTORIA"
      ? CONSULTORIA_PRECO
      : tipoInteresse === "MENTORIA"
      ? scholarship.mentoriaPrice
      : scholarship.inscriptionPrice;
  const servicoGratuito = valorServico !== undefined && valorServico <= 0;

  const inscricao = useMutation({
    mutationFn: async () => {
      if (!bolsaId) throw new Error("ID da bolsa não disponível");

      if (isDemoToken) {
        throw new Error("Modo demonstração ativo. Faça login com uma conta real para se inscrever.");
      }

      const payload = new FormData();
      payload.append("tipoInteresse", tipoInteresse || "");
      payload.append("nome", nome);
      payload.append("email", email);
      payload.append("telefone", telefone);
      if (!servicoGratuito) {
        payload.append("metodoPagamento", metodoPagamento);
        if (metodoPagamento === "momenu-mcx") {
          payload.append("phoneNumber", normalizarTelefone(telefonePagamento));
        }
      }
      if (tipoInteresse === "CONSULTORIA") {
        payload.append("observacoes", `Interesse: Consultoria - ${observacaoConsultoria}`);
      }
      if (tipoInteresse === "CONSULTORIA" && dataSelecionada && horaSelecionada) {
        payload.append("dataAgendada", `${dataSelecionada}T${horaSelecionada}:00`);
      }
      documentos.forEach((doc) => {
        if (doc.file) {
          payload.append("docNome", doc.nome);
          payload.append("docFile", doc.file);
        }
      });

      return bolsasApi.inscribir(bolsaId, payload);
    },
    onSuccess: (resultado) => {
      setInscricaoError(null);
      if (resultado.pagamento && resultado.status !== "APROVADA") {
        setPagamentoAtivo(resultado.pagamento);
        return;
      }
      setInscricaoSuccess(true);
      setShowForm(false);
      atualizarEstado();
      toast.success(tipoInteresse === "CONSULTORIA" ? "Consultoria agendada com sucesso!" : "Inscrição realizada com sucesso!");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || err.message || "Erro ao realizar inscrição";
      setInscricaoError(message);
      toast.error(message);
    },
  });

  const handleInscrever = () => {
    if (!tipoInteresse) {
      toast.error("Selecione o tipo de interesse");
      return;
    }
    if (!nome.trim() || !email.trim() || !telefone.trim()) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (tipoInteresse === "CONSULTORIA") {
      if (!observacaoConsultoria.trim()) {
        toast.error("Descreva a sua dúvida ou consulta");
        return;
      }
      if (!dataSelecionada || !horaSelecionada) {
        toast.error("Selecione a data e hora da consultoria");
        return;
      }
    }
    if (!servicoGratuito && metodoPagamento === "momenu-mcx" && !telefoneValido(telefonePagamento)) {
      toast.error("Indique um telefone válido com 9 dígitos, a começar por 9.");
      return;
    }
    inscricao.mutate();
  };

  const pagamentoConfirmado = useCallback(() => {
    setInscricaoSuccess(true);
    atualizarEstado();
    toast.success("Pagamento confirmado!");
  }, [atualizarEstado]);

  const fecharEstadoPagamento = (status: PagamentoMomenu["status"]) => {
    setPagamentoAtivo(null);
    if (status !== "FALHADO") setShowForm(false);
  };

  const servicosDisponiveis = useMemo(() => {
    const servicos: { value: TipoInteresse; icon: React.ElementType; titulo: string; preco: string; sub?: string }[] = [];
    if (scholarship.inscriptionPrice !== undefined && !jaInscrito) {
      servicos.push({ value: "INSCRICAO", icon: FileText, titulo: "Inscrição", preco: formatPrice(scholarship.inscriptionPrice, scholarship.currency) });
    }
    if (scholarship.consultoriaPrice !== undefined) {
      servicos.push({ value: "CONSULTORIA", icon: MessageSquare, titulo: "Consultoria", preco: formatPrice(CONSULTORIA_PRECO, scholarship.currency), sub: "Sessão de 60 minutos" });
    }
    if (scholarship.mentoriaPrice !== undefined && !mentoriaAte) {
      servicos.push({ value: "MENTORIA", icon: Users, titulo: "Mentoria", preco: formatPrice(scholarship.mentoriaPrice, scholarship.currency) });
    }
    return servicos;
  }, [scholarship, jaInscrito, mentoriaAte]);

  const abrirFormulario = (tipo?: TipoInteresse) => {
    if (isDemoToken) {
      toast.error("Faça login com uma conta real para se inscrever");
      return;
    }
    const escolhido = tipo ?? (servicosDisponiveis.length === 1 ? servicosDisponiveis[0].value : null);
    if (escolhido) setTipoInteresse(escolhido);
    setShowForm(true);
  };

  const prazo = useMemo(() => {
    if (!scholarship.deadlineISO) return null;
    const dias = differenceInCalendarDays(parseISO(scholarship.deadlineISO), new Date());
    if (Number.isNaN(dias)) return null;
    if (dias < 0) {
      return { texto: "Prazo encerrado", classe: "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400" };
    }
    const urgente = "bg-amber-50 text-amber-800 dark:bg-amber-500/10 dark:text-amber-300";
    if (dias === 0) return { texto: "Termina hoje", classe: urgente };
    return {
      texto: dias === 1 ? "Falta 1 dia" : `Faltam ${dias} dias`,
      classe: dias <= 14 ? urgente : "bg-emerald-50 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-300",
    };
  }, [scholarship.deadlineISO]);

  const detalhes = [
    { icon: Calendar, label: "Prazo", value: scholarship.deadline },
    { icon: Users, label: "Vagas", value: scholarship.slots > 0 ? String(scholarship.slots) : "" },
    { icon: Banknote, label: "Valor da bolsa", value: scholarship.valor },
    { icon: Layers, label: "Modalidade", value: scholarship.modalidade },
    { icon: Languages, label: "Idioma", value: scholarship.idioma },
    { icon: Globe, label: "País", value: scholarship.country },
  ].filter((d): d is { icon: typeof Calendar; label: string; value: string } => Boolean(d.value));

  // Só aceita links http(s): o valor vem do que for escrito no formulário da bolsa.
  const linkOficial = /^https?:\/\//i.test(scholarship.linkAplicar ?? "") ? scholarship.linkAplicar : null;

  const bgImageUrl = scholarship.bgImage
    ? scholarship.bgImage.startsWith("http")
      ? scholarship.bgImage
      : getUploadUrl(`/uploads/${scholarship.bgImage.replace(/^\//, "")}`)
    : null;

  const secao =
    "rounded-2xl border border-gray-200/70 bg-white p-6 shadow-[0_1px_2px_rgba(16,24,40,0.05)] dark:border-white/[0.07] dark:bg-[#151518] sm:p-7";

  return (
    <div className="min-h-screen bg-white dark:bg-[#111113]">
      <div className="container mx-auto max-w-6xl px-6 py-6 sm:py-8">
        <button
          onClick={onBack}
          className="group mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
          Voltar às oportunidades
        </button>

        {/* ─── TÍTULO ─── */}
        <motion.header
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {scholarship.level && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                <GraduationCap className="h-3.5 w-3.5" />
                {scholarship.level}
              </span>
            )}
            {scholarship.area && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300">
                <BookOpen className="h-3.5 w-3.5" />
                {scholarship.area}
              </span>
            )}
            {scholarship.slots > 0 && scholarship.slots <= 10 && (
              <span className="inline-flex items-center gap-1.5 rounded-lg bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/10 dark:text-amber-400">
                <Zap className="h-3.5 w-3.5" />
                Vagas limitadas
              </span>
            )}
          </div>
          <h1 className="max-w-4xl text-2xl font-bold leading-tight tracking-tight text-gray-900 dark:text-white sm:text-3xl lg:text-4xl">
            {scholarship.title}
          </h1>
          {(scholarship.university || scholarship.country) && (
            <p className="mt-3 flex items-center gap-2 text-sm text-gray-500 dark:text-zinc-400">
              <MapPin className="h-4 w-4 shrink-0 text-emerald-500" />
              {[scholarship.university, scholarship.country].filter(Boolean).join(" · ")}
            </p>
          )}
        </motion.header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3 lg:gap-8">
          {/* ─── CONTEÚDO ─── */}
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {bgImageUrl && (
              <Reveal className="h-auto">
                <div className="overflow-hidden rounded-2xl border border-gray-200/70 dark:border-white/[0.07]">
                  <img
                    src={bgImageUrl}
                    alt=""
                    className="aspect-[16/7] w-full object-cover"
                    onError={(e) => {
                      (e.currentTarget.parentElement as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
              </Reveal>
            )}

            {detalhes.length > 0 && (
              <Reveal className="h-auto">
                <section aria-label="Detalhes da bolsa" className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {detalhes.map(({ icon: Icon, label, value }) => (
                    <div key={label} className={`${userCard} p-4`}>
                      <CardAccent />
                      <Icon className="mb-2 h-4 w-4 text-emerald-500 transition-transform duration-300 group-hover:scale-125" />
                      <p className="text-xs text-gray-500 dark:text-zinc-400">{label}</p>
                      <p className="mt-0.5 text-sm font-semibold text-gray-900 dark:text-white">{value}</p>
                    </div>
                  ))}
                </section>
              </Reveal>
            )}

            {scholarship.description && (
              <Reveal className="h-auto">
                <section className={secao}>
                  <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    <FileText className="h-5 w-5 text-emerald-500" />
                    Sobre a bolsa
                  </h2>
                  <div
                    className="prose prose-sm max-w-none leading-relaxed text-gray-600 dark:prose-invert dark:text-zinc-300"
                    dangerouslySetInnerHTML={{ __html: scholarship.description }}
                  />
                </section>
              </Reveal>
            )}

            {scholarship.requirements.length > 0 && (
              <Reveal className="h-auto">
                <section className={secao}>
                  <h2 className="mb-4 flex items-center gap-3 text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
                    <ShieldCheck className="h-5 w-5 text-emerald-500" />
                    Requisitos
                  </h2>
                  <ul className="space-y-3">
                    {scholarship.requirements.map((req, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-gray-600 dark:text-zinc-300">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              </Reveal>
            )}

            {scholarship.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {scholarship.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* ─── AÇÃO: no telemóvel fica antes do conteúdo, para não obrigar a descer ─── */}
          <aside className="order-first self-start lg:sticky lg:top-6 lg:order-none">
            <Reveal className="h-auto">
              <div className={`${secao} !p-5`}>
                {prazo && (
                  <div className={`mb-5 flex items-center gap-3 rounded-xl px-4 py-3 ${prazo.classe}`}>
                    <Clock className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{prazo.texto}</p>
                      <p className="text-xs opacity-80">Prazo: {scholarship.deadline}</p>
                    </div>
                  </div>
                )}

                {(jaInscrito || mentoriaAte) && (
                  <div className="mb-5 space-y-2" role="status">
                    {jaInscrito && (
                      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        Já está inscrito nesta bolsa
                      </p>
                    )}
                    {mentoriaAte && (
                      <p className="flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
                        <CheckCircle2 className="h-5 w-5 shrink-0" />
                        Mentoria ativa até {new Date(mentoriaAte).toLocaleDateString("pt-PT")}
                      </p>
                    )}
                  </div>
                )}

                {servicosDisponiveis.length > 0 && (
                  <div className="mb-5">
                    <h2 className="mb-3 text-sm font-semibold text-gray-900 dark:text-white">
                      {jaInscrito || mentoriaAte ? "Outros serviços" : "Como podemos ajudar"}
                    </h2>
                    <div className="space-y-2">
                      {servicosDisponiveis.map(({ value, icon: Icon, titulo, preco, sub }) => (
                        <button
                          key={value}
                          type="button"
                          disabled={inscricaoSuccess}
                          onClick={() => abrirFormulario(value)}
                          className="group flex w-full items-center gap-3 rounded-xl border border-gray-200/80 p-3 text-left transition-all duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-60 dark:border-white/[0.08] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.05]"
                        >
                          <span className={`${iconTile} !h-9 !w-9`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block text-sm font-medium text-gray-900 dark:text-white">{titulo}</span>
                            {sub && <span className="block text-xs text-gray-500 dark:text-zinc-400">{sub}</span>}
                          </span>
                          <span className={`shrink-0 text-sm font-semibold ${preco === "Grátis" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-900 dark:text-white"}`}>
                            {preco}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {inscricaoSuccess ? (
                  <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="rounded-xl bg-emerald-50 p-4 text-center dark:bg-emerald-500/10"
                  >
                    <p className="flex items-center justify-center gap-2 text-sm font-semibold text-emerald-700 dark:text-emerald-400">
                      <CheckCircle2 className="h-5 w-5" />
                      Pedido registado com sucesso
                    </p>
                    <Link
                      to="/minhas-atividades"
                      className="mt-2 inline-block text-xs font-medium text-emerald-700 underline-offset-2 hover:underline dark:text-emerald-400"
                    >
                      Acompanhar em Minhas Atividades
                    </Link>
                  </motion.div>
                ) : jaInscrito || mentoriaAte ? null : servicosDisponiveis.length > 0 ? (
                  <>
                    {isDemoToken && (
                      <div className="mb-3 flex items-start gap-2.5 rounded-xl bg-amber-50 px-4 py-3 dark:bg-amber-500/[0.06]">
                        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                        <p className="text-xs leading-relaxed text-amber-700 dark:text-amber-400">
                          Modo demonstração ativo. Faça login para se inscrever.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => abrirFormulario()}
                      disabled={!bolsaId}
                      className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow-lg shadow-emerald-600/20 transition-all duration-200 hover:bg-emerald-500 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-[#151518]"
                    >
                      {isDemoToken ? "Faça login primeiro" : "Inscrever-se agora"}
                      <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                    </button>
                    {inscricaoError && !showForm && (
                      <p className="mt-2 text-center text-xs text-red-500">{inscricaoError}</p>
                    )}
                  </>
                ) : (
                  <p className="rounded-xl bg-gray-50 p-4 text-center text-sm text-gray-500 dark:bg-white/[0.03] dark:text-zinc-400">
                    Os serviços desta bolsa ainda não estão disponíveis.
                  </p>
                )}

                {linkOficial && (
                  <a
                    href={linkOficial}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-3 flex h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.06]"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Ver página oficial da bolsa
                  </a>
                )}
              </div>
            </Reveal>
          </aside>
        </div>
      </div>

      {/* ─── INSCRIPTION DRAWER ─── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
            onClick={() => setShowForm(false)}
          >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-[#111113] shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-label="Formulário de inscrição"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06] shrink-0 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Inscrição</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 truncate max-w-md">{scholarship.title}</p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    aria-label="Fechar"
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={18} className="text-gray-500 dark:text-zinc-500" />
                  </button>
                </div>

                <ScrollArea className="flex-1 px-6 py-6">
                  <div className="space-y-7">
                  {/* STEP 0: Tipo de Interesse */}
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">1</span>
                      O que deseja?
                    </h3>
                    {servicosDisponiveis.length === 0 ? (
                      <div className="text-center py-8 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/60 dark:border-white/[0.04]">
                        <p className="text-sm text-gray-500 dark:text-zinc-500">Nenhum serviço disponível</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {servicosDisponiveis.map(({ value, icon: Icon, titulo, preco, sub }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setTipoInteresse(value)}
                            className={`flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${
                              tipoInteresse === value
                                ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50/80 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                                : "border-gray-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-gray-50/50 dark:hover:bg-white/[0.02]"
                            }`}
                          >
                            <div className={`h-11 w-11 rounded-2xl flex items-center justify-center shrink-0 transition-all ${
                              tipoInteresse === value
                                ? "bg-gradient-to-br from-emerald-500 to-teal-500 text-white shadow-md shadow-emerald-500/25"
                                : "bg-gray-100 dark:bg-white/[0.06] text-gray-500 dark:text-zinc-400"
                            }`}>
                              <Icon className="h-5 w-5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <p className={`text-sm font-bold ${
                                  tipoInteresse === value
                                    ? "text-gray-900 dark:text-white"
                                    : "text-gray-700 dark:text-zinc-300"
                                }`}>
                                  {titulo}
                                </p>
                                <span className={`text-xs font-semibold shrink-0 ${
                                  preco === "Grátis" ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500 dark:text-zinc-400"
                                }`}>
                                  {preco}
                                </span>
                              </div>
                              {sub && (
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-1 flex items-center gap-1.5">
                                  <Clock className="h-3 w-3" />
                                  {sub}
                                </p>
                              )}
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 transition-all ${
                              tipoInteresse === value
                                ? "border-emerald-500 bg-emerald-500"
                                : "border-gray-300 dark:border-zinc-600"
                            }`}>
                              {tipoInteresse === value && (
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </section>

                  {tipoInteresse && (
                  <section>
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">2</span>
                      Dados Pessoais
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Nome Completo *</Label>
                        <Input
                          value={nome}
                          onChange={(e) => setNome(e.target.value)}
                          placeholder="Seu nome completo"
                          className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">E-mail *</Label>
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="seu@email.com"
                          className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Telefone *</Label>
                        <Input
                          value={telefone}
                          onChange={(e) => setTelefone(e.target.value)}
                          placeholder="+244 999 999 999"
                          className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                        />
                      </div>
                    </div>
                  </section>
                  )}

                  { tipoInteresse === "CONSULTORIA" && (
                    <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">3</span>
                        A sua Dúvida
                      </h3>
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Descreva a sua dúvida ou consulta *</Label>
                        <Textarea
                          value={observacaoConsultoria}
                          onChange={(e) => setObservacaoConsultoria(e.target.value)}
                          placeholder="Ex: Gostaria de saber mais sobre os requisitos de candidatura e prazos..."
                          className="min-h-[120px]"
                        />
                      </div>
                    </section>
                  )}

                  { tipoInteresse === "CONSULTORIA" && (
                    <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                      <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">4</span>
                        Agendar Consultoria
                      </h3>

                      <div className="flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-500/[0.06] dark:to-teal-500/[0.03] border border-emerald-100/80 dark:border-emerald-500/10 rounded-2xl px-4 py-3 mb-4">
                        <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {CONSULTORIA_DURACAO_MINUTOS} minutos
                        </span>
                        <span className="text-sm font-bold text-emerald-700 dark:text-emerald-400">
                          {formatPrice(CONSULTORIA_PRECO, scholarship.currency)}
                        </span>
                      </div>

                      <p className="text-[11px] text-gray-500 dark:text-zinc-500 mb-3 flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 shrink-0" />
                        Segunda a sexta, entre as 09:00 e as 17:00.
                      </p>

                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-10">
                          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
                        </div>
                      ) : slotsError ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/60 dark:border-white/[0.04]">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-3">Não foi possível carregar os horários.</p>
                          <button
                            type="button"
                            onClick={() => refetchSlots()}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      ) : !slotsDias || slotsDias.length === 0 ? (
                        <div className="text-center py-8 bg-gray-50 dark:bg-white/[0.03] rounded-2xl border border-gray-100/60 dark:border-white/[0.04]">
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Sem horários disponíveis.</p>
                        </div>
                      ) : (
                        <>
                          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                            {slotsDias.map((d) => {
                              const dt = new Date(`${d.data}T00:00:00`);
                              const selecionado = dataSelecionada === d.data;
                              return (
                                <button
                                  key={d.data}
                                  type="button"
                                  onClick={() => { setDataSelecionada(d.data); setHoraSelecionada(null); }}
                                  className={`shrink-0 flex flex-col items-center gap-0.5 px-4 py-3 rounded-2xl border-2 transition-all ${
                                    selecionado
                                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                                      : "border-gray-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
                                  }`}
                                >
                                  <span className={`text-[10px] font-bold uppercase tracking-wider ${
                                    selecionado ? "text-emerald-600 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"
                                  }`}>
                                    {dt.toLocaleDateString("pt-PT", { weekday: "short" })}
                                  </span>
                                  <span className={`text-xs font-bold ${
                                    selecionado ? "text-gray-900 dark:text-white" : "text-gray-700 dark:text-zinc-300"
                                  }`}>
                                    {dt.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit" })}
                                  </span>
                                </button>
                              );
                            })}
                          </div>

                          {dataSelecionada && (
                            <div className="mt-3">
                              <p className="text-[11px] text-gray-500 dark:text-zinc-500 font-medium mb-2">Horários disponíveis</p>
                              {(() => {
                                const dia = slotsDias.find((d) => d.data === dataSelecionada);
                                if (!dia || dia.horarios.length === 0) {
                                  return <p className="text-xs text-gray-400 dark:text-zinc-600">Sem horários neste dia.</p>;
                                }
                                return (
                                  <div className="grid grid-cols-4 gap-2">
                                    {dia.horarios.map((h) => (
                                      <button
                                        key={h}
                                        type="button"
                                        onClick={() => setHoraSelecionada(h)}
                                        className={`py-2.5 rounded-xl border-2 text-xs font-bold transition-all ${
                                          horaSelecionada === h
                                            ? "border-emerald-500 bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg shadow-emerald-500/25"
                                            : "border-gray-200/80 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300 hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
                                        }`}
                                      >
                                        {h}
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()}
                            </div>
                          )}

                          {dataSelecionada && horaSelecionada && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 flex items-center justify-between bg-gradient-to-r from-emerald-50 to-teal-50/50 dark:from-emerald-500/[0.06] dark:to-teal-500/[0.03] border border-emerald-100/80 dark:border-emerald-500/10 rounded-2xl px-4 py-3"
                            >
                              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                <Calendar className="h-4 w-4" />
                                {new Date(`${dataSelecionada}T00:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                                às {horaSelecionada}
                              </div>
                              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            </motion.div>
                          )}
                        </>
                      )}
                    </section>
                  )}

                  {tipoInteresse && tipoInteresse !== "CONSULTORIA" && (
                  <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">3</span>
                      Documentos
                    </h3>
                    <div className="space-y-2">
                      {documentos.map((doc, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Input
                            value={doc.nome}
                            onChange={(e) => {
                              const updated = [...documentos];
                              updated[i] = { ...updated[i], nome: e.target.value };
                              setDocumentos(updated);
                            }}
                            placeholder="Ex: BI, Passaporte, Currículo..."
                            className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600 text-sm flex-1"
                          />
                          <label className="flex items-center gap-2 h-11 px-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 transition-colors shrink-0">
                            <Upload size={14} className="text-gray-400" />
                            <span className="text-xs text-gray-400 truncate max-w-[80px]">
                              {doc.file ? doc.file.name : "Ficheiro"}
                            </span>
                            <input
                              type="file"
                              accept="image/*,.pdf,.doc,.docx"
                              onChange={(e) => {
                                const updated = [...documentos];
                                updated[i] = { ...updated[i], file: e.target.files?.[0] || null };
                                setDocumentos(updated);
                              }}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => setDocumentos(documentos.filter((_, j) => j !== i))}
                            className="h-11 w-11 flex items-center justify-center rounded-xl border border-gray-200 dark:border-white/[0.08] text-gray-400 hover:text-red-500 hover:border-red-300 transition-colors shrink-0"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        onClick={() => setDocumentos([...documentos, { nome: "", file: null }])}
                        className="flex items-center gap-2 h-11 px-4 rounded-xl border border-dashed border-gray-200 dark:border-white/[0.08] text-xs text-gray-500 dark:text-zinc-400 hover:border-emerald-400 hover:text-emerald-600 transition-colors w-full"
                      >
                        <Plus size={14} />
                        Adicionar documento
                      </button>
                    </div>
                  </section>
                  )}

                  {tipoInteresse && (
                  <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <h3 className="text-[11px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2.5">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-500/15 flex items-center justify-center text-[10px] font-bold text-emerald-700 dark:text-emerald-400">
                        {tipoInteresse === "CONSULTORIA" ? "5" : "4"}
                      </span>
                      Pagamento
                    </h3>

                    {tipoInteresse === "CONSULTORIA" && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-white/[0.03] border border-gray-100 dark:border-white/[0.06] rounded-2xl px-4 py-3 mb-4">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                          Consultoria de {CONSULTORIA_DURACAO_MINUTOS} minutos
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatPrice(CONSULTORIA_PRECO, scholarship.currency)}
                        </span>
                      </div>
                    )}

                    {servicoGratuito ? (
                      <p className="text-xs text-gray-500 dark:text-zinc-400">Este serviço é gratuito.</p>
                    ) : (
                      <SeletorPagamento
                        metodo={metodoPagamento}
                        onMetodo={setMetodoPagamento}
                        telefone={telefonePagamento}
                        onTelefone={setTelefonePagamento}
                      />
                    )}
                  </section>
                  )}
                </div>
                </ScrollArea>

                {inscricaoError && (
                  <div className="px-6 py-3 bg-red-50 dark:bg-red-950/30 border-t border-red-100 dark:border-red-900/40 shrink-0">
                    <p className="text-xs text-red-600 dark:text-red-400 text-center font-medium flex items-center justify-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5" />
                      {inscricaoError}
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#0e0e10] shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-white h-11"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleInscrever}
                    disabled={inscricao.isPending || !tipoInteresse}
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 h-11 shadow-lg shadow-emerald-600/25"
                  >
                    {inscricao.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
                      </>
                    ) : tipoInteresse && !servicoGratuito && metodoPagamento === "reference" ? (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Gerar referência
                      </>
                    ) : tipoInteresse === "CONSULTORIA" ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Agendar Consultoria
                      </>
                    ) : tipoInteresse === "MENTORIA" ? (
                      <>
                        <Users className="h-4 w-4 mr-2" />
                        Solicitar Mentoria
                      </>
                    ) : servicoGratuito ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirmar inscrição
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Pagar e Inscrever
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {pagamentoAtivo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-[#111113] rounded-3xl shadow-2xl p-6">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Pagamento</h3>
            <EstadoPagamento
              pagamento={pagamentoAtivo}
              onConfirmado={pagamentoConfirmado}
              onFechar={fecharEstadoPagamento}
            />
          </div>
        </div>
      )}

    </div>
  );
}
