import { useEffect, useId, useRef, useState, type DragEvent, type FormEvent, type ReactNode } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { FileText, Info, Link2, ListChecks, Loader2, Upload, Video, X, Youtube, type LucideIcon } from "lucide-react";
import { toast } from "sonner";
import { cursosApi, type Aula } from "@/api/cursos";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { api } from "@/lib/axios";

type Tipo = Aula["tipo"];
type Origem = "link" | "ficheiro";

interface Formulario {
  titulo: string;
  tipo: Tipo;
  duracao: string;
  gratuito: boolean;
  origem: Origem;
  link: string;
  ficheiro: { url: string; nome: string; duracao: string } | null;
}

const FORMULARIO_VAZIO: Formulario = {
  titulo: "", tipo: "VIDEO", duracao: "", gratuito: false, origem: "link", link: "", ficheiro: null,
};

const TIPOS: { valor: Tipo; nome: string; icone: LucideIcon }[] = [
  { valor: "VIDEO", nome: "Vídeo", icone: Video },
  { valor: "PDF", nome: "PDF", icone: FileText },
  { valor: "QUIZ", nome: "Quiz", icone: ListChecks },
];

// Igual ao limite do servidor (api/src/utills/multer.ts).
const LIMITE_MB = 50;

// Só formatos que o navegador consegue reproduzir na aula: AVI, por exemplo, carrega mas não toca.
const FICHEIROS = {
  VIDEO: { mime: ["video/mp4", "video/webm"], nomes: "MP4 ou WebM", pedido: "Carregue o vídeo da aula." },
  PDF: { mime: ["application/pdf"], nomes: "PDF", pedido: "Carregue o ficheiro PDF." },
};

const campo =
  "rounded-xl border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus-visible:ring-emerald-500/40 dark:border-white/[0.08] dark:bg-white/[0.04] dark:text-white dark:placeholder:text-zinc-500";
const rotulo = "text-sm font-medium text-gray-800 dark:text-zinc-100";
const opcional = "font-normal text-gray-500 dark:text-zinc-400";

function extrairIdYoutube(url: string) {
  const resultado = url.match(
    /(?:youtube\.com\/(?:watch\?(?:\S*&)?v=|embed\/|v\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/
  );
  return resultado?.[1] ?? null;
}

function formatarDuracao(segundos: number) {
  const total = Math.round(segundos);
  const horas = Math.floor(total / 3600);
  const minutos = Math.floor((total % 3600) / 60);
  const resto = String(total % 60).padStart(2, "0");
  return horas > 0 ? `${horas}:${String(minutos).padStart(2, "0")}:${resto}` : `${minutos}:${resto}`;
}

function lerDuracaoDoVideo(ficheiro: File) {
  return new Promise<string>((resolve) => {
    const url = URL.createObjectURL(ficheiro);
    const video = document.createElement("video");
    const terminar = (duracao: string) => {
      URL.revokeObjectURL(url);
      resolve(duracao);
    };
    video.preload = "metadata";
    video.onloadedmetadata = () => terminar(Number.isFinite(video.duration) ? formatarDuracao(video.duration) : "");
    video.onerror = () => terminar("");
    video.src = url;
  });
}

function mensagemDoErro(erro: unknown) {
  return (erro as { response?: { data?: { message?: string } } } | null)?.response?.data?.message;
}

function Erro({ texto }: { texto: string }) {
  return texto ? <p className="text-xs text-red-600 dark:text-red-400">{texto}</p> : null;
}

function Opcao({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={ativa}
      onClick={onClick}
      className={`flex min-h-11 items-center justify-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
        ativa
          ? "border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
          : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-white/[0.08] dark:text-zinc-300 dark:hover:border-white/20"
      }`}
    >
      {children}
    </button>
  );
}

interface NovaAulaDialogProps {
  cursoId: string;
  totalAulas: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NovaAulaDialog({ cursoId, totalAulas, open, onOpenChange }: NovaAulaDialogProps) {
  const queryClient = useQueryClient();
  const idBase = useId();
  const [form, setForm] = useState<Formulario>(FORMULARIO_VAZIO);
  const [tentou, setTentou] = useState(false);
  const [envio, setEnvio] = useState<{ nome: string; progresso: number } | null>(null);
  const [erroEnvio, setErroEnvio] = useState("");
  const [aArrastar, setAArrastar] = useState(false);
  const inputFicheiro = useRef<HTMLInputElement>(null);
  const envioAtual = useRef<AbortController | null>(null);

  const idYoutube = form.tipo === "VIDEO" && form.origem === "link" ? extrairIdYoutube(form.link) : null;

  const adicionar = useMutation({
    mutationFn: () => {
      const { tipo, origem, link, ficheiro } = form;
      const conteudo = origem === "ficheiro" ? ficheiro?.url : link.trim();
      return cursosApi.addAula(cursoId, {
        titulo: form.titulo.trim(),
        tipo,
        duracao: form.duracao.trim() || undefined,
        gratuito: form.gratuito,
        // O link do YouTube é guardado no formato embed: é o único que todos os leitores conseguem abrir.
        videoUrl: tipo === "VIDEO" && origem === "link" ? `https://www.youtube.com/embed/${idYoutube}` : undefined,
        videoLocal: tipo === "VIDEO" && origem === "ficheiro" ? conteudo : undefined,
        pdfUrl: tipo === "PDF" ? conteudo : undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curso", cursoId] });
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-cursos"] });
      toast.success("Aula adicionada!");
      onOpenChange(false);
    },
  });
  const { reset: limparErroAoAdicionar } = adicionar;

  useEffect(() => {
    if (!open) return;
    setForm(FORMULARIO_VAZIO);
    setTentou(false);
    setEnvio(null);
    setErroEnvio("");
    limparErroAoAdicionar();
    // Fechar o dialog (ou sair da página) interrompe um carregamento em curso.
    return () => envioAtual.current?.abort();
  }, [open, limparErroAoAdicionar]);

  const erros = {
    titulo: form.titulo.trim() ? "" : "Indique o título da aula.",
    duracao:
      !form.duracao.trim() || /^(?:\d{1,2}:)?[0-5]?\d:[0-5]\d$/.test(form.duracao.trim())
        ? ""
        : "Use o formato mm:ss, por exemplo 12:30.",
    conteudo: (() => {
      if (form.tipo === "QUIZ") return "";
      if (form.origem === "ficheiro") return form.ficheiro ? "" : FICHEIROS[form.tipo].pedido;
      if (form.tipo === "VIDEO") return idYoutube ? "" : "Cole um link válido do YouTube.";
      return /^https?:\/\/\S+$/.test(form.link.trim()) ? "" : "Cole um link completo, a começar por https://.";
    })(),
  };

  const atualizar = (alteracoes: Partial<Formulario>) => setForm((atual) => ({ ...atual, ...alteracoes }));

  function cancelarEnvio() {
    envioAtual.current?.abort();
    setErroEnvio("");
  }

  function mudarConteudo(alteracoes: Partial<Formulario>) {
    cancelarEnvio();
    // A duração detetada no ficheiro anterior não vale para o conteúdo novo; a escrita à mão mantém-se.
    setForm((atual) => ({
      ...atual,
      link: "",
      ficheiro: null,
      duracao: atual.ficheiro && atual.duracao === atual.ficheiro.duracao ? "" : atual.duracao,
      ...alteracoes,
    }));
  }

  function escolherTipo(tipo: Tipo) {
    if (tipo !== form.tipo) mudarConteudo({ tipo, origem: tipo === "PDF" ? "ficheiro" : "link" });
  }

  async function carregar(ficheiro: File) {
    if (form.tipo === "QUIZ") return;
    const { mime, nomes } = FICHEIROS[form.tipo];
    if (!mime.includes(ficheiro.type)) {
      setErroEnvio(`Formato não suportado. Escolha um ficheiro ${nomes}.`);
      return;
    }
    if (ficheiro.size > LIMITE_MB * 1024 * 1024) {
      setErroEnvio(`O ficheiro tem mais de ${LIMITE_MB} MB.`);
      return;
    }

    const controlador = new AbortController();
    envioAtual.current = controlador;
    setErroEnvio("");
    setEnvio({ nome: ficheiro.name, progresso: 0 });

    try {
      const duracao = form.tipo === "VIDEO" ? lerDuracaoDoVideo(ficheiro) : Promise.resolve("");
      const corpo = new FormData();
      corpo.append("file", ficheiro);
      const { data } = await api.post("/upload", corpo, {
        signal: controlador.signal,
        onUploadProgress: ({ loaded, total }) =>
          setEnvio({ nome: ficheiro.name, progresso: total ? Math.round((loaded / total) * 100) : 0 }),
      });
      const duracaoDetetada = await duracao;
      if (controlador.signal.aborted) return;
      setForm((atual) => ({
        ...atual,
        ficheiro: { url: data.url, nome: ficheiro.name, duracao: duracaoDetetada },
        duracao: atual.duracao.trim() || duracaoDetetada,
      }));
    } catch (erro) {
      if (!axios.isCancel(erro)) {
        setErroEnvio(mensagemDoErro(erro) || "Não foi possível carregar o ficheiro. Tente novamente.");
      }
    } finally {
      if (envioAtual.current === controlador) {
        envioAtual.current = null;
        setEnvio(null);
      }
    }
  }

  function largarFicheiro(evento: DragEvent) {
    evento.preventDefault();
    setAArrastar(false);
    const ficheiro = evento.dataTransfer.files[0];
    if (ficheiro && !envio) carregar(ficheiro);
  }

  function submeter(evento: FormEvent) {
    evento.preventDefault();
    setTentou(true);
    if (!erros.titulo && !erros.duracao && !erros.conteudo && !envio && !adicionar.isPending) adicionar.mutate();
  }

  const idCampo = (nome: string) => `${idBase}-${nome}`;
  const erroConteudo = tentou && !envio && !erroEnvio ? erros.conteudo : "";

  return (
    <Dialog open={open} onOpenChange={(aberto) => !adicionar.isPending && onOpenChange(aberto)}>
      <DialogContent
        // Um clique fora não deve deitar fora o formulário nem um carregamento em curso.
        onInteractOutside={(e) => e.preventDefault()}
        className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-3xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100"
      >
        <DialogHeader className="text-left">
          <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Nova aula</DialogTitle>
          <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
            Será a aula n.º {totalAulas + 1} deste curso.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submeter} noValidate className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor={idCampo("titulo")} className={rotulo}>Título</Label>
            <Input
              id={idCampo("titulo")}
              autoFocus
              maxLength={120}
              value={form.titulo}
              onChange={(e) => atualizar({ titulo: e.target.value })}
              placeholder="Ex: Introdução às Finanças"
              aria-invalid={tentou && !!erros.titulo}
              className={`h-11 ${campo}`}
            />
            {tentou && <Erro texto={erros.titulo} />}
          </div>

          <div className="space-y-1.5">
            <p id={idCampo("tipo")} className={rotulo}>Tipo de aula</p>
            <div role="group" aria-labelledby={idCampo("tipo")} className="grid grid-cols-3 gap-2">
              {TIPOS.map(({ valor, nome, icone: Icone }) => (
                <Opcao key={valor} ativa={form.tipo === valor} onClick={() => escolherTipo(valor)}>
                  <Icone size={16} aria-hidden />
                  {nome}
                </Opcao>
              ))}
            </div>
          </div>

          {form.tipo === "QUIZ" ? (
            <p className="flex gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-300">
              <Info size={16} className="mt-0.5 shrink-0" aria-hidden />
              Ainda não é possível criar perguntas. Os estudantes verão esta aula com o aviso "Em breve disponível".
            </p>
          ) : (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <p id={idCampo("origem")} className={rotulo}>
                  {form.tipo === "VIDEO" ? "Origem do vídeo" : "Origem do PDF"}
                </p>
                <div role="group" aria-labelledby={idCampo("origem")} className="grid grid-cols-2 gap-2">
                  <Opcao ativa={form.origem === "link"} onClick={() => form.origem !== "link" && mudarConteudo({ origem: "link" })}>
                    {form.tipo === "VIDEO" ? <Youtube size={16} aria-hidden /> : <Link2 size={16} aria-hidden />}
                    {form.tipo === "VIDEO" ? "YouTube" : "Link externo"}
                  </Opcao>
                  <Opcao ativa={form.origem === "ficheiro"} onClick={() => form.origem !== "ficheiro" && mudarConteudo({ origem: "ficheiro" })}>
                    <Upload size={16} aria-hidden />
                    Do computador
                  </Opcao>
                </div>
              </div>

              {form.origem === "link" ? (
                <div className="space-y-1.5">
                  <Label htmlFor={idCampo("link")} className={rotulo}>
                    {form.tipo === "VIDEO" ? "Link do vídeo" : "Link do PDF"}
                  </Label>
                  <Input
                    id={idCampo("link")}
                    type="url"
                    inputMode="url"
                    value={form.link}
                    onChange={(e) => atualizar({ link: e.target.value })}
                    placeholder={form.tipo === "VIDEO" ? "https://youtube.com/watch?v=..." : "https://..."}
                    aria-invalid={!!erroConteudo}
                    className={`h-11 ${campo}`}
                  />
                  <Erro texto={erroConteudo} />
                  {idYoutube && (
                    <img
                      src={`https://img.youtube.com/vi/${idYoutube}/mqdefault.jpg`}
                      alt="Miniatura do vídeo do YouTube"
                      className="mt-2 aspect-video w-40 rounded-lg object-cover"
                    />
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <input
                    ref={inputFicheiro}
                    type="file"
                    accept={FICHEIROS[form.tipo].mime.join(",")}
                    aria-label={form.tipo === "VIDEO" ? "Escolher vídeo" : "Escolher PDF"}
                    onChange={(e) => {
                      const ficheiro = e.target.files?.[0];
                      e.target.value = "";
                      if (ficheiro) carregar(ficheiro);
                    }}
                    className="hidden"
                  />

                  {form.ficheiro ? (
                    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 dark:border-emerald-500/30 dark:bg-emerald-500/10">
                      {form.tipo === "VIDEO"
                        ? <Video size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />
                        : <FileText size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" aria-hidden />}
                      <span className="flex-1 truncate text-sm text-emerald-800 dark:text-emerald-300">{form.ficheiro.nome}</span>
                      <button
                        type="button"
                        aria-label="Remover ficheiro"
                        onClick={() => mudarConteudo({})}
                        className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100 dark:text-emerald-400 dark:hover:bg-emerald-500/20"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : envio ? (
                    <div className="space-y-2 rounded-xl border border-gray-200 p-3 dark:border-white/[0.08]">
                      <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300">
                        <Loader2 size={14} className="shrink-0 animate-spin text-emerald-500" aria-hidden />
                        <span className="flex-1 truncate">{envio.nome}</span>
                        <span className="tabular-nums text-gray-500 dark:text-zinc-400">{envio.progresso}%</span>
                        <button
                          type="button"
                          aria-label="Cancelar carregamento"
                          onClick={cancelarEnvio}
                          className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-white/[0.06]"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      <Progress
                        value={envio.progresso}
                        aria-label="Progresso do carregamento"
                        className="h-1.5 bg-gray-100 dark:bg-white/[0.08] [&>div]:bg-emerald-500"
                      />
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => inputFicheiro.current?.click()}
                      onDragOver={(e) => { e.preventDefault(); setAArrastar(true); }}
                      onDragLeave={() => setAArrastar(false)}
                      onDrop={largarFicheiro}
                      className={`flex w-full flex-col items-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 ${
                        aArrastar
                          ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10"
                          : erroConteudo || erroEnvio
                            ? "border-red-300 dark:border-red-500/40"
                            : "border-gray-200 hover:border-emerald-400 dark:border-white/[0.08] dark:hover:border-emerald-500/50"
                      }`}
                    >
                      <Upload size={20} className="text-gray-400 dark:text-zinc-500" aria-hidden />
                      <span className="text-sm font-medium text-gray-700 dark:text-zinc-200">
                        Clique para escolher ou arraste o ficheiro
                      </span>
                      <span className="text-xs text-gray-500 dark:text-zinc-400">
                        {FICHEIROS[form.tipo].nomes}, até {LIMITE_MB} MB
                      </span>
                    </button>
                  )}
                  <Erro texto={erroEnvio || erroConteudo} />
                </div>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor={idCampo("duracao")} className={rotulo}>
              Duração <span className={opcional}>(opcional)</span>
            </Label>
            <Input
              id={idCampo("duracao")}
              value={form.duracao}
              onChange={(e) => atualizar({ duracao: e.target.value })}
              placeholder="12:30"
              aria-invalid={tentou && !!erros.duracao}
              className={`h-11 w-32 ${campo}`}
            />
            {tentou && erros.duracao
              ? <Erro texto={erros.duracao} />
              : form.tipo === "VIDEO" && form.origem === "ficheiro" && (
                <p className="text-xs text-gray-500 dark:text-zinc-400">Preenchida automaticamente ao carregar o vídeo.</p>
              )}
          </div>

          <div className="flex items-center justify-between gap-4 rounded-xl border border-gray-200 p-3 dark:border-white/[0.08]">
            <div>
              <Label htmlFor={idCampo("gratuito")} className={rotulo}>Aula gratuita</Label>
              <p className="text-xs text-gray-500 dark:text-zinc-400">Pode ser vista sem comprar o curso.</p>
            </div>
            <Switch
              id={idCampo("gratuito")}
              checked={form.gratuito}
              onCheckedChange={(gratuito) => atualizar({ gratuito })}
              className="data-[state=checked]:bg-emerald-500"
            />
          </div>

          {adicionar.isError && (
            <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-500/10 dark:text-red-400">
              {mensagemDoErro(adicionar.error) || "Não foi possível adicionar a aula. Tente novamente."}
            </p>
          )}

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={adicionar.isPending}
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl border-gray-200 dark:border-white/[0.08] dark:text-white dark:hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={adicionar.isPending || !!envio}
              className="h-11 rounded-xl bg-emerald-500 font-semibold text-white hover:bg-emerald-600"
            >
              {adicionar.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  A adicionar...
                </>
              ) : envio ? (
                "A carregar ficheiro..."
              ) : (
                "Adicionar aula"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
