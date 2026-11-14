import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { AlertTriangle, CalendarClock, FlaskConical, Loader2, MailX, Send } from "lucide-react";
import { funilApi, type Gatilho, type ResultadoFunil } from "@/api/funil";
import { AdminPageHeader, AdminPanel, KpiTile, adminMuted } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";

const GATILHOS: { valor: Gatilho; nome: string; quando: string }[] = [
  { valor: "PAGAMENTO_ABANDONADO", nome: "Pagamento abandonado", quando: "Começou a pagar e não terminou (últimas 72h)" },
  { valor: "MENTORIA_A_EXPIRAR", nome: "Mentoria a expirar", quando: "A mentoria paga acaba nos próximos 3 dias" },
  { valor: "MENTORIA_EXPIRADA", nome: "Mentoria expirada", quando: "Acabou há 1 a 7 dias e não renovou" },
  { valor: "BOAS_VINDAS", nome: "Boas-vindas", quando: "Dias 1, 3 e 7 após o registo, para quem ainda não comprou" },
  { valor: "PRAZO_BOLSA", nome: "Prazo da bolsa", quando: "Uma bolsa publicada fecha em 3 a 14 dias" },
  { valor: "REATIVACAO", nome: "Reactivação", quando: "Não entra há 14+ dias (uma vez por mês)" },
];

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

/** Funil de vendas por email: um email por pessoa por dia, com o gatilho mais importante. */
export function FunilAdmin() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [resultado, setResultado] = useState<ResultadoFunil | null>(null);

  const { data: resumo, isLoading } = useQuery({ queryKey: ["funil-resumo"], queryFn: funilApi.resumo });

  const simular = useMutation({
    mutationFn: funilApi.simular,
    onSuccess: setResultado,
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível simular.")),
  });

  const executar = useMutation({
    mutationFn: funilApi.executar,
    onSuccess: (r) => {
      setResultado(r);
      queryClient.invalidateQueries({ queryKey: ["funil-resumo"] });
      toast.success(`${r.enviados} email(s) enviados${r.falhados ? `, ${r.falhados} falharam` : ""}.`);
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível enviar.")),
  });

  const enviarAgora = async () => {
    const ok = await confirm(
      "Cada pessoa recebe no máximo um email por dia. Quem receber agora não recebe outro às 08:00.",
      "Enviar os emails de hoje agora?"
    );
    if (ok) executar.mutate();
  };

  const total30 = Object.values(resumo?.enviados30Dias ?? {}).reduce((a, b) => a + (b ?? 0), 0);

  return (
    <div className="space-y-5">
      <ConfirmDialog />
      <AdminPageHeader
        eyebrow="Vendas"
        title="Funil de emails"
        description="Todas as manhãs, cada utilizador recebe no máximo um email com o gatilho mais importante para ele: recuperar um pagamento, renovar a mentoria, aproveitar um prazo."
      />

      {resumo && (!resumo.ativo || !resumo.emailConfigurado) && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-300">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>
            {!resumo.emailConfigurado
              ? "O SMTP não está configurado no servidor: nenhum email será enviado."
              : "O envio automático está desligado neste servidor (FUNIL_EMAILS_ATIVO). Pode simular ou enviar manualmente."}
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile
          label="Enviados (30 dias)"
          value={isLoading ? "—" : total30.toLocaleString("pt-PT")}
          hint={resumo?.ultimoEnvio ? `último: ${new Date(resumo.ultimoEnvio).toLocaleString("pt-PT")}` : "ainda sem envios"}
          icon={Send}
          tone="emerald"
        />
        <KpiTile
          label="Horário"
          value={resumo?.ativo ? "Activo" : "Desligado"}
          hint={resumo?.horario ?? "—"}
          icon={CalendarClock}
          tone={resumo?.ativo ? "teal" : "amber"}
        />
        <KpiTile
          label="Cancelaram"
          value={isLoading ? "—" : (resumo?.cancelados ?? 0).toLocaleString("pt-PT")}
          hint="não recebem emails promocionais"
          icon={MailX}
          tone="rose"
        />
      </div>

      <AdminPanel
        title="Gatilhos"
        subtitle="Por ordem de prioridade. Os três últimos são promocionais: no máximo um a cada 3 dias por pessoa."
        bodyClassName="px-0 pb-2"
      >
        <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
          {GATILHOS.map((g, i) => (
            <li key={g.valor} className="flex items-center gap-3 px-4 py-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500 dark:bg-white/[0.06] dark:text-zinc-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{g.nome}</p>
                <p className={cn("text-xs", adminMuted)}>{g.quando}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-bold tabular-nums text-gray-900 dark:text-white">
                  {resumo?.enviados30Dias[g.valor] ?? 0}
                </p>
                <p className={cn("text-[10px]", adminMuted)}>30 dias</p>
              </div>
              {resultado && (
                <div className="w-16 shrink-0 text-right">
                  <p className="text-sm font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {resultado.porGatilho[g.valor] ?? 0}
                  </p>
                  <p className={cn("text-[10px]", adminMuted)}>{resultado.simulacao ? "hoje" : "agora"}</p>
                </div>
              )}
            </li>
          ))}
        </ul>
      </AdminPanel>

      <AdminPanel title="Executar" subtitle="A simulação não envia nada: mostra quantos emails sairiam hoje.">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <Button
            variant="outline"
            onClick={() => simular.mutate()}
            disabled={simular.isPending}
            className="w-full gap-2 sm:w-auto"
          >
            {simular.isPending ? <Loader2 className="size-4 animate-spin" /> : <FlaskConical className="size-4" />}
            Simular hoje
          </Button>
          <Button
            onClick={enviarAgora}
            disabled={executar.isPending || !resumo?.emailConfigurado}
            className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
          >
            {executar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            Enviar agora
          </Button>
          {resultado && (
            <p className={cn("text-sm sm:ml-2", adminMuted)}>
              {resultado.simulacao
                ? `${resultado.planeados} email(s) sairiam hoje.`
                : `${resultado.enviados} de ${resultado.planeados} enviados.`}
            </p>
          )}
        </div>
      </AdminPanel>
    </div>
  );
}
