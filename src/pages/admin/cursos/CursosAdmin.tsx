import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  Plus, Search, Edit, Trash2, ChevronLeft, Check, Loader2,
  X, Hash, BookOpen, Eye, Upload, Image,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cursosApi, type Curso } from "@/api/cursos";
import { ScrollArea } from "@/components/ui/scroll-area";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";

interface CursoForm {
  titulo: string;
  subtitulo: string;
  nivel: string;
  duracao: string;
  preco: number;
  precoOriginal: number;
  idioma: string;
  tags: string[];
  descricao: string;
  capaUrl: string;
  status: "RASCUNHO" | "PUBLICADO";
  mentorNome: string;
  mentorAvatar: string;
}

const emptyForm: CursoForm = {
  titulo: "", subtitulo: "", nivel: "", duracao: "",
  preco: 0, precoOriginal: 0, idioma: "Português", tags: [],
  descricao: "", capaUrl: "", status: "RASCUNHO",
  mentorNome: "", mentorAvatar: "",
};

const levels = ["Iniciante", "Intermédio", "Avançado"];
const tagSuggestions = ["Presencial", "Online", "Certificação", "Projecto", "Estágio", "Mentoria", "Ao Vivo", "Autoguiado"];

function mapCursoToForm(curso: Curso): CursoForm {
  return {
    titulo: curso.titulo,
    subtitulo: curso.subtitulo || "",
    nivel: curso.nivel || "",
    duracao: curso.duracao || "",
    preco: curso.preco,
    precoOriginal: curso.precoOriginal || 0,
    idioma: curso.idioma || "Português",
    tags: curso.tags || [],
    descricao: curso.descricao || "",
    capaUrl: curso.capaUrl || "",
    status: curso.status,
    mentorNome: curso.mentorNome || "",
    mentorAvatar: curso.mentorAvatar || "",
  };
}

export function CursosAdmin() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CursoForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [capaUploading, setCapaUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-cursos"],
    queryFn: () => cursosApi.list({}),
  });

  const cursos = response?.data || [];

  const createMutation = useMutation({
    mutationFn: cursosApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Curso criado! Agora adicione aulas e conteúdos.");
      setShowForm(false);
      setForm(emptyForm);
      navigate(`/admin/cursos/${data.id}`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao criar curso");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Curso> }) =>
      cursosApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Curso atualizado com sucesso!");
      setShowForm(false);
      setForm(emptyForm);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar curso");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: cursosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Curso excluído com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao excluir curso");
    },
  });

  const publishMutation = useMutation({
    mutationFn: cursosApi.publish,
    onSuccess: (_) => {
      queryClient.invalidateQueries({ queryKey: ["admin-cursos"] });
      toast.success("Curso publicado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao publicar curso");
    },
  });

  const filteredCursos = cursos.filter((c) => {
    const matchesSearch =
      c.titulo.toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "todos" ||
      (filterStatus === "PUBLICADO" && c.status === "PUBLICADO") ||
      (filterStatus === "RASCUNHO" && c.status === "RASCUNHO");
    return matchesSearch && matchesStatus;
  });

  const handleSave = () => {
    const payload: Partial<Curso> = {
      titulo: form.titulo,
      subtitulo: form.subtitulo || undefined,
      nivel: form.nivel || undefined,
      duracao: form.duracao || undefined,
      preco: form.preco,
      precoOriginal: form.precoOriginal || undefined,
      idioma: form.idioma || undefined,
      tags: form.tags,
      descricao: form.descricao || undefined,
      capaUrl: form.capaUrl || undefined,
      status: form.status,
      mentorNome: form.mentorNome || undefined,
      mentorAvatar: form.mentorAvatar || undefined,
    };
    if (editingId) {
      updateMutation.mutate({ id: editingId, payload });
    } else {
      createMutation.mutate(payload as any);
    }
  };

  const handleEdit = async (curso: Curso) => {
    setEditingId(curso.id);
    setForm(mapCursoToForm(curso));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm("Tem certeza que deseja excluir este curso?");
    if (ok) deleteMutation.mutate(id);
  };

  const handlePublishToggle = async (curso: Curso) => {
    if (curso.status === "PUBLICADO") return;
    const ok = await confirm("Publicar este curso?");
    if (ok) publishMutation.mutate(curso.id);
  };

  const handleViewDetails = (id: string) => {
    navigate(`/admin/cursos/${id}`);
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const handleCapaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCapaUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const { data } = await api.post("/upload", formData);
      setForm({ ...form, capaUrl: data.url });
      toast.success("Imagem carregada!");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao carregar imagem");
    } finally {
      setCapaUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const addTag = (tag: string) => {
    if (!form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
  };
  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  const renderTags = () => (
    <div className="space-y-2">
      <Label className="text-gray-700 dark:text-zinc-300">Tags</Label>
      <div className="mt-1.5 min-h-[38px] flex flex-wrap gap-1.5 p-2 rounded-lg border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent">
        {form.tags.map((tag) => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
          >
            <Hash size={10} />
            {tag}
            <button type="button" onClick={() => removeTag(tag)} className="hover:text-red-500 transition-colors">
              <X size={12} />
            </button>
          </span>
        ))}
        {form.tags.length === 0 && (
          <span className="text-xs text-gray-400 dark:text-zinc-600 px-1 py-0.5">Adicione tags abaixo</span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 mt-2">
        {tagSuggestions.filter((t) => !form.tags.includes(t)).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => addTag(tag)}
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 hover:bg-gray-200 dark:hover:bg-white/[0.1] transition-colors"
          >
            <Plus size={10} />
            {tag}
          </button>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2">
        <Hash size={14} className="text-gray-400 shrink-0" />
        <input
          placeholder="Digitar tag personalizada..."
          className="flex-1 h-8 bg-transparent text-xs text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              const val = (e.target as HTMLInputElement).value.trim();
              if (val && !form.tags.includes(val)) {
                addTag(val);
                (e.target as HTMLInputElement).value = "";
              }
            }
          }}
        />
      </div>
    </div>
  );

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
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <ChevronLeft size={18} className="text-gray-500 dark:text-zinc-500" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? "Editar Curso" : "Novo Curso"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Preencha os dados do curso</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white" onClick={() => { setShowForm(false); setEditingId(null); setForm(emptyForm); }} disabled={isFormLoading}>
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
                  <Label className="text-gray-700 dark:text-zinc-300">Título do Curso</Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Finanças Pessoais & Investimento"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Subtítulo</Label>
                  <Input
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                    placeholder="Ex: Da poupança inteligente ao primeiro investimento"
                    className="mt-1.5"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Nível</Label>
                    <Select value={form.nivel} onValueChange={(v) => setForm({ ...form, nivel: v })}>
                      <SelectTrigger className="mt-1.5"><SelectValue placeholder="Selecionar" /></SelectTrigger>
                      <SelectContent>
                        {levels.map((l) => <SelectItem key={l} value={l}>{l}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Duração</Label>
                    <Input
                      value={form.duracao}
                      onChange={(e) => setForm({ ...form, duracao: e.target.value })}
                      placeholder="Ex: 12h 20min"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Idioma</Label>
                    <Input
                      value={form.idioma}
                      onChange={(e) => setForm({ ...form, idioma: e.target.value })}
                      placeholder="Ex: Português"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Preço (Kz)</Label>
                    <Input
                      type="number"
                      value={form.preco}
                      onChange={(e) => setForm({ ...form, preco: parseFloat(e.target.value) || 0 })}
                      placeholder="12000"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Preço Original (Kz)</Label>
                    <Input
                      type="number"
                      value={form.precoOriginal}
                      onChange={(e) => setForm({ ...form, precoOriginal: parseFloat(e.target.value) || 0 })}
                      placeholder="24000"
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Instrutor</Label>
                    <Input
                      value={form.mentorNome}
                      onChange={(e) => setForm({ ...form, mentorNome: e.target.value })}
                      placeholder="Ex: Ana Luísa Ferreira"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Avatar URL (opcional)</Label>
                    <Input
                      value={form.mentorAvatar}
                      onChange={(e) => setForm({ ...form, mentorAvatar: e.target.value })}
                      placeholder="URL do avatar..."
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Imagem de Capa</Label>
                  <p className="text-[10px] text-gray-500 dark:text-gray-300 mt-1 mb-2">
                    Tamanho ideal: <strong>1280×720px</strong> (16:9) — máx 2MB
                  </p>
                  <div className="mt-1.5 flex items-start gap-3">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleCapaUpload}
                          className="hidden"
                        />
                          <Button
                            type="button"
                            variant="outline"
                            disabled={capaUploading}
                            onClick={() => fileInputRef.current?.click()}
                            className="flex items-center gap-2 dark:text-white"
                          >
                            {capaUploading ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Upload size={14} />
                            )}
                            {capaUploading ? "A carregar..." : "Carregar imagem"}
                          </Button>
                        <span className="text-xs text-gray-500 dark:text-gray-300">ou URL:</span>
                      </div>
                      <Input
                        value={form.capaUrl}
                        onChange={(e) => setForm({ ...form, capaUrl: e.target.value })}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="mt-1"
                      />
                    </div>
                    {form.capaUrl && (
                      <div className="shrink-0 w-28 h-16 rounded-lg overflow-hidden border border-gray-200 dark:border-white/[0.08] bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center">
                        {form.capaUrl.startsWith("http") || form.capaUrl.startsWith("/uploads") ? (
                          <img
                            src={getUploadUrl(form.capaUrl)}
                            alt="Capa"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).style.display = "none";
                              (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="text-gray-400"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg></div>';
                            }}
                          />
                        ) : (
                          <Image size={20} className="text-gray-300 dark:text-zinc-600" />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Descrição</Label>
                  <RichTextEditor
                    value={form.descricao}
                    onChange={(html) => setForm({ ...form, descricao: html })}
                    placeholder="Descrição do curso..."
                    className="mt-1.5"
                  />
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Configurações</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(v) => setForm({ ...form, status: v as "RASCUNHO" | "PUBLICADO" })}
                      >
                        <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                          <SelectItem value="PUBLICADO">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <BookOpen size={16} /> Tags
                  </h3>
                  {renderTags()}
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
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerir Cursos</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">Adicione, edite ou remova cursos</p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openNewForm} disabled={isLoading}>
                  <Plus size={16} className="mr-2" />Novo Curso
                </Button>
              </div>

              <div className="p-5 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar cursos..." className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="PUBLICADO">Publicados</SelectItem>
                    <SelectItem value="RASCUNHO">Rascunhos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Curso</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Duração</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Aulas</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Alunos</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Preço</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ) : filteredCursos.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-12">
                          <BookOpen size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
                          <p className="text-gray-500 dark:text-zinc-500">Nenhum curso encontrado</p>
                        </td>
                      </tr>
                    ) : (
                      filteredCursos.map((curso) => (
                        <tr
                          key={curso.id}
                          className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        >
                          <td className="px-5 py-4">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">{curso.titulo}</p>
                              {curso.subtitulo && (
                                <p className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[250px]">{curso.subtitulo}</p>
                              )}
                            </div>
                          </td>
                          <td className="px-5 py-4 text-sm text-gray-600 dark:text-zinc-400">{curso.duracao || "-"}</td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{curso.quantAulas}</td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{curso.estudantes}</td>
                          <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{curso.preco.toLocaleString()} Kz</td>
                          <td className="px-5 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              curso.status === "PUBLICADO"
                                ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                : "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400"
                            }`}>
                              {curso.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button onClick={() => handleViewDetails(curso.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]" title="Ver detalhes">
                                <Eye size={14} className="text-emerald-500" />
                              </button>
                              {curso.status === "RASCUNHO" && (
                                <button
                                  onClick={() => handlePublishToggle(curso)}
                                  disabled={publishMutation.isPending}
                                  className="p-1.5 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-500/10 disabled:opacity-50"
                                  title="Publicar"
                                >
                                  {publishMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin text-emerald-500" />
                                  ) : (
                                    <Check size={14} className="text-emerald-500" />
                                  )}
                                </button>
                              )}
                              <button onClick={() => handleEdit(curso)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                                <Edit size={14} className="text-gray-400 dark:text-zinc-500" />
                              </button>
                              <button onClick={() => handleDelete(curso.id)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50">
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

export default CursosAdmin;
