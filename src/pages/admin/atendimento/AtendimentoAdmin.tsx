import { useState } from "react";
import { Link } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CheckCircle2, Download, ExternalLink, Headset, Loader2, Mail, MessageCircle, PhoneCall, Send, Users } from "lucide-react";
import toast from "react-hot-toast";
import { isAxiosError } from "axios";
import { atendimentoApi, atendimentoWhatsappApi } from "@/api/atendimento";
import { AdminPageHeader, AdminPanel, KpiTile, adminMuted } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

const PERIODOS = [
  { dias: 7, label: "7 dias" },
  { dias: 30, label: "30 dias" },
  { dias: 90, label: "90 dias" },
] as const;

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

/** Envia à equipa de atendimento o PDF com quem pagou e quem não pagou, para ligarem. */
export function AtendimentoAdmin() {
  const [dias, setDias] = useState<number>(30);
  const [mensagem, setMensagem] = useState("");

  const { data: resumo, isLoading } = useQuery({
    queryKey: ["atendimento-resumo", dias],
    queryFn: () => atendimentoApi.resumo(dias),
  });

  const descarregar = useMutation({
    mutationFn: () => atendimentoApi.descarregarPdf(dias),
    onError: (erro) => toast.error(mensagemDeErro(erro, "Não foi possível gerar o PDF.")),
  });

  const enviar = useMutation({
    mutationFn: () => atendimentoApi.enviarContactos(dias, mensagem.trim() || undefined),
    onSuccess: (r) => {
      toast.success(`PDF enviado a ${r.enviados} de ${r.destinatarios} membro(s) da equipa.`);
      setMensagem("");
    },
    onError: (erro) => toast.error(mensagemDeErro(erro, "Não foi possível enviar o email.")),
  });

  const equipaActiva = resumo?.equipa.filter((m) => m.estado_conta === "ACTIVA") ?? [];

  // WhatsApp: links wa.me prontos (funciona sempre) ou envio automático pela API oficial.
  const prepararWhatsapp = useMutation({
    mutationFn: () => atendimentoWhatsappApi.links(dias, mensagem.trim() || undefined),
    onError: (erro) => toast.error(mensagemDeErro(erro, "Não foi possível preparar as mensagens.")),
  });
  const enviarWhatsapp = useMutation({
    mutationFn: () => atendimentoWhatsappApi.enviar(dias, mensagem.trim() || undefined),
    onSuccess: (r) =>
      toast.success(
        `PDF enviado no WhatsApp a ${r.enviados} atendente(s)` +
          (r.falhados.length ? `, ${r.falhados.length} falharam` : "") +
          (r.semNumero ? `, ${r.semNumero} sem telefone` : "") +
          "."
      ),
    onError: (erro) => toast.error(mensagemDeErro(erro, "Não foi possível enviar pelo WhatsApp.")),
  });
  const whatsapp = prepararWhatsapp.data;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Vendas"
        title="Atendimento"
        description="A equipa de atendimento recebe um alerta sempre que uma venda é cancelada. Daqui envia-lhe a lista de contactos por email ou WhatsApp."
        actions={
          <Link
            to="/admin/crm"
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 dark:border-white/[0.08] dark:text-zinc-200 dark:hover:bg-white/[0.05]"
          >
            <Headset className="size-3.5" /> Abrir o CRM
          </Link>
        }
      />

      <div className="inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-gray-100/70 p-1 dark:bg-white/[0.04]">
        {PERIODOS.map((p) => (
          <button
            key={p.dias}
            type="button"
            onClick={() => setDias(p.dias)}
            aria-pressed={dias === p.dias}
            className={cn(
              "shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all",
              dias === p.dias
                ? "bg-white text-emerald-600 shadow-sm dark:bg-white/[0.09] dark:text-emerald-400"
                : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white",
            )}
          >
            Últimos {p.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="Não pagaram"
          value={isLoading ? "—" : (resumo?.naoPagaram ?? 0).toLocaleString("pt-PT")}
          hint="ligar primeiro"
          icon={PhoneCall}
          tone="rose"
        />
        <KpiTile
          label="Pagaram"
          value={isLoading ? "—" : (resumo?.pagaram ?? 0).toLocaleString("pt-PT")}
          hint="acompanhamento"
          icon={CheckCircle2}
          tone="emerald"
        />
        <KpiTile
          label="Equipa de atendimento"
          value={isLoading ? "—" : equipaActiva.length.toLocaleString("pt-PT")}
          hint="contas activas"
          icon={Headset}
          tone="amber"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <AdminPanel
          title="Enviar contactos à equipa"
          subtitle="O PDF tem os clientes que tentaram comprar no período: primeiro quem não pagou, depois quem pagou."
          icon={Mail}
        >
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="mensagem-atendimento" className="text-xs">
                Mensagem para a equipa (opcional)
              </Label>
              <Textarea
                id="mensagem-atendimento"
                value={mensagem}
                maxLength={1000}
                onChange={(e) => setMensagem(e.target.value)}
                placeholder="Ex.: Prioridade às inscrições de mentoria desta semana."
                className="min-h-[90px]"
              />
            </div>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button
                variant="outline"
                onClick={() => descarregar.mutate()}
                disabled={descarregar.isPending}
                className="w-full gap-2 sm:w-auto"
              >
                {descarregar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Descarregar PDF
              </Button>
              <Button
                onClick={() => enviar.mutate()}
                disabled={enviar.isPending || equipaActiva.length === 0}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
              >
                {enviar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Mail className="size-4" />}
                Enviar por email ({equipaActiva.length})
              </Button>
            </div>
            {!isLoading && equipaActiva.length === 0 && (
              <p className="text-xs text-amber-600 dark:text-amber-400">
                Ainda não há ninguém com o cargo de Atendimento. Atribua-o em{" "}
                <Link to="/admin/usuarios" className="font-semibold underline">
                  Utilizadores
                </Link>
                .
              </p>
            )}
          </div>
        </AdminPanel>

        <AdminPanel title="Equipa" subtitle="Quem recebe os alertas e o email" icon={Users}>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="size-5 animate-spin text-emerald-500" />
            </div>
          ) : resumo && resumo.equipa.length > 0 ? (
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {resumo.equipa.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{m.nome}</p>
                    <p className={cn("truncate text-xs", adminMuted)}>{m.email}</p>
                  </div>
                  {m.estado_conta !== "ACTIVA" && (
                    <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:bg-rose-500/10 dark:text-rose-400">
                      Suspenso
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className={cn("py-4 text-sm", adminMuted)}>Sem membros na equipa de atendimento.</p>
          )}
        </AdminPanel>
      </div>

      <AdminPanel
        title="Enviar pelo WhatsApp"
        subtitle="Cada atendente recebe o resumo e um link seguro para o PDF (válido 48 horas). Usa a mensagem escrita acima."
        icon={MessageCircle}
      >
        <div className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={() => prepararWhatsapp.mutate()}
              disabled={prepararWhatsapp.isPending || equipaActiva.length === 0}
              className="w-full gap-2 sm:w-auto"
            >
              {prepararWhatsapp.isPending ? <Loader2 className="size-4 animate-spin" /> : <MessageCircle className="size-4" />}
              Preparar mensagens
            </Button>
            {whatsapp?.apiConfigurada && (
              <Button
                onClick={() => enviarWhatsapp.mutate()}
                disabled={enviarWhatsapp.isPending}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
              >
                {enviarWhatsapp.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                Enviar o PDF automaticamente
              </Button>
            )}
          </div>

          {whatsapp && (
            <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
              {whatsapp.equipa.map((m) => (
                <li key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">{m.nome}</p>
                    <p className={cn("truncate text-xs", adminMuted)}>{m.phone ?? "Sem telefone no perfil"}</p>
                  </div>
                  {m.link ? (
                    <a
                      href={m.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
                    >
                      <ExternalLink className="size-3.5" /> Abrir WhatsApp
                    </a>
                  ) : (
                    <span className={cn("shrink-0 text-xs", adminMuted)}>Adicione o telefone</span>
                  )}
                </li>
              ))}
            </ul>
          )}

          {whatsapp && !whatsapp.apiConfigurada && (
            <p className={cn("text-xs", adminMuted)}>
              Para enviar o PDF automaticamente (sem abrir o WhatsApp), configure a API oficial do WhatsApp no servidor.
            </p>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
