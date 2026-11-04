import { useState } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft, PlayCircle, Video, FileText, Clock, Users,
  GraduationCap, Globe, Eye, Youtube, Hash, Loader2, Plus, Trash2,
  Monitor, Award,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { cursosApi, type Aula } from "@/api/cursos";
import { getUploadUrl } from "@/lib/axios";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { toast } from "sonner";
import { NovaAulaDialog } from "./NovaAulaDialog";

function isYoutubeUrl(url?: string) {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

export function CourseDetailAdmin({ basePath = "/admin/cursos" }: { basePath?: string } = {}) {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [previewAula, setPreviewAula] = useState<Aula | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const { data: curso, isLoading } = useQuery({
    queryKey: ["admin-curso", id],
    queryFn: () => cursosApi.get(id!),
    enabled: !!id,
  });

  const removeAulaMutation = useMutation({
    mutationFn: (aulaId: string) => cursosApi.removeAula(id!, aulaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curso", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      queryClient.invalidateQueries({ queryKey: ["gestor-cursos"] });
      toast.success("Aula removida com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover aula");
    },
  });

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!curso) {
    return <Navigate to={basePath} replace />;
  }

  const aulas = curso.aulas || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="p-6 max-w-5xl mx-auto"
    >
      <Button
        variant="ghost"
        onClick={() => navigate(basePath)}
        className="mb-6 text-gray-600 dark:text-zinc-400 hover:text-gray-900 dark:hover:text-white"
      >
        <ChevronLeft size={18} className="mr-1" />
        Voltar aos Cursos
      </Button>

      <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="relative h-48 bg-gradient-to-r from-emerald-500 to-teal-600">
          <div className="absolute inset-0 flex items-center justify-center">
            <GraduationCap size={64} className="text-white/30" />
          </div>
          <div className="absolute bottom-6 left-6 right-6">
            <span className={`inline-flex px-3 py-1 text-xs font-medium rounded-full ${
              curso.status === "PUBLICADO"
                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
            }`}>
              {curso.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
            </span>
          </div>
        </div>

        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{curso.titulo}</h1>
              {curso.subtitulo && (
                <p className="text-gray-500 dark:text-zinc-500 mt-1">{curso.subtitulo}</p>
              )}
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{curso.preco.toLocaleString()} Kz</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 mb-6 text-sm text-gray-600 dark:text-zinc-400">
            {curso.duracao && (
              <div className="flex items-center gap-2">
                <Clock size={16} />
                <span>{curso.duracao}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <PlayCircle size={16} />
              <span>{curso.quantAulas} aulas</span>
            </div>
            <div className="flex items-center gap-2">
              <Users size={16} />
              <span>{curso.estudantes} alunos</span>
            </div>
            {curso.idioma && (
              <div className="flex items-center gap-2">
                <Globe size={16} />
                <span>{curso.idioma}</span>
              </div>
            )}
            {curso.nivel && (
              <div className="flex items-center gap-2">
                <GraduationCap size={16} />
                <span>{curso.nivel}</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Bolsa vinculada</h3>
              {curso.bolsa ? (
                <p className="flex items-center gap-1.5 text-gray-600 dark:text-zinc-400">
                  <Award size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                  <span className="truncate">{curso.bolsa.titulo}</span>
                </p>
              ) : (
                <p className="text-gray-400 dark:text-zinc-600">Curso independente</p>
              )}
            </div>
            <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Categoria</h3>
              <p className="text-gray-600 dark:text-zinc-400">{curso.categoria}</p>
            </div>
            <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Mentor</h3>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white text-sm font-medium">
                  {curso.mentorNome?.charAt(0) || "?"}
                </div>
                <span className="text-gray-600 dark:text-zinc-400">{curso.mentorNome || "—"}</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Tags</h3>
              <div className="flex flex-wrap gap-1">
                {(curso.tags || []).map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-white dark:bg-white/[0.06] rounded-full text-gray-600 dark:text-zinc-400">
                    <Hash size={10} />
                    {tag}
                  </span>
                ))}
                {(!curso.tags || curso.tags.length === 0) && (
                  <span className="text-xs text-gray-400 dark:text-zinc-600">Nenhuma tag</span>
                )}
              </div>
            </div>
          </div>

          {curso.descricao && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Descrição</h3>
              <div className="prose prose-sm dark:prose-invert max-w-none text-gray-600 dark:text-zinc-400" dangerouslySetInnerHTML={{ __html: curso.descricao }} />
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <PlayCircle size={20} />
            Aulas do Curso ({aulas.length})
          </h2>
          <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setDialogOpen(true)}>
            <Plus size={14} className="mr-1" />Adicionar Aula
          </Button>
          <NovaAulaDialog cursoId={id!} totalAulas={aulas.length} open={dialogOpen} onOpenChange={setDialogOpen} />
        </div>

        {aulas.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-zinc-500">
            <Video size={40} className="mx-auto mb-3 opacity-30" />
            <p>Nenhuma aula adicionada ainda.</p>
            <p className="text-xs mt-1">Clique em "Adicionar Aula" para começar.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-white/[0.05]">
            {aulas.map((aula, idx) => (
              <div
                key={aula.id}
                className="p-4 flex items-center gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.03] group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center shrink-0">
                  {aula.tipo === "VIDEO" && isYoutubeUrl(aula.videoUrl) && (
                    <Youtube size={18} className="text-red-500" />
                  )}
                  {aula.tipo === "VIDEO" && !isYoutubeUrl(aula.videoUrl) && (
                    <Video size={18} className="text-emerald-500" />
                  )}
                  {aula.tipo === "PDF" && <FileText size={18} className="text-blue-500" />}
                  {aula.tipo === "QUIZ" && <FileText size={18} className="text-amber-500" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 dark:text-zinc-600 w-5">{idx + 1}.</span>
                    <p className="font-medium text-gray-900 dark:text-white truncate">{aula.titulo}</p>
                    {aula.gratuito && (
                      <span className="px-2 py-0.5 text-xs bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-full">
                        Grátis
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500 dark:text-zinc-500">
                    {aula.duracao && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {aula.duracao}
                      </span>
                    )}
                    <span>{aula.tipo === "VIDEO" ? "Vídeo" : aula.tipo === "PDF" ? "PDF" : "Quiz"}</span>
                    {aula.tipo === "VIDEO" && aula.videoUrl && isYoutubeUrl(aula.videoUrl) && (
                      <span className="flex items-center gap-1 text-red-500">
                        <Youtube size={12} />
                        YouTube
                      </span>
                    )}
                    {aula.tipo === "VIDEO" && aula.videoLocal && !isYoutubeUrl(aula.videoUrl) && (
                      <span className="flex items-center gap-1 text-emerald-500">
                        <Monitor size={12} />
                        Local
                      </span>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {aula.tipo === "VIDEO" && (aula.videoUrl || aula.videoLocal) && (
                    <Button size="sm" variant="outline" onClick={() => setPreviewAula(aula)} className="bg-white dark:bg-[#111113] text-gray-900 dark:text-white border-gray-200 dark:border-white/[0.08] hover:bg-gray-50 dark:hover:bg-[#111113] hover:text-gray-900 dark:hover:text-white">
                      <PlayCircle size={14} className="mr-1" />
                      Assistir
                    </Button>
                  )}
                  {aula.tipo === "PDF" && aula.pdfUrl && (
                    <Button size="sm" variant="outline" onClick={() => {
                      const url = aula.pdfUrl!.startsWith("/uploads/") ? getUploadUrl(aula.pdfUrl) : aula.pdfUrl!;
                      window.open(url, "_blank");
                    }}>
                      <Eye size={14} className="mr-1" />
                      Ver PDF
                    </Button>
                  )}
                  <button
                    type="button"
                    onClick={async () => {
                      const ok = await confirm(`Remover a aula "${aula.titulo}"?`);
                      if (ok) {
                        removeAulaMutation.mutate(aula.id);
                      }
                    }}
                    disabled={removeAulaMutation.isPending}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover:opacity-100 focus-visible:opacity-100 transition-opacity disabled:opacity-50"
                  >
                    {removeAulaMutation.isPending ? (
                      <Loader2 size={14} className="animate-spin text-red-400" />
                    ) : (
                      <Trash2 size={14} className="text-red-400" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Preview Dialog ── */}
      <Dialog open={!!previewAula} onOpenChange={(open) => { if (!open) setPreviewAula(null); }}>
        <DialogContent className="sm:max-w-4xl bg-white dark:bg-[#111113]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-gray-900 dark:text-white">
              {previewAula?.tipo === "VIDEO" && previewAula?.videoUrl && isYoutubeUrl(previewAula.videoUrl) && <Youtube size={18} className="text-red-500" />}
              {previewAula?.tipo === "VIDEO" && previewAula?.videoLocal && <Video size={18} className="text-emerald-500" />}
              {previewAula?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            <AspectRatio ratio={16 / 9} className="bg-black rounded-lg overflow-hidden">
              {previewAula?.tipo === "VIDEO" && previewAula?.videoUrl && isYoutubeUrl(previewAula.videoUrl) && (
                <iframe
                  src={previewAula.videoUrl}
                  title={previewAula.titulo}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              )}
              {previewAula?.tipo === "VIDEO" && previewAula?.videoLocal && (
                <video
                  src={getUploadUrl(previewAula.videoLocal)}
                  controls
                  autoPlay
                  className="w-full h-full object-contain"
                />
              )}
            </AspectRatio>
          </div>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </motion.div>
  );
}

export default CourseDetailAdmin;
