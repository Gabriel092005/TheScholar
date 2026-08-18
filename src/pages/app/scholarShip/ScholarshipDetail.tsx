import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, FileText, CheckCircle2, Clock,
  ShieldCheck, Users, BookOpen, Award, X,
  Upload, CreditCard, Loader2, Building2,
  AlertTriangle, Calendar, MapPin, GraduationCap,
  MessageSquare, Plus,
} from "lucide-react";
import { ExpressIcon, MulticaixaIcon } from "@/components/payment-icons";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { bolsasApi } from "@/api/bolsas";
import { useMutation, useQuery } from "@tanstack/react-query";
import { api, getUploadUrl } from "@/lib/axios";
import Cookies from "js-cookie";
import toast from "react-hot-toast";
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

type PaymentMethod = "EXPRESS" | "TRANSFERENCIA" | "MULTICAIXA";

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] }
};

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
  const [metodoPagamento, setMetodoPagamento] = useState<PaymentMethod>("EXPRESS");
  const [referenciaPagamento, setReferenciaPagamento] = useState("");
  const [comprovativo, setComprovativo] = useState<File | null>(null);
  const [dataSelecionada, setDataSelecionada] = useState<string | null>(null);
  const [horaSelecionada, setHoraSelecionada] = useState<string | null>(null);

  const isDemoToken = Cookies.get("token")?.startsWith("demo.");

  useEffect(() => {
    if (autoServico) {
      setTipoInteresse(autoServico);
      setShowForm(true);
    }
  }, [autoServico]);

  const { data: slotsDias, isLoading: slotsLoading, isError: slotsError, refetch: refetchSlots } = useQuery({
    queryKey: ["consultoria-slots", bolsaId],
    queryFn: () => bolsasApi.consultoriaSlots(bolsaId!),
    enabled: !!bolsaId && tipoInteresse === "CONSULTORIA" && showForm,
  });

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
      if (referenciaPagamento) payload.append("referenciaPagamento", referenciaPagamento);
      payload.append("metodoPagamento", metodoPagamento);
      payload.append("observacoes", tipoInteresse === "CONSULTORIA"
        ? `Interesse: Consultoria - ${observacaoConsultoria}`
        : `Pagamento via ${metodoPagamento} - Ref: ${referenciaPagamento}`
      );
      if (tipoInteresse === "CONSULTORIA" && dataSelecionada && horaSelecionada) {
        payload.append("dataAgendada", `${dataSelecionada}T${horaSelecionada}:00`);
      }
      if (comprovativo) payload.append("comprovativo", comprovativo);
      documentos.forEach((doc) => {
        if (doc.file) {
          payload.append("docNome", doc.nome);
          payload.append("docFile", doc.file);
        }
      });

      await bolsasApi.inscribir(bolsaId, payload);
    },
    onSuccess: () => {
      setInscricaoSuccess(true);
      setInscricaoError(null);
      setShowForm(false);
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
    if (!referenciaPagamento.trim()) {
      toast.error("Informe a referência do pagamento");
      return;
    }
    inscricao.mutate();
  };

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ElementType; desc: string }[] = [
    { value: "EXPRESS", label: "Express", icon: ExpressIcon, desc: "Pagamento via Express" },
    { value: "TRANSFERENCIA", label: "Transferência", icon: Building2, desc: "Transferência bancária" },
    { value: "MULTICAIXA", label: "Multicaixa", icon: MulticaixaIcon, desc: "Pagamento Multicaixa" },
  ];

  const servicosDisponiveis = useMemo(() => {
    const servicos: { value: TipoInteresse; icon: React.ElementType; titulo: string; preco: string; sub?: string }[] = [];
    if (scholarship.consultoriaPrice !== undefined) {
      servicos.push({ value: "CONSULTORIA", icon: MessageSquare, titulo: "Consultoria", preco: formatPrice(CONSULTORIA_PRECO, scholarship.currency), sub: "Sessão de 60 minutos" });
    }
    if (scholarship.mentoriaPrice !== undefined) {
      servicos.push({ value: "MENTORIA", icon: Users, titulo: "Mentoria", preco: formatPrice(scholarship.mentoriaPrice, scholarship.currency) });
    }
    if (scholarship.inscriptionPrice !== undefined) {
      servicos.push({ value: "INSCRICAO", icon: FileText, titulo: "Inscrição", preco: formatPrice(scholarship.inscriptionPrice, scholarship.currency) });
    }
    return servicos;
  }, [scholarship]);

  const bgImageUrl = scholarship.bgImage
    ? scholarship.bgImage.startsWith("http")
      ? scholarship.bgImage
      : getUploadUrl(`/uploads/${scholarship.bgImage.replace(/^\//, "")}`)
    : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#111113]">
      {/* ─── HERO ─── */}
      <div className="relative min-h-[25vh] flex items-end overflow-hidden">
        <div className="absolute inset-0">
          {bgImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-105"
              style={{ backgroundImage: `url(${bgImageUrl})` }}
            />
          )}
          <div className={`absolute inset-0 ${bgImageUrl
            ? "bg-gradient-to-t from-gray-900 via-gray-900/80 to-gray-900/40"
            : "bg-gradient-to-br from-emerald-800 via-emerald-900 to-gray-900"
          }`} />
          <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 via-transparent to-transparent" />
        </div>

        {/* Decorative */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[35rem] h-[35rem] rounded-full bg-emerald-500/10 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full bg-emerald-400/5 blur-3xl" />
        </div>

        <div className="relative w-full">
          <div className="container mx-auto px-6 pt-12 pb-10 md:pb-14 max-w-6xl">
            <button
              onClick={onBack}
              className="inline-flex items-center gap-2 text-emerald-300/80 hover:text-white transition-all mb-8 md:mb-10 text-sm font-medium group backdrop-blur-sm bg-white/10 px-4 py-2 rounded-full border border-white/10"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Voltar às oportunidades
            </button>

            {(scholarship.level || scholarship.area) && (
            <div className="flex flex-wrap gap-3 mb-5">
              {scholarship.level && (
              <Badge className="bg-emerald-500/90 text-white border-none px-4 py-1.5 rounded-full text-xs font-bold tracking-wide shadow-lg shadow-emerald-500/30 backdrop-blur-sm">
                {scholarship.level}
              </Badge>
              )}
              {scholarship.area && (
              <Badge className="bg-white/10 text-white/90 border border-white/20 px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm">
                {scholarship.area}
              </Badge>
              )}
            </div>
            )}

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-6 max-w-4xl tracking-tight">
              {scholarship.title}
            </h1>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2.5 text-sm">
              {scholarship.university && (
              <div className="flex items-center gap-2.5 text-emerald-200/80 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <GraduationCap className="h-4 w-4 text-emerald-300" />
                <span className="font-medium text-white">{scholarship.university}</span>
                {scholarship.country && (
                  <>
                    <span className="text-emerald-400/50">&middot;</span>
                    <span className="text-emerald-200/70">{scholarship.country}</span>
                  </>
                )}
              </div>
              )}
              {scholarship.deadline && (
              <div className="flex items-center gap-2 text-emerald-200/80 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Calendar className="h-4 w-4 text-emerald-300" />
                <span>Prazo: <span className="text-white font-semibold">{scholarship.deadline}</span></span>
              </div>
              )}
              {scholarship.slots > 0 && (
              <div className="flex items-center gap-2 text-emerald-200/80 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 border border-white/10">
                <Users className="h-4 w-4 text-emerald-300" />
                <span><span className="text-white font-semibold">{scholarship.slots}</span> vagas</span>
              </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="relative -mt-12 h-12 bg-gradient-to-t from-gray-50 dark:from-[#111113] to-transparent z-10" />

      {/* ─── CONTENT ─── */}
      <div className="container mx-auto px-6 -mt-8 relative z-10 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT */}
          <div className="lg:col-span-2 space-y-6">
            {scholarship.description && (
            <motion.section {...fadeUp} transition={{ delay: 0.05 }}
              className="bg-white dark:bg-[#111113] rounded-2xl p-7 md:p-8 border border-gray-200/60 dark:border-white/[0.06] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-5">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                  Sobre a Bolsa
                </h2>
              </div>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: scholarship.description }} />
            </motion.section>
            )}

            {scholarship.requirements.length > 0 && (
            <motion.section {...fadeUp} transition={{ delay: 0.1 }}
              className="bg-white dark:bg-[#111113] rounded-2xl p-7 md:p-8 border border-gray-200/60 dark:border-white/[0.06] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                  Requisitos
                </h2>
              </div>
              <ul className="space-y-3">
                {scholarship.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-200/50 dark:ring-white/10">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <span className="text-gray-600 dark:text-zinc-300 text-sm leading-relaxed">{req}</span>
                  </li>
                ))}
              </ul>
            </motion.section>
            )}

            {scholarship.benefits.length > 0 && (
            <motion.section {...fadeUp} transition={{ delay: 0.15 }}
              className="bg-white dark:bg-[#111113] rounded-2xl p-7 md:p-8 border border-gray-200/60 dark:border-white/[0.06] shadow-sm"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center">
                  <Award className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                </div>
                <h2 className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-600 dark:text-emerald-400">
                  Benefícios
                </h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {scholarship.benefits.map((ben, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 bg-gradient-to-r from-emerald-50/80 to-emerald-50/40 dark:from-white/[0.04] dark:to-white/[0.02] rounded-xl p-4 border border-emerald-100 dark:border-white/[0.06]"
                  >
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shrink-0 ring-2 ring-emerald-200 dark:ring-emerald-500/30" />
                    <span className="text-sm text-gray-600 dark:text-zinc-300 font-medium">{ben}</span>
                  </div>
                ))}
              </div>
            </motion.section>
            )}
          </div>

          {/* RIGHT */}
          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            <motion.div {...fadeUp} transition={{ delay: 0.08 }}
              className="bg-white dark:bg-[#111113] rounded-2xl p-6 border border-gray-200/60 dark:border-white/[0.06] shadow-sm"
            >
              {scholarship.deadline && (
              <div className="flex items-center gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-3 mb-5">
                <Clock className="h-4 w-4 text-amber-500 shrink-0" />
                <div>
                  <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wide">Prazo</p>
                  <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">{scholarship.deadline}</p>
                </div>
              </div>
              )}

              {scholarship.slots > 0 && (
              <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100 dark:border-white/[0.06]">
                <div>
                  <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium uppercase tracking-wider mb-0.5">Vagas</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{scholarship.slots}</p>
                </div>
                <div className="h-12 w-12 rounded-xl bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                </div>
              </div>
              )}

              {/* Serviços Disponíveis */}
              <div className="mb-5 pb-5 border-b border-gray-100 dark:border-white/[0.06] space-y-3">
                <p className="text-[10px] text-gray-500 dark:text-zinc-500 font-medium uppercase tracking-wider mb-2">Serviços</p>

                    {scholarship.inscriptionPrice !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center">
                        <FileText className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-zinc-400">Inscrição</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {scholarship.inscriptionPrice > 0
                        ? `AOA ${scholarship.inscriptionPrice.toLocaleString()}`
                        : "Grátis"}
                    </span>
                  </div>
                )}

                {scholarship.consultoriaPrice !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-amber-50 dark:bg-amber-500/10 flex items-center justify-center">
                        <MessageSquare className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-zinc-400">
                        Consultoria <span className="text-[10px] text-gray-400 dark:text-zinc-600">(60 min)</span>
                      </span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      AOA {CONSULTORIA_PRECO.toLocaleString()}
                    </span>
                  </div>
                )}

                {scholarship.mentoriaPrice !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-7 w-7 rounded-lg bg-violet-50 dark:bg-violet-500/10 flex items-center justify-center">
                        <Users className="h-3.5 w-3.5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <span className="text-sm text-gray-600 dark:text-zinc-400">Mentoria</span>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-white">
                      {scholarship.mentoriaPrice > 0
                        ? `AOA ${scholarship.mentoriaPrice.toLocaleString()}`
                        : "Grátis"}
                    </span>
                  </div>
                )}
              </div>

              {scholarship.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {scholarship.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-white/[0.06] text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-white/[0.08]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-3">
                {inscricaoSuccess ? (
                  <div className="w-full bg-emerald-600 text-white rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25">
                    <CheckCircle2 className="h-4 w-4" />
                    Inscrição Realizada!
                  </div>
                ) : (
                  <>
                    {isDemoToken && (
                      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl px-4 py-3 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          Modo demonstração ativo. Faça login para se inscrever.
                        </p>
                      </div>
                    )}
                    <button
                      onClick={() => {
                        if (isDemoToken) {
                          toast.error("Faça login com uma conta real para se inscrever");
                          return;
                        }
                        setShowForm(true);
                      }}
                      disabled={!bolsaId}
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-500 rounded-xl py-3.5 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-emerald-600/25 transition-all duration-200 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDemoToken ? "Faça Login Primeiro" : "Inscrever-se Agora"}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                    {inscricaoError && !showForm && (
                      <p className="text-xs text-red-500 text-center">{inscricaoError}</p>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {(scholarship.university || scholarship.country || scholarship.level) && (
            <motion.div {...fadeUp} transition={{ delay: 0.12 }}
              className="bg-gradient-to-br from-emerald-700 to-emerald-900 dark:from-emerald-900 dark:to-gray-900 rounded-2xl p-6 text-white shadow-sm border border-white/5"
            >
              {scholarship.university && (
              <div className="flex items-center gap-3 mb-4">
                <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-emerald-300" />
                </div>
                <div>
                  <p className="text-[10px] text-emerald-300/80 font-medium uppercase tracking-wide mb-0.5">Instituição</p>
                  <p className="font-bold text-sm leading-snug">{scholarship.university}</p>
                </div>
              </div>
              )}
              {scholarship.country && (
              <div className="flex items-center gap-2 text-emerald-200/70 text-xs">
                <MapPin className="h-3.5 w-3.5" />
                <span>{scholarship.country}</span>
              </div>
              )}
              {scholarship.level && (
              <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2 text-emerald-200/70 text-xs">
                <BookOpen className="h-3.5 w-3.5" />
                <span>Nível: <span className="text-white font-semibold">{scholarship.level}</span></span>
              </div>
              )}
            </motion.div>
            )}
          </div>
        </div>
      </div>

      {/* ─── INSCRIPTION DRAWER ─── */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          >
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            className="absolute right-0 top-0 h-full w-full max-w-xl bg-white dark:bg-[#111113] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex flex-col h-full">
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06] shrink-0">
                  <div>
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Inscrição</h2>
                    <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5 truncate max-w-md">{scholarship.title}</p>
                  </div>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                  >
                    <X size={18} className="text-gray-500 dark:text-zinc-500" />
                  </button>
                </div>

                {/* Cover image */}
                {scholarship.bgImage && (
                  <div className="h-32 shrink-0 relative overflow-hidden">
                    <img
                      src={scholarship.bgImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-transparent to-transparent" />
                  </div>
                )}

                <ScrollArea className="flex-1 px-6 py-6">
                  <div className="space-y-7">
                  {/* STEP 0: Tipo de Interesse */}
                  <section>
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">1</span>
                      O que deseja?
                    </h3>
                    {servicosDisponiveis.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
                        <p className="text-sm text-gray-500 dark:text-zinc-500">Nenhum serviço disponível para esta bolsa</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {servicosDisponiveis.map(({ value, icon: Icon, titulo, preco, sub }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setTipoInteresse(value)}
                            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                              tipoInteresse === value
                                ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                                : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
                            }`}
                          >
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                              tipoInteresse === value
                                ? "bg-emerald-500 text-white"
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
                                <p className="text-[11px] text-gray-400 dark:text-zinc-500 mt-0.5 flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {sub}
                                </p>
                              )}
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5 ${
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
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">2</span>
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
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">3</span>
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
                      <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">4</span>
                        Agendar Consultoria
                      </h3>

                      <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-900/40 rounded-xl px-4 py-3 mb-4">
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
                        Segunda a sexta, entre as 09:00 e as 17:00. Escolha a data e a hora.
                      </p>

                      {slotsLoading ? (
                        <div className="flex items-center justify-center py-8">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-500" />
                        </div>
                      ) : slotsError ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
                          <p className="text-xs text-gray-500 dark:text-zinc-500 mb-2">Não foi possível carregar os horários.</p>
                          <button
                            type="button"
                            onClick={() => refetchSlots()}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                          >
                            Tentar novamente
                          </button>
                        </div>
                      ) : !slotsDias || slotsDias.length === 0 ? (
                        <div className="text-center py-6 bg-gray-50 dark:bg-white/[0.04] rounded-xl">
                          <p className="text-xs text-gray-500 dark:text-zinc-500">Sem horários disponíveis nas próximas semanas.</p>
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
                                  className={`shrink-0 flex flex-col items-center gap-0.5 px-3.5 py-2.5 rounded-xl border-2 transition-all ${
                                    selecionado
                                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                                      : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
                                  }`}
                                >
                                  <span className={`text-[10px] font-bold uppercase ${
                                    selecionado ? "text-emerald-700 dark:text-emerald-400" : "text-gray-400 dark:text-zinc-500"
                                  }`}>
                                    {dt.toLocaleDateString("pt-PT", { weekday: "short" })}
                                  </span>
                                  <span className={`text-xs font-semibold ${
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
                                  return <p className="text-xs text-gray-400 dark:text-zinc-600">Sem horários disponíveis neste dia.</p>;
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
                                            ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/25"
                                            : "border-gray-200 dark:border-white/[0.08] text-gray-700 dark:text-zinc-300 hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
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
                            <div className="mt-4 flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 rounded-xl px-4 py-3">
                              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-800 dark:text-emerald-300">
                                <Calendar className="h-4 w-4" />
                                {new Date(`${dataSelecionada}T00:00:00`).toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" })}{" "}
                                às {horaSelecionada}
                              </div>
                              <Clock className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                            </div>
                          )}
                        </>
                      )}
                    </section>
                  )}

                  {tipoInteresse && tipoInteresse !== "CONSULTORIA" && (
                  <section className="pt-2 border-t border-gray-100 dark:border-white/[0.06]">
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">3</span>
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
                    <h3 className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 mb-4 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-white/[0.06] flex items-center justify-center text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                        {tipoInteresse === "CONSULTORIA" ? "5" : "4"}
                      </span>
                      Pagamento
                    </h3>

                    {tipoInteresse === "CONSULTORIA" && (
                      <div className="flex items-center justify-between bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] rounded-xl px-4 py-3 mb-4">
                        <span className="text-xs text-gray-500 dark:text-zinc-500">
                          Consultoria de {CONSULTORIA_DURACAO_MINUTOS} minutos
                        </span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                          {formatPrice(CONSULTORIA_PRECO, scholarship.currency)}
                        </span>
                      </div>
                    )}

                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setMetodoPagamento(method.value)}
                          className={`flex flex-col items-center gap-2 p-3.5 rounded-xl border-2 transition-all ${
                            metodoPagamento === method.value
                              ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-sm"
                              : "border-gray-200 dark:border-white/[0.08] hover:border-emerald-500/50 dark:hover:border-emerald-500/50"
                          }`}
                        >
                          <method.icon
                            className={`w-[34px] h-[34px] shrink-0 ${
                              metodoPagamento === method.value ? "scale-105" : "opacity-80"
                            }`}
                          />
                          <span className={`text-[9px] font-bold text-center leading-tight ${
                            metodoPagamento === method.value
                              ? "text-gray-900 dark:text-white"
                              : "text-gray-500 dark:text-zinc-400"
                          }`}>
                            {method.label}
                          </span>
                        </button>
                      ))}
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/40 rounded-xl p-4 mb-4">
                      <p className="text-[10px] text-amber-700 dark:text-amber-400 font-bold mb-1">
                        Pagamento via {metodoPagamento === "EXPRESS" ? "Express" : metodoPagamento === "TRANSFERENCIA" ? "Transferência Bancária" : "Multicaixa"}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-500 leading-relaxed">
                        {metodoPagamento === "EXPRESS"
                          ? "Faça o pagamento para o número 923 456 789 (Express). Após o pagamento, insira a referência abaixo."
                          : metodoPagamento === "TRANSFERENCIA"
                          ? "IBAN: AO06 0040 0000 1234 5678 9012 3. Envie o comprovativo após a transferência."
                          : "Pague no Multicaixa com o código 12345. Insira a referência após o pagamento."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-xs text-gray-600 dark:text-zinc-400">Referência *</Label>
                        <Input
                          value={referenciaPagamento}
                          onChange={(e) => setReferenciaPagamento(e.target.value)}
                          placeholder="Código da transação"
                          className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border-gray-200 dark:border-white/[0.08] text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-zinc-600"
                        />
                      </div>
                      <FileUpload
                        label="Comprovativo (opcional)"
                        file={comprovativo}
                        onChange={setComprovativo}
                        accept="image/*,.pdf"
                      />
                    </div>
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

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-[#111113] shrink-0">
                  <Button
                    variant="outline"
                    onClick={() => setShowForm(false)}
                    className="rounded-xl border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-zinc-400 h-11"
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleInscrever}
                    disabled={inscricao.isPending}
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-6 h-11 shadow-lg shadow-emerald-600/25"
                  >
                    {inscricao.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Processando...
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

    </div>
  );
}

function FileUpload({
  label,
  file,
  onChange,
  accept,
}: {
  label: string;
  file: File | null;
  onChange: (f: File | null) => void;
  accept: string;
}) {
  const [, setPreview] = useState<string | null>(null);

  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-gray-600 dark:text-zinc-400">{label}</Label>
      <label className="flex items-center gap-2.5 h-11 px-4 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 dark:hover:border-emerald-500 transition-colors group">
        <Upload size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
        <span className="text-xs text-gray-400 dark:text-zinc-500 truncate flex-1">
          {file ? file.name : "Carregar ficheiro"}
        </span>
        {file && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onChange(null);
              setPreview(null);
            }}
            className="p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-white/[0.08] transition-colors"
          >
            <X size={12} className="text-gray-500" />
          </button>
        )}
        <input type="file" accept={accept} onChange={(e) => onChange(e.target.files?.[0] || null)} className="hidden" />
      </label>
    </div>
  );
}
