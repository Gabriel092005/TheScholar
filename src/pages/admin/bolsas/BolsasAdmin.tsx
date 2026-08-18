import { useState, useRef } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import {
  Award, Plus, Search, Edit, Trash2, ChevronLeft, Check, Loader2,
  X, Hash, Building2, ListChecks,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RichTextEditor } from "@/components/ui/rich-text-editor";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { bolsasApi, type Bolsa } from "@/api/bolsas";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";

interface ScholarshipForm {
  id: string;
  titulo: string;
  subtitulo: string;
  instituicoes: string[];
  pais: string;
  niveis: string[];
  requisitos: string[];
  descricao: string;
  tags: string[];
  status: "ativa" | "inativa";
  prazo: string;
  numeroVagas: number | null;
  imagemBg: string;
}

const emptyForm: ScholarshipForm = {
  id: "", titulo: "", subtitulo: "", instituicoes: [""],
  pais: "", niveis: [],
  requisitos: [""], descricao: "", tags: [],
  status: "ativa", prazo: "", numeroVagas: null, imagemBg: "",
};

const levels = ["GRADUACAO", "MESTRADO", "DOUTORAMENTO", "MBA", "POSGRADUACAO"];

const tagSuggestions = ["Integral", "Parcial", "Europa", "EUA", "Ásia", "Presencial", "Online", "Mobilidade", "Pesquisa", "Graduação", "Pós-Graduação", "Idiomas", "Tutoria"];

function mapBolsaToForm(bolsa: Bolsa): ScholarshipForm {
  const parseInstituicoes = (val?: string): string[] => {
    if (!val) return [""];
    if (val.includes("|")) return val.split("|").map((s) => s.trim());
    return [val];
  };
  const parseRequisitos = (val?: string): string[] => {
    if (!val) return [""];
    if (val.includes("\n")) return val.split("\n").filter(Boolean);
    return [val];
  };
  return {
    id: bolsa.id,
    titulo: bolsa.titulo,
    subtitulo: bolsa.subtitulo || "",
    instituicoes: parseInstituicoes(bolsa.instituicao),
    pais: bolsa.pais || "",
    niveis: bolsa.nivel ? bolsa.nivel.split(", ").filter(Boolean) : [],
    requisitos: parseRequisitos(bolsa.requisitos),
    descricao: bolsa.descricao || "",
    tags: bolsa.tags || [],
    status: bolsa.status === "PUBLICADA" ? "ativa" : "inativa",
    prazo: bolsa.prazo || "",
    numeroVagas: bolsa.numeroVagas ?? null,
    imagemBg: bolsa.imagemBg || "",
  };
}

export function BolsasAdmin() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ScholarshipForm>(emptyForm);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");
  const [imagemBgFile, setImagemBgFile] = useState<File | null>(null);
  const [imagemBgPreview, setImagemBgPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: response, isLoading } = useQuery({
    queryKey: ["admin-bolsas"],
    queryFn: () => bolsasApi.list({}),
  });

  const bolsas = response?.data || [];

  const createMutation = useMutation({
    mutationFn: bolsasApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] });
      toast.success("Bolsa criada com sucesso!");
      setShowForm(false);
      setForm(emptyForm);
      setImagemBgFile(null);
      setImagemBgPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao criar bolsa");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Bolsa> | FormData }) =>
      bolsasApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] });
      toast.success("Bolsa atualizada com sucesso!");
      setShowForm(false);
      setForm(emptyForm);
      setImagemBgFile(null);
      setImagemBgPreview(null);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar bolsa");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: bolsasApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bolsas"] });
      toast.success("Bolsa excluída com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao excluir bolsa");
    },
  });

  const filteredBolsas = bolsas.filter((b) => {
    const matchesSearch =
      b.titulo.toLowerCase().includes(search.toLowerCase()) ||
      (b.instituicao || "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus =
      filterStatus === "todas" ||
      (filterStatus === "ativa" && b.status === "PUBLICADA") ||
      (filterStatus === "inativa" && b.status === "INATIVA");
    return matchesSearch && matchesStatus;
  });

  const handleSave = () => {
    const payload: Record<string, any> = {
      titulo: form.titulo,
      subtitulo: form.subtitulo || undefined,
      instituicao: form.instituicoes.filter(Boolean).join(" | ") || undefined,
      pais: form.pais,
      nivel: form.niveis.length > 0 ? form.niveis.join(", ") : "",
      requisitos: form.requisitos.filter(Boolean).join("\n") || undefined,
      descricao: form.descricao,
      tags: form.tags.join(","),
      status: form.status === "ativa" ? "PUBLICADA" : "INATIVA",
      prazo: form.prazo || undefined,
      numeroVagas: form.numeroVagas != null ? String(form.numeroVagas) : undefined,
    };

    if (imagemBgFile) {
      const fd = new FormData();
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== "") fd.append(key, String(val));
      });
      fd.append("imagemBg", imagemBgFile);
      if (editingId) {
        updateMutation.mutate({ id: editingId, payload: fd });
      } else {
        createMutation.mutate(fd as any);
      }
    } else {
      payload.imagemBg = form.imagemBg || undefined;
      if (editingId) {
        updateMutation.mutate({ id: editingId, payload: payload as any });
      } else {
        createMutation.mutate(payload as any);
      }
    }
  };

  const openNewForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(true);
    setImagemBgFile(null);
    setImagemBgPreview(null);
  };

  const handleEdit = (bolsa: Bolsa) => {
    setEditingId(bolsa.id);
    setForm(mapBolsaToForm(bolsa));
    setShowForm(true);
    setImagemBgFile(null);
    setImagemBgPreview(null);
  };

  const handleDelete = async (id: string) => {
    const ok = await confirm("Tem certeza que deseja excluir esta bolsa?");
    if (ok) deleteMutation.mutate(id);
  };

  // const openNewForm = () => {
  //   setForm(emptyForm);
  //   setEditingId(null);
  //   setShowForm(true);
  // };

  const isFormLoading = createMutation.isPending || updateMutation.isPending;

  const addInstituicao = () => setForm({ ...form, instituicoes: [...form.instituicoes, ""] });
  const removeInstituicao = (i: number) => {
    const arr = form.instituicoes.filter((_, idx) => idx !== i);
    setForm({ ...form, instituicoes: arr.length ? arr : [""] });
  };
  const updateInstituicao = (i: number, v: string) => {
    const arr = [...form.instituicoes];
    arr[i] = v;
    setForm({ ...form, instituicoes: arr });
  };

  const addRequisito = () => setForm({ ...form, requisitos: [...form.requisitos, ""] });
  const removeRequisito = (i: number) => {
    const arr = form.requisitos.filter((_, idx) => idx !== i);
    setForm({ ...form, requisitos: arr.length ? arr : [""] });
  };
  const updateRequisito = (i: number, v: string) => {
    const arr = [...form.requisitos];
    arr[i] = v;
    setForm({ ...form, requisitos: arr });
  };

  const addTag = (tag: string) => {
    if (!form.tags.includes(tag)) {
      setForm({ ...form, tags: [...form.tags, tag] });
    }
  };
  const removeTag = (tag: string) => {
    setForm({ ...form, tags: form.tags.filter((t) => t !== tag) });
  };

  const renderInstituicoes = () => (
    <div className="space-y-2">
      <Label className="text-gray-700 dark:text-zinc-300">Universidades / Instituições</Label>
      <div className="space-y-2 mt-1.5">
        {form.instituicoes.map((inst, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-transparent rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 has-[input:focus]:border-emerald-500 transition-colors">
              <Building2 size={14} className="text-gray-400 shrink-0" />
              <input
                value={inst}
                onChange={(e) => updateInstituicao(i, e.target.value)}
                placeholder={i === 0 ? "Ex: Universidade de Coimbra" : "Ex: Universidade de Lisboa"}
                className="flex-1 h-9 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
            </div>
            {form.instituicoes.length > 1 && (
              <button
                type="button"
                onClick={() => removeInstituicao(i)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addInstituicao}
        className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mt-1"
      >
        <Plus size={12} />
        Adicionar outra instituição
      </button>
    </div>
  );

  const renderRequisitos = () => (
    <div className="space-y-2">
      <Label className="text-gray-700 dark:text-zinc-300">Requisitos</Label>
      <div className="space-y-2 mt-1.5">
        {form.requisitos.map((req, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1 flex items-center gap-2 bg-white dark:bg-transparent rounded-lg border border-gray-200 dark:border-white/[0.08] px-3 has-[input:focus]:border-emerald-500 transition-colors">
              <ListChecks size={14} className="text-gray-400 shrink-0" />
              <input
                value={req}
                onChange={(e) => updateRequisito(i, e.target.value)}
                placeholder="Ex: Média mínima de 16 valores"
                className="flex-1 h-9 bg-transparent text-sm text-gray-900 dark:text-white outline-none placeholder:text-gray-400"
              />
            </div>
            {form.requisitos.length > 1 && (
              <button
                type="button"
                onClick={() => removeRequisito(i)}
                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 text-red-400 shrink-0"
              >
                <X size={14} />
              </button>
            )}
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={addRequisito}
        className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 font-medium mt-1"
      >
        <Plus size={12} />
        Adicionar requisito
      </button>
    </div>
  );

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
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        {form.tags.length === 0 && (
          <span className="text-xs text-gray-400 dark:text-zinc-600 px-1 py-0.5">
            Selecione ou digite tags abaixo
          </span>
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
                  onClick={() => setShowForm(false)}
                  className="p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-white/[0.06]"
                >
                  <ChevronLeft size={18} className="text-gray-500 dark:text-zinc-500" />
                </button>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                    {editingId ? "Editar Bolsa" : "Nova Bolsa"}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    Preencha os dados da bolsa de estudos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button className="bg-zinc-500 hover:bg-zinc-600 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white" onClick={() => setShowForm(false)} disabled={isFormLoading}>
                  Cancelar
                </Button>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={handleSave} disabled={isFormLoading}>
                  {isFormLoading ? <Loader2 size={16} className="mr-2 animate-spin" /> : <Check size={16} className="mr-2" />}
                  Guardar
                </Button>
              </div>
            </div>

            <ScrollArea className="[&>div>div]:!block">
              <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Título da Bolsa</Label>
                  <Input
                    value={form.titulo}
                    onChange={(e) => setForm({ ...form, titulo: e.target.value })}
                    placeholder="Ex: Bolsa de Mérito Acadêmico 2026"
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Subtítulo</Label>
                  <Input
                    value={form.subtitulo}
                    onChange={(e) => setForm({ ...form, subtitulo: e.target.value })}
                    placeholder="Ex: Para estudantes com excelente desempenho académico"
                    className="mt-1.5"
                  />
                </div>

                {renderInstituicoes()}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">País</Label>
                    <Input
                      value={form.pais}
                      onChange={(e) => setForm({ ...form, pais: e.target.value })}
                      placeholder="Ex: Angola, Brasil, Portugal..."
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Níveis</Label>
                    <div className="flex flex-wrap gap-2 mt-1.5">
                      {levels.map((l) => {
                        const selected = form.niveis.includes(l);
                        return (
                          <button
                            key={l}
                            type="button"
                            onClick={() =>
                              setForm({
                                ...form,
                                niveis: selected
                                  ? form.niveis.filter((v) => v !== l)
                                  : [...form.niveis, l],
                              })
                            }
                            className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all ${
                              selected
                                ? "bg-emerald-500 text-white border-emerald-500"
                                : "bg-white dark:bg-transparent text-gray-600 dark:text-zinc-400 border-gray-200 dark:border-white/[0.12] hover:border-emerald-300 dark:hover:border-emerald-500/50"
                            }`}
                          >
                            {l}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Prazo</Label>
                    <Input
                      type="date"
                      value={form.prazo}
                      onChange={(e) => setForm({ ...form, prazo: e.target.value })}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Vagas</Label>
                    <Input
                      type="number"
                      value={form.numeroVagas ?? ""}
                      onChange={(e) => setForm({ ...form, numeroVagas: e.target.value ? parseInt(e.target.value) : null })}
                      placeholder="Não informado"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label className="text-gray-700 dark:text-zinc-300">Imagem de Capa</Label>
                    <div className="mt-1.5 space-y-3">
                      {(imagemBgPreview || (form.imagemBg && !imagemBgFile)) && (
                        <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-white/[0.08]">
                          <img
                            src={imagemBgPreview || (form.imagemBg.startsWith("http") ? form.imagemBg : getUploadUrl(`/uploads/${form.imagemBg}`))}
                            alt="Preview"
                            className="w-full h-32 object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => { setImagemBgFile(null); setImagemBgPreview(null); setForm({ ...form, imagemBg: "" }); }}
                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      )}
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setImagemBgFile(file);
                            setImagemBgPreview(URL.createObjectURL(file));
                            setForm({ ...form, imagemBg: "" });
                          }
                        }}
                        className="block w-full text-sm text-gray-500 dark:text-zinc-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-emerald-50 dark:file:bg-emerald-500/10 file:text-emerald-700 dark:file:text-emerald-400 hover:file:bg-emerald-100 dark:hover:file:bg-emerald-500/20 cursor-pointer"
                      />
                      <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                          <span className="w-full border-t border-gray-200 dark:border-white/[0.08]" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                          <span className="bg-white dark:bg-[#111113] px-2 text-gray-400 dark:text-zinc-500">ou URL</span>
                        </div>
                      </div>
                      <Input
                        value={form.imagemBg}
                        onChange={(e) => {
                          setForm({ ...form, imagemBg: e.target.value });
                          setImagemBgFile(null);
                          setImagemBgPreview(null);
                        }}
                        placeholder="https://exemplo.com/imagem.jpg"
                        className="mt-1.5"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label className="text-gray-700 dark:text-zinc-300">Descrição</Label>
                  <RichTextEditor
                    value={form.descricao}
                    onChange={(html) => setForm({ ...form, descricao: html })}
                    placeholder="Descreva os detalhes da bolsa..."
                    className="mt-1.5"
                  />
                </div>

                {renderRequisitos()}
              </div>

              <div className="space-y-6">
                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Configurações</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-gray-700 dark:text-zinc-300">Status</Label>
                      <Select
                        value={form.status}
                        onValueChange={(value) => setForm({ ...form, status: value as "ativa" | "inativa" })}
                      >
                        <SelectTrigger className="mt-1.5">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativa">Ativa</SelectItem>
                          <SelectItem value="inativa">Inativa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-white/[0.06] rounded-xl p-4">
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Tags</h3>
                  {renderTags()}
                </div>
              </div>
            </div>
            </ScrollArea>
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
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Gerir Bolsas</h2>
                  <p className="text-sm text-gray-500 dark:text-zinc-500">
                    Adicione, edite ou remova bolsas de estudos
                  </p>
                </div>
                <Button className="bg-emerald-500 hover:bg-emerald-600 text-white" onClick={openNewForm} disabled={isLoading}>
                  <Plus size={16} className="mr-2" />
                  Nova Bolsa
                </Button>
              </div>

              <div className="p-5 flex items-center gap-4">
                <div className="relative flex-1 max-w-md">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Pesquisar bolsas..." className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas</SelectItem>
                    <SelectItem value="ativa">Ativas</SelectItem>
                    <SelectItem value="inativa">Inativas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <ScrollArea className="w-full whitespace-nowrap">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Bolsa</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Instituições</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">País</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Nível</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Prazo</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Vagas</th>
                      <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                        </td>
                      </tr>
                    ) : filteredBolsas.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12">
                          <Award size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
                          <p className="text-gray-500 dark:text-zinc-500">Nenhuma bolsa encontrada</p>
                        </td>
                      </tr>
                    ) : (
                      filteredBolsas.map((bolsa) => {
                        const insts = bolsa.instituicao?.split("|").map((s) => s.trim()).filter(Boolean) || [];
                        return (
                          <tr
                            key={bolsa.id}
                            className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                          >
                            <td className="px-5 py-4">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">{bolsa.titulo}</p>
                                {bolsa.subtitulo && (
                                  <p className="text-xs text-gray-500 dark:text-zinc-500 truncate max-w-[200px]">{bolsa.subtitulo}</p>
                                )}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {insts.map((inst, i) => (
                                  <span key={i} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 rounded">
                                    {inst}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm text-gray-600 dark:text-zinc-400">{bolsa.pais}</span>
                            </td>
                            <td className="px-5 py-4">
                              <div className="flex flex-wrap gap-1">
                                {(bolsa.nivel ? bolsa.nivel.split(", ").filter(Boolean) : []).map((n, i) => (
                                  <span key={i} className="inline-flex px-1.5 py-0.5 text-[10px] font-medium bg-gray-50 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400 rounded">
                                    {n}
                                  </span>
                                ))}
                              </div>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm text-gray-600 dark:text-zinc-400">{bolsa.prazo || bolsa.datasImportantes?.prazo || "-"}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className="text-sm font-medium text-gray-900 dark:text-white">{bolsa.numeroVagas ?? "-"}</span>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${bolsa.status === "PUBLICADA" ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"}`}>
                                {bolsa.status === "PUBLICADA" ? "Ativa" : "Inativa"}
                              </span>
                            </td>
                            <td className="px-5 py-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => handleEdit(bolsa)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/[0.06]">
                                  <Edit size={14} className="text-gray-400 dark:text-zinc-500" />
                                </button>
                                <button onClick={() => handleDelete(bolsa.id)} disabled={deleteMutation.isPending} className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 disabled:opacity-50">
                                  {deleteMutation.isPending ? (
                                    <Loader2 size={14} className="animate-spin text-red-400" />
                                  ) : (
                                    <Trash2 size={14} className="text-red-400 dark:text-red-500" />
                                  )}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
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

export default BolsasAdmin;
