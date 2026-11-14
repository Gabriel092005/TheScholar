import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { Eye, EyeOff, Loader2, Pencil, PlayCircle, Plus, Trash2, Upload, Youtube } from "lucide-react";
import {
  LOCAIS_VIDEO,
  PUBLICOS_VIDEO,
  carregarVideo,
  eFicheiroLocal,
  idDoYoutube,
  videosApi,
  type DadosVideo,
  type VideoExplicativo,
} from "@/api/videos";
import { AdminPageHeader, AdminPanel, adminMuted } from "@/components/admin/admin-ui";
import { LeitorVideo, MiniaturaVideo } from "@/components/videos-explicativos";
import { getUploadUrl } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { cn } from "@/lib/utils";

const VAZIO: DadosVideo = {
  titulo: "",
  descricao: "",
  url: "",
  publico: "TODOS",
  local: "GERAL",
  ordem: 0,
  publicado: true,
  notificar: false,
};

const nomePublico = (v: string) => PUBLICOS_VIDEO.find((p) => p.valor === v)?.nome ?? v;
const nomeLocal = (v: string) => LOCAIS_VIDEO.find((l) => l.valor === v)?.nome ?? v;

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

/** O admin publica vídeos do YouTube que aparecem em "Como funciona" e nas páginas escolhidas. */
export function VideosAdmin() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formAberto, setFormAberto] = useState(false);
  const [editar, setEditar] = useState<VideoExplicativo | null>(null);
  const [dados, setDados] = useState<DadosVideo>(VAZIO);
  const [aVer, setAVer] = useState<VideoExplicativo | null>(null);
  const [origem, setOrigem] = useState<"youtube" | "ficheiro">("youtube");
  const [progresso, setProgresso] = useState<number | null>(null);

  const escolherFicheiro = async (ficheiro: File | undefined) => {
    if (!ficheiro) return;
    if (ficheiro.size > 500 * 1024 * 1024) {
      toast.error("O vídeo tem mais de 500 MB. Comprima-o ou publique-o no YouTube.");
      return;
    }
    setProgresso(0);
    try {
      const url = await carregarVideo(ficheiro, setProgresso);
      setDados((d) => ({ ...d, url, titulo: d.titulo || ficheiro.name.replace(/\.[^.]+$/, "") }));
      toast.success("Vídeo carregado");
    } catch (e) {
      toast.error(mensagemDeErro(e, "Não foi possível carregar o vídeo."));
    } finally {
      setProgresso(null);
    }
  };

  const { data: videos, isLoading } = useQuery({ queryKey: ["admin-videos"], queryFn: videosApi.admin });

  const atualizarListas = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-videos"] });
    queryClient.invalidateQueries({ queryKey: ["videos"] });
  };

  const guardar = useMutation({
    mutationFn: () => {
      const corpo = { ...dados, descricao: dados.descricao?.trim() || null };
      if (editar) {
        const { notificar: _n, ...semNotificar } = corpo;
        return videosApi.atualizar(editar.id, semNotificar);
      }
      return videosApi.criar(corpo);
    },
    onSuccess: () => {
      atualizarListas();
      setFormAberto(false);
      toast.success(editar ? "Vídeo actualizado" : "Vídeo publicado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível guardar o vídeo.")),
  });

  const alternarPublicado = useMutation({
    mutationFn: (v: VideoExplicativo) => videosApi.atualizar(v.id, { publicado: !v.publicado }),
    onSuccess: atualizarListas,
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível alterar.")),
  });

  const apagar = useMutation({
    mutationFn: videosApi.apagar,
    onSuccess: () => {
      atualizarListas();
      toast.success("Vídeo apagado");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível apagar.")),
  });

  const abrirNovo = () => {
    setEditar(null);
    setDados(VAZIO);
    setOrigem("youtube");
    setFormAberto(true);
  };
  const abrirEditar = (v: VideoExplicativo) => {
    setEditar(v);
    setOrigem(eFicheiroLocal(v.url) ? "ficheiro" : "youtube");
    setDados({
      titulo: v.titulo,
      descricao: v.descricao ?? "",
      url: v.url,
      publico: v.publico,
      local: v.local,
      ordem: v.ordem,
      publicado: v.publicado,
    });
    setFormAberto(true);
  };

  const idPreview = idDoYoutube(dados.url);
  const ficheiroCarregado = eFicheiroLocal(dados.url);
  const valido =
    dados.titulo.trim().length >= 3 && progresso === null && (origem === "youtube" ? !!idPreview : ficheiroCarregado);

  return (
    <div className="space-y-5">
      <ConfirmDialog />
      <AdminPageHeader
        eyebrow="Conteúdo"
        title="Vídeos explicativos"
        description="Publique vídeos do YouTube que explicam a plataforma. Aparecem em Como funciona e na página que escolher, só para o público certo."
        actions={
          <Button onClick={abrirNovo} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
            <Plus className="size-4" /> Novo vídeo
          </Button>
        }
      />

      <AdminPanel title="Vídeos" subtitle={`${videos?.length ?? 0} vídeo(s)`} icon={PlayCircle} bodyClassName="px-0 pb-1">
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-emerald-500" />
          </div>
        ) : !videos || videos.length === 0 ? (
          <p className={cn("px-4 py-8 text-center text-sm", adminMuted)}>
            Ainda não há vídeos. Carregue em "Novo vídeo" e cole o link do YouTube.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {videos.map((v) => (
              <li key={v.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => setAVer(v)}
                  className="relative aspect-video w-full shrink-0 overflow-hidden rounded-lg bg-gray-100 sm:w-32 dark:bg-white/[0.04]"
                  aria-label={`Ver ${v.titulo}`}
                >
                  <MiniaturaVideo video={v} qualidade="mqdefault" />
                  <PlayCircle className="absolute inset-0 m-auto size-8 text-white drop-shadow" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{v.titulo}</p>
                  <div className="mt-1 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                    <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                      {nomePublico(v.publico)}
                    </span>
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400">
                      {nomeLocal(v.local)}
                    </span>
                    {!v.publicado && (
                      <span className="rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300">
                        Rascunho
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => alternarPublicado.mutate(v)}
                    title={v.publicado ? "Despublicar" : "Publicar"}
                    className="gap-1.5"
                  >
                    {v.publicado ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                    {v.publicado ? "Ocultar" : "Publicar"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => abrirEditar(v)} aria-label="Editar">
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Apagar"
                    className="text-red-600 hover:text-red-700"
                    onClick={async () => {
                      if (await confirm(`O vídeo "${v.titulo}" deixa de aparecer para todos.`, "Apagar o vídeo?")) {
                        apagar.mutate(v.id);
                      }
                    }}
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AdminPanel>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">{editar ? "Editar vídeo" : "Novo vídeo explicativo"}</DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">Cole um link do YouTube ou carregue um vídeo do seu computador.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3 [&_label]:text-gray-700 dark:[&_label]:text-zinc-300 dark:[&_input]:border-white/[0.1] dark:[&_input]:bg-white/[0.04] dark:[&_input]:text-white dark:[&_textarea]:border-white/[0.1] dark:[&_textarea]:bg-white/[0.04] dark:[&_textarea]:text-white dark:[&_button[role=combobox]]:border-white/[0.1] dark:[&_button[role=combobox]]:bg-white/[0.04] dark:[&_button[role=combobox]]:text-white"
            onSubmit={(e) => {
              e.preventDefault();
              if (valido) guardar.mutate();
            }}
          >
            <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-gray-100/70 p-1 dark:bg-white/[0.04]">
              {([
                { valor: "youtube", nome: "YouTube", icone: Youtube },
                { valor: "ficheiro", nome: "Do meu computador", icone: Upload },
              ] as const).map(({ valor, nome, icone: Icone }) => (
                <button
                  key={valor}
                  type="button"
                  aria-pressed={origem === valor}
                  disabled={progresso !== null}
                  onClick={() => {
                    setOrigem(valor);
                    setDados((d) => ({ ...d, url: "" }));
                  }}
                  className={cn(
                    "flex items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-xs font-semibold transition-all",
                    origem === valor
                      ? "bg-white text-emerald-600 shadow-sm dark:bg-white/[0.09] dark:text-emerald-400"
                      : "text-gray-500 dark:text-zinc-400"
                  )}
                >
                  <Icone className="size-4" /> {nome}
                </button>
              ))}
            </div>

            {origem === "youtube" ? (
              <div className="space-y-1.5">
                <Label htmlFor="video-url">Link do YouTube *</Label>
                <Input
                  id="video-url"
                  value={dados.url}
                  onChange={(e) => setDados({ ...dados, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=..."
                />
                {dados.url && !idPreview && <p className="text-xs text-red-600">Este link não parece ser do YouTube.</p>}
                {idPreview && (
                  <img
                    src={`https://i.ytimg.com/vi/${idPreview}/mqdefault.jpg`}
                    alt="Pré-visualização"
                    className="mt-1 aspect-video w-full rounded-lg object-cover"
                  />
                )}
              </div>
            ) : (
              <div className="space-y-1.5">
                <Label htmlFor="video-ficheiro">Vídeo (MP4, WEBM ou MOV, até 500 MB) *</Label>
                <label
                  htmlFor="video-ficheiro"
                  className={cn(
                    "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-gray-200 px-3 py-5 text-center text-xs text-gray-500 transition-colors hover:border-emerald-300 dark:border-white/[0.1] dark:text-zinc-400",
                    progresso !== null && "pointer-events-none opacity-70"
                  )}
                >
                  <Upload className="size-5 text-emerald-600 dark:text-emerald-400" />
                  {ficheiroCarregado ? "Escolher outro vídeo" : "Clique para escolher o vídeo"}
                </label>
                <input
                  id="video-ficheiro"
                  type="file"
                  accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.m4v"
                  className="hidden"
                  onChange={(e) => {
                    void escolherFicheiro(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {progresso !== null && (
                  <div className="space-y-1">
                    <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-white/[0.06]">
                      <div className="h-full bg-emerald-500 transition-all" style={{ width: `${progresso}%` }} />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-zinc-400">A carregar… {progresso}%</p>
                  </div>
                )}
                {ficheiroCarregado && progresso === null && (
                  <video src={getUploadUrl(dados.url)} controls playsInline className="mt-1 aspect-video w-full rounded-lg bg-black" />
                )}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="video-titulo">Título *</Label>
              <Input
                id="video-titulo"
                value={dados.titulo}
                maxLength={120}
                onChange={(e) => setDados({ ...dados, titulo: e.target.value })}
                placeholder="Como pagar a mentoria por referência"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-descricao">Descrição curta</Label>
              <Textarea
                id="video-descricao"
                value={dados.descricao ?? ""}
                maxLength={500}
                onChange={(e) => setDados({ ...dados, descricao: e.target.value })}
                className="min-h-[70px]"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>Para quem</Label>
                <Select value={dados.publico} onValueChange={(v) => setDados({ ...dados, publico: v as DadosVideo["publico"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PUBLICOS_VIDEO.map((p) => (
                      <SelectItem key={p.valor} value={p.valor}>
                        {p.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Onde aparece</Label>
                <Select value={dados.local} onValueChange={(v) => setDados({ ...dados, local: v as DadosVideo["local"] })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LOCAIS_VIDEO.map((l) => (
                      <SelectItem key={l.valor} value={l.valor}>
                        {l.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video-ordem">Ordem (menor aparece primeiro)</Label>
              <Input
                id="video-ordem"
                type="number"
                min={0}
                max={999}
                value={dados.ordem}
                onChange={(e) => setDados({ ...dados, ordem: Number(e.target.value) || 0 })}
                className="w-28"
              />
            </div>
            <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
              <span className="text-sm">Publicado</span>
              <Switch checked={dados.publicado} onCheckedChange={(c) => setDados({ ...dados, publicado: c })} />
            </label>
            {!editar && (
              <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                <span className="text-sm">Avisar o público (notificação na app e push)</span>
                <Switch checked={!!dados.notificar} onCheckedChange={(c) => setDados({ ...dados, notificar: c })} />
              </label>
            )}
            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button type="button" variant="outline" onClick={() => setFormAberto(false)} className="w-full dark:border-white/[0.1] dark:text-white sm:w-auto">
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!valido || guardar.isPending}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
              >
                {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
                {editar ? "Guardar" : "Publicar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <LeitorVideo video={aVer} onFechar={() => setAVer(null)} />
    </div>
  );
}
