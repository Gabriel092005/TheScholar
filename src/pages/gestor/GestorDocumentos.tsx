import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check, ChevronLeft, Download, Edit, FileText, Loader2, Plus, Trash2, Upload,
} from "lucide-react";
import { toast } from "sonner";
import { gestorApi, type Documento, type DocumentoGestor } from "@/api/gestor";
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

interface DocumentoForm {
  titulo: string;
  descricao: string;
  categoria: string;
  status: "RASCUNHO" | "PUBLICADO";
  preco: string;
  bolsaId: string;
}

// O Select não aceita um valor vazio.
const SEM_BOLSA = "none";

const emptyForm: DocumentoForm = {
  titulo: "", descricao: "", categoria: "", status: "RASCUNHO", preco: "", bolsaId: SEM_BOLSA,
};

// O valor mínimo aceite pela MoMenu (VALOR_MINIMO_MOMENU na API).
const PRECO_MINIMO = 100;

const formatPreco = (preco: number) => `${preco.toLocaleString("pt-PT")} Kz`;

const formatSize = (bytes?: number | null) => {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function GestorDocumentos() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<DocumentoGestor | null>(null);
  const [form, setForm] = useState<DocumentoForm>(emptyForm);
  const [file, setFile] = useState<File | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("TODOS");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["gestor-documentos", search, status],
    queryFn: () => gestorApi.listDocumentos({ search: search || undefined, status }),
  });

  const documentos = data?.data || [];

  const { data: bolsasData } = useQuery({
    queryKey: ["gestor-bolsas-select"],
    queryFn: () => gestorApi.listBolsas({ limit: 100 }),
    enabled: showForm,
  });
  // A bolsa atual fica na lista mesmo que não venha nesta página de resultados.
  const opcoesBolsa = [
    ...(editing?.bolsa && !bolsasData?.data.some((b) => b.id === editing.bolsa?.id) ? [editing.bolsa] : []),
    ...(bolsasData?.data ?? []),
  ];
  const temBolsa = form.bolsaId !== SEM_BOLSA;

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["gestor-documentos"] });
    queryClient.invalidateQueries({ queryKey: ["gestor-dashboard"] });
  };

  const createMutation = useMutation({
    mutationFn: gestorApi.createDocumento,
    onSuccess: () => {
      invalidate();
      toast.success("Documento criado com sucesso");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao criar documento"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: FormData }) => gestorApi.updateDocumento(id, payload),
    onSuccess: () => {
      invalidate();
      toast.success("Documento atualizado com sucesso");
      closeForm();
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao atualizar documento"),
  });

  const deleteMutation = useMutation({
    mutationFn: gestorApi.deleteDocumento,
    onSuccess: () => {
      invalidate();
      toast.success("Documento excluído");
    },
    onError: (err: any) => toast.error(err.response?.data?.message || "Erro ao excluir documento"),
  });

  const isSaving = createMutation.isPending || updateMutation.isPending;

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(emptyForm);
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openNew = () => {
    setForm(emptyForm);
    setEditing(null);
    setFile(null);
    setShowForm(true);
  };

  const abrirFicheiro = (documento: Documento) => {
    gestorApi.abrirDocumento(documento).catch(() => toast.error("Não foi possível abrir o documento"));
  };

  const openEdit = (documento: DocumentoGestor) => {
    setForm({
      titulo: documento.titulo,
      descricao: documento.descricao || "",
      categoria: documento.categoria || "",
      status: documento.status,
      preco: documento.preco > 0 ? String(documento.preco) : "",
      bolsaId: documento.bolsaId ?? SEM_BOLSA,
    });
    setEditing(documento);
    setFile(null);
    setShowForm(true);
  };

  const handleSave = () => {
    if (!form.titulo.trim()) {
      toast.error("O título é obrigatório");
      return;
    }
    if (!editing && !file) {
      toast.error("Selecione o ficheiro a carregar");
      return;
    }
    const preco = Number(form.preco || 0);
    if (!Number.isFinite(preco) || preco < 0 || (preco > 0 && preco < PRECO_MINIMO)) {
      toast.error(`O preço mínimo é de ${PRECO_MINIMO} Kz. Para oferecer o documento, deixe em branco.`);
      return;
    }

    const fd = new FormData();
    fd.append("preco", String(preco));
    fd.append("titulo", form.titulo);
    if (form.descricao) fd.append("descricao", form.descricao);
    if (form.categoria) fd.append("categoria", form.categoria);
    fd.append("status", form.status);
    fd.append("bolsaId", temBolsa ? form.bolsaId : "");
    if (file) fd.append("arquivo", file);

    if (editing) updateMutation.mutate({ id: editing.id, payload: fd });
    else createMutation.mutate(fd);
  };

  const handleDelete = async (documento: Documento) => {
    if (await confirm(`Tem certeza que deseja excluir "${documento.titulo}"?`)) {
      deleteMutation.mutate(documento.id);
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
                    {editing ? "Editar documento" : "Novo documento"}
                  </h1>
                  <p className={`text-sm ${softText}`}>Carregue guias, editais e outros materiais.</p>
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

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <section className={surface}>
                <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Informação</h2>
                  <p className={`mt-0.5 text-xs ${faintText}`}>Como o documento aparece na plataforma.</p>
                </div>
                <div className="space-y-4 p-5">
                  <Field label="Título">
                    <Input className={inputClass} value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} placeholder="Guia de candidatura 2026" />
                  </Field>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Field label="Categoria">
                      <Input className={inputClass} value={form.categoria} onChange={(e) => setForm({ ...form, categoria: e.target.value })} placeholder="Guias" />
                    </Field>
                    <Field label="Estado">
                      <Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as DocumentoForm["status"] })}>
                        <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RASCUNHO">Rascunho</SelectItem>
                          <SelectItem value="PUBLICADO">Publicado</SelectItem>
                        </SelectContent>
                      </Select>
                    </Field>
                  </div>
                  <Field label="Bolsa">
                    <Select
                      value={form.bolsaId}
                      // Um documento de bolsa vem com a mentoria, por isso não tem preço próprio.
                      onValueChange={(value) =>
                        setForm({ ...form, bolsaId: value, preco: value === SEM_BOLSA ? form.preco : "" })
                      }
                    >
                      <SelectTrigger className={selectClass}><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SEM_BOLSA}>Nenhuma (documento geral)</SelectItem>
                        {opcoesBolsa.map((bolsa) => (
                          <SelectItem key={bolsa.id} value={bolsa.id}>{bolsa.titulo}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className={`mt-1.5 text-[11px] ${faintText}`}>
                      {temBolsa
                        ? "Só quem tiver a mentoria ativa desta bolsa consegue ver e abrir o documento."
                        : "Fica disponível para todos os estudantes, gratuito ou à venda."}
                    </p>
                  </Field>
                  {!temBolsa && (
                    <Field label="Preço (Kz)">
                      <Input
                        className={inputClass}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        value={form.preco}
                        onChange={(e) => setForm({ ...form, preco: e.target.value })}
                        placeholder="Em branco para gratuito"
                      />
                      <p className={`mt-1.5 text-[11px] ${faintText}`}>
                        Com preço, só quem pagar consegue abrir o ficheiro. Mínimo de {PRECO_MINIMO} Kz.
                      </p>
                    </Field>
                  )}
                  <Field label="Descrição">
                    <Textarea className={`${inputClass} min-h-[110px] py-3`} value={form.descricao} onChange={(e) => setForm({ ...form, descricao: e.target.value })} placeholder="Breve descrição do conteúdo do documento" />
                  </Field>
                </div>
              </section>

              <section className={surface}>
                <div className="border-b border-zinc-100 px-5 py-4 dark:border-white/[0.06]">
                  <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Ficheiro</h2>
                  <p className={`mt-0.5 text-xs ${faintText}`}>PDF, DOC ou imagem.</p>
                </div>
                <div className="space-y-4 p-5">
                  <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-zinc-300 px-4 py-10 text-center transition-colors hover:border-emerald-400 hover:bg-emerald-50/40 dark:border-white/[0.12] dark:hover:border-emerald-500/40 dark:hover:bg-emerald-500/[0.04]">
                    <Upload size={20} className="text-zinc-400" />
                    <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                      {file ? file.name : editing ? "Substituir ficheiro (opcional)" : "Selecionar ficheiro"}
                    </span>
                    <span className={`text-[10px] ${faintText}`}>Até 10 MB</span>
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => setFile(e.target.files?.[0] || null)}
                    />
                  </label>

                  {editing && (
                    <div className="flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-white/[0.03]">
                      <FileText size={16} className="shrink-0 text-zinc-400" />
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-[11px] ${faintText}`}>Ficheiro atual</p>
                        <button
                          type="button"
                          onClick={() => abrirFicheiro(editing)}
                          className="block max-w-full truncate text-xs font-medium text-emerald-600 hover:underline dark:text-emerald-400"
                        >
                          {editing.fileName || "Ver documento"}
                        </button>
                      </div>
                      <span className={`shrink-0 text-[10px] ${faintText}`}>{formatSize(editing.fileSize)}</span>
                    </div>
                  )}
                </div>
              </section>
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
              title="Documentos"
              description="Publique materiais para os estudantes, gratuitos ou à venda."
              action={
                <Button className={primaryButton} onClick={openNew}>
                  <Plus size={16} /> Novo documento
                </Button>
              }
            />

            <Toolbar>
              <SearchInput className="flex-1" value={search} onChange={setSearch} placeholder="Pesquisar documentos" />
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
            ) : documentos.length === 0 ? (
              <div className={surface}>
                <EmptyState
                  icon={FileText}
                  title="Nenhum documento carregado"
                  description="Carregue guias e editais para ajudar os estudantes."
                  action={
                    <Button className={primaryButton} onClick={openNew}>
                      <Plus size={15} /> Carregar documento
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {documentos.map((documento) => (
                  <div key={documento.id} className={`${surface} flex flex-col p-5 transition-shadow hover:shadow-md`}>
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-white/[0.05] dark:text-zinc-500">
                        <FileText size={17} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-[13.5px] font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                          {documento.titulo}
                        </h3>
                        <p className={`mt-0.5 text-[11px] ${faintText}`}>
                          {documento.categoria || "Geral"} · {formatSize(documento.fileSize)}
                        </p>
                      </div>
                      <StatusPill status={documento.status} />
                    </div>

                    {documento.descricao && (
                      <p className={`mt-3 line-clamp-2 text-xs leading-relaxed ${softText}`}>{documento.descricao}</p>
                    )}

                    <p className="mt-3 mb-3 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                      {documento.bolsa
                        ? `Bolsa: ${documento.bolsa.titulo}`
                        : documento.preco > 0
                          ? formatPreco(documento.preco)
                          : "Gratuito"}
                      {documento.preco > 0 && (
                        <span className={`ml-1.5 font-normal ${faintText}`}>
                          · {documento._count?.compras ?? 0} venda(s)
                        </span>
                      )}
                    </p>

                    <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-white/[0.06]">
                      <button
                        type="button"
                        onClick={() => abrirFicheiro(documento)}
                        className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 transition-colors hover:text-emerald-500 dark:text-emerald-400"
                      >
                        <Download size={14} /> Abrir
                      </button>
                      <div className="flex items-center gap-0.5">
                        <IconAction onClick={() => openEdit(documento)} icon={Edit} label="Editar" />
                        <IconAction onClick={() => handleDelete(documento)} icon={Trash2} label="Excluir" danger disabled={deleteMutation.isPending} />
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

export default GestorDocumentos;
