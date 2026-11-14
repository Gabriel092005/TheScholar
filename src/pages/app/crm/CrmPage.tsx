import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { toast } from "sonner";
import {
  CalendarClock,
  CheckCircle2,
  Clock,
  Headset,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Send,
  StickyNote,
  UserRound,
} from "lucide-react";
import { useUser } from "@/api/useGetProfile";
import {
  crmApi,
  numeroWhatsapp,
  type EtapaLead,
  type FiltrosLeads,
  type Lead,
  type TipoInteracao,
} from "@/api/crm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { BotaoVideosDaPagina } from "@/components/videos-explicativos";
import { cn } from "@/lib/utils";

const ETAPAS: { valor: EtapaLead; nome: string; cor: string }[] = [
  { valor: "NOVO", nome: "Novo", cor: "bg-sky-50 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300" },
  { valor: "CONTACTADO", nome: "Contactado", cor: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" },
  { valor: "INTERESSADO", nome: "Interessado", cor: "bg-violet-50 text-violet-700 dark:bg-violet-500/10 dark:text-violet-300" },
  { valor: "CONVERTIDO", nome: "Convertido", cor: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" },
  { valor: "PERDIDO", nome: "Perdido", cor: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400" },
];
const etapaInfo = (e: EtapaLead) => ETAPAS.find((x) => x.valor === e) ?? ETAPAS[0];

const ORIGENS: Record<string, string> = {
  PAGAMENTO_FALHADO: "Pagamento falhado",
  PAGAMENTO_PENDENTE: "Pagamento por concluir",
  REGISTO: "Novo registo",
  MENTORIA_EXPIRADA: "Mentoria expirada",
};

type Separador = "hoje" | "abertos" | EtapaLead;
const SEPARADORES: { valor: Separador; nome: string }[] = [
  { valor: "hoje", nome: "Para hoje" },
  { valor: "abertos", nome: "Abertos" },
  ...ETAPAS.map((e) => ({ valor: e.valor as Separador, nome: e.nome })),
];

const TIPOS: { valor: TipoInteracao; nome: string; icone: typeof Phone }[] = [
  { valor: "CHAMADA", nome: "Chamada", icone: Phone },
  { valor: "WHATSAPP", nome: "WhatsApp", icone: MessageCircle },
  { valor: "EMAIL", nome: "Email", icone: Mail },
  { valor: "NOTA", nome: "Nota", icone: StickyNote },
];

const formatarKz = (v: number) => `${v.toLocaleString("pt-PT")} Kz`;
const formatarData = (iso: string) =>
  new Date(iso).toLocaleString("pt-PT", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

/** "2026-11-15T09:00" (input datetime-local) a partir de um Date, na hora local. */
function paraInputLocal(data: Date) {
  const d = new Date(data.getTime() - data.getTimezoneOffset() * 60000);
  return d.toISOString().slice(0, 16);
}

function daquiA(dias: number) {
  const d = new Date();
  d.setDate(d.getDate() + dias);
  d.setHours(9, 0, 0, 0);
  return d;
}

function mensagemWhatsapp(lead: Lead) {
  const nome = lead.usuario.nome.split(" ")[0];
  const produto = lead.produto ? ` sobre ${lead.produto.replace(/^[^:]+:\s*/, "")}` : "";
  return `Olá ${nome}! Fala a equipa Afroscholars${produto}. Podemos ajudar a concluir a sua inscrição?`;
}

function EstadoProximoContacto({ lead }: { lead: Lead }) {
  if (!lead.proximoContacto) return null;
  const atrasado = new Date(lead.proximoContacto) < new Date() && lead.etapa !== "CONVERTIDO";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
        atrasado
          ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
          : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
      )}
    >
      <Clock className="size-3" />
      {formatarData(lead.proximoContacto)}
    </span>
  );
}

function AcoesRapidas({ lead, compacto = false }: { lead: Lead; compacto?: boolean }) {
  const whatsapp = numeroWhatsapp(lead.usuario.phone);
  const classe = cn(
    "inline-flex items-center justify-center gap-1.5 rounded-xl border text-xs font-semibold transition-colors",
    compacto ? "size-9" : "h-10 flex-1 px-3",
    "border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.05]"
  );
  return (
    <div className={cn("flex gap-2", !compacto && "w-full")} onClick={(e) => e.stopPropagation()}>
      {lead.usuario.phone && (
        <a href={`tel:${lead.usuario.phone.replace(/\s/g, "")}`} className={classe} aria-label="Ligar">
          <Phone className="size-4" />
          {!compacto && "Ligar"}
        </a>
      )}
      {whatsapp && (
        <a
          href={`https://wa.me/${whatsapp}?text=${encodeURIComponent(mensagemWhatsapp(lead))}`}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(classe, "text-emerald-700 dark:text-emerald-400")}
          aria-label="WhatsApp"
        >
          <MessageCircle className="size-4" />
          {!compacto && "WhatsApp"}
        </a>
      )}
      <a href={`mailto:${lead.usuario.email}`} className={classe} aria-label="Email">
        <Mail className="size-4" />
        {!compacto && "Email"}
      </a>
    </div>
  );
}

function CartaoLead({ lead, onAbrir }: { lead: Lead; onAbrir: () => void }) {
  const etapa = etapaInfo(lead.etapa);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onAbrir}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onAbrir()}
      className="flex cursor-pointer flex-col gap-3 rounded-2xl border border-gray-100 bg-white p-4 transition-colors hover:border-emerald-200 dark:border-white/[0.06] dark:bg-[#111113] dark:hover:border-emerald-500/30 sm:flex-row sm:items-center"
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{lead.usuario.nome}</p>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", etapa.cor)}>{etapa.nome}</span>
          <EstadoProximoContacto lead={lead} />
        </div>
        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-zinc-400">
          {lead.usuario.phone ?? "sem telefone"} · {ORIGENS[lead.origem] ?? lead.origem}
        </p>
        {(lead.produto || lead.valorPotencial) && (
          <p className="mt-1 truncate text-xs font-medium text-gray-700 dark:text-zinc-300">
            {lead.produto}
            {lead.valorPotencial ? ` · ${formatarKz(lead.valorPotencial)}` : ""}
          </p>
        )}
        {lead.atendente && (
          <p className="mt-1 text-[11px] text-gray-400 dark:text-zinc-500">Atendente: {lead.atendente.nome}</p>
        )}
      </div>
      <AcoesRapidas lead={lead} compacto />
    </div>
  );
}

function FichaLead({ leadId, admin, onFechar }: { leadId: string | null; admin: boolean; onFechar: () => void }) {
  const queryClient = useQueryClient();
  const [tipo, setTipo] = useState<TipoInteracao>("CHAMADA");
  const [texto, setTexto] = useState("");
  const [proximo, setProximo] = useState("");

  const { data: lead, isLoading } = useQuery({
    queryKey: ["crm-lead", leadId],
    queryFn: () => crmApi.lead(leadId as string),
    enabled: !!leadId,
  });
  const { data: atendentes } = useQuery({
    queryKey: ["crm-atendentes"],
    queryFn: crmApi.atendentes,
    enabled: admin && !!leadId,
  });

  useEffect(() => {
    setTexto("");
    setTipo("CHAMADA");
    setProximo("");
  }, [leadId]);

  const atualizarListas = () => {
    queryClient.invalidateQueries({ queryKey: ["crm-lead", leadId] });
    queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
    queryClient.invalidateQueries({ queryKey: ["crm-resumo"] });
  };

  const atualizar = useMutation({
    mutationFn: (dados: Parameters<typeof crmApi.atualizar>[1]) => crmApi.atualizar(leadId as string, dados),
    onSuccess: () => {
      atualizarListas();
      toast.success("Lead actualizado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível actualizar.")),
  });

  const registar = useMutation({
    mutationFn: () =>
      crmApi.registarContacto(leadId as string, {
        tipo,
        texto,
        ...(proximo ? { proximoContacto: new Date(proximo).toISOString() } : {}),
      }),
    onSuccess: () => {
      atualizarListas();
      setTexto("");
      setProximo("");
      toast.success("Contacto registado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível registar.")),
  });

  return (
    <Sheet open={!!leadId} onOpenChange={(aberto) => !aberto && onFechar()}>
      <SheetContent side="right" className="flex h-[100dvh] w-full flex-col gap-0 p-0 sm:max-w-lg">
        <SheetHeader className="shrink-0 border-b border-gray-100 p-4 pr-12 text-left dark:border-white/[0.06]">
          <SheetTitle className="truncate">{lead?.usuario.nome ?? "Lead"}</SheetTitle>
          <SheetDescription className="truncate">
            {lead ? `${lead.usuario.email} · ${lead.usuario.phone ?? "sem telefone"}` : "A carregar…"}
          </SheetDescription>
        </SheetHeader>

        {isLoading || !lead ? (
          <div className="flex flex-1 items-center justify-center">
            <Loader2 className="size-6 animate-spin text-emerald-500" />
          </div>
        ) : (
          <ScrollArea className="min-h-0 flex-1">
            <div className="space-y-5 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
              <AcoesRapidas lead={lead} />

              <div className="rounded-2xl bg-gray-50 p-3 text-sm dark:bg-white/[0.03]">
                <p className="text-xs text-gray-500 dark:text-zinc-400">{ORIGENS[lead.origem] ?? lead.origem}</p>
                {lead.produto && <p className="mt-0.5 font-semibold text-gray-900 dark:text-white">{lead.produto}</p>}
                {lead.valorPotencial ? (
                  <p className="mt-0.5 font-bold text-emerald-600 dark:text-emerald-400">{formatarKz(lead.valorPotencial)}</p>
                ) : null}
                {lead.caminho && (
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard
                        .writeText(`${window.location.origin}${lead.caminho}`)
                        .then(() => toast.success("Link copiado: envie-o ao cliente"))
                        .catch(() => toast.error("Não foi possível copiar"));
                    }}
                    className="mt-2 text-xs font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                  >
                    Copiar link para o cliente concluir a compra
                  </button>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Etapa</Label>
                  <Select
                    value={lead.etapa}
                    onValueChange={(v) => atualizar.mutate({ etapa: v as EtapaLead })}
                    disabled={atualizar.isPending}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ETAPAS.map((e) => (
                        <SelectItem key={e.valor} value={e.valor}>
                          {e.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {admin && (
                  <div className="space-y-1.5">
                    <Label className="text-xs">Atendente</Label>
                    <Select
                      value={lead.atendente?.id ?? "nenhum"}
                      onValueChange={(v) => atualizar.mutate({ atendenteId: v === "nenhum" ? null : v })}
                      disabled={atualizar.isPending}
                    >
                      <SelectTrigger className="h-10 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="nenhum">Sem atendente</SelectItem>
                        {atendentes?.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.nome} ({a.leadsAbertos})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs">Próximo contacto</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { nome: "Amanhã", dias: 1 },
                    { nome: "Em 3 dias", dias: 3 },
                    { nome: "Em 1 semana", dias: 7 },
                  ].map((p) => (
                    <button
                      key={p.dias}
                      type="button"
                      disabled={atualizar.isPending}
                      onClick={() => atualizar.mutate({ proximoContacto: daquiA(p.dias).toISOString() })}
                      className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.05]"
                    >
                      {p.nome}
                    </button>
                  ))}
                  {lead.proximoContacto && (
                    <span className="self-center text-xs text-gray-500 dark:text-zinc-400">
                      Agendado: {formatarData(lead.proximoContacto)}
                    </span>
                  )}
                </div>
              </div>

              <form
                className="space-y-3 rounded-2xl border border-gray-100 p-3 dark:border-white/[0.06]"
                onSubmit={(e) => {
                  e.preventDefault();
                  if (texto.trim()) registar.mutate();
                }}
              >
                <p className="text-sm font-bold text-gray-900 dark:text-white">Registar contacto</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {TIPOS.map(({ valor, nome, icone: Icone }) => (
                    <button
                      key={valor}
                      type="button"
                      aria-pressed={tipo === valor}
                      onClick={() => setTipo(valor)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-xl border px-1 py-2 text-[11px] font-semibold transition-colors",
                        tipo === valor
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                          : "border-gray-200 text-gray-600 dark:border-white/[0.08] dark:text-zinc-400"
                      )}
                    >
                      <Icone className="size-4" />
                      {nome}
                    </button>
                  ))}
                </div>
                <Textarea
                  value={texto}
                  onChange={(e) => setTexto(e.target.value)}
                  placeholder="O que ficou combinado? Ex.: vai pagar amanhã por referência."
                  className="min-h-[80px]"
                />
                <div className="space-y-1.5">
                  <Label htmlFor="proximo-contacto" className="text-xs">
                    Voltar a contactar em (opcional)
                  </Label>
                  <Input
                    id="proximo-contacto"
                    type="datetime-local"
                    value={proximo}
                    min={paraInputLocal(new Date())}
                    onChange={(e) => setProximo(e.target.value)}
                    className="h-10 rounded-xl"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!texto.trim() || registar.isPending}
                  className="h-11 w-full gap-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-500"
                >
                  {registar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
                  Guardar contacto
                </Button>
              </form>

              {lead.pagamentos.length > 0 && (
                <div>
                  <p className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Pagamentos</p>
                  <ul className="divide-y divide-gray-100 rounded-2xl border border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
                    {lead.pagamentos.map((p) => (
                      <li key={p.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                        <span className="text-gray-600 dark:text-zinc-400">
                          {p.tipo} · {formatarData(p.created_at)}
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="font-semibold text-gray-900 dark:text-white">{formatarKz(p.valor)}</span>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-semibold",
                              p.status === "PAGO"
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300"
                                : p.status === "FALHADO"
                                  ? "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300"
                                  : "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300"
                            )}
                          >
                            {p.status === "PAGO" ? "Pago" : p.status === "FALHADO" ? "Falhado" : "Pendente"}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <p className="mb-2 text-sm font-bold text-gray-900 dark:text-white">Histórico</p>
                <ol className="space-y-3 border-l border-gray-200 pl-4 dark:border-white/[0.08]">
                  {lead.interacoes.map((i) => (
                    <li key={i.id} className="relative">
                      <span className="absolute -left-[21px] top-1.5 size-2.5 rounded-full bg-emerald-500 ring-4 ring-white dark:ring-[#0d0d0f]" />
                      <p className="text-[11px] text-gray-400 dark:text-zinc-500">
                        {formatarData(i.created_at)} · {i.autor?.nome ?? "Sistema"} ·{" "}
                        {TIPOS.find((t) => t.valor === i.tipo)?.nome ?? (i.tipo === "ETAPA" ? "Alteração" : "Automático")}
                      </p>
                      <p className="whitespace-pre-line text-sm text-gray-800 dark:text-zinc-200">{i.texto}</p>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </ScrollArea>
        )}
      </SheetContent>
    </Sheet>
  );
}

/** CRM da equipa de atendimento: quem contactar hoje, o pipeline e a ficha de cada cliente. */
export function CrmPage() {
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [separador, setSeparador] = useState<Separador>("hoje");
  const [busca, setBusca] = useState("");
  const [buscaAtiva, setBuscaAtiva] = useState("");
  const [atendenteId, setAtendenteId] = useState("todos");
  const leadAberto = searchParams.get("lead");
  const temAcesso = user?.role === "ATENDIMENTO" || user?.role === "ADMIN";
  const admin = user?.role === "ADMIN";

  useEffect(() => {
    const t = setTimeout(() => setBuscaAtiva(busca.trim()), 300);
    return () => clearTimeout(t);
  }, [busca]);

  const filtros: FiltrosLeads = useMemo(
    () => ({
      ...(separador === "hoje" || separador === "abertos" ? { escopo: separador } : { escopo: "todos", etapa: separador }),
      ...(buscaAtiva ? { busca: buscaAtiva } : {}),
      ...(admin && atendenteId !== "todos" ? { atendenteId } : {}),
    }),
    [separador, buscaAtiva, admin, atendenteId]
  );

  const { data: resumo } = useQuery({ queryKey: ["crm-resumo"], queryFn: crmApi.resumo, enabled: temAcesso });
  const { data: leads, isLoading } = useQuery({
    queryKey: ["crm-leads", filtros],
    queryFn: () => crmApi.leads(filtros),
    enabled: temAcesso,
  });
  const { data: atendentes } = useQuery({ queryKey: ["crm-atendentes"], queryFn: crmApi.atendentes, enabled: admin });

  const sincronizar = useMutation({
    mutationFn: crmApi.sincronizar,
    onSuccess: (r) => {
      queryClient.invalidateQueries({ queryKey: ["crm-leads"] });
      queryClient.invalidateQueries({ queryKey: ["crm-resumo"] });
      toast.success(`${r.criados} lead(s) recolhidos.`);
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível recolher os leads.")),
  });
  const resumoDiario = useMutation({
    mutationFn: crmApi.enviarResumoDiario,
    onSuccess: (r) =>
      toast.success(`Mensagem diária enviada a ${r.atendentes} atendente(s): ${r.emails} por email, ${r.whatsapp} por WhatsApp.`),
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível enviar.")),
  });

  const abrirLead = (id: string | null) => {
    const novos = new URLSearchParams(searchParams);
    if (id) novos.set("lead", id);
    else novos.delete("lead");
    setSearchParams(novos, { replace: true });
  };

  if (user && !temAcesso) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 text-center">
        <Headset className="mx-auto mb-3 size-10 text-gray-300 dark:text-zinc-700" />
        <p className="font-semibold text-gray-900 dark:text-white">O CRM é da equipa de atendimento.</p>
      </div>
    );
  }

  const kpis = [
    { nome: "Para hoje", valor: resumo?.hoje ?? 0, icone: CalendarClock, cor: "text-rose-600 dark:text-rose-400" },
    { nome: "Novos", valor: resumo?.porEtapa.NOVO ?? 0, icone: UserRound, cor: "text-sky-600 dark:text-sky-400" },
    { nome: "Interessados", valor: resumo?.porEtapa.INTERESSADO ?? 0, icone: MessageCircle, cor: "text-violet-600 dark:text-violet-400" },
    { nome: "Convertidos (30d)", valor: resumo?.convertidos30 ?? 0, icone: CheckCircle2, cor: "text-emerald-600 dark:text-emerald-400" },
  ];

  return (
    <div className="mx-auto w-full max-w-5xl space-y-5 px-4 py-6 sm:px-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">CRM</h1>
            <BotaoVideosDaPagina local="CRM" />
          </div>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            {admin ? "Todos os leads da equipa de atendimento." : "Os seus clientes para contactar."}
          </p>
        </div>
        {admin && (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => sincronizar.mutate()}
              disabled={sincronizar.isPending}
              className="w-full gap-2 sm:w-auto"
            >
              {sincronizar.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Recolher leads agora
            </Button>
            <Button
              onClick={() => resumoDiario.mutate()}
              disabled={resumoDiario.isPending}
              className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
            >
              {resumoDiario.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
              Enviar mensagem diária
            </Button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {kpis.map(({ nome, valor, icone: Icone, cor }) => (
          <div key={nome} className="rounded-2xl border border-gray-100 bg-white p-3 dark:border-white/[0.06] dark:bg-[#111113] sm:p-4">
            <Icone className={cn("mb-2 size-4", cor)} />
            <p className="text-xl font-bold tabular-nums text-gray-900 dark:text-white">{valor.toLocaleString("pt-PT")}</p>
            <p className="text-xs text-gray-500 dark:text-zinc-400">{nome}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Procurar por nome, email ou telefone"
            className="h-10 rounded-xl pl-9"
          />
        </div>
        {admin && (
          <Select value={atendenteId} onValueChange={setAtendenteId}>
            <SelectTrigger className="h-10 rounded-xl sm:w-56">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os atendentes</SelectItem>
              {atendentes?.map((a) => (
                <SelectItem key={a.id} value={a.id}>
                  {a.nome} ({a.leadsAbertos})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
        <div className="inline-flex gap-1 rounded-xl bg-gray-100/70 p-1 dark:bg-white/[0.04]">
          {SEPARADORES.map((s) => (
            <button
              key={s.valor}
              type="button"
              aria-pressed={separador === s.valor}
              onClick={() => setSeparador(s.valor)}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
                separador === s.valor
                  ? "bg-white text-emerald-600 shadow-sm dark:bg-white/[0.09] dark:text-emerald-400"
                  : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white"
              )}
            >
              {s.nome}
              {s.valor !== "hoje" && s.valor !== "abertos" && resumo?.porEtapa[s.valor] ? ` (${resumo.porEtapa[s.valor]})` : ""}
              {s.valor === "hoje" && resumo?.hoje ? ` (${resumo.hoje})` : ""}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-emerald-500" />
        </div>
      ) : !leads || leads.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/[0.08]">
          <CheckCircle2 className="mx-auto mb-2 size-8 text-emerald-500" />
          <p className="text-sm font-semibold text-gray-900 dark:text-white">
            {separador === "hoje" ? "Sem contactos pendentes para hoje." : "Nenhum lead aqui."}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {leads.map((lead) => (
            <CartaoLead key={lead.id} lead={lead} onAbrir={() => abrirLead(lead.id)} />
          ))}
        </div>
      )}

      <FichaLead leadId={leadAberto} admin={admin} onFechar={() => abrirLead(null)} />
    </div>
  );
}
