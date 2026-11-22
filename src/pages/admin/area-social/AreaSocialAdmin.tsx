import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import toast from "react-hot-toast";
import { HeartHandshake, Loader2, Pencil, Plus, Search, Trash2, UserRound } from "lucide-react";
import {
  PERMISSOES_SOCIAIS,
  areaSocialApi,
  type MembroSocial,
  type PermissoesSociais,
} from "@/api/area-social";
import { bolsasApi } from "@/api/bolsas";
import { usuariosApi, type Usuario } from "@/api/usuarios";
import { AdminPageHeader, AdminPanel, adminMuted } from "@/components/admin/admin-ui";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { getUploadUrl } from "@/lib/axios";
import { cn } from "@/lib/utils";

const VAZIO: PermissoesSociais = {
  todasBolsas: true,
  bolsaIds: [],
  documentos: true,
  cursos: true,
  comunidades: true,
  aulas: true,
  ia: true,
  ativo: true,
  expiraEm: null,
  observacao: null,
};

function mensagemDeErro(erro: unknown, padrao: string) {
  if (isAxiosError(erro)) return (erro.response?.data as { message?: string } | undefined)?.message ?? padrao;
  return padrao;
}

/** "2026-12-31T00:00:00.000Z" → "2026-12-31", para o input de data. */
const paraInputData = (iso: string | null) => (iso ? iso.slice(0, 10) : "");
/** Fim do dia escolhido, para o acesso durar o dia todo. */
const deInputData = (valor: string) => (valor ? new Date(`${valor}T23:59:59`).toISOString() : null);

function Avatar({ nome, imagem }: { nome: string; imagem: string | null }) {
  return imagem ? (
    <img src={getUploadUrl(imagem)} alt="" className="size-9 shrink-0 rounded-full object-cover" />
  ) : (
    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-sm font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300">
      {nome.charAt(0).toUpperCase()}
    </span>
  );
}

function estadoDe(m: MembroSocial): { texto: string; classe: string } {
  if (!m.ativo) return { texto: "Suspenso", classe: "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400" };
  if (m.expiraEm && new Date(m.expiraEm) <= new Date()) {
    return { texto: "Expirado", classe: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-300" };
  }
  return { texto: "Ativo", classe: "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300" };
}

/**
 * Área social: o admin dá a quem escolher o acesso de quem pagou a mentoria, sem pagamento,
 * e escolhe as bolsas e as áreas abertas a cada pessoa.
 */
export function AreaSocialAdmin() {
  const queryClient = useQueryClient();
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [formAberto, setFormAberto] = useState(false);
  const [editar, setEditar] = useState<MembroSocial | null>(null);
  const [dados, setDados] = useState<PermissoesSociais>(VAZIO);
  const [usuario, setUsuario] = useState<Pick<Usuario, "id" | "nome" | "email" | "image_path"> | null>(null);
  const [pesquisa, setPesquisa] = useState("");
  const [filtroBolsas, setFiltroBolsas] = useState("");
  const [filtroLista, setFiltroLista] = useState("");

  const { data: membros, isLoading } = useQuery({ queryKey: ["admin-area-social"], queryFn: areaSocialApi.listar });

  const { data: bolsas } = useQuery({
    queryKey: ["admin-area-social-bolsas"],
    queryFn: async () => (await bolsasApi.list({ limit: 500 })).data,
    enabled: formAberto,
  });

  const { data: resultados, isFetching: aPesquisar } = useQuery({
    queryKey: ["admin-area-social-pesquisa", pesquisa],
    queryFn: async () => (await usuariosApi.list({ search: pesquisa, limit: "8" })).data,
    enabled: formAberto && !editar && !usuario && pesquisa.trim().length >= 2,
  });

  const jaMembros = useMemo(() => new Set(membros?.map((m) => m.usuarioId)), [membros]);
  const nomeBolsa = useMemo(() => new Map(bolsas?.map((b) => [b.id, b.titulo])), [bolsas]);

  const atualizarLista = () => queryClient.invalidateQueries({ queryKey: ["admin-area-social"] });

  const guardar = useMutation({
    mutationFn: () => {
      const corpo = { ...dados, observacao: dados.observacao?.trim() || null, bolsaIds: dados.todasBolsas ? [] : dados.bolsaIds };
      if (editar) return areaSocialApi.atualizar(editar.id, corpo);
      return areaSocialApi.adicionar({ ...corpo, usuarioId: usuario!.id });
    },
    onSuccess: () => {
      atualizarLista();
      setFormAberto(false);
      toast.success(editar ? "Permissões atualizadas" : "Pessoa adicionada à área social");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível guardar.")),
  });

  const alternarAtivo = useMutation({
    mutationFn: (m: MembroSocial) => {
      const { id: _id, usuarioId: _u, created_at: _c, usuario: _us, ...permissoes } = m;
      return areaSocialApi.atualizar(m.id, { ...permissoes, ativo: !m.ativo, expiraEm: m.expiraEm });
    },
    onSuccess: atualizarLista,
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível alterar.")),
  });

  const remover = useMutation({
    mutationFn: areaSocialApi.remover,
    onSuccess: () => {
      atualizarLista();
      toast.success("Removido da área social");
    },
    onError: (e) => toast.error(mensagemDeErro(e, "Não foi possível remover.")),
  });

  const abrirNovo = () => {
    setEditar(null);
    setUsuario(null);
    setPesquisa("");
    setFiltroBolsas("");
    setDados(VAZIO);
    setFormAberto(true);
  };

  const abrirEditar = (m: MembroSocial) => {
    setEditar(m);
    setUsuario(m.usuario);
    setFiltroBolsas("");
    setDados({
      todasBolsas: m.todasBolsas,
      bolsaIds: m.bolsaIds,
      documentos: m.documentos,
      cursos: m.cursos,
      comunidades: m.comunidades,
      aulas: m.aulas,
      ia: m.ia,
      ativo: m.ativo,
      expiraEm: m.expiraEm,
      observacao: m.observacao ?? "",
    });
    setFormAberto(true);
  };

  const alternarBolsa = (id: string, marcada: boolean) =>
    setDados((d) => ({
      ...d,
      bolsaIds: marcada ? [...d.bolsaIds, id] : d.bolsaIds.filter((b) => b !== id),
    }));

  const algumaPermissao = PERMISSOES_SOCIAIS.some((p) => dados[p.chave]);
  const valido = !!usuario && algumaPermissao && (dados.todasBolsas || dados.bolsaIds.length > 0);

  const bolsasFiltradas = (bolsas ?? []).filter((b) =>
    b.titulo.toLowerCase().includes(filtroBolsas.trim().toLowerCase())
  );

  const membrosFiltrados = (membros ?? []).filter((m) => {
    const termo = filtroLista.trim().toLowerCase();
    return !termo || m.usuario.nome.toLowerCase().includes(termo) || m.usuario.email.toLowerCase().includes(termo);
  });

  return (
    <div className="space-y-5">
      <ConfirmDialog />
      <AdminPageHeader
        eyebrow="Acessos"
        title="Área social"
        description="Dê a quem escolher, sem pagamento, o acesso que tem quem pagou a mentoria. Escolha as bolsas e o que fica aberto para cada pessoa."
        actions={
          <Button onClick={abrirNovo} className="gap-2 bg-emerald-600 text-white hover:bg-emerald-500">
            <Plus className="size-4" /> Adicionar pessoa
          </Button>
        }
      />

      <AdminPanel
        title="Pessoas na área social"
        subtitle={`${membros?.length ?? 0} pessoa(s)`}
        icon={HeartHandshake}
        bodyClassName="px-0 pb-1"
        action={
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-gray-400" />
            <Input
              value={filtroLista}
              onChange={(e) => setFiltroLista(e.target.value)}
              placeholder="Procurar"
              className="h-8 w-40 pl-8 text-xs sm:w-56"
            />
          </div>
        }
      >
        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="size-5 animate-spin text-emerald-500" />
          </div>
        ) : membrosFiltrados.length === 0 ? (
          <p className={cn("px-4 py-8 text-center text-sm", adminMuted)}>
            {membros?.length ? "Ninguém corresponde à pesquisa." : 'Ainda ninguém na área social. Carregue em "Adicionar pessoa".'}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {membrosFiltrados.map((m) => {
              const estado = estadoDe(m);
              return (
                <li key={m.id} className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    <Avatar nome={m.usuario.nome} imagem={m.usuario.image_path} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-bold text-gray-900 dark:text-white">{m.usuario.nome}</p>
                        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", estado.classe)}>{estado.texto}</span>
                      </div>
                      <p className={cn("truncate text-xs", adminMuted)}>{m.usuario.email}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold">
                        <span className="rounded-full bg-sky-50 px-2 py-0.5 text-sky-700 dark:bg-sky-500/10 dark:text-sky-300">
                          {m.todasBolsas ? "Todas as bolsas" : `${m.bolsaIds.length} bolsa(s)`}
                        </span>
                        {PERMISSOES_SOCIAIS.filter((p) => m[p.chave]).map((p) => (
                          <span
                            key={p.chave}
                            className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
                          >
                            {p.nome}
                          </span>
                        ))}
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400">
                          {m.expiraEm ? `Até ${new Date(m.expiraEm).toLocaleDateString("pt-PT")}` : "Sem data de fim"}
                        </span>
                      </div>
                      {m.observacao && <p className={cn("mt-1 text-xs italic", adminMuted)}>{m.observacao}</p>}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1.5">
                    <label className="mr-1 flex items-center gap-1.5 text-xs text-gray-600 dark:text-zinc-400">
                      <Switch
                        checked={m.ativo}
                        disabled={alternarAtivo.isPending}
                        onCheckedChange={() => alternarAtivo.mutate(m)}
                        aria-label={m.ativo ? "Suspender acesso" : "Reativar acesso"}
                      />
                      {m.ativo ? "Ativo" : "Suspenso"}
                    </label>
                    <Button variant="outline" size="sm" onClick={() => abrirEditar(m)} aria-label="Editar permissões">
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      aria-label="Remover"
                      className="text-red-600 hover:text-red-700"
                      onClick={async () => {
                        if (
                          await confirm(
                            `${m.usuario.nome} perde o acesso dado pela área social e sai das comunidades que só tinha por ela.`,
                            "Remover da área social?"
                          )
                        ) {
                          remover.mutate(m.id);
                        }
                      }}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AdminPanel>

      <Dialog open={formAberto} onOpenChange={setFormAberto}>
        <DialogContent className="max-h-[90dvh] w-[calc(100%-1.5rem)] max-w-lg overflow-y-auto rounded-2xl border-gray-100 bg-white text-gray-900 dark:border-white/[0.06] dark:bg-[#111113] dark:text-zinc-100">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">
              {editar ? "Editar permissões" : "Adicionar à área social"}
            </DialogTitle>
            <DialogDescription className="text-gray-500 dark:text-zinc-400">
              A pessoa tem o mesmo acesso de quem pagou a mentoria, só nas bolsas e áreas que marcar.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4 [&_label]:text-gray-700 dark:[&_label]:text-zinc-300 dark:[&_input]:border-white/[0.1] dark:[&_input]:bg-white/[0.04] dark:[&_input]:text-white dark:[&_textarea]:border-white/[0.1] dark:[&_textarea]:bg-white/[0.04] dark:[&_textarea]:text-white"
            onSubmit={(e) => {
              e.preventDefault();
              if (valido) guardar.mutate();
            }}
          >
            {/* Pessoa */}
            <div className="space-y-1.5">
              <Label>Pessoa *</Label>
              {usuario ? (
                <div className="flex items-center gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                  <Avatar nome={usuario.nome} imagem={usuario.image_path} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{usuario.nome}</p>
                    <p className={cn("truncate text-xs", adminMuted)}>{usuario.email}</p>
                  </div>
                  {!editar && (
                    <Button type="button" variant="ghost" size="sm" onClick={() => setUsuario(null)}>
                      Trocar
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-1.5">
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <Input
                      value={pesquisa}
                      autoFocus
                      onChange={(e) => setPesquisa(e.target.value)}
                      placeholder="Nome ou email"
                      className="pl-9"
                    />
                  </div>
                  {pesquisa.trim().length >= 2 && (
                    <div className="max-h-56 overflow-y-auto rounded-xl border border-gray-100 dark:border-white/[0.06]">
                      {aPesquisar ? (
                        <div className="flex justify-center py-4">
                          <Loader2 className="size-4 animate-spin text-emerald-500" />
                        </div>
                      ) : !resultados?.length ? (
                        <p className={cn("px-3 py-3 text-center text-xs", adminMuted)}>Nenhum utilizador encontrado.</p>
                      ) : (
                        resultados.map((u) => {
                          const ja = jaMembros.has(u.id);
                          return (
                            <button
                              key={u.id}
                              type="button"
                              disabled={ja}
                              onClick={() => setUsuario(u)}
                              className="flex w-full items-center gap-3 px-3 py-2 text-left transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-white/[0.04]"
                            >
                              <Avatar nome={u.nome} imagem={u.image_path} />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate text-sm font-medium">{u.nome}</span>
                                <span className={cn("block truncate text-xs", adminMuted)}>{u.email}</span>
                              </span>
                              {ja && <span className="text-[10px] font-semibold text-emerald-600">Já está</span>}
                            </button>
                          );
                        })
                      )}
                    </div>
                  )}
                  {pesquisa.trim().length < 2 && (
                    <p className={cn("flex items-center gap-1.5 text-xs", adminMuted)}>
                      <UserRound className="size-3.5" /> Escreva pelo menos 2 letras para procurar.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Bolsas */}
            <div className="space-y-2">
              <label className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                <span className="text-sm">
                  Todas as bolsas
                  <span className={cn("block text-xs", adminMuted)}>Inclui as bolsas criadas no futuro</span>
                </span>
                <Switch checked={dados.todasBolsas} onCheckedChange={(c) => setDados({ ...dados, todasBolsas: c })} />
              </label>
              {!dados.todasBolsas && (
                <div className="space-y-1.5">
                  <Input
                    value={filtroBolsas}
                    onChange={(e) => setFiltroBolsas(e.target.value)}
                    placeholder="Filtrar bolsas"
                    className="h-9 text-sm"
                  />
                  <div className="max-h-48 space-y-0.5 overflow-y-auto rounded-xl border border-gray-100 p-1.5 dark:border-white/[0.06]">
                    {!bolsas ? (
                      <div className="flex justify-center py-3">
                        <Loader2 className="size-4 animate-spin text-emerald-500" />
                      </div>
                    ) : bolsasFiltradas.length === 0 ? (
                      <p className={cn("px-2 py-2 text-center text-xs", adminMuted)}>Nenhuma bolsa.</p>
                    ) : (
                      bolsasFiltradas.map((b) => (
                        <label
                          key={b.id}
                          className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.04]"
                        >
                          <Checkbox
                            checked={dados.bolsaIds.includes(b.id)}
                            onCheckedChange={(c) => alternarBolsa(b.id, c === true)}
                          />
                          <span className="truncate">{b.titulo}</span>
                        </label>
                      ))
                    )}
                  </div>
                  <p className={cn("text-xs", dados.bolsaIds.length ? adminMuted : "text-red-600")}>
                    {dados.bolsaIds.length
                      ? `${dados.bolsaIds.length} selecionada(s): ${dados.bolsaIds.map((id) => nomeBolsa.get(id) ?? "…").slice(0, 3).join(", ")}${dados.bolsaIds.length > 3 ? "…" : ""}`
                      : "Escolha pelo menos uma bolsa."}
                  </p>
                </div>
              )}
            </div>

            {/* Permissões */}
            <div className="space-y-1.5">
              <Label>O que fica aberto *</Label>
              <div className="divide-y divide-gray-100 rounded-xl border border-gray-100 dark:divide-white/[0.06] dark:border-white/[0.06]">
                {PERMISSOES_SOCIAIS.map((p) => (
                  <label key={p.chave} className="flex cursor-pointer items-center justify-between gap-3 px-3 py-2.5">
                    <span className="text-sm">
                      {p.nome}
                      <span className={cn("block text-xs", adminMuted)}>{p.ajuda}</span>
                    </span>
                    <Switch
                      checked={dados[p.chave]}
                      onCheckedChange={(c) => setDados({ ...dados, [p.chave]: c })}
                    />
                  </label>
                ))}
              </div>
              {!algumaPermissao && <p className="text-xs text-red-600">Escolha pelo menos uma permissão.</p>}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="social-expira">Acesso até (opcional)</Label>
                <Input
                  id="social-expira"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={paraInputData(dados.expiraEm)}
                  onChange={(e) => setDados({ ...dados, expiraEm: deInputData(e.target.value) })}
                />
              </div>
              <label className="flex items-center justify-between gap-3 self-end rounded-xl border border-gray-100 px-3 py-2.5 dark:border-white/[0.06]">
                <span className="text-sm">Ativo</span>
                <Switch checked={dados.ativo} onCheckedChange={(c) => setDados({ ...dados, ativo: c })} />
              </label>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="social-obs">Nota interna</Label>
              <Textarea
                id="social-obs"
                value={dados.observacao ?? ""}
                maxLength={500}
                onChange={(e) => setDados({ ...dados, observacao: e.target.value })}
                placeholder="Ex.: parceria com a associação X"
                className="min-h-[60px]"
              />
            </div>

            <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormAberto(false)}
                className="w-full dark:border-white/[0.1] dark:text-white sm:w-auto"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={!valido || guardar.isPending}
                className="w-full gap-2 bg-emerald-600 text-white hover:bg-emerald-500 sm:w-auto"
              >
                {guardar.isPending && <Loader2 className="size-4 animate-spin" />}
                {editar ? "Guardar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
