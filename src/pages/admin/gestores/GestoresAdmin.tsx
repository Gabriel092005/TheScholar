import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Award,
  BookOpen,
  Check,
  Loader2,
  MoreHorizontal,
  Newspaper,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserX,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getGestoresMetrics } from "@/api/gestores";
import { usuariosApi } from "@/api/usuarios";
import { useUser } from "@/api/useGetProfile";
import { AdminPageHeader, adminSurface } from "@/components/admin/admin-ui";
import { BandeiraPais } from "@/components/bandeira-pais";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
        {hint && <p className="truncate text-[9px] text-gray-400 dark:text-zinc-600">{hint}</p>}
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

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join("").toUpperCase() || "GE";
}

export function GestoresAdmin() {
  const queryClient = useQueryClient();
  const { user } = useUser();
  const isAdmin = user?.role === "ADMIN";
  const [search, setSearch] = useState("");

  const columns = [
    "Gestor",
    "País",
    "Bolsas",
    "Cursos",
    "Novidades",
    "Estado",
    "Último acesso",
    ...(isAdmin ? ["Ações"] : []),
  ];

  const { data, isLoading, isError } = useQuery({
    queryKey: ["gestores-metrics"],
    queryFn: getGestoresMetrics,
  });

  const gestores = data?.gestores ?? [];
  const metrics = data?.metrics;

  const filtrados = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return gestores;
    return gestores.filter(
      (g) =>
        g.nome.toLowerCase().includes(term) ||
        g.email.toLowerCase().includes(term) ||
        (g.paisMentoria ?? "").toLowerCase().includes(term),
    );
  }, [gestores, search]);

  const totalBolsas = gestores.reduce((sum, g) => sum + (g._count?.bolsasCriadas ?? 0), 0);
  const totalNovidades = gestores.reduce((sum, g) => sum + (g._count?.novidades ?? 0), 0);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["gestores-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] });
  };

  const alterarRoleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: "ADMIN" | "GESTOR" | "USUARIO" }) =>
      usuariosApi.alterarRole(userId, role),
    onSuccess: () => {
      invalidate();
      toast.success("Função alterada com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao alterar função");
    },
  });

  const suspenderMutation = useMutation({
    mutationFn: usuariosApi.suspender,
    onSuccess: () => {
      invalidate();
      toast.success("Estado da conta alterado!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao alterar estado");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: usuariosApi.delete,
    onSuccess: () => {
      invalidate();
      toast.success("Gestor eliminado com sucesso!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao eliminar gestor");
    },
  });

  return (
    <div className="space-y-5">
      <AdminPageHeader
        eyebrow="Plataforma"
        title="Gestores & Mentores"
        description="Acompanhe e gira os gestores e mentores responsáveis pelas bolsas, cursos e conteúdos da plataforma."
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard label="Gestores" value={(metrics?.total ?? gestores.length).toLocaleString("pt-PT")} icon={Users} tone="emerald" hint="contas de gestão" />
        <StatCard label="Ativos" value={(metrics?.activos ?? 0).toLocaleString("pt-PT")} icon={UserCheck} tone="teal" hint="com acesso" />
        <StatCard label="Bolsas" value={totalBolsas.toLocaleString("pt-PT")} icon={Award} tone="amber" hint="criadas" />
        <StatCard label="Novidades" value={totalNovidades.toLocaleString("pt-PT")} icon={Newspaper} tone="emerald" hint="publicadas" />
      </div>

      <div className={cn(adminSurface, "overflow-hidden")}>
        <div className="flex flex-col gap-3 border-b border-gray-100/80 p-4 dark:border-white/[0.06] sm:flex-row sm:items-center sm:justify-between sm:p-5">
          <div className="relative w-full sm:max-w-sm">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar por nome, email ou país..."
              className="h-10 rounded-xl border-gray-200/80 bg-gray-50/70 pl-10 text-sm dark:border-white/[0.07] dark:bg-white/[0.03]"
            />
          </div>
          <span className="text-[11px] font-medium text-gray-400 dark:text-zinc-500">
            {filtrados.length.toLocaleString("pt-PT")} resultado{filtrados.length === 1 ? "" : "s"}
          </span>
        </div>

        <ScrollArea className="w-full">
          <table className="w-full min-w-[860px] text-left">
            <thead>
              <tr className="border-b border-gray-100/80 dark:border-white/[0.06]">
                {columns.map((label, i) => (
                  <th
                    key={label}
                    className={cn(
                      "px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-600",
                      i === columns.length - 1 && isAdmin && "text-right",
                    )}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <Loader2 className="mx-auto h-7 w-7 animate-spin text-emerald-500" />
                  </td>
                </tr>
              ) : isError ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center text-sm text-rose-600 dark:text-rose-400">
                    Não foi possível carregar os gestores. Recarregue a página.
                  </td>
                </tr>
              ) : filtrados.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} className="py-16 text-center">
                    <div className="mx-auto mb-3 grid size-12 place-items-center rounded-2xl bg-gray-100 text-gray-400 dark:bg-white/[0.05] dark:text-zinc-600">
                      <Shield size={22} />
                    </div>
                    <p className="text-sm font-medium text-gray-700 dark:text-zinc-300">
                      Nenhum gestor encontrado
                    </p>
                    <p className="mt-1 text-xs text-gray-400 dark:text-zinc-500">
                      Promova um utilizador a gestor na página de utilizadores.
                    </p>
                  </td>
                </tr>
              ) : (
                filtrados.map((gestor) => {
                  const ativo = gestor.estado_conta === "ACTIVA";
                  return (
                    <tr
                      key={gestor.id}
                      className="group border-b border-gray-100/70 transition-colors last:border-0 hover:bg-gray-50/60 dark:border-white/[0.05] dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="grid size-9 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-400 to-orange-500 text-[12px] font-bold text-white shadow-sm shadow-amber-500/20">
                            {initials(gestor.nome)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-gray-900 dark:text-white">
                              {gestor.nome}
                            </p>
                            <p className="truncate text-[11px] text-gray-400 dark:text-zinc-500">
                              {gestor.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3.5">
                        {gestor.paisMentoria ? (
                          <span className="inline-flex items-center gap-2 text-[12px] text-gray-700 dark:text-zinc-300">
                            <BandeiraPais pais={gestor.paisMentoria} className="h-3.5 w-5 shrink-0" />
                            {gestor.paisMentoria}
                          </span>
                        ) : (
                          <span className="text-[12px] text-gray-400 dark:text-zinc-500">Por definir</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 dark:text-zinc-300">
                          <Award size={13} className="text-gray-400 dark:text-zinc-500" />
                          {gestor._count?.bolsasCriadas ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-gray-700 dark:text-zinc-300">
                          <BookOpen size={13} className="text-gray-400 dark:text-zinc-500" />
                          {gestor._count?.cursosCriados ?? 0}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="inline-flex min-w-7 items-center justify-center rounded-lg bg-gray-100 px-2 py-1 text-[11px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300">
                          {gestor._count?.novidades ?? 0}
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
                        {formatDate(gestor.last_active_at)}
                      </td>
                      {isAdmin && (
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
                              Função
                            </DropdownMenuLabel>
                            <DropdownMenuItem
                              disabled={alterarRoleMutation.isPending}
                              className="cursor-pointer gap-2 text-gray-700 focus:bg-emerald-50 focus:text-emerald-700 dark:text-zinc-200 dark:focus:bg-emerald-500/10 dark:focus:text-emerald-300"
                              onClick={() => alterarRoleMutation.mutate({ userId: gestor.id, role: "ADMIN" })}
                            >
                              <ShieldCheck size={14} className="text-gray-400 dark:text-zinc-500" />
                              <span className="text-[13px]">Promover a Admin</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="cursor-pointer gap-2 text-gray-700 dark:text-zinc-200"
                              disabled
                            >
                              <Shield size={14} className="text-emerald-500" />
                              <span className="text-[13px]">Gestor</span>
                              <Check size={14} className="ml-auto text-emerald-500" />
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-100 dark:bg-white/[0.06]" />
                            <DropdownMenuItem
                              disabled={suspenderMutation.isPending}
                              className="cursor-pointer gap-2 text-gray-700 focus:bg-gray-50 focus:text-gray-900 dark:text-zinc-200 dark:focus:bg-white/[0.06] dark:focus:text-white"
                              onClick={() => suspenderMutation.mutate(gestor.id)}
                            >
                              {ativo ? <UserX size={14} className="text-gray-400 dark:text-zinc-500" /> : <UserCheck size={14} className="text-gray-400 dark:text-zinc-500" />}
                              <span className="text-[13px]">{ativo ? "Suspender conta" : "Reativar conta"}</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              disabled={deleteMutation.isPending}
                              className="cursor-pointer gap-2 text-rose-600 focus:bg-rose-50 focus:text-rose-600 dark:text-rose-400 dark:focus:bg-rose-500/10 dark:focus:text-rose-300"
                              onClick={() => {
                                if (window.confirm(`Tem a certeza que deseja eliminar o gestor "${gestor.nome}"?`)) {
                                  deleteMutation.mutate(gestor.id);
                                }
                              }}
                            >
                              <Trash2 size={14} />
                              <span className="text-[13px]">Eliminar gestor</span>
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
    </div>
  );
}

export default GestoresAdmin;
