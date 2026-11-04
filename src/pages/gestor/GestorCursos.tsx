import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award, BookOpen, Check, ChevronLeft, Edit, Eye, ImagePlus, Loader2, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { cursosApi, type Curso } from "@/api/cursos";
import { gestorApi, type CursoGestor } from "@/api/gestor";
import { api, getUploadUrl } from "@/lib/axios";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  CursoBolsaSelect, SEM_BOLSA, bolsaIdDoCampo, campoDaBolsaId, erroNoCampoDoCurso,
} from "@/components/curso-bolsa-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EmptyState, Field, IconAction, PageHeader, SearchInput, StatusPill, TagInput, Toolbar,
  faintText, inputClass, primaryButton, selectClass, softText, surface,
} from "./ui";

interface CursoForm {
  titulo: string;
  subtitulo: string;
  categoria: string;
  nivel: string;
  duracao: string;
  preco: string;
  idioma: string;
  tags: string[];
  descricao: string;
  capaUrl: string;
  status: "RASCUNHO" | "PUBLICADO";
  bolsaId: string;
}

const emptyForm: CursoForm = {
  titulo: "", subtitulo: "", categoria: "", nivel: "", duracao: "",
  preco: "", idioma: "Português", tags: [],
  descricao: "", capaUrl: "", status: "RASCUNHO", bolsaId: SEM_BOLSA,
};

const tagSuggestions = ["Presencial", "Online", "Certificação", "Projecto", "Estágio", "Mentoria", "Ao Vivo", "Autoguiado"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(value);

function mapToForm(curso: CursoGestor): CursoForm {
  return {
    titulo: curso.titulo,
    subtitulo: curso.subtitulo || "",
    categoria: curso.categoria || "",
    nivel: curso.nivel || "",
    duracao: curso.duracao || "",
    preco: String(curso.preco ?? ""),
    idioma: curso.idioma || "Português",
    tags: curso.tags || [],
    descricao: curso.descricao || "",
    capaUrl: curso.capaUrl || "",
    status: curso.status,
    bolsaId: campoDaBolsaId(curso.bolsaId),
  };
}

export function GestorCursos({ abrirNovo = false }: { abrirNovo?: boolean }) {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(abrirNovo);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CursoForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("TODOS");
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["gestor-cursos", search, status],
    queryFn: () => gestorApi.listCursos({ search: search || undefined, status }),
  });

  const cursos = data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["gestor-cursos"] });
    queryClient.invalidateQueries({ queryKey: ["gestor-dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: cursosApi.create,
    onSuccess: (data) => {
      invalidate();
      toast.success("Curso criado. Adicione as aulas agora.");
      closeForm();
      navigate(`/gestor/cursos/${data.id}`);
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao criar curso"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Curso> }) => cursosApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Curso atualizado com sucesso");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao atualizar curso"),
  });

  const deleteMutation = useMutation({
    mutationFn: cursosApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Curso excluído");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao excluir curso"),
  });

  const publishMutation = useMutation({
    mutationFn: cursosApi.publish,
    onSuccess: () => {
      invalidate();
      toast.success("Curso publicado com sucesso");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao publicar curso"),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
  };

  const openEdit = (curso: CursoGestor) => {
    setForm(mapToForm(curso));
    setEditingId(curso.id);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    const erro = erroNoCampoDoCurso(form.bolsaId, form.preco);
    if (erro) {
      toast.error(erro);
      return;
    }

    const payload: Partial<Curso> = {
      bolsaId: bolsaIdDoCampo(form.bolsaId),
      titulo: form.titulo,
      subtitulo: form.subtitulo || undefined,
      categoria: form.categoria || undefined,
      nivel: form.nivel || undefined,
      duracao: form.duracao || undefined,
      preco: form.preco ? Number(form.preco) : 0,
      idioma: form.idioma || undefined,
      tags: form.tags,
      descricao: form.descricao || undefined,
      capaUrl: form.capaUrl || undefined,
      status: form.status,
    };

    if (editingId) updateMutation.mutate({ id: editingId, payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Tem certeza que deseja excluir este curso?")) deleteMutation.mutate(id);
  };

  const handlePublish = async (curso: CursoGestor) => {
    if (curso.status === "PUBLICADO") return;
    if (await confirm("Publicar este curso? Os alunos poderão vê-lo e inscrever-se.")) {
      publishMutation.mutate(curso.id);
    }
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const { data } = await api.post("/upload", fd);
      setForm((prev) => ({ ...prev, capaUrl: data.url }));
      toast.success("Imagem carregada");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Erro ao carregar imagem");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <button onClick={closeForm} className="flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200/80 text-zinc-500 transition-colors hover:bg-zinc-100 dark:border-white/[0.08] dark:hover:bg-white/[0.06]">
                  <ChevronLeft size={17} />
                </button>
                <div>
                  <h1 className="text-[22px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                    {editingId ? "Editar curso" : "Novo curso"}
                  </h1>
                  <p className={`text-sm ${softText}`}>Crie o curso e depois adicione as aulas.</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={closeForm} disabled={isSaving} className="rounded-full dark:text-white">
                  Cancelar
                </Button>
                <Button className={primaryButton} onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
                  Guardar
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="space-y-4 lg:col-span-2">
                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Informação principal</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>O essencial para apresentar o curso.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Título">
                      <Input className={inputClass} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Preparação para IELTS" />
                    </Field>
                    <Field label="Subtítulo">
                      <Input className={inputClass} value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} placeholder="Um resumo curto e claro" />
                    </Field>
                    <Field label="Bolsa vinculada (opcional)">
                      <CursoBolsaSelect
                        value={form.bolsaId}
                        onChange={(bolsaId) => setForm({ ...form, bolsaId })}
                        bolsaAtual={cursos.find((c) => c.id === editingId)?.bolsa}
                        triggerClassName={selectClass}
                      />
                    </Field>
                    {form.bolsaId === SEM_BOLSA && (
                      <Field label="Valor do curso (Kz)">
                        <Input className={inputClass} type="number" min={0} value={form.preco} onChange={(e) => setForm({ ...form, preco: e.target.value })} placeholder="Ex: 12000 (0 para gratuito)" />
                      </Field>
                    )}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Categoria">
                        <Input className={inputClass} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Idiomas" />
                      </Field>
                      <Field label="Nível">
                        <Input className={inputClass} value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} placeholder="Iniciante" />
                      </Field>
                      <Field label="Duração">
                        <Input className={inputClass} value={form.duracao} onChange={(e) => setForm({ ...form, duracao: e.target.value })} placeholder="20 horas" />
                      </Field>
                      <Field label="Idioma">
                        <Input className={inputClass} value={form.idioma} onChange={(e) => setForm({ ...form, idioma: e.target.value })} />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Descrição</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Descrição e tags.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Descrição">
                      <Textarea className={`${inputClass} min-h-[120px] py-3`} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="O que os alunos vão aprender..." />
                    </Field>
                    <Field label="Tags">
                      <TagInput value={form.tags} onChange={(tags) => setForm((prev) => ({ ...prev, tags }))} suggestions={tagSuggestions} />
                    </Field>
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publicação</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Visibilidade do curso.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Estado">
                      <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as CursoForm["status"] })}>
                        <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                          <SelectItem value="PUBLICADO">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                </section>

                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Imagem de capa</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Uma imagem transmite confiança.</p>
                  </div>
                  <div className="space-y-3 p-5">
                    {form.capaUrl && (
                      <img
                        src={form.capaUrl.startsWith("http") ? form.capaUrl : getUploadUrl(form.capaUrl)}
                        alt="Capa"
                        className="h-36 w-full rounded-xl border border-zinc-100 object-cover dark:border-white/[0.06]"
                      />
                    )}
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-white/[0.12] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.04]">
                      {uploading ? <Loader2 size={18} className="animate-spin text-emerald-500" /> : <ImagePlus size={18} className="text-zinc-400" />}
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {uploading ? "A carregar..." : "Carregar capa"}
                      </span>
                      <span className={`text-[10px] ${faintText}`}>JPG ou PNG</span>
                      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
                    </label>
                  </div>
                </section>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-5"
          >
            <PageHeader
              title="Meus cursos"
              description="Crie, publique e adicione aulas aos seus cursos."
              action={
                <Button className={primaryButton} onClick={openNew}>
                  <Plus size={16} /> Novo curso
                </Button>
              }
            />

            <Toolbar>
              <SearchInput className="flex-1" value={search} onChange={setSearch} placeholder="Pesquisar cursos" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`${selectClass} w-full sm:w-44`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos</SelectItem>
                  <SelectItem value="PUBLICADO">Publicados</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunhos</SelectItem>
                </SelectContent>
              </Select>
            </Toolbar>

            {isLoading ? (
              <div className="flex items-center justify-center py-24">
                <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
              </div>
            ) : cursos.length === 0 ? (
              <div className={surface}>
                <EmptyState
                  icon={BookOpen}
                  title="Ainda não criou nenhum curso"
                  description="Os seus cursos aparecerão aqui assim que os criar."
                  action={
                    <Button className={primaryButton} onClick={openNew}>
                      <Plus size={15} /> Criar curso
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {cursos.map((curso) => (
                  <div key={curso.id} className={`${surface} group flex flex-col overflow-hidden transition-shadow hover:shadow-md`}>
                    <div className="relative h-40 overflow-hidden bg-zinc-100 dark:bg-white/[0.04]">
                      {curso.capaUrl ? (
                        <img
                          src={curso.capaUrl.startsWith("http") ? curso.capaUrl : getUploadUrl(curso.capaUrl)}
                          alt=""
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-zinc-300 dark:text-zinc-600">
                          <BookOpen size={36} />
                        </div>
                      )}
                      <div className="absolute left-3 top-3">
                        <StatusPill status={curso.status} />
                      </div>
                    </div>

                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="line-clamp-1 text-[14px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                        {curso.titulo}
                      </h3>
                      <p className={`mt-1 line-clamp-2 text-[11px] leading-relaxed ${faintText}`}>
                        {curso.subtitulo || curso.descricao || "Sem descrição"}
                      </p>
                      {curso.bolsa && (
                        <p className="mt-2 flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                          <Award size={12} className="shrink-0" />
                          <span className="truncate">{curso.bolsa.titulo}</span>
                        </p>
                      )}

                      <div className={`mt-3 flex items-center gap-3 text-[11px] ${faintText}`}>
                        <span>{curso.aulas?.length ?? 0} aulas</span>
                        <span className="h-0.5 w-0.5 rounded-full bg-current" />
                        <span>{curso._count?.compras ?? curso.estudantes} estudantes</span>
                      </div>

                      <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/[0.06]">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                          {curso.bolsaId && curso.preco <= 0 ? "Incluído na bolsa" : formatCurrency(curso.preco)}
                        </p>
                        <div className="flex items-center gap-0.5">
                          {curso.status === "RASCUNHO" && (
                            <Button
                              size="sm"
                              className="mr-1 h-7 rounded-full bg-emerald-400 px-3 text-[11px] font-semibold text-emerald-950 hover:bg-emerald-300"
                              onClick={() => handlePublish(curso)}
                              disabled={publishMutation.isPending}
                            >
                              Publicar
                            </Button>
                          )}
                          <IconAction onClick={() => navigate(`/gestor/cursos/${curso.id}`)} icon={Eye} label="Gerir aulas" />
                          <IconAction onClick={() => openEdit(curso)} icon={Edit} label="Editar" />
                          <IconAction onClick={() => handleDelete(curso.id)} icon={Trash2} label="Excluir" danger />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog />
    </div>
  );
}

export default GestorCursos;
