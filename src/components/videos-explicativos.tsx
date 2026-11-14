import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { PlayCircle } from "lucide-react";
import { eFicheiroLocal, videosApi, type LocalVideo, type VideoExplicativo } from "@/api/videos";
import { getUploadUrl } from "@/lib/axios";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

/** Leitor do YouTube num diálogo (domínio sem cookies). */
export function LeitorVideo({ video, onFechar }: { video: VideoExplicativo | null; onFechar: () => void }) {
  return (
    <Dialog open={!!video} onOpenChange={(aberto) => !aberto && onFechar()}>
      <DialogContent className="w-[calc(100%-1.5rem)] max-w-3xl gap-3 overflow-hidden rounded-2xl border-0 bg-zinc-950 p-0 text-white sm:rounded-2xl">
        {video && (
          <>
            <div className="aspect-video w-full bg-black">
              {eFicheiroLocal(video.url) ? (
                <video src={getUploadUrl(video.url)} controls autoPlay playsInline className="h-full w-full" />
              ) : video.youtubeId ? (
                <iframe
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0`}
                  title={video.titulo}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-400">Vídeo indisponível</div>
              )}
            </div>
            <DialogHeader className="px-4 pb-4 text-left">
              <DialogTitle className="text-base text-white">{video.titulo}</DialogTitle>
              {video.descricao && (
                <DialogDescription className="text-sm text-zinc-400">{video.descricao}</DialogDescription>
              )}
            </DialogHeader>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

/** Miniatura: a do YouTube, ou o primeiro segundo do ficheiro carregado. */
export function MiniaturaVideo({ video, qualidade = "hqdefault" }: { video: Pick<VideoExplicativo, "url" | "youtubeId">; qualidade?: string }) {
  if (eFicheiroLocal(video.url)) {
    return (
      <video
        src={`${getUploadUrl(video.url)}#t=1`}
        preload="metadata"
        muted
        playsInline
        className="pointer-events-none h-full w-full object-cover"
      />
    );
  }
  if (!video.youtubeId) return null;
  return (
    <img
      src={`https://i.ytimg.com/vi/${video.youtubeId}/${qualidade}.jpg`}
      alt=""
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );
}

/** Miniatura clicável de um vídeo. */
export function CartaoVideo({ video, onVer }: { video: VideoExplicativo; onVer: () => void }) {
  return (
    <button
      type="button"
      onClick={onVer}
      className="group overflow-hidden rounded-2xl border border-gray-100 bg-white text-left transition-colors hover:border-emerald-200 dark:border-white/[0.06] dark:bg-[#111113] dark:hover:border-emerald-500/30"
    >
      <div className="relative aspect-video bg-gray-100 dark:bg-white/[0.04]">
        <MiniaturaVideo video={video} />
        <span className="absolute inset-0 flex items-center justify-center bg-black/20 transition-colors group-hover:bg-black/35">
          <PlayCircle className="size-12 text-white drop-shadow" />
        </span>
      </div>
      <div className="p-3">
        <p className="line-clamp-2 text-sm font-bold text-gray-900 dark:text-white">{video.titulo}</p>
        {video.descricao && (
          <p className="mt-1 line-clamp-2 text-xs text-gray-500 dark:text-zinc-400">{video.descricao}</p>
        )}
      </div>
    </button>
  );
}

/**
 * Botão "Vídeos explicativos" para colocar numa página: só aparece se o admin tiver
 * publicado vídeos para esse local (e para o público de quem está a ver).
 */
export function BotaoVideosDaPagina({ local, className }: { local: LocalVideo; className?: string }) {
  const [listaAberta, setListaAberta] = useState(false);
  const [aVer, setAVer] = useState<VideoExplicativo | null>(null);
  const { data: videos } = useQuery({
    queryKey: ["videos", local],
    queryFn: () => videosApi.listar(local),
    staleTime: 5 * 60 * 1000,
  });
  const daPagina = (videos ?? []).filter((v) => v.local === local);
  if (daPagina.length === 0) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => (daPagina.length === 1 ? setAVer(daPagina[0]) : setListaAberta(true))}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300",
          className
        )}
      >
        <PlayCircle className="size-4" />
        {daPagina.length === 1 ? "Ver vídeo explicativo" : `Vídeos explicativos (${daPagina.length})`}
      </button>

      <Dialog open={listaAberta} onOpenChange={setListaAberta}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-2xl overflow-y-auto rounded-2xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Vídeos explicativos</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            {daPagina.map((v) => (
              <CartaoVideo
                key={v.id}
                video={v}
                onVer={() => {
                  setListaAberta(false);
                  setAVer(v);
                }}
              />
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <LeitorVideo video={aVer} onFechar={() => setAVer(null)} />
    </>
  );
}
