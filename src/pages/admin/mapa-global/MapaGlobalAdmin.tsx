import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { mapaGlobalApi, type MapaGlobalItem } from "@/api/mapa-global";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapaGlobal } from "@/components/mapa-global/MapaGlobal";
import { Plus, Trash2, Loader2, Globe, Search } from "lucide-react";
import { paises } from "@/data/paises";
import toast from "react-hot-toast";

export function MapaGlobalAdmin() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);

  const [nome, setNome] = useState("");
  const [curso, setCurso] = useState("");
  const [pais, setPais] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [latitude, setLatitude] = useState("");
  const [longitude, setLongitude] = useState("");
  const [texto, setTexto] = useState("");
  const [paisSearch, setPaisSearch] = useState("");
  const [paisOpen, setPaisOpen] = useState(false);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["mapa-global"],
    queryFn: mapaGlobalApi.list,
  });

  const createMutation = useMutation({
    mutationFn: mapaGlobalApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapa-global"] });
      toast.success("Marcador adicionado!");
      setShowForm(false);
      setNome(""); setCurso(""); setPais(""); setBandeira("");
      setLatitude(""); setLongitude(""); setTexto("");
      setPaisSearch("");
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Erro ao adicionar marcador");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: mapaGlobalApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mapa-global"] });
      toast.success("Marcador removido!");
    },
    onError: () => toast.error("Erro ao remover marcador"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!latitude || !longitude) {
      toast.error("Selecione um país");
      return;
    }
    createMutation.mutate({ nome, curso, pais, bandeira, latitude: parseFloat(latitude), longitude: parseFloat(longitude), texto: texto || undefined });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Mapa Global</h1>
          <p className="text-sm text-gray-500 dark:text-zinc-400">
            Gerir marcadores de alunos aprovados ao redor do mundo
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="gap-2">
          <Plus className="h-4 w-4" />
          {showForm ? "Cancelar" : "Adicionar marcador"}
        </Button>
      </div>

      {/* Map preview */}
      <div className="rounded-2xl overflow-hidden border border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.04] p-4">
        <MapaGlobal items={items} />
      </div>

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-600 dark:text-zinc-400">Nome do aluno *</Label>
              <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: João Silva" className="mt-1" required />
            </div>
            <div>
              <Label className="text-sm text-gray-600 dark:text-zinc-400">Curso *</Label>
              <Input value={curso} onChange={(e) => setCurso(e.target.value)} placeholder="Ex: Medicina" className="mt-1" required />
            </div>
            <div className="sm:col-span-2 relative">
              <Label className="text-sm text-gray-600 dark:text-zinc-400">País *</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                <Input
                  value={paisSearch}
                  onChange={(e) => { setPaisSearch(e.target.value); setPaisOpen(true); }}
                  onFocus={() => setPaisOpen(true)}
                  onBlur={() => setTimeout(() => setPaisOpen(false), 200)}
                  placeholder="Pesquisar país..."
                  className="pl-9"
                />
                {paisOpen && (
                  <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto rounded-xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-700 shadow-lg">
                    {paises.filter((p) => p.nome.toLowerCase().includes(paisSearch.toLowerCase())).map((p) => (
                      <button
                        key={p.nome}
                        type="button"
                        onClick={() => {
                          setPais(p.nome);
                          setBandeira(p.bandeira);
                          setLatitude(String(p.latitude));
                          setLongitude(String(p.longitude));
                          setPaisSearch(`${p.bandeira} ${p.nome}`);
                          setPaisOpen(false);
                        }}
                        className="flex items-center gap-3 w-full px-3 py-2 text-sm text-left text-gray-700 dark:text-zinc-300 hover:bg-gray-100 dark:hover:bg-white/[0.06] transition-colors"
                      >
                        <span className="text-base">{p.bandeira}</span>
                        <span>{p.nome}</span>
                      </button>
                    ))}
                    {paises.filter((p) => p.nome.toLowerCase().includes(paisSearch.toLowerCase())).length === 0 && (
                      <p className="px-3 py-2 text-sm text-gray-400">Nenhum país encontrado</p>
                    )}
                  </div>
                )}
              </div>
              {pais && (
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-1">
                  {bandeira} {pais} ({latitude}, {longitude})
                </p>
              )}
            </div>
          </div>
          <div>
            <Label className="text-sm text-gray-600 dark:text-zinc-400">Depoimento (opcional)</Label>
            <Textarea value={texto} onChange={(e) => setTexto(e.target.value)} placeholder="Relato do aluno..." className="mt-1 min-h-[80px]" />
          </div>
          <Button type="submit" disabled={createMutation.isPending} className="gap-2">
            {createMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            {createMutation.isPending ? "A adicionar..." : "Adicionar marcador"}
          </Button>
        </form>
      )}

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-10 text-gray-400 dark:text-zinc-500">
          <Globe className="h-10 w-10 mx-auto mb-2 opacity-50" />
          <p>Nenhum marcador adicionado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06]"
            >
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs shrink-0">
                {item.nome.split(" ").map(n => n[0]).join("").substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {item.bandeira} {item.nome}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-400 truncate">
                  {item.curso} — {item.pais}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { if (window.confirm("Remover este marcador?")) deleteMutation.mutate(item.id); }}
                className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
              >
                {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
