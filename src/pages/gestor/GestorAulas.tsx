import { useEffect, useState, type FormEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { format, parseISO } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarClock, Clock, Loader2, Play, Plus, Radio, Trash2, Users, Video, X } from "lucide-react";
import { toast } from "sonner";
import { aulasApi, type AulaOnline, type AulaOnlineStatus } from "@/api/aulas";
import { gestorApi } from "@/api/gestor";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { EmptyState, IconAction, PageHeader, StatCard, StatusPill, primaryButton, softText, surface } from "./ui";

const SEM_BOLSA = "none";
const campo =
  "rounded-xl border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500";
const rotulo = "text-sm font-medium text-gray-800 dark:text-zinc-100";

function formatarQuando(data: string) {
  return format(parseISO(data), "dd MMM yyyy, HH:mm", { locale: pt });
}

function mensagemDoErro(erro: unknown) {
  return (erro as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
}

function NovaAulaDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const queryClient = useQueryClient();
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [data, setData] = useState("");
  const [hora, setHora] = useState("");
  const [duracao, setDuracao] = useState("60");
  const [bolsaId, setBolsaId] = useState(SEM_BOLSA);
  const [tentou, setTentou] = useState(false);

  const { data: bolsasData } = useQuery({
    queryKey: ["gestor-bolsas-select"],
    queryFn: () => gestorApi.listBolsas({ limit: 100 }),
    enabled: open,
  });
  const bolsas = bolsasData?.data ?? [];

  const criar = useMutation({
    mutationFn: () =>
      aulasApi.create({
        titulo: titulo.trim(),
        descricao: descricao.trim() || undefined,
        // Vai com fuso horário, para o servidor não a mudar de hora.
        data: new Date(`${data}T${hora}`).toISOString(),
        duracao: Number(duracao),
        bolsaId: bolsaId === SEM_BOLSA ? undefined : bolsaId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["gestor-aulas"] });
      queryClient.invalidateQueries({ queryKey: ["aulas"] });
      toast.success("Aula agendada!");
      onOpenChange(false);
    },
  });
  const { reset: limparErro } = criar;

  useEffect(() => {
    if (!open) return;
    setTitulo("");
    setDescricao("");
    setData("");
    setHora("");
    setDuracao("60");
    setBolsaId(SEM_BOLSA);
    setTentou(false);
    limparErro();
  }, [open, limparErro]);

  const quando = data && hora ? new Date(`${data}T${hora}`) : null;
  const duracaoNumero = Number(duracao);
  const erros = {
    titulo: titulo.trim() ? "" : "Indique o título da aula.",
    quando: !quando
      ? "Indique a data e a hora."
      : quando.getTime() <= Date.now()
        ? "Escolha uma data e hora no futuro."
        : "",
    duracao:
      Number.isInteger(duracaoNumero) && duracaoNumero >= 15 && duracaoNumero <= 480
        ? ""
        : "A duração deve estar entre 15 e 480 minutos.",
  };

  function submeter(evento: FormEvent) {
    evento.preventDefault();
    setTentou(true);
    if (!erros.titulo && !erros.quando && !erros.duracao && !criar.isPending) criar.mutate();
  }

  const Erro = ({ texto }: { texto: string }) =>
    tentou && texto ? <p className="text-xs text-red-600 dark:text-red-400">{texto}</p> : null;

  return (
    <Dialog open={open} onOpenChange={(aberto) => !criar.isPending && onOpenChange(aberto)}>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto rounded-3xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Nova aula ao vivo</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
            A aula aparece para os estudantes em "Aulas ao Vivo" e no calendário.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submeter} noValidate className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="aula-titulo" className={rotulo}>Título</Label>
            <Input
              id="aula-titulo"
              autoFocus
              maxLength={120}
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
              placeholder="Ex: Como preparar a carta de motivação"
              className={`h-11 ${campo}`}
            />
            <Erro texto={erros.titulo} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aula-descricao" className={rotulo}>
              Descrição <span className="font-normal text-gray-500 dark:text-zinc-400">(opcional)</span>
            </Label>
            <Textarea
              id="aula-descricao"
              rows={2}
              maxLength={500}
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="O que os estudantes vão aprender?"
              className={`resize-none ${campo}`}
            />
          </div>

          <div className="space-y-1.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="aula-data" className={rotulo}>Data</Label>
                <Input
                  id="aula-data"
                  type="date"
                  min={format(new Date(), "yyyy-MM-dd")}
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  className={`h-11 dark:[color-scheme:dark] ${campo}`}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="aula-hora" className={rotulo}>Hora</Label>
                <Input
                  id="aula-hora"
                  type="time"
                  value={hora}
                  onChange={(e) => setHora(e.target.value)}
                  className={`h-11 dark:[color-scheme:dark] ${campo}`}
                />
              </div>
            </div>
            <Erro texto={erros.quando} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aula-duracao" className={rotulo}>Duração (minutos)</Label>
            <Input
              id="aula-duracao"
              type="number"
              inputMode="numeric"
              min={15}
              max={480}
              step={15}
              value={duracao}
              onChange={(e) => setDuracao(e.target.value)}
              className={`h-11 ${campo}`}
            />
            <Erro texto={erros.duracao} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="aula-bolsa" className={rotulo}>Quem pode entrar</Label>
            <Select value={bolsaId} onValueChange={setBolsaId}>
              <SelectTrigger id="aula-bolsa" className={`h-11 ${campo}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={SEM_BOLSA}>Todos os estudantes</SelectItem>
                {bolsas.map((bolsa) => (
                  <SelectItem key={bolsa.id} value={bolsa.id}>{bolsa.titulo}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-500 dark:text-zinc-400">
              {bolsaId === SEM_BOLSA
                ? "Qualquer estudante com sessão iniciada pode entrar."
                : "Só entram os estudantes com inscrição aprovada nesta bolsa."}
            </p>
          </div>

          {criar.isError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {mensagemDoErro(criar.error) || "Não foi possível agendar a aula. Tente novamente."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={criar.isPending}
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-gray-200 dark:border-white/[0.08] dark:text-white dark:hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={criar.isPending}
              className="h-11 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            >
              {criar.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A agendar...
                </>
              ) : (
                "Agendar aula"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function GestorAulas() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [criarOpen, setCriarOpen] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["gestor-aulas"],
    queryFn: aulasApi.listMinhas,
  });
  const aulas = data?.data ?? [];

  const atualizar = () => {
    queryClient.invalidateQueries({ queryKey: ["gestor-aulas"] });
    queryClient.invalidateQueries({ queryKey: ["aulas"] });
  };

  const mudarEstado = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AulaOnlineStatus }) =>
      aulasApi.updateStatus(id, { status }),
    onSuccess: (_resposta, { id, status }) => {
      atualizar();
      if (status === "AO_VIVO") navigate(`/aulas/${id}`);
    },
    onError: (erro) => toast.error(mensagemDoErro(erro) || "Não foi possível atualizar a aula."),
  });

  const remover = useMutation({
    mutationFn: (id: string) => aulasApi.delete(id),
    onSuccess: () => {
      atualizar();
      toast.success("Aula removida.");
    },
    onError: (erro) => toast.error(mensagemDoErro(erro) || "Não foi possível remover a aula."),
  });

  const aoVivo = aulas.filter((a) => a.status === "AO_VIVO");
  const proximas = aulas
    .filter((a) => a.status === "AGENDADA")
    .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  const anteriores = aulas.filter((a) => a.status === "FINALIZADA" || a.status === "CANCELADA");
  const totalParticipantes = aulas.reduce((total, a) => total + a._count.participantes, 0);

  const secoes = [
    { titulo: "Ao vivo agora", itens: aoVivo },
    { titulo: "Próximas aulas", itens: proximas },
    { titulo: "Anteriores", itens: anteriores },
  ];

  function CartaoAula({ aula }: { aula: AulaOnline }) {
    const emAtraso = aula.status === "AGENDADA" && new Date(aula.data).getTime() < Date.now();
    const ocupado = mudarEstado.isPending || remover.isPending;

    return (
      <div className={`${surface} flex flex-col p-5`}>
        <div className="flex items-start justify-between gap-3">
          <p className="min-w-0 break-words text-sm font-semibold text-zinc-900 dark:text-zinc-50">{aula.titulo}</p>
          <StatusPill status={aula.status} />
        </div>
        {aula.descricao && <p className={`mt-1.5 line-clamp-2 text-xs ${softText}`}>{aula.descricao}</p>}

        <div className={`mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs ${softText}`}>
          <span className="flex items-center gap-1.5"><CalendarClock size={13} />{formatarQuando(aula.data)}</span>
          {aula.duracao && <span className="flex items-center gap-1.5"><Clock size={13} />{aula.duracao} min</span>}
          <span className="flex items-center gap-1.5"><Users size={13} />{aula._count.participantes}</span>
        </div>
        {aula.bolsa && <p className="mt-2 truncate text-xs font-medium text-emerald-700 dark:text-emerald-400">{aula.bolsa.titulo}</p>}
        {emAtraso && <p className="mt-2 text-xs text-amber-700 dark:text-amber-400">A hora marcada já passou.</p>}

        <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-3 dark:border-white/[0.06]">
          {aula.status === "AGENDADA" && (
            <>
              <Button
                size="sm"
                disabled={ocupado}
                className={`${primaryButton} flex-1`}
                onClick={() => mudarEstado.mutate({ id: aula.id, status: "AO_VIVO" })}
              >
                <Play size={14} className="mr-1.5" />
                Iniciar aula
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado}
                className="rounded-full dark:text-white"
                onClick={async () => {
                  if (await confirm(`Cancelar a aula "${aula.titulo}"? Os estudantes deixam de poder entrar.`, "Cancelar aula")) {
                    mudarEstado.mutate({ id: aula.id, status: "CANCELADA" });
                  }
                }}
              >
                Cancelar
              </Button>
            </>
          )}
          {aula.status === "AO_VIVO" && (
            <>
              <Button size="sm" className={`${primaryButton} flex-1`} onClick={() => navigate(`/aulas/${aula.id}`)}>
                <Video size={14} className="mr-1.5" />
                Entrar na sala
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={ocupado}
                className="rounded-full text-red-600 dark:text-red-400"
                onClick={async () => {
                  if (await confirm(`Encerrar a aula "${aula.titulo}"?`, "Encerrar aula")) {
                    mudarEstado.mutate({ id: aula.id, status: "FINALIZADA" });
                  }
                }}
              >
                <X size={14} className="mr-1" />
                Encerrar
              </Button>
            </>
          )}
          {aula.status === "FINALIZADA" && (
            <Button size="sm" variant="outline" className="flex-1 rounded-full dark:text-white" onClick={() => navigate(`/aulas/${aula.id}`)}>
              Ver gravação
            </Button>
          )}
          {(aula.status === "FINALIZADA" || aula.status === "CANCELADA") && (
            <div className="ml-auto">
              <IconAction
                danger
                icon={Trash2}
                label="Remover aula"
                disabled={ocupado}
                onClick={async () => {
                  if (await confirm(`Remover "${aula.titulo}" e a lista de participantes? Esta ação não pode ser desfeita.`, "Remover aula")) {
                    remover.mutate(aula.id);
                  }
                }}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Aulas ao vivo"
        description="Agende aulas por videochamada e entre na sala quando for a hora."
        action={
          <Button className={primaryButton} onClick={() => setCriarOpen(true)}>
            <Plus size={15} className="mr-1.5" />
            Nova aula
          </Button>
        }
      />

      {/* No telemóvel, as aulas vêm primeiro: os números ocupariam o ecrã todo. */}
      <div className="hidden gap-3 sm:grid sm:grid-cols-3">
        <StatCard label="Próximas" value={proximas.length} icon={CalendarClock} highlight />
        <StatCard label="Ao vivo" value={aoVivo.length} icon={Radio} />
        <StatCard label="Participantes" value={totalParticipantes} icon={Users} />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      ) : isError ? (
        <div className={surface}>
          <EmptyState
            icon={Video}
            title="Não foi possível carregar as aulas"
            description="Verifique a ligação e tente novamente."
            action={<Button variant="outline" className="rounded-full dark:text-white" onClick={() => refetch()}>Tentar novamente</Button>}
          />
        </div>
      ) : aulas.length === 0 ? (
        <div className={surface}>
          <EmptyState
            icon={Video}
            title="Ainda não tem aulas"
            description="Agende a primeira aula e os estudantes vão vê-la em Aulas ao Vivo."
            action={<Button className={primaryButton} onClick={() => setCriarOpen(true)}>Agendar aula</Button>}
          />
        </div>
      ) : (
        secoes
          .filter((secao) => secao.itens.length > 0)
          .map((secao) => (
            <section key={secao.titulo} className="space-y-3">
              <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{secao.titulo}</h2>
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {secao.itens.map((aula) => (
                  <CartaoAula key={aula.id} aula={aula} />
                ))}
              </div>
            </section>
          ))
      )}

      <NovaAulaDialog open={criarOpen} onOpenChange={setCriarOpen} />
      <ConfirmDialog />
    </div>
  );
}

export default GestorAulas;
