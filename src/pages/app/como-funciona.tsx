import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2, PlayCircle } from "lucide-react";
import { LOCAIS_VIDEO, videosApi, type VideoExplicativo } from "@/api/videos";
import { CartaoVideo, LeitorVideo } from "@/components/videos-explicativos";

/** Todos os vídeos explicativos que o admin publicou para quem está a ver. */
export function ComoFuncionaPage() {
  const [aVer, setAVer] = useState<VideoExplicativo | null>(null);
  const { data: videos, isLoading } = useQuery({ queryKey: ["videos", "todos"], queryFn: () => videosApi.listar() });

  // Agrupados pela página a que se referem, pela ordem definida.
  const grupos = LOCAIS_VIDEO.map((l) => ({
    ...l,
    nome: l.valor === "GERAL" ? "Geral" : l.nome,
    videos: (videos ?? []).filter((v) => v.local === l.valor),
  })).filter((g) => g.videos.length > 0);

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-6 sm:px-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Como funciona</h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400">Vídeos curtos que explicam como tirar partido da plataforma.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="size-6 animate-spin text-emerald-500" />
        </div>
      ) : grupos.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 py-16 text-center dark:border-white/[0.08]">
          <PlayCircle className="mx-auto mb-2 size-8 text-gray-300 dark:text-zinc-700" />
          <p className="text-sm text-gray-500 dark:text-zinc-400">Ainda não há vídeos explicativos.</p>
        </div>
      ) : (
        grupos.map((g) => (
          <section key={g.valor} className="space-y-3">
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-400">{g.nome}</h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {g.videos.map((v) => (
                <CartaoVideo key={v.id} video={v} onVer={() => setAVer(v)} />
              ))}
            </div>
          </section>
        ))
      )}

      <LeitorVideo video={aVer} onFechar={() => setAVer(null)} />
    </div>
  );
}
