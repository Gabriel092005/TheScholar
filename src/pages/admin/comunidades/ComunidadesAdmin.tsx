import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { motion } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Search, Loader2, Trash2, Users, MessageCircle,
  Plus, PenLine, Image, X, GraduationCap,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { listarComunidades, criarComunidade, entrarComunidade, editarComunidade } from "@/api/comunidades";
import { api, getUploadUrl } from "@/lib/axios";
import toast from "react-hot-toast";

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("pt-PT", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function ComunidadesAdmin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [criarOpen, setCriarOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [descricao, setDescricao] = useState("");
  const [bolsaId, setBolsaId] = useState("");

  const [editarOpen, setEditarOpen] = useState(false);
  const [editarId, setEditarId] = useState("");
  const [editarNome, setEditarNome] = useState("");
  const [editarDescricao, setEditarDescricao] = useState("");
  const [editarImagem, setEditarImagem] = useState<string | null>("");
  const [editarCapa, setEditarCapa] = useState<string | null>("");
  const [uploadingImagem, setUploadingImagem] = useState(false);
  const [uploadingCapa, setUploadingCapa] = useState(false);

  function abrirEditar(c: { id: string; nome: string; descricao?: string | null; imagem?: string | null; capa?: string | null }) {
    setEditarId(c.id);
    setEditarNome(c.nome);
    setEditarDescricao(c.descricao || "");
    setEditarImagem(c.imagem || null);
    setEditarCapa(c.capa || null);
    setEditarOpen(true);
  }

  async function uploadImagem(file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await api.post<{ url: string }>("/upload", formData);
    return data.url;
  }

  const { data: comunidades = [], isLoading } = useQuery({
    queryKey: ["admin-comunidades"],
    queryFn: listarComunidades,
  });

  const { data: bolsas = [] } = useQuery({
    queryKey: ["admin-bolsas-select"],
    queryFn: async () => {
      const { data } = await api.get("/bolsas");
      return data.data || data;
    },
  });

  const criarMutation = useMutation({
    mutationFn: () => criarComunidade({ nome, descricao: descricao || undefined, bolsaId: bolsaId || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comunidades"] });
      setCriarOpen(false);
      setNome("");
      setDescricao("");
      setBolsaId("");
      toast.success("Comunidade criada!");
    },
    onError: () => toast.error("Erro ao criar comunidade"),
  });

  const editarMutation = useMutation({
    mutationFn: () => editarComunidade(editarId, {
      nome: editarNome.trim() ? editarNome : undefined,
      descricao: editarDescricao.trim() ? editarDescricao : null,
      imagem: editarImagem || null,
      capa: editarCapa || null,
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comunidades"] });
      setEditarOpen(false);
      toast.success("Comunidade actualizada!");
    },
    onError: () => toast.error("Erro ao actualizar comunidade"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/comunidades/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comunidades"] });
      toast.success("Comunidade removida");
    },
    onError: () => toast.error("Erro ao remover comunidade"),
  });

  const entrarMutation = useMutation({
    mutationFn: (id: string) => entrarComunidade(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comunidades"] });
      toast.success("Entrou na comunidade!");
    },
    onError: () => toast.error("Erro ao entrar na comunidade"),
  });

  const filtered = comunidades.filter((c) =>
    c.nome.toLowerCase().includes(search.toLowerCase()) ||
    c.descricao?.toLowerCase().includes(search.toLowerCase())
  );
  const { confirm, ConfirmDialog } = useConfirmDialog();

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
              Comunidades
            </h1>
            <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
              Gerir comunidades da plataforma
            </p>
          </div>
          <Button
            onClick={() => setCriarOpen(true)}
            className="h-11 px-5 text-sm font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
          >
            <Plus className="mr-2 h-4 w-4" />
            Criar Comunidade
          </Button>
        </div>

        <div className="relative mb-6 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Pesquisar comunidades..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] text-sm"
          />
        </div>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="h-10 w-10 text-gray-300 dark:text-zinc-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-zinc-500">Nenhuma comunidade encontrada</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {filtered.map((comunidade) => (
                <div
                  key={comunidade.id}
                  onClick={() => navigate(`/comunidades/${comunidade.id}`)}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer"
                >
                  <Avatar className="w-10 h-10 rounded-xl">
                    <AvatarImage src={comunidade.imagem || ""} />
                    <AvatarFallback className="rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-sm font-bold">
                      {comunidade.nome.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 dark:text-white truncate">
                      {comunidade.nome}
                    </p>
                    {comunidade.descricao && (
                      <p className="text-xs text-gray-500 dark:text-zinc-400 truncate mt-0.5">
                        {comunidade.descricao}
                      </p>
                    )}
                    <p className="text-[10px] text-gray-400 dark:text-zinc-600 mt-0.5">
                      Criada em {formatDate(comunidade.created_at)}
                    </p>
                    {comunidade.bolsa && (
                      <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5 flex items-center gap-1">
                        <GraduationCap className="h-3 w-3" />
                        {comunidade.bolsa.titulo}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
                      <MessageCircle className="h-3.5 w-3.5" />
                      {comunidade._count?.mensagens || 0}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-gray-500 dark:text-zinc-400">
                      <Users className="h-3.5 w-3.5" />
                      {comunidade._count?.membros || 0}
                    </span>
                    {!comunidade.souMembro && !comunidade.solicitacaoPendente && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => { e.stopPropagation(); entrarMutation.mutate(comunidade.id); }}
                        disabled={entrarMutation.isPending}
                        className="h-9 px-3 rounded-xl text-xs font-semibold text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                      >
                        {entrarMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : (
                          <Users className="h-3.5 w-3.5 mr-1" />
                        )}
                        Entrar
                      </Button>
                    )}
                    {comunidade.souMembro && (
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 px-2">
                        Membro
                      </span>
                    )}
                    {comunidade.solicitacaoPendente && (
                      <span className="text-[11px] font-medium text-yellow-600 dark:text-yellow-400 px-2">
                        Solicitado
                      </span>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => { e.stopPropagation(); abrirEditar(comunidade); }}
                      className="h-9 w-9 p-0 rounded-xl text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                    >
                      <PenLine className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async (e) => { e.stopPropagation();
                        const ok = await confirm(`Remover "${comunidade.nome}"?`);
                        if (ok) {
                          deleteMutation.mutate(comunidade.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="h-9 w-9 p-0 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>

      <Dialog open={criarOpen} onOpenChange={setCriarOpen}>
        <DialogContent className="max-w-md rounded-3xl bg-white dark:bg-[#111113]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Criar Comunidade
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-300">
              Crie um espaço para conectar pessoas com interesses em comum.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Nome</Label>
              <Input
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Devs Angola"
                className="h-11 rounded-xl bg-white dark:bg-transparent dark:text-white placeholder:dark:text-zinc-500"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Descrição (opcional)</Label>
              <Textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="O propósito desta comunidade..."
                className="rounded-xl bg-white dark:bg-transparent dark:text-white placeholder:dark:text-zinc-500 resize-none"
                rows={3}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Bolsa (opcional)</Label>
              <Select value={bolsaId} onValueChange={setBolsaId}>
                <SelectTrigger className="h-11 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-white dark:bg-transparent dark:text-white">
                  <SelectValue placeholder="Selecionar bolsa..." />
                </SelectTrigger>
                <SelectContent>
                  {bolsas.map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.titulo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setCriarOpen(false)}
              className="rounded-xl h-11 font-bold text-sm dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => criarMutation.mutate()}
              disabled={!nome.trim() || criarMutation.isPending}
              className="rounded-xl h-11 font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              {criarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Plus className="h-4 w-4 mr-2" />
              )}
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <Dialog open={editarOpen} onOpenChange={setEditarOpen}>
        <DialogContent className="max-w-lg rounded-3xl bg-white dark:bg-[#111113]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Editar Comunidade
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              Altere o nome, descrição ou imagens da comunidade.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-5">
            {/* Imagem de perfil */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Imagem de Perfil</Label>
              <div className="flex items-center gap-4">
                <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08] shrink-0">
                  {editarImagem ? (
                    <>
                      <img src={getUploadUrl(editarImagem)} alt="Perfil" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setEditarImagem(null)}
                        className="absolute top-0.5 right-0.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Image className="w-6 h-6" />
                    </div>
                  )}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingImagem}
                  className="rounded-xl text-xs"
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      setUploadingImagem(true);
                      try {
                        const url = await uploadImagem(file);
                        setEditarImagem(url);
                      } catch {
                        toast.error("Erro ao fazer upload");
                      } finally {
                        setUploadingImagem(false);
                      }
                    };
                    input.click();
                  }}
                >
                  {uploadingImagem ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {editarImagem ? "Trocar" : "Adicionar"}
                </Button>
              </div>
            </div>

            {/* Imagem de capa */}
            <div className="space-y-2">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Imagem de Capa</Label>
              <div className="relative w-full h-32 rounded-xl overflow-hidden bg-gray-100 dark:bg-white/[0.04] border border-gray-200 dark:border-white/[0.08]">
                {editarCapa ? (
                  <>
                    <img src={getUploadUrl(editarCapa)} alt="Capa" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setEditarCapa(null)}
                      className="absolute top-1 right-1 w-6 h-6 rounded-full bg-red-500 text-white flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <Image className="w-8 h-8" />
                  </div>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  disabled={uploadingCapa}
                  className="absolute bottom-2 right-2 rounded-xl text-xs bg-white/80 dark:bg-black/50 backdrop-blur-sm"
                  onClick={async () => {
                    const input = document.createElement("input");
                    input.type = "file";
                    input.accept = "image/*";
                    input.onchange = async () => {
                      const file = input.files?.[0];
                      if (!file) return;
                      setUploadingCapa(true);
                      try {
                        const url = await uploadImagem(file);
                        setEditarCapa(url);
                      } catch {
                        toast.error("Erro ao fazer upload");
                      } finally {
                        setUploadingCapa(false);
                      }
                    };
                    input.click();
                  }}
                >
                  {uploadingCapa ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                  {editarCapa ? "Trocar" : "Adicionar"}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Nome</Label>
              <Input
                value={editarNome}
                onChange={(e) => setEditarNome(e.target.value)}
                className="h-11 rounded-xl bg-white dark:bg-transparent dark:text-white"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-bold text-gray-700 dark:text-white">Descrição (opcional)</Label>
              <Textarea
                value={editarDescricao}
                onChange={(e) => setEditarDescricao(e.target.value)}
                className="rounded-xl bg-white dark:bg-transparent dark:text-white resize-none"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setEditarOpen(false)}
              className="rounded-xl h-11 font-bold text-sm dark:text-white dark:hover:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={() => editarMutation.mutate()}
              disabled={!editarNome.trim() || editarMutation.isPending}
              className="rounded-xl h-11 font-bold text-sm bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm"
            >
              {editarMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <PenLine className="h-4 w-4 mr-2" />
              )}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ConfirmDialog />
    </div>
  );
}
