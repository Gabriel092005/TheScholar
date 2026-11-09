import { erroNosPacotes, pacotesParaEnvio, pacotesParaFormulario, type PacoteMentoriaForm } from "@/lib/pacotes-mentoria";
import { PacotesMentoriaEditor } from "@/components/pacotes-mentoria-editor";
import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Award, Check, ChevronLeft, Edit, ImagePlus, Loader2, Plus, Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { gestorApi, type BolsaGestor } from "@/api/gestor";
import { getUploadUrl } from "@/lib/axios";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  EmptyState, Field, IconAction, PageHeader, SearchInput, StatusPill, Toolbar,
  faintText, inputClass, primaryButton, selectClass, softText, surface,
} from "./ui";

interface BolsaForm {
  titulo: string;
  subtitulo: string;
  categoria: string;
  instituicao: string;
  pais: string;
  nivel: string;
  requisitos: string;
  valor: string;
  moeda: string;
  precoInscricao: string;
  precoConsultoria: string;
  precoMentoria: string;
  pacotesMentoria: PacoteMentoriaForm[];
  idioma: string;
  tags: string;
  descricao: string;
  linkAplicar: string;
  prazo: string;
  numeroVagas: string;
  status: "RASCUNHO" | "PUBLICADA" | "INATIVA";
}

const emptyForm: BolsaForm = {
  titulo: "", subtitulo: "", categoria: "", instituicao: "", pais: "",
  nivel: "", requisitos: "", valor: "", moeda: "AOA", precoInscricao: "",
  precoConsultoria: "", precoMentoria: "", pacotesMentoria: [], idioma: "", tags: "",
  descricao: "", linkAplicar: "", prazo: "", numeroVagas: "", status: "RASCUNHO",
};

function formatDate(value?: string | null): string {
  if (!value) return "—";
  const date = new Date(value.length <= 10 ? `${value}T00:00:00` : value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function mapToForm(bolsa: BolsaGestor): BolsaForm {
  return {
    titulo: bolsa.titulo,
    subtitulo: bolsa.subtitulo || "",
    categoria: bolsa.categoria || "",
    instituicao: bolsa.instituicao || "",
    pais: bolsa.pais || "",
    nivel: bolsa.nivel || "",
    requisitos: bolsa.requisitos || "",
    valor: String(bolsa.valor ?? ""),
    moeda: bolsa.moeda || "AOA",
    precoInscricao: bolsa.precoInscricao != null ? String(bolsa.precoInscricao) : "",
    precoConsultoria: bolsa.precoConsultoria != null ? String(bolsa.precoConsultoria) : "",
    precoMentoria: bolsa.precoMentoria != null ? String(bolsa.precoMentoria) : "",
    pacotesMentoria: pacotesParaFormulario(bolsa.pacotesMentoria),
    idioma: bolsa.idioma || "",
    tags: (bolsa.tags || []).join(", "),
    descricao: bolsa.descricao || "",
    linkAplicar: bolsa.linkAplicar || "",
    prazo: bolsa.prazo ? String(bolsa.prazo).slice(0, 10) : "",
    numeroVagas: bolsa.numeroVagas != null ? String(bolsa.numeroVagas) : "",
    status: bolsa.status,
  };
}

export function GestorBolsas() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<BolsaForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("TODAS");
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["gestor-bolsas", search, status],
    queryFn: () => gestorApi.listBolsas({ search: search || undefined, status }),
  });

  const bolsas = data?.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["gestor-bolsas"] });
    queryClient.invalidateQueries({ queryKey: ["gestor-dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: bolsasApi.create,
    onSuccess: () => {
      invalidate();
      toast.success("Bolsa criada com sucesso");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao criar bolsa"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData | Partial<Bolsa> }) => bolsasApi.update(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Bolsa atualizada com sucesso");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao atualizar bolsa"),
  });

  const deleteMutation = useMutation({
    mutationFn: bolsasApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Bolsa excluída");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao excluir bolsa"),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const closeForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditingId(null);
    setFile(null);
    setShowForm(true);
  };

  const openEdit = (bolsa: BolsaGestor) => {
    setForm(mapToForm(bolsa));
    setEditingId(bolsa.id);
    setFile(null);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }

    const erroPacotes = erroNosPacotes(form.pacotesMentoria, form.precoMentoria);
    if (erroPacotes) {
      toast.error(erroPacotes);
      return;
    }

    const fd = new FormData();
    const { pacotesMentoria, ...campos } = form;
    Object.entries(campos).forEach(([key, value]) => {
      if (value !== "") fd.append(key, String(value));
    });
    fd.append("pacotesMentoria", pacotesParaEnvio(pacotesMentoria));
    if (file) fd.append("imagemBg", file);

    if (editingId) updateMutation.mutate({ id: editingId, payload: fd });
    else createMutation.mutate(fd);
  };

  const handleDelete = async (id: string) => {
    if (await confirm("Tem certeza que deseja excluir esta bolsa?")) {
      deleteMutation.mutate(id);
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
                    {editingId ? "Editar bolsa" : "Nova bolsa"}
                  </h1>
                  <p className={`text-sm ${softText}`}>Preencha os detalhes e publique quando estiver pronto.</p>
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
                    <p className={`mt-0.5 text-xs ${faintText}`}>O essencial para identificar a bolsa.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Título">
                      <Input className={inputClass} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Bolsa de Mérito Académico 2026" />
                    </Field>
                    <Field label="Subtítulo">
                      <Input className={inputClass} value={form.subtitulo} onChange={(e) => setForm({ ...form, subtitulo: e.target.value })} placeholder="Um resumo curto e claro" />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="Instituição">
                        <Input className={inputClass} value={form.instituicao} onChange={(e) => setForm({ ...form, instituicao: e.target.value })} placeholder="Universidade de Coimbra" />
                      </Field>
                      <Field label="País">
                        <Input className={inputClass} value={form.pais} onChange={(e) => setForm({ ...form, pais: e.target.value })} placeholder="Portugal" />
                      </Field>
                      <Field label="Categoria">
                        <Input className={inputClass} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Internacional" />
                      </Field>
                      <Field label="Nível">
                        <Input className={inputClass} value={form.nivel} onChange={(e) => setForm({ ...form, nivel: e.target.value })} placeholder="Mestrado" />
                      </Field>
                    </div>
                  </div>
                </section>

                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Detalhes</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Descrição, requisitos e valores.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Descrição">
                      <Textarea className={`${inputClass} min-h-[120px] py-3`} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Benefícios, condições e tudo o que o candidato precisa de saber." />
                    </Field>
                    <Field label="Requisitos">
                      <Textarea className={`${inputClass} min-h-[90px] py-3`} value={form.requisitos} onChange={(e) => setForm({ ...form, requisitos: e.target.value })} placeholder="Um requisito por linha" />
                    </Field>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Valor">
                        <Input className={inputClass} type="number" value={form.valor} onChange={(e) => setForm({ ...form, valor: e.target.value })} placeholder="0" />
                      </Field>
                      <Field label="Moeda">
                        <Input className={inputClass} value={form.moeda} onChange={(e) => setForm({ ...form, moeda: e.target.value })} placeholder="AOA" />
                      </Field>
                      <Field label="Vagas">
                        <Input className={inputClass} type="number" value={form.numeroVagas} onChange={(e) => setForm({ ...form, numeroVagas: e.target.value })} placeholder="Sem limite" />
                      </Field>
                    </div>
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                      <Field label="Inscrição">
                        <Input className={inputClass} type="number" value={form.precoInscricao} onChange={(e) => setForm({ ...form, precoInscricao: e.target.value })} />
                      </Field>
                      <Field label="Consultoria">
                        <Input className={inputClass} type="number" value={form.precoConsultoria} onChange={(e) => setForm({ ...form, precoConsultoria: e.target.value })} />
                      </Field>
                      <Field label="Mentoria">
                        <Input className={inputClass} type="number" value={form.precoMentoria} onChange={(e) => setForm({ ...form, precoMentoria: e.target.value })} />
                      </Field>
                    </div>
                    <PacotesMentoriaEditor
                      precoBase={form.precoMentoria}
                      pacotes={form.pacotesMentoria}
                      onChange={(pacotesMentoria) => setForm({ ...form, pacotesMentoria })}
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-4">
                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Publicação</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Visibilidade e datas.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Estado">
                      <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as BolsaForm["status"] })}>
                        <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                          <SelectItem value="PUBLICADA">Publicada</SelectItem>
                          <SelectItem value="INATIVA">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                    <Field label="Prazo">
                      <Input className={`${inputClass} dark:[color-scheme:dark]`} type="date" value={form.prazo} onChange={(e) => setForm({ ...form, prazo: e.target.value })} />
                    </Field>
                    <Field label="Idioma">
                      <Input className={inputClass} value={form.idioma} onChange={(e) => setForm({ ...form, idioma: e.target.value })} placeholder="Português" />
                    </Field>
                    <Field label="Link para aplicar">
                      <Input className={inputClass} value={form.linkAplicar} onChange={(e) => setForm({ ...form, linkAplicar: e.target.value })} placeholder="https://..." />
                    </Field>
                  </div>
                </section>

                <section className={surface}>
                  <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                    <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Mídia e tags</h2>
                    <p className={`mt-0.5 text-xs ${faintText}`}>Imagem de capa e palavras-chave.</p>
                  </div>
                  <div className="space-y-4 p-5">
                    <Field label="Tags">
                      <Input className={inputClass} value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="Integral, Europa, Mestrado" />
                      <p className={`mt-1.5 text-[11px] ${faintText}`}>Separe as tags por vírgulas.</p>
                    </Field>

                    <div>
                      <p className="text-[11px] font-medium uppercase tracking-[0.1em] text-zinc-500 dark:text-zinc-400">
                        Imagem de capa
                      </p>
                      <label className="mt-2 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-6 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-white/[0.12] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.04]">
                        <ImagePlus size={18} className="text-zinc-400" />
                        <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                          {file ? file.name : "Selecionar imagem"}
                        </span>
                        <span className={`text-[10px] ${faintText}`}>JPG ou PNG</span>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={(e) => setFile(e.target.files?.[0] || null)}
                          className="hidden"
                        />
                      </label>
                    </div>
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
              title="Minhas bolsas"
              description="Crie, edite e publique as suas bolsas de estudo."
              action={
                <Button className={primaryButton} onClick={openNew}>
                  <Plus size={16} /> Nova bolsa
                </Button>
              }
            />

            <Toolbar>
              <SearchInput className="flex-1" value={search} onChange={setSearch} placeholder="Pesquisar por título, instituição ou país" />
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className={`${selectClass} w-full sm:w-44`}><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODAS">Todas</SelectItem>
                  <SelectItem value="PUBLICADA">Publicadas</SelectItem>
                  <SelectItem value="RASCUNHO">Rascunhos</SelectItem>
                  <SelectItem value="INATIVA">Inativas</SelectItem>
                </SelectContent>
              </Select>
            </Toolbar>

            <div className={`${surface} overflow-hidden`}>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[860px]">
                  <thead>
                    <tr className="bg-zinc-50/70 dark:bg-white/[0.02]">
                      {["Bolsa", "País", "Prazo", "Inscrições", "Faturado", "Estado", ""].map((header) => (
                        <th
                          key={header}
                          className={`px-5 py-3 text-left text-[10px] font-medium uppercase tracking-[0.14em] ${faintText} ${header === "" ? "text-right" : ""}`}
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={7} className="py-16 text-center">
                          <Loader2 className="mx-auto h-6 w-6 animate-spin text-emerald-500" />
                        </td>
                      </tr>
                    ) : bolsas.length === 0 ? (
                      <tr>
                        <td colSpan={7}>
                          <EmptyState
                            icon={Award}
                            title="Nenhuma bolsa encontrada"
                            description={search ? "Tente ajustar a pesquisa ou os filtros." : "Crie a sua primeira bolsa para começar."}
                            action={
                              !search ? (
                                <Button className={primaryButton} onClick={openNew}>
                                  <Plus size={15} /> Criar bolsa
                                </Button>
                              ) : undefined
                            }
                          />
                        </td>
                      </tr>
                    ) : (
                      bolsas.map((bolsa) => (
                        <tr key={bolsa.id} className="border-t border-zinc-100 transition-colors hover:bg-zinc-50/70 dark:border-white/[0.05] dark:hover:bg-white/[0.02]">
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              {bolsa.imagemBg ? (
                                <img
                                  src={bolsa.imagemBg.startsWith("http") ? bolsa.imagemBg : getUploadUrl(`/uploads/${bolsa.imagemBg}`)}
                                  alt=""
                                  className="h-10 w-10 rounded-xl object-cover"
                                />
                              ) : (
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-white/[0.05] dark:text-zinc-500">
                                  <Award size={16} />
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="max-w-[260px] truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                                  {bolsa.titulo}
                                </p>
                                <p className={`max-w-[260px] truncate text-[11px] ${faintText}`}>
                                  {bolsa.instituicao || bolsa.subtitulo || "Sem descrição"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className={`px-5 py-3.5 text-[13px] ${softText}`}>{bolsa.pais || "—"}</td>
                          <td className={`px-5 py-3.5 text-[13px] tabular-nums ${softText}`}>
                            {formatDate(bolsa.prazo)}
                          </td>
                          <td className="px-5 py-3.5 text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                            {bolsa._count?.inscricoes ?? 0}
                          </td>
                          <td className="whitespace-nowrap px-5 py-3.5 text-[13px] font-medium tabular-nums text-zinc-800 dark:text-zinc-200">
                            {(bolsa.faturado ?? 0).toLocaleString("pt-PT", { maximumFractionDigits: 2 })} Kz
                          </td>
                          <td className="px-5 py-3.5">
                            <StatusPill status={bolsa.status} />
                          </td>
                          <td className="px-5 py-3.5">
                            <div className="flex items-center justify-end gap-0.5">
                              <IconAction onClick={() => openEdit(bolsa)} icon={Edit} label="Editar" />
                              <IconAction onClick={() => handleDelete(bolsa.id)} icon={Trash2} label="Excluir" danger disabled={deleteMutation.isPending} />
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <ConfirmDialog />
    </div>
  );
}

export default GestorBolsas;
