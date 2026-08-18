import { useState, useMemo } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Edit, Trash2, ChevronLeft, Check, Loader2, Video, X,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { novidadesApi, type Novidade } from "@/api/novidades";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";

interface NovidadeForm {
  title: string;
  introduction: string;
  sobre: string;
  description: string;
  destaque: boolean;
  temInscricao: boolean;
  status: string;
  image_url: string;
}

const emptyForm: NovidadeForm = {
  title: "",
  introduction: "",
  sobre: "",
  description: "",
  image_url: "",
  destaque: false,
  temInscricao: false,
  status: "RASCUNHO",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export function NovidadesAdmin() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<NovidadeForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [files, setFiles] = useState<File[]>([]);
  const [coverFileIndex, setCoverFileIndex] = useState<number | null>(null);
  const [coverAnexoPath, setCoverAnexoPath] = useState<string | null>(null);

  const { data: novidades = [], isLoading } = useQuery({
    queryKey: ["admin-novidades"],
    queryFn: () => novidadesApi.list(),
  });

  const createMutation = useMutation({
    mutationFn: (payload: FormData) => novidadesApi.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-novidades"] });
      toast.success("Novidade criada com sucesso!");
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao criar novidade");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) =>
      novidadesApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-novidades"] });
      toast.success("Novidade atualizada com sucesso!");
      closeForm();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar novidade");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: novidadesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-novidades"] });
      toast.success("Novidade removida com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover novidade");
    },
  });

  const filtered = novidades.filter((n) => {
    const matchesSearch = n.title.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "todas" ||
      (filterStatus === "PUBLICADO" && n.status === "PUBLICADO") ||
      (filterStatus === "RASCUNHO" && n.status === "RASCUNHO");
    return matchesSearch && matchesStatus;
  });

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFiles([]);
    setCoverFileIndex(null);
    setCoverAnexoPath(null);
  };

  const handleEdit = (novidade: Novidade) => {
    setEditingId(novidade.id);
    setForm({
      title: novidade.title,
      introduction: novidade.introduction || "",
      sobre: novidade.sobre || "",
      description: novidade.description || "",
      image_url: novidade.image_url || "",
      destaque: novidade.destaque,
      temInscricao: novidade.temInscricao ?? false,
      status: novidade.status,
    });
    setCoverAnexoPath(novidade.image_path || null);
    setShowForm(true);
  };

  const handleSave = () => {
    const payload = new FormData();
    payload.append("title", form.title);
    payload.append("introduction", form.introduction);
    payload.append("sobre", form.sobre);
    payload.append("description", form.description);
    payload.append("destaque", String(form.destaque));
    payload.append("temInscricao", String(form.temInscricao));
    payload.append("status", form.status);
    if (form.image_url) payload.append("image_url", form.image_url);

    if (coverFileIndex !== null) {
      payload.append("coverFileIndex", String(coverFileIndex));
    }

    if (coverAnexoPath && files.length === 0) {
      payload.append("coverFilePath", coverAnexoPath);
    }

    for (const file of files) {
      payload.append("files", file);
    }

    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;
  const { confirm, ConfirmDialog } = useConfirmDialog();

  const filePreviews = useMemo(() => {
    return files.map((file, index) => ({
      index,
      file,
      url: URL.createObjectURL(file),
      isImage: file.type.startsWith("image/"),
      isVideo: file.type.startsWith("video/"),
    }));
  }, [files]);

  const existingAnexos = useMemo(() => {
    if (!editingId) return [];
    const novidade = novidades.find((n) => n.id === editingId);
    return novidade?.anexos || [];
  }, [editingId, novidades]);

  return (
    <div className="p-6">
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden"
          >
            <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button onClick={closeForm} className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]">
                  <ChevronLeft size={18} className="text-gray-500 dark:text-zinc-500" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? "Editar Novidade" : "Nova Novidade"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Preencha os dados da novidade</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white" onClick={closeForm} disabled={isFormLoading}>
                  Cancelar
                </Button>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSave} disabled={isFormLoading}>
                  {isFormLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>

            <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Título</Label>
                  <Input
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Título da novidade"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Introdução (subtítulo)</Label>
                  <Input
                    value={form.introduction}
                    onChange={(e) => setForm({ ...form, introduction: e.target.value })}
                    placeholder="Breve introdução ou subtítulo"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Sobre</Label>
                  <Input
                    value={form.sobre}
                    onChange={(e) => setForm({ ...form, sobre: e.target.value })}
                    placeholder="Sobre o que é esta novidade"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Descrição (conteúdo completo)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    placeholder="Conteúdo completo da novidade..."
                    className="mt-1.5"
                    rows={8}
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Configurações</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">Status</Label>
                      <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                          <SelectItem value="PUBLICADO">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="destaque"
                        checked={form.destaque}
                        onChange={(e) => setForm({ ...form, destaque: e.target.checked })}
                        className="rounded border-gray-300 dark:border-zinc-600 text-emerald-500 focus:ring-emerald-500"
                      />
                      <Label htmlFor="destaque" className="text-gray-700 dark:text-zinc-300 cursor-pointer">
                        Marcar como Destaque
                      </Label>
                    </div>
                    <div className="flex items-center gap-3 pt-3 border-t border-gray-100 dark:border-white/[0.06]">
                      <Switch
                        checked={form.temInscricao}
                        onCheckedChange={(v) => setForm({ ...form, temInscricao: v })}
                      />
                      <div>
                        <Label className="text-gray-700 dark:text-zinc-300 cursor-pointer">
                          Permitir inscrição
                        </Label>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">
                          Usuários podem inscrever-se nesta novidade
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Imagens & Vídeos</h3>

                  {/* Existing anexos (editing mode) */}
                  {existingAnexos.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 dark:text-zinc-500 mb-2 block">Ficheiros existentes</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {existingAnexos.map((anexo) => {
                          const url = getUploadUrl(`/uploads/${anexo.file}`);
                          const isImage = anexo.type === "image";
                          const isCover = coverAnexoPath === anexo.file;
                          return (
                            <div
                              key={anexo.id}
                              onClick={() => {
                                if (anexo.type === "image") {
                                  setCoverAnexoPath(isCover ? null : anexo.file);
                                }
                              }}
                              className={`relative aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-white/[0.06] cursor-pointer border-2 transition-all ${
                                isCover ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent hover:border-white/20"
                              }`}
                            >
                              {isImage ? (
                                <img src={url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Video size={20} className="text-gray-400" />
                                </div>
                              )}
                              {isCover && (
                                <span className="absolute top-1 left-1 text-[8px] font-bold uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                                  Capa
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* New file previews */}
                  {filePreviews.length > 0 && (
                    <div className="mb-4">
                      <Label className="text-xs text-gray-500 dark:text-zinc-500 mb-2 block">Novos ficheiros</Label>
                      <div className="grid grid-cols-3 gap-2">
                        {filePreviews.map((preview) => {
                          const isCover = coverFileIndex === preview.index;
                          return (
                            <div
                              key={preview.index}
                              onClick={() => {
                                if (preview.isImage) {
                                  setCoverFileIndex(isCover ? null : preview.index);
                                  setCoverAnexoPath(null);
                                }
                              }}
                              className={`relative aspect-square rounded-xl overflow-hidden bg-black/5 dark:bg-white/[0.06] cursor-pointer border-2 transition-all ${
                                isCover ? "border-emerald-500 ring-2 ring-emerald-500/30" : "border-transparent hover:border-white/20"
                              }`}
                            >
                              {preview.isImage ? (
                                <img src={preview.url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-black/10 dark:bg-white/[0.04]">
                                  <Video size={24} className="text-gray-400" />
                                </div>
                              )}
                              {isCover && (
                                <span className="absolute top-1 left-1 text-[8px] font-bold uppercase bg-emerald-500 text-white px-1.5 py-0.5 rounded">
                                  Capa
                                </span>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setFiles((prev) => prev.filter((_, i) => i !== preview.index));
                                  if (coverFileIndex === preview.index) setCoverFileIndex(null);
                                }}
                                className="absolute top-1 right-1 w-5 h-5 flex items-center justify-center bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">URL da imagem externa (opcional)</Label>
                      <Input
                        value={form.image_url}
                        onChange={(e) => setForm({ ...form, image_url: e.target.value })}
                        placeholder="https://..."
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">Upload de ficheiros</Label>
                      <label className="flex items-center gap-2 mt-1.5 h-11 px-4 rounded-xl bg-white dark:bg-transparent border border-dashed border-gray-200 dark:border-white/[0.08] cursor-pointer hover:border-emerald-400 transition-colors">
                        <Plus size={14} className="text-gray-400 shrink-0" />
                        <span className="text-xs text-gray-400 truncate">
                          {files.length > 0 ? `${files.length} ficheiro(s)` : "Adicionar imagens e vídeos"}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const newFiles = Array.from(e.target.files || []);
                            setFiles((prev) => [...prev, ...newFiles]);
                          }}
                          className="hidden"
                        />
                      </label>
                      <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-1.5">
                        Clique numa imagem para a definir como capa da novidade
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
              <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerir Novidades</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Publique novidades, destaques e comunicados</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={() => setShowForm(true)} disabled={isLoading}>
                  <Plus size={16} className="mr-2" />Nova Novidade
                </Button>
              </div>

              <div className="p-5 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar novidades..." className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="PUBLICADO">Publicadas</SelectItem>
                    <SelectItem value="RASCUNHO">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Título</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Destaque</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Data</th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ) : filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">

                          <p className="text-gray-500 dark:text-zinc-500">Nenhuma novidade encontrada</p>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((novidade) => (
                        <tr
                          key={novidade.id}
                          className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{novidade.title}</p>
                              {novidade.introduction && (
                                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[300px]">{novidade.introduction}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              novidade.status === "PUBLICADO"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}>
                              {novidade.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                            </span>
                          </td>
                          <td className="px-5 py-4">
                            {novidade.destaque ? (
                              <span className="inline-flex items-center text-xs font-medium text-amber-600 dark:text-amber-400">Sim</span>
                            ) : (
                              <span className="inline-flex items-center text-xs text-gray-400 dark:text-zinc-600">Não</span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-zinc-400">
                            {formatDate(novidade.created_at)}
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleEdit(novidade)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                                <Edit size={14} className="text-gray-400 dark:text-zinc-500" />
                              </button>
                              <button
                                onClick={async () => {
                                  const ok = await confirm("Tem certeza que deseja excluir esta novidade?");
                                  if (ok) {
                                    deleteMutation.mutate(novidade.id);
                                  }
                                }}
                                disabled={deleteMutation.isPending}
                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50"
                              >
                                {deleteMutation.isPending ? (
                                  <Loader2 size={14} className="animate-spin text-red-400" />
                                ) : (
                                  <Trash2 size={14} className="text-red-400 dark:text-red-500" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog />
    </div>
  );
}

export default NovidadesAdmin;