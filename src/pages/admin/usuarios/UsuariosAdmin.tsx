import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Users, Loader2, Shield, ShieldCheck, User, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usuariosApi } from "@/api/usuarios";
import toast from "react-hot-toast";

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  GESTOR: "Gestor",
  USUARIO: "Utilizador",
};

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400",
  GESTOR: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
  USUARIO: "bg-gray-100 dark:bg-white/[0.06] text-gray-600 dark:text-zinc-400",
};

const roleIcons: Record<string, any> = {
  ADMIN: ShieldCheck,
  GESTOR: Shield,
  USUARIO: User,
};

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

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Utilizadores</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Gerir utilizadores da plataforma
            </p>
          </div>
          <Users size={20} className="text-gray-400 dark:text-zinc-600" />
        </div>

        <div className="p-5 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Pesquisar por nome ou email..."
              className="pl-10"
            />
          </div>
          <Select value={filterRole} onValueChange={(v) => { setFilterRole(v); setPage(1); }}>
            <SelectTrigger className="w-36 text-gray-900 dark:text-white">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#111113] border-gray-200 dark:border-white/[0.1]">
              <SelectItem value="todas" className="text-gray-700 dark:text-gray-200">Todas as roles</SelectItem>
              <SelectItem value="ADMIN" className="text-gray-700 dark:text-gray-200">Admin</SelectItem>
              <SelectItem value="GESTOR" className="text-gray-700 dark:text-gray-200">Gestor</SelectItem>
              <SelectItem value="USUARIO" className="text-gray-700 dark:text-gray-200">Utilizador</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterEstado} onValueChange={(v) => { setFilterEstado(v); setPage(1); }}>
            <SelectTrigger className="w-36 text-gray-900 dark:text-white">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-[#111113] border-gray-200 dark:border-white/[0.1]">
              <SelectItem value="todas" className="text-gray-700 dark:text-gray-200">Todos os estados</SelectItem>
              <SelectItem value="ACTIVA" className="text-gray-700 dark:text-gray-200">Activa</SelectItem>
              <SelectItem value="INACTIVA" className="text-gray-700 dark:text-gray-200">Inactiva</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Utilizador</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Email</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Role</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Estado</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Registo</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" />
                  </td>
                </tr>
              ) : usuarios.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <Users size={40} className="mx-auto text-gray-300 dark:text-zinc-700 mb-3" />
                    <p className="text-gray-500 dark:text-zinc-500">Nenhum utilizador encontrado</p>
                  </td>
                </tr>
              ) : (
                usuarios.map((user) => {
                  const RoleIcon = roleIcons[user.role] || User;
                  return (
                    <tr
                      key={user.id}
                      className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm shrink-0">
                            {user.nome.substring(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{user.nome}</p>
                            {user.phone && (
                              <p className="text-xs text-gray-400 dark:text-zinc-500">{user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-600 dark:text-zinc-400">{user.email}</span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${roleColors[user.role]}`}>
                          <RoleIcon size={12} />
                          {roleLabels[user.role]}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                          user.estado_conta === "ACTIVA"
                            ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                            : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            user.estado_conta === "ACTIVA" ? "bg-emerald-500" : "bg-red-500"
                          }`} />
                          {user.estado_conta === "ACTIVA" ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-sm text-gray-500 dark:text-zinc-500">
                          {new Date(user.created_at).toLocaleDateString("pt-PT")}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" className="text-xs h-8 text-gray-700 dark:text-gray-200">
                                {roleLabels[user.role]}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white dark:bg-[#111113] border-gray-200 dark:border-white/[0.1]">
                              {["ADMIN", "GESTOR", "USUARIO"].map((r) => (
                                <DropdownMenuItem
                                  key={r}
                                  disabled={r === user.role || alterarRoleMutation.isPending}
                                  className="cursor-pointer text-gray-700 dark:text-gray-200"
                                  onClick={() => alterarRoleMutation.mutate({ userId: user.id, role: r as any })}
                                >
                                  <span className={`text-xs ${r === user.role ? "text-emerald-500 dark:text-emerald-400 font-medium" : ""}`}>
                                    {roleLabels[r]} {r === user.role ? "✓" : ""}
                                  </span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`text-xs h-8 ${
                              user.estado_conta === "ACTIVA"
                                ? "text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                                : "text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            }`}
                            disabled={suspenderMutation.isPending}
                            onClick={() => suspenderMutation.mutate(user.id)}
                          >
                            {user.estado_conta === "ACTIVA" ? "Suspender" : "Ativar"}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                            disabled={deleteMutation.isPending}
                            onClick={() => {
                              if (window.confirm(`Tem a certeza que deseja eliminar o utilizador "${user.nome}"?`)) {
                                deleteMutation.mutate(user.id);
                              }
                            }}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </ScrollArea>

        {meta && meta.totalPages > 1 && (
          <div className="p-5 border-t border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Mostrando página {meta.page} de {meta.totalPages} ({meta.total} total)
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= meta.totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Próxima
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UsuariosAdmin;
