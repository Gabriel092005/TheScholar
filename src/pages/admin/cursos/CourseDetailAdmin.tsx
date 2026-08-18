import { useState, useRef } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  ChevronLeft, PlayCircle, Video, FileText, Clock, Users,
  GraduationCap, Globe, Eye, Youtube, Hash, Loader2, Plus, Trash2, X,
  Upload, Monitor,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { cursosApi, type Aula } from "@/api/cursos";
import { api, getUploadUrl } from "@/lib/axios";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import toast from "react-hot-toast";

function isYoutubeUrl(url?: string) {
  if (!url) return false;
  return url.includes("youtube.com") || url.includes("youtu.be");
}

interface NewAulaForm {
  titulo: string;
  tipo: "VIDEO" | "PDF" | "QUIZ";
  duracao: string;
  gratuito: boolean;
  videoSource: "youtube" | "local";
  videoUrl: string;
  videoLocal: string;
  pdfUrl: string;
}

const emptyAulaForm: NewAulaForm = {
  titulo: "", tipo: "VIDEO", duracao: "10:00",
  gratuito: false, videoSource: "youtube", videoUrl: "", videoLocal: "", pdfUrl: "",
};

export function CourseDetailAdmin() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [novaAula, setNovaAula] = useState<NewAulaForm>(emptyAulaForm);
  const [previewAula, setPreviewAula] = useState<Aula | null>(null);
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const { data: curso, isLoading } = useQuery({
    queryKey: ["admin-curso", id],
    queryFn: () => cursosApi.get(id!),
    enabled: !!id,
  });

  const addAulaMutation = useMutation({
    mutationFn: (payload: Parameters<typeof cursosApi.addAula>[1]) =>
      cursosApi.addAula(id!, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curso", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Aula adicionada com sucesso!");
      setDialogOpen(false);
      setNovaAula(emptyAulaForm);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao adicionar aula");
    },
  });

  const removeAulaMutation = useMutation({
    mutationFn: (aulaId: string) => cursosApi.removeAula(id!, aulaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-curso", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Aula removida com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover aula");
    },
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleUploadLocalVideo = async (file: File) => {
    try {
      setUploading(true);
      const form = new FormData();
      form.append("file", file);
      const { data } = await api.post("/upload", form);
      const path = data.url || data.path || "";
      setNovaAula({ ...novaAula, videoLocal: path });
      toast.success("Vídeo carregado com sucesso!");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erro ao carregar vídeo");
    } finally {
      setUploading(false);
    }
  };

  const handleAddAula = () => {
    if (!novaAula.titulo.trim()) {
      toast.error("O título da aula é obrigatório");
      return;
    }
    addAulaMutation.mutate({
      titulo: novaAula.titulo,
      tipo: novaAula.tipo,
      duracao: novaAula.duracao || undefined,
      gratuito: novaAula.gratuito,
      videoUrl: novaAula.tipo === "VIDEO" && novaAula.videoSource === "youtube" ? novaAula.videoUrl || undefined : undefined,
      videoLocal: novaAula.tipo === "VIDEO" && novaAula.videoSource === "local" ? novaAula.videoLocal || undefined : undefined,
      pdfUrl: novaAula.tipo === "PDF" ? novaAula.pdfUrl || undefined : undefined,
    });
  };

  if (isLoading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!curso) {
    return <Navigate to="/admin/cursos" replace />;
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
        onClick={() => navigate("/admin/cursos")}
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
              {curso.precoOriginal && curso.precoOriginal > curso.preco && (
                <p className="text-sm text-gray-400 dark:text-zinc-600 line-through">{curso.precoOriginal.toLocaleString()} Kz</p>
              )}
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
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
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                <Plus size={14} className="mr-1" />Adicionar Aula
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Nova Aula</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Título da Aula</Label>
                  <Input
                    value={novaAula.titulo}
                    onChange={(e) => setNovaAula({ ...novaAula, titulo: e.target.value })}
                    placeholder="Ex: Introdução às Finanças"
                    className="mt-1.5"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Tipo</Label>
                    <Select
                      value={novaAula.tipo}
                      onValueChange={(v) => setNovaAula({ ...novaAula, tipo: v as NewAulaForm["tipo"] })}
                    >
                      <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="VIDEO">Vídeo</SelectItem>
                        <SelectItem value="PDF">PDF</SelectItem>
                        <SelectItem value="QUIZ">Quiz</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Duração</Label>
                    <Input
                      value={novaAula.duracao}
                      onChange={(e) => setNovaAula({ ...novaAula, duracao: e.target.value })}
                      placeholder="10:00"
                      className="mt-1.5"
                    />
                  </div>
                </div>
                {novaAula.tipo === "VIDEO" && (
                  <>
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">Origem do Vídeo</Label>
                      <div className="flex gap-2 mt-1.5">
                        <button
                          type="button"
                          onClick={() => setNovaAula({ ...novaAula, videoSource: "youtube", videoLocal: "" })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            novaAula.videoSource === "youtube"
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-zinc-400 hover:border-gray-300"
                          }`}
                        >
                          <Youtube size={14} />
                          YouTube
                        </button>
                        <button
                          type="button"
                          onClick={() => setNovaAula({ ...novaAula, videoSource: "local", videoUrl: "" })}
                          className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium border transition-all ${
                            novaAula.videoSource === "local"
                              ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                              : "border-gray-200 dark:border-white/[0.08] text-gray-600 dark:text-zinc-400 hover:border-gray-300"
                          }`}
                        >
                          <Monitor size={14} />
                          Vídeo Local
                        </button>
                      </div>
                    </div>

                    {novaAula.videoSource === "youtube" && (
                      <div>
                        <Label className="text-gray-700 dark:text-zinc-300">URL do Vídeo (YouTube)</Label>
                        <Input
                          value={novaAula.videoUrl}
                          onChange={(e) => setNovaAula({ ...novaAula, videoUrl: e.target.value })}
                          placeholder="https://youtube.com/watch?v=..."
                          className="mt-1.5"
                        />
                      </div>
                    )}

                    {novaAula.videoSource === "local" && (
                      <div>
                        <Label className="text-gray-700 dark:text-zinc-300">Vídeo do Sistema</Label>
                        {novaAula.videoLocal ? (
                          <div className="mt-1.5 flex items-center gap-2 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30">
                            <Monitor size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                            <span className="text-xs text-emerald-700 dark:text-emerald-300 truncate flex-1">
                              {novaAula.videoLocal.split("/").pop() || novaAula.videoLocal}
                            </span>
                            <button
                              type="button"
                              onClick={() => setNovaAula({ ...novaAula, videoLocal: "" })}
                              className="p-1 hover:bg-emerald-200 dark:hover:bg-emerald-500/20 rounded"
                            >
                              <X size={12} className="text-emerald-600 dark:text-emerald-400" />
                            </button>
                          </div>
                        ) : (
                          <div className="mt-1.5">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="video/*"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) handleUploadLocalVideo(file);
                              }}
                              className="hidden"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              disabled={uploading}
                              className="w-full flex items-center justify-center gap-2 px-4 py-6 rounded-lg border-2 border-dashed border-gray-200 dark:border-white/[0.08] text-gray-500 dark:text-zinc-500 hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition-all disabled:opacity-50"
                            >
                              {uploading ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Upload size={16} />
                              )}
                              <span className="text-sm font-medium">
                                {uploading ? "A carregar..." : "Carregar vídeo do computador"}
                              </span>
                            </button>
                            <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1">
                              Formatos suportados: MP4, WebM, AVI
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
                {novaAula.tipo === "PDF" && (
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">URL do PDF</Label>
                    <Input
                      value={novaAula.pdfUrl}
                      onChange={(e) => setNovaAula({ ...novaAula, pdfUrl: e.target.value })}
                      placeholder="URL do arquivo PDF..."
                      className="mt-1.5"
                    />
                  </div>
                )}
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-zinc-300 cursor-pointer pt-2">
                  <input
                    type="checkbox"
                    checked={novaAula.gratuito}
                    onChange={(e) => setNovaAula({ ...novaAula, gratuito: e.target.checked })}
                    className="rounded border-gray-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                  />
                  Aula gratuita (disponível sem compra)
                </label>
                <div className="flex justify-end gap-3 pt-2">
                  <Button className="bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white" onClick={() => { setDialogOpen(false); setNovaAula(emptyAulaForm); }}>
                    Cancelar
                  </Button>
                  <Button
                    className="bg-emerald-500 hover:bg-emerald-600 text-white"
                    onClick={handleAddAula}
                    disabled={addAulaMutation.isPending}
                  >
                    {addAulaMutation.isPending ? <Loader2 size={14} className="mr-1 animate-spin" /> : <Plus size={14} className="mr-1" />}
                    Adicionar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
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
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-50"
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
