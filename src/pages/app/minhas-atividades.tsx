import { useState } from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  BookOpen, CreditCard, Users, Loader2,
  CheckCircle, XCircle, Clock, ExternalLink,
  FileText, Play, AlertCircle, UserCheck, GraduationCap,
  Smartphone, Landmark,
} from "lucide-react";
import { Button } from "@/components/ui/button";

import { cursosApi } from "@/api/cursos";
import { bolsasApi } from "@/api/bolsas";
import { listarComunidades, type Community } from "@/api/comunidades";

import { cn } from "@/lib/utils";

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

const STATUS_STYLES: Record<string, { label: string; class: string; icon: any }> = {
  APROVADO:   { label: "Aprovado",   class: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle },
  APROVADA:   { label: "Aprovada",   class: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400", icon: CheckCircle },
  PENDENTE:   { label: "Pendente",   class: "text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10 dark:text-yellow-400", icon: Clock },
  REJEITADO:  { label: "Rejeitado",  class: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400", icon: XCircle },
  REJEITADA:  { label: "Rejeitada",  class: "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400", icon: XCircle },
  CANCELADO:  { label: "Cancelado",  class: "text-gray-600 bg-gray-50 dark:bg-white/[0.06] dark:text-zinc-400", icon: AlertCircle },
  CANCELADA:  { label: "Cancelada",  class: "text-gray-600 bg-gray-50 dark:bg-white/[0.06] dark:text-zinc-400", icon: AlertCircle },
};

const PAYMENT_METHODS: Record<string, { label: string; icon: any; color: string; bg: string }> = {
  EXPRESS:       { label: "Express",       icon: Smartphone, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-500/10" },
  MULTICAIXA:    { label: "Multicaixa",    icon: CreditCard, color: "text-blue-600 dark:text-blue-400",       bg: "bg-blue-50 dark:bg-blue-500/10" },
  TRANSFERENCIA: { label: "Transferência", icon: Landmark,   color: "text-purple-600 dark:text-purple-400",   bg: "bg-purple-50 dark:bg-purple-500/10" },
};

function PaymentMethodBadge({ metodo }: { metodo?: string | null }) {
  if (!metodo) return null;
  const method = PAYMENT_METHODS[metodo];
  if (!method) return <span className="text-[11px] text-gray-500">{metodo}</span>;
  const Icon = method.icon;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${method.bg} ${method.color}`}>
      <Icon className="w-3.5 h-3.5" />
      {method.label}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] || { label: status, class: "text-gray-600 bg-gray-50 dark:bg-white/[0.06] dark:text-zinc-400", icon: AlertCircle };
  const Icon = style.icon;
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider", style.class)}>
      <Icon className="w-3 h-3" />
      {style.label}
    </span>
  );
}

const tabs = [
  { id: "cursos", label: "Meus Cursos", icon: BookOpen },
  { id: "pagamentos", label: "Pagamentos", icon: CreditCard },
  { id: "inscricoes", label: "Inscrições", icon: FileText },
  { id: "comunidades", label: "Comunidades", icon: Users },
];

export function MinhasAtividadesPage() {
  const [tab, setTab] = useState("cursos");

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 max-w-5xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Minhas Atividades
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Acompanhe seus cursos, pagamentos, inscrições e comunidades.
        </p>
      </motion.div>

      <div className="flex gap-1 mb-8 p-1 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] overflow-x-auto">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap",
              tab === id
                ? "bg-white dark:bg-[#111113] text-gray-900 dark:text-white shadow-sm border border-gray-200 dark:border-white/[0.08]"
                : "text-gray-500 dark:text-zinc-400 hover:text-gray-700 dark:hover:text-zinc-300"
            )}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {tab === "cursos" && <MeusCursosTab />}
      {tab === "pagamentos" && <MeusPagamentosTab />}
      {tab === "inscricoes" && <MinhasInscricoesTab />}
      {tab === "comunidades" && <MinhasComunidadesTab />}
    </motion.div>
  );
}

function MeusCursosTab() {
  const { data: cursos, isLoading } = useQuery({
    queryKey: ["meus-cursos"],
    queryFn: cursosApi.listMeusCursos,
  });

  if (isLoading) return <LoadingState />;
  if (!cursos?.length) return <EmptyState icon={BookOpen} title="Nenhum curso adquirido" message="Explore os cursos disponíveis e adquira o seu primeiro curso!" action={{ label: "Ver Cursos", to: "/cursos" }} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {cursos.map((curso, i) => (
        <motion.div
          key={curso.id}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
        >
          <Link
            to={`/cursos/${curso.id}/aulas`}
            className="block group rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] hover:border-emerald-200 dark:hover:border-emerald-500/25 hover:shadow-sm transition-all duration-200"
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white shrink-0">
                <BookOpen className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                  {curso.titulo}
                </h3>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                  {curso.quantAulas} aula{curso.quantAulas !== 1 ? "s" : ""}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
              <span className="text-[10px] text-gray-400 dark:text-zinc-600">
                {curso.categoria}
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-500 transition-colors flex items-center gap-1">
                <Play className="w-3 h-3" />
                Acessar
              </span>
            </div>
          </Link>
        </motion.div>
      ))}
    </div>
  );
}

function MeusPagamentosTab() {
  const { data: pagamentos, isLoading } = useQuery({
    queryKey: ["meus-pagamentos"],
    queryFn: cursosApi.listMeusPagamentos,
  });

  if (isLoading) return <LoadingState />;
  if (!pagamentos?.length) return <EmptyState icon={CreditCard} title="Nenhum pagamento realizado" message="Quando adquirir um curso, o histórico de pagamentos aparecerá aqui." />;

  return (
    <div className="space-y-3">
      {pagamentos.map((p, i) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
          className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113]"
        >
          <div className="w-11 h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center text-gray-400 shrink-0">
            <CreditCard className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
              {p.curso?.titulo || "Curso"}
            </p>
            <p className="text-[11px] text-gray-500 dark:text-zinc-500 flex items-center gap-2 mt-0.5">
              {new Date(p.created_at).toLocaleDateString("pt-PT")}
              <PaymentMethodBadge metodo={p.metodo} />
            </p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-sm font-bold text-gray-900 dark:text-white">
              {p.valor.toLocaleString("pt-PT", { style: "currency", currency: "AOA" })}
            </p>
            <StatusBadge status={p.status} />
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function MinhasInscricoesTab() {
  const { data: inscricoes, isLoading } = useQuery({
    queryKey: ["minhas-inscricoes"],
    queryFn: () => bolsasApi.listMinhasInscricoes(),
  });

  const { data: comunidades = [] } = useQuery({
    queryKey: ["comunidades"],
    queryFn: listarComunidades,
  });

  if (isLoading) return <LoadingState />;
  if (!inscricoes?.length) return <EmptyState icon={FileText} title="Nenhuma inscrição realizada" message="Inscreva-se em bolsas de estudo para acompanhar aqui." action={{ label: "Ver Bolsas", to: "/bolsas" }} />;

  return (
    <div className="space-y-3">
      {inscricoes.map((insc, i) => {
        const color = COLORS[(insc.bolsa?.titulo?.length ?? 0) % COLORS.length] || "bg-emerald-500";
        const comunidadeDaBolsa = comunidades.find((c) => c.bolsaId === insc.bolsaId);
        return (
          <motion.div
            key={insc.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex items-center gap-4 p-4 rounded-2xl border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113]"
          >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0", color)}>
              {insc.bolsa?.titulo?.substring(0, 2).toUpperCase() || "BO"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {insc.bolsa?.titulo || "Bolsas"}
              </p>
              <p className="text-[11px] text-gray-500 dark:text-zinc-500">
                {new Date(insc.created_at).toLocaleDateString("pt-PT")}
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-3">
              <StatusBadge status={insc.status} />
              {comunidadeDaBolsa && insc.tipoInteresse === "MENTORIA" && (
                <Link
                  to={`/comunidades/${comunidadeDaBolsa.id}`}
                  className="flex items-center gap-1 h-8 px-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors text-[11px] font-semibold"
                >
                  <Users className="w-3.5 h-3.5" />
                  Comunidade
                </Link>
              )}
              {insc.bolsa && (
                <Link
                  to={`/bolsas/${insc.bolsaId}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06] text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                </Link>
              )}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

function MinhasComunidadesTab() {
  const { data: comunidades, isLoading } = useQuery({
    queryKey: ["comunidades"],
    queryFn: listarComunidades,
  });

  const minhas = (comunidades || []).filter((c) => c.souMembro);

  if (isLoading) return <LoadingState />;
  if (!minhas.length) return <EmptyState icon={Users} title="Nenhuma comunidade" message="Entre em comunidades para se conectar com outros estudantes." action={{ label: "Ver Comunidades", to: "/comunidades" }} />;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {minhas.map((c, i) => {
        const color = COLORS[c.nome.length % COLORS.length];
        return (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link
              to={`/comunidades/${c.id}`}
              className="block group rounded-2xl p-5 border border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] hover:border-emerald-200 dark:hover:border-emerald-500/25 hover:shadow-sm transition-all duration-200"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0", color)}>
                  {c.nome.substring(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors truncate">
                    {c.nome}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-zinc-500">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {c._count.membros}
                    </span>
                  </div>
                </div>
              </div>
                  {c.bolsa && (
                    <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mb-2 flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" />
                      {c.bolsa.titulo}
                    </p>
                  )}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
                  <UserCheck className="w-3 h-3" />
                  Membro
                </span>
                {c.meuPapel === "ADMIN" && (
                  <span className="text-[10px] font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-500/10 px-2 py-0.5 rounded-lg">
                    Admin
                  </span>
                )}
              </div>
            </Link>
          </motion.div>
        );
      })}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

function EmptyState({ icon: Icon, title, message, action }: {
  icon: any;
  title: string;
  message: string;
  action?: { label: string; to: string };
}) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <div className="w-16 h-16 rounded-2xl bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center">
        <Icon className="w-8 h-8 text-gray-300 dark:text-zinc-600" />
      </div>
      <div className="text-center">
        <p className="text-base font-semibold text-gray-900 dark:text-white">{title}</p>
        <p className="text-sm text-gray-500 dark:text-zinc-500 mt-1 max-w-sm">{message}</p>
      </div>
      {action && (
        <Link to={action.to}>
          <Button className="rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white mt-2">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
}
