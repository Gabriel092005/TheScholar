import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, FileText, CheckCircle2, Clock,
  ShieldCheck, Users, BookOpen, Award, X,
  Upload, CreditCard, Loader2, Building2,
  AlertTriangle, Calendar, MapPin, GraduationCap,
  MessageSquare, Plus, Sparkles, Star, Zap,
  Heart, Globe, TrendingUp, ChevronRight,
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
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] }
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
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
    const servicos: { value: TipoInteresse; icon: React.ElementType; titulo: string; preco: string; sub?: string; color: string }[] = [];
    if (scholarship.consultoriaPrice !== undefined) {
      servicos.push({ value: "CONSULTORIA", icon: MessageSquare, titulo: "Consultoria", preco: formatPrice(CONSULTORIA_PRECO, scholarship.currency), sub: "Sessão de 60 minutos", color: "violet" });
    }
    if (scholarship.mentoriaPrice !== undefined) {
      servicos.push({ value: "MENTORIA", icon: Users, titulo: "Mentoria", preco: formatPrice(scholarship.mentoriaPrice, scholarship.currency), color: "blue" });
    }
    if (scholarship.inscriptionPrice !== undefined) {
      servicos.push({ value: "INSCRICAO", icon: FileText, titulo: "Inscrição", preco: formatPrice(scholarship.inscriptionPrice, scholarship.currency), color: "emerald" });
    }
    return servicos;
  }, [scholarship]);

  const bgImageUrl = scholarship.bgImage
    ? scholarship.bgImage.startsWith("http")
      ? scholarship.bgImage
      : getUploadUrl(`/uploads/${scholarship.bgImage.replace(/^\//, "")}`)
    : null;

  const tagIcons: Record<string, React.ElementType> = {
    "GRATUITA": Heart,
    "INTERNACIONAL": Globe,
    "EMPREGO": TrendingUp,
    "CIÊNCIA": Sparkles,
  };

  return (
    <div className="min-h-screen bg-[#f4faf7] dark:bg-[#0a0a0c]">
      {/* ─── HERO ─── */}
      <div className="relative min-h-[280px] md:min-h-[300px] flex items-end overflow-hidden">
        {/* Background layers */}
        <div className="absolute inset-0">
          {bgImageUrl && (
            <div
              className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-110"
              style={{ backgroundImage: `url(${bgImageUrl})` }}
            />
          )}
          <div className={`absolute inset-0 ${bgImageUrl
            ? "bg-gradient-to-t from-[#0a0a0c] via-[#0a0a0c]/80 to-[#0a0a0c]/30"
            : "bg-gradient-to-br from-[#053a2e] via-[#0a2e23] to-[#0a0a0c]"
          }`} />
          {/* Mesh gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 via-transparent to-teal-600/10" />
        </div>

        {/* Animated decorative orbs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ y: [0, -15, 0], x: [0, 8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-emerald-500/[0.07] blur-[100px]"
          />
          <motion.div
            animate={{ y: [0, 12, 0], x: [0, -6, 0] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-40 -left-40 w-[25rem] h-[25rem] rounded-full bg-teal-400/[0.05] blur-[80px]"
          />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.03]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '60px 60px'
          }} />
        </div>

        <div className="relative w-full">
          <div className="container mx-auto px-6 pt-8 pb-8 md:pb-10 max-w-6xl">
            {/* Back button */}
            <motion.button
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              onClick={onBack}
              className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-all mb-5 md:mb-6 text-sm font-medium group backdrop-blur-md bg-white/[0.06] hover:bg-white/[0.1] px-4 py-2 rounded-full border border-white/[0.08] hover:border-white/[0.15]"
            >
              <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Voltar às oportunidades
            </motion.button>

            {/* Badges */}
            <motion.div {...fadeUp} transition={{ delay: 0.15 }} className="flex flex-wrap gap-2.5 mb-4">
              {scholarship.level && (
                <span className="inline-flex items-center gap-1.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-1.5 rounded-full text-[11px] font-bold tracking-wider uppercase shadow-lg shadow-emerald-500/30 backdrop-blur-sm">
                  <GraduationCap size={12} />
                  {scholarship.level}
                </span>
              )}
              {scholarship.area && (
                <span className="inline-flex items-center gap-1.5 bg-white/[0.1] text-white/90 border border-white/[0.15] px-4 py-1.5 rounded-full text-[11px] font-medium backdrop-blur-md">
                  <BookOpen size={11} />
                  {scholarship.area}
                </span>
              )}
              {scholarship.slots > 0 && scholarship.slots <= 10 && (
                <span className="inline-flex items-center gap-1.5 bg-amber-500/90 text-white px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide shadow-lg shadow-amber-500/30 backdrop-blur-sm">
                  <Zap size={11} />
                  Vagas limitadas
                </span>
              )}
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              className="text-3xl md:text-4xl lg:text-[2.75rem] font-extrabold text-white leading-[1.1] mb-6 max-w-4xl tracking-tight"
            >
              {scholarship.title}
            </motion.h1>

            {/* Meta pills */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              {scholarship.university && (
                <div className="flex items-center gap-2.5 bg-white/[0.08] backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/[0.1] hover:bg-white/[0.12] transition-colors">
                  <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-400/80 to-teal-500/80 flex items-center justify-center">
                    <GraduationCap className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <span className="font-semibold text-white text-sm">{scholarship.university}</span>
                    {scholarship.country && (
                      <span className="text-white/50 text-sm ml-1.5">· {scholarship.country}</span>
                    )}
                  </div>
                </div>
              )}
              {scholarship.deadline && (
                <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/[0.1]">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  <span className="text-white/60 text-sm">Prazo:</span>
                  <span className="text-white font-semibold text-sm">{scholarship.deadline}</span>
                </div>
              )}
              {scholarship.slots > 0 && (
                <div className="flex items-center gap-2 bg-white/[0.08] backdrop-blur-md rounded-2xl px-4 py-2.5 border border-white/[0.1]">
                  <Users className="h-4 w-4 text-emerald-400" />
                  <span className="text-white font-semibold text-sm">{scholarship.slots}</span>
                  <span className="text-white/50 text-sm">vagas</span>
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="relative -mt-8 h-8 bg-gradient-to-t from-[#f4faf7] dark:from-[#0a0a0c] to-transparent z-10" />

      {/* ─── CONTENT ─── */}
      <div className="container mx-auto px-6 -mt-4 relative z-10 max-w-6xl pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            {scholarship.description && (
              <motion.section {...fadeUp} transition={{ delay: 0.05 }}
                className="relative bg-white dark:bg-[#111113] rounded-3xl p-8 md:p-9 border border-gray-200/50 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                {/* Decorative corner accent */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-emerald-50/[0.5] to-transparent dark:from-emerald-500/[0.03] rounded-bl-[80px] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-500/10 dark:to-emerald-500/5 flex items-center justify-center shadow-sm shadow-emerald-500/10">
                      <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                      Sobre a Bolsa
                    </h2>
                  </div>
                  <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-zinc-300 leading-relaxed" dangerouslySetInnerHTML={{ __html: scholarship.description }} />
                </div>
              </motion.section>
            )}

            {/* Requirements */}
            {scholarship.requirements.length > 0 && (
              <motion.section {...fadeUp} transition={{ delay: 0.1 }}
                className="relative bg-white dark:bg-[#111113] rounded-3xl p-8 md:p-9 border border-gray-200/50 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-emerald-50/[0.5] to-transparent dark:from-emerald-500/[0.03] rounded-tr-[80px] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-50 to-emerald-100/80 dark:from-emerald-500/10 dark:to-emerald-500/5 flex items-center justify-center shadow-sm shadow-emerald-500/10">
                      <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                      Requisitos
                    </h2>
                  </div>
                  <div className="space-y-3">
                    {scholarship.requirements.map((req, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.05 }}
                        className="flex items-start gap-3.5 p-3.5 rounded-2xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100/80 dark:border-white/[0.04] hover:bg-emerald-50/50 dark:hover:bg-emerald-500/[0.03] transition-colors group"
                      >
                        <div className="h-7 w-7 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5 flex items-center justify-center shrink-0 mt-0.5 ring-1 ring-emerald-200/50 dark:ring-emerald-500/10 group-hover:ring-emerald-300 dark:group-hover:ring-emerald-500/20 transition-all">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-gray-600 dark:text-zinc-300 text-[13px] leading-relaxed">{req}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}

            {/* Benefits */}
            {scholarship.benefits.length > 0 && (
              <motion.section {...fadeUp} transition={{ delay: 0.15 }}
                className="relative bg-white dark:bg-[#111113] rounded-3xl p-8 md:p-9 border border-gray-200/50 dark:border-white/[0.06] shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-amber-50/60 to-transparent dark:from-amber-500/[0.03] rounded-br-[80px] pointer-events-none" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-100/60 dark:from-amber-500/10 dark:to-orange-500/5 flex items-center justify-center shadow-sm shadow-amber-500/10">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h2 className="text-sm font-bold text-gray-900 dark:text-white tracking-tight">
                      Benefícios
                    </h2>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {scholarship.benefits.map((ben, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className="relative flex items-center gap-3.5 bg-gradient-to-br from-amber-50/60 via-emerald-50/30 to-transparent dark:from-white/[0.03] dark:via-white/[0.01] dark:to-transparent rounded-2xl p-4 border border-amber-100/60 dark:border-white/[0.06] hover:border-amber-200 dark:hover:border-white/[0.1] transition-all group"
                      >
                        <div className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 shrink-0 shadow-sm shadow-amber-500/30 group-hover:scale-125 transition-transform" />
                        <span className="text-[13px] text-gray-600 dark:text-zinc-300 font-medium">{ben}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.section>
            )}
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-6 lg:sticky lg:top-6 self-start">
            {/* Action Card */}
            <motion.div {...fadeUp} transition={{ delay: 0.08 }}
              className="bg-white dark:bg-[#111113] rounded-3xl p-6 border border-gray-200/50 dark:border-white/[0.06] shadow-sm overflow-hidden relative"
            >
              {/* Top gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />

              {/* Deadline */}
              {scholarship.deadline && (
                <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-500/[0.06] dark:to-orange-500/[0.03] border border-amber-100/80 dark:border-amber-500/10 rounded-2xl px-4 py-3.5 mb-5">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-500/20">
                    <Clock className="h-4.5 w-4.5 text-white" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-amber-600/80 dark:text-amber-400/80 uppercase tracking-widest">Prazo limite</p>
                    <p className="text-sm font-bold text-amber-900 dark:text-amber-200">{scholarship.deadline}</p>
                  </div>
                </div>
              )}

              {/* Slots */}
              {scholarship.slots > 0 && (
                <div className="flex items-center justify-between mb-5 pb-5 border-b border-gray-100/80 dark:border-white/[0.06]">
                  <div>
                    <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-1">Vagas disponíveis</p>
                    <p className="text-3xl font-extrabold text-gray-900 dark:text-white">{scholarship.slots}</p>
                  </div>
                  <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-500/10 dark:to-teal-500/5 flex items-center justify-center shadow-sm">
                    <Users className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
                  </div>
                </div>
              )}

              {/* Services */}
              <div className="mb-5 pb-5 border-b border-gray-100/80 dark:border-white/[0.06]">
                <p className="text-[10px] text-gray-400 dark:text-zinc-500 font-bold uppercase tracking-widest mb-3">Serviços disponíveis</p>
                <div className="space-y-2.5">
                  {scholarship.inscriptionPrice !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100/60 dark:border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-500/15 dark:to-emerald-500/5 flex items-center justify-center">
                          <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <span className="text-[13px] text-gray-600 dark:text-zinc-400 font-medium">Inscrição</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {scholarship.inscriptionPrice > 0
                          ? `AOA ${scholarship.inscriptionPrice.toLocaleString()}`
                          : "Grátis"}
                      </span>
                    </div>
                  )}

                  {scholarship.consultoriaPrice !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100/60 dark:border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-violet-100 to-violet-50 dark:from-violet-500/15 dark:to-violet-500/5 flex items-center justify-center">
                          <MessageSquare className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                        </div>
                        <span className="text-[13px] text-gray-600 dark:text-zinc-400 font-medium">
                          Consultoria
                          <span className="text-[10px] text-gray-400 dark:text-zinc-600 ml-1">(60 min)</span>
                        </span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        AOA {CONSULTORIA_PRECO.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {scholarship.mentoriaPrice !== undefined && (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100/60 dark:border-white/[0.04]">
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-500/15 dark:to-blue-500/5 flex items-center justify-center">
                          <Users className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        </div>
                        <span className="text-[13px] text-gray-600 dark:text-zinc-400 font-medium">Mentoria</span>
                      </div>
                      <span className="text-sm font-bold text-gray-900 dark:text-white">
                        {scholarship.mentoriaPrice > 0
                          ? `AOA ${scholarship.mentoriaPrice.toLocaleString()}`
                          : "Grátis"}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Tags */}
              {scholarship.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {scholarship.tags.map((tag) => {
                    const TagIcon = tagIcons[tag] || Star;
                    return (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-full bg-gradient-to-r from-gray-50 to-gray-100/80 dark:from-white/[0.04] dark:to-white/[0.02] text-gray-600 dark:text-zinc-400 border border-gray-200/80 dark:border-white/[0.08] hover:border-emerald-300 dark:hover:border-emerald-500/30 transition-colors cursor-default"
                      >
                        <TagIcon size={9} className="text-emerald-500" />
                        {tag}
                      </span>
                    );
                  })}
                </div>
              )}

              {/* CTA Button */}
              <div className="space-y-3">
                {inscricaoSuccess ? (
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-500/30"
                  >
                    <CheckCircle2 className="h-5 w-5" />
                    Inscrição Realizada!
                  </motion.div>
                ) : (
                  <>
                    {isDemoToken && (
                      <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-100 dark:border-amber-500/10 rounded-2xl px-4 py-3 mb-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                          Modo demonstração ativo. Faça login para se inscrever.
                        </p>
                      </div>
                    )}
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        if (isDemoToken) {
                          toast.error("Faça login com uma conta real para se inscrever");
                          return;
                        }
                        setShowForm(true);
                      }}
                      disabled={!bolsaId}
                      className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2.5 shadow-xl shadow-emerald-600/30 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isDemoToken ? "Faça Login Primeiro" : "Inscrever-se Agora"}
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </motion.button>
                    {inscricaoError && !showForm && (
                      <p className="text-xs text-red-500 text-center">{inscricaoError}</p>
                    )}
                  </>
                )}
              </div>
            </motion.div>

            {/* Institution Card */}
            {(scholarship.university || scholarship.country || scholarship.level) && (
              <motion.div {...fadeUp} transition={{ delay: 0.12 }}
                className="relative rounded-3xl overflow-hidden shadow-sm"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-[#053a2e] via-[#0a4535] to-[#0d523f] dark:from-emerald-900/80 dark:via-[#0a3a2e] dark:to-gray-900" />
                <div className="absolute inset-0 opacity-30" style={{
                  backgroundImage: `radial-gradient(circle at 20% 80%, rgba(16,185,129,0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(20,184,166,0.2) 0%, transparent 50%)`
                }} />
                <div className="relative p-6 text-white">
                  {scholarship.university && (
                    <div className="flex items-center gap-3.5 mb-4">
                      <div className="h-12 w-12 rounded-2xl bg-white/[0.1] backdrop-blur-sm flex items-center justify-center border border-white/[0.1]">
                        <GraduationCap className="h-6 w-6 text-emerald-300" />
                      </div>
                      <div>
                        <p className="text-[10px] text-emerald-300/70 font-bold uppercase tracking-widest mb-0.5">Instituição</p>
                        <p className="font-bold text-sm leading-snug">{scholarship.university}</p>
                      </div>
                    </div>
                  )}
                  {scholarship.country && (
                    <div className="flex items-center gap-2 text-emerald-200/70 text-xs bg-white/[0.05] rounded-xl px-3 py-2 border border-white/[0.06] mb-3">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>{scholarship.country}</span>
                    </div>
                  )}
                  {scholarship.level && (
                    <div className="flex items-center gap-2 text-emerald-200/70 text-xs bg-white/[0.05] rounded-xl px-3 py-2 border border-white/[0.06]">
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Nível: <span className="text-white font-semibold">{scholarship.level}</span></span>
                    </div>
                  )}
                </div>
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
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md"
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
                <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 dark:border-white/[0.06] shrink-0 relative">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-400" />
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

                {scholarship.bgImage && (
                  <div className="h-36 shrink-0 relative overflow-hidden">
                    <img
                      src={scholarship.bgImage}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111113] via-[#111113]/30 to-transparent" />
                  </div>
                )}

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
                        {servicosDisponiveis.map(({ value, icon: Icon, titulo, preco, sub, color }) => (
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

                    <div className="grid grid-cols-3 gap-2.5 mb-4">
                      {paymentMethods.map((method) => (
                        <button
                          key={method.value}
                          type="button"
                          onClick={() => setMetodoPagamento(method.value)}
                          className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all ${
                            metodoPagamento === method.value
                              ? "border-emerald-500 dark:border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 shadow-md shadow-emerald-500/10"
                              : "border-gray-200/80 dark:border-white/[0.08] hover:border-emerald-500/40 dark:hover:border-emerald-500/40"
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

                    <div className="bg-amber-50 dark:bg-amber-500/[0.06] border border-amber-100/80 dark:border-amber-500/10 rounded-2xl p-4 mb-4">
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

                <div className="flex items-center justify-between gap-3 px-6 py-4 border-t border-gray-100 dark:border-white/[0.06] bg-gray-50/80 dark:bg-[#0e0e10] shrink-0">
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
                    className="rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold px-6 h-11 shadow-lg shadow-emerald-600/25"
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
