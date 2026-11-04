import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  User,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usuariosApi } from "@/api/usuarios";
import { AdminPageHeader, adminSurface } from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

const ROLE_LABELS: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  USUARIO: "Utilizador",
};

const ROLE_ICONS: Record<string, LucideIcon> = {
  ADMIN: ShieldCheck,
  GESTOR: Shield,
  USUARIO: User,
};

const ROLE_PILLS: Record<string, string> = {
  ADMIN: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-500/20",
  GESTOR: "bg-teal-50 text-teal-700 ring-1 ring-teal-200/70 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-500/20",
  USUARIO: "bg-gray-100 text-gray-600 ring-1 ring-gray-200/70 dark:bg-white/[0.05] dark:text-zinc-300 dark:ring-white/10",
};

const ROLE_TABS = [
  { value: "todas", label: "Todos" },
  { value: "ADMIN", label: "Admins" },
  { value: "GESTOR", label: "Gestores" },
  { value: "USUARIO", label: "Utilizadores" },
] as const;

const ROLES = ["ADMIN", "GESTOR", "USUARIO"] as const;

type StatTone = "emerald" | "teal" | "amber" | "rose";

const STAT_TONES: Record<StatTone, string> = {
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  teal: "bg-teal-50 text-teal-600 dark:bg-teal-500/10 dark:text-teal-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
};

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = "emerald",
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon: LucideIcon;
  tone?: StatTone;
}) {
  return (
    <div className={cn(adminSurface, "flex items-center gap-3 p-3 sm:p-4")}>
      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl", STAT_TONES[tone])}>
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-lg font-bold leading-tight tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
          {label}
        </p>
        {hint && (
          <p className="truncate text-[9px] text-gray-400 dark:text-zinc-600">{hint}</p>
        )}
      </div>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" });
}

export function UsuariosAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("todas");
  const [filterEstado, setFilterEstado] = useState("todas");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-usuarios", search, filterRole, filterEstado, page],
    queryFn: () => usuariosApi.list({
      search: search || undefined,
      role: filterRole !== "todas" ? filterRole : undefined,
      estado: filterEstado !== "todas" ? filterEstado : undefined,
      page: String(page),
      limit: "20",
    }),
  });

  const usuarios = data?.data || [];
  const meta = data?.meta;

  const ativos = usuarios.filter((u) => u.estado_conta === "ACTIVA").length;
  const suspensos = usuarios.length - ativos;
  const hasFilters = !!search || filterRole !== "todas" || filterEstado !== "todas";

  const limparFiltros = () => {
    setSearch("");
    setFilterRole("todas");
    setFilterEstado("todas");
    setPage(1);
  };

  const alterarRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "ADMIN" | "GESTOR" | "USUARIO" }) =>
      usuariosApi.alterarRole(userId, role),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Role alterada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao alterar role");
    },
  });

  const suspenderMutation = useMutation({
    mutationFn: usuariosApi.suspender,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Estado da conta alterado!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao alterar estado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usuariosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
      toast.success("Utilizador eliminado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao eliminar utilizador");
    },
  });

  const rangeStart = meta ? (meta.page - 1) * meta.limit + 1 : 0;
  const rangeEnd = meta ? Math.min(meta.page * meta.limit, meta.total) : 0;

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Plataforma"
        title="Utilizadores"
        description="Gerir contas, permissões e estado de acesso de toda a plataforma."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Total" value={(meta?.total ?? usuarios.length).toLocaleString("pt-PT")} icon={Users} tone="emerald" hint="todas as contas" />
        <StatCard label="Resultados" value={usuarios.length.toLocaleString("pt-PT")} icon={Search} tone="teal" hint="nesta página" />
        <StatCard label="Ativos" value={ativos.toLocaleString("pt-PT")} icon={UserCheck} tone="emerald" hint="nesta página" />
        <StatCard label="Suspensos" value={suspensos.toLocaleString("pt-PT")} icon={UserX} tone="rose" hint="nesta página" />
      </div>

      <div className={cn(adminSurface, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-gray-100/80 p-4 dark:border-white/[0.06] sm:p-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="relative w-full lg:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Pesquisar por nome ou email..."
              className="h-10 rounded-xl border-gray-200/80 bg-gray-50/70 pl-10 text-sm dark:border-white/[0.07] dark:bg-white/[0.03]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex items-center gap-0.5 rounded-xl bg-gray-100/70 p-1 dark:bg-white/[0.04]">
              {ROLE_TABS.map((tab) => (
                <button
                  key={tab.value}
                  type="button"
                  onClick={() => { setFilterRole(tab.value); setPage(1); }}
                  className={cn(
                    "rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-all",
                    filterRole === tab.value
                      ? "bg-white text-emerald-600 shadow-sm dark:bg-white/[0.09] dark:text-emerald-400"
                      : "text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-white",
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(1); }}>
              <SelectTrigger className="h-9 w-36 rounded-xl border-gray-200/80 text-xs text-gray-900 dark:border-white/[0.07] dark:text-white">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111416]">
                <SelectItem value="todas" className="text-gray-700 dark:text-gray-200">Todos os estados</SelectItem>
                <SelectItem value="ACTIVA" className="text-gray-700 dark:text-gray-200">Activa</SelectItem>
                <SelectItem value="INACTIVA" className="text-gray-700 dark:text-gray-200">Inactiva</SelectItem>
              </SelectContent>
            </Select>

            {hasFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={limparFiltros}
                className="h-9 rounded-xl text-xs text-gray-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400"
              >
                Limpar
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-gray-100/80 dark:border-white/[0.06]">
                {["Utilizador", "Função", "Estado", "Último acesso", "Registo", ""].map((label, i) => (
                  <th
                    key={i}
                    className={cn(
                      "px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-600",
                      i === 5 && "text-right",
                    )}
                  >
                    {label || "Ações"}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.05] dark:text-zinc-600">
                      <Users size={22} />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Nenhum utilizador encontrado
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                      Ajuste a pesquisa ou os filtros para ver mais resultados.
                    </p>
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => {
                  const RoleIcon = ROLE_ICONS[user.role] || User;
                  const ativo = user.estado_conta === "ACTIVA";
                  return (
                    <tr
                      key={user.id}
                      className="group border-b border-gray-100/70 transition-colors last:border-0 hover:bg-gray-50/60 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 text-[12px] font-bold text-white shadow-sm shadow-emerald-500/20">
                            {user.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                              {user.nome}
                            </p>
                            <p className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold", ROLE_PILLS[user.role])}>
                          <RoleIcon size={11} />
                          {ROLE_LABELS[user.role]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={cn(
                            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold",
                            ativo
                              ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
                          )}
                        >
                          <span className={cn("size-1.5 rounded-full", ativo ? "bg-emerald-500" : "bg-rose-500")} />
                          {ativo ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 dark:text-zinc-400">
                        {formatDate(user.last_active_at)}
                      </td>
                      <td className="px-5 py-3.5 text-[12px] text-gray-500 dark:text-zinc-400">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="size-8 rounded-lg text-gray-400 opacity-70 transition-opacity hover:bg-gray-100 hover:text-gray-700 group-hover:opacity-100 data-[state=open]:opacity-100 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white"
                            >
                              <MoreHorizontal size={16} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-52 border-gray-200 bg-white dark:border-white/[0.08] dark:bg-[#111416]">
                            <DropdownMenuLabel className="text-[9px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-600">
                              Alterar função
                            </DropdownMenuLabel>
                            {ROLES.map((r) => {
                              const Icon = ROLE_ICONS[r];
                              return (
                                <DropdownMenuItem
                                  key={r}
                                  disabled={r === user.role || alterarRoleMutation.isPending}
                                  className="cursor-pointer gap-2 text-gray-700 focus:bg-emerald-50 focus:text-emerald-700 dark:text-zinc-200 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300"
                                  onClick={() => alterarRoleMutation.mutate({ userId: user.id, role: r })}
                                >
                                  <Icon size={14} className="text-gray-400 dark:text-zinc-500" />
                                  <span className="text-[13px]">{ROLE_LABELS[r]}</span>
                                  {r === user.role && <Check size={14} className="ml-auto text-emerald-500" />}
                                </DropdownMenuItem>
                              );
                            })}
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
                            <DropdownMenuItem
                              disabled={suspenderMutation.isPending}
                              className="cursor-pointer gap-2 text-gray-700 focus:bg-gray-50 focus:text-gray-900 dark:text-zinc-200 dark:focus:bg-white/[0.06] dark:focus:text-white"
                              onClick={() => suspenderMutation.mutate(user.id)}
                            >
                              {ativo ? <UserX size={14} className="text-gray-400 dark:text-zinc-500" /> : <UserCheck size={14} className="text-gray-400 dark:text-zinc-500" />}
                              <span className="text-[13px]">{ativo ? "Suspender conta" : "Reativar conta"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={deleteMutation.isPending}
                              className="cursor-pointer gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:focus:text-rose-300"
                              onClick={() => {
                                if (window.confirm(`Tem a certeza que deseja eliminar o utilizador "${user.nome}"?`)) {
                                  deleteMutation.mutate(user.id);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                              <span className="text-[13px]">Eliminar utilizador</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {meta && meta.totalPages > 1 && (
          <div className="flex flex-col gap-3 border-t border-gray-100/80 px-4 py-3.5 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:px-5">
            <p className="text-[11px] text-gray-400 dark:text-zinc-500">
              A mostrar <span className="font-semibold text-gray-700 dark:text-zinc-200">{rangeStart}–{rangeEnd}</span> de{" "}
              <span className="font-semibold text-gray-700 dark:text-zinc-200">{meta.total.toLocaleString("pt-PT")}</span>
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="h-8 rounded-lg border-gray-200/80 text-[11px] dark:border-white/[0.08]"
              >
                <ChevronLeft size={14} />
                Anterior
              </Button>
              <span className="min-w-[54px] text-center text-[11px] font-medium text-gray-500 dark:text-zinc-400">
                {meta.page} / {meta.totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="h-8 rounded-lg border-gray-200/80 text-[11px] dark:border-white/[0.08]"
              >
                Próxima
                <ChevronRight size={14} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsuariosAdmin;
