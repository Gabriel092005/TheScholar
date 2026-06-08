import { useState } from "react";
import { useConfirmDialog } from "@/hooks/use-confirm-dialog";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageCircle, Loader2, Search, Check, X, Trash2, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { depoimentosApi } from "@/api/depoimentos";
import toast from "react-hot-toast";

export function DepoimentosAdmin() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todas");

  const { data: depoimentos = [], isLoading } = useQuery({
    queryKey: ["admin-depoimentos", filterStatus],
    queryFn: () => depoimentosApi.listAll(filterStatus !== "todas" ? filterStatus : undefined),
  });

  const aprovarMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: "PUBLICADO" | "RASCUNHO" }) =>
      depoimentosApi.aprovar(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-depoimentos"] });
      toast.success("Depoimento atualizado!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao atualizar depoimento");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: depoimentosApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-depoimentos"] });
      toast.success("Depoimento removido!");
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || "Erro ao remover depoimento");
    },
  });

  const filtered = depoimentos.filter((d) =>
    !search || d.nome.toLowerCase().includes(search.toLowerCase()) ||
    d.texto.toLowerCase().includes(search.toLowerCase())
  );
  const { confirm, ConfirmDialog } = useConfirmDialog();

  return (
    <div className="p-6">
      <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
        <div className="p-5 border-b border-gray-100 dark:border-white/[0.06] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Depoimentos</h2>
            <p className="text-sm text-gray-500 dark:text-zinc-500">
              Gerir depoimentos enviados pelos utilizadores
            </p>
          </div>
          <MessageCircle size={20} className="text-gray-400 dark:text-zinc-600" />
        </div>

        <div className="p-5 flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar depoimentos..."
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todos</SelectItem>
              <SelectItem value="RASCUNHO">Pendentes</SelectItem>
              <SelectItem value="PUBLICADO">Publicados</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <ScrollArea className="w-full whitespace-nowrap">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-white/[0.06]">
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Utilizador</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Depoimento</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Rating</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Status</th>
                <th className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Data</th>
                <th className="text-right px-5 py-3 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-zinc-500">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6} className="text-center py-12"><Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto" /></td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={6} className="text-center py-12 text-gray-500 dark:text-zinc-500">Nenhum depoimento encontrado</td></tr>
              ) : (
                filtered.map((d) => (
                  <tr key={d.id} className="border-b border-gray-50 dark:border-white/[0.05] hover:bg-gray-50 dark:hover:bg-white/[0.03]">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-100 dark:bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                          {d.nome.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white text-sm">{d.nome}</p>
                          <p className="text-xs text-gray-400 dark:text-zinc-500">{d.curso}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 max-w-[300px]">
                      <p className="text-sm text-gray-600 dark:text-zinc-400 truncate">{d.texto}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                        <Star size={12} /> {d.rating}/5
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${
                        d.status === "PUBLICADO"
                          ? "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : "bg-yellow-50 dark:bg-yellow-500/10 text-yellow-600 dark:text-yellow-400"
                      }`}>
                        {d.status === "PUBLICADO" ? "Publicado" : "Pendente"}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-sm text-gray-500 dark:text-zinc-500">
                        {new Date(d.created_at).toLocaleDateString("pt-PT")}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {d.status === "RASCUNHO" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-500/10"
                            disabled={aprovarMutation.isPending}
                            onClick={() => aprovarMutation.mutate({ id: d.id, status: "PUBLICADO" })}
                          >
                            <Check size={14} className="mr-1" /> Aprovar
                          </Button>
                        )}
                        {d.status === "PUBLICADO" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs h-8 text-yellow-500 hover:text-yellow-700 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                            disabled={aprovarMutation.isPending}
                            onClick={() => aprovarMutation.mutate({ id: d.id, status: "RASCUNHO" })}
                          >
                            <X size={14} className="mr-1" /> Rejeitar
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-500/10"
                          disabled={deleteMutation.isPending}
                          onClick={async () => { const ok = await confirm("Remover depoimento?"); if (ok) deleteMutation.mutate(d.id); }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </ScrollArea>
      </div>
      <ConfirmDialog />
    </div>
  );
}

export default DepoimentosAdmin;
