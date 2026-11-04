import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Building2, Loader2, Search, UsersRound, X, type LucideIcon } from "lucide-react";
import { adminApi } from "@/api/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AdminPanel, EmptyState, ProgressBar } from "@/components/admin/admin-ui";
import { getUploadUrl } from "@/lib/axios";

const formatarKz = (valor: number) =>
  new Intl.NumberFormat("pt-AO", {
    style: "currency",
    currency: "AOA",
    maximumFractionDigits: 0,
  }).format(valor);

function Resumo({ rotulo, valor, destaque = false }: { rotulo: string; valor: string; destaque?: boolean }) {
  return (
    <div className="min-w-0">
      <p className="text-xs text-gray-500 dark:text-zinc-400">{rotulo}</p>
      <p
        className={`mt-1 break-words text-lg font-semibold tabular-nums tracking-tight sm:text-xl ${
          destaque ? "text-emerald-700 dark:text-emerald-400" : "text-gray-900 dark:text-white"
        }`}
      >
        {valor}
      </p>
    </div>
  );
}

function Linha({
  nome,
  detalhe,
  total,
  mes,
  parte,
  imagem,
  icon: Icon,
}: {
  nome: string;
  detalhe: string;
  total: number;
  mes: number;
  parte: number;
  imagem?: string | null;
  icon?: LucideIcon;
}) {
  return (
    <li className="py-3">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-100 text-[11px] font-semibold text-gray-600 dark:bg-white/[0.06] dark:text-zinc-300">
          {imagem ? (
            <img src={getUploadUrl(`/uploads/${imagem}`)} alt="" className="h-full w-full object-cover" />
          ) : Icon ? (
            <Icon className="h-4 w-4" />
          ) : (
            nome.substring(0, 2).toUpperCase()
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{nome}</p>
          <p className="truncate text-xs text-gray-500 dark:text-zinc-400">{detalhe}</p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-semibold tabular-nums text-gray-900 dark:text-white">{formatarKz(total)}</p>
          <p className="text-xs tabular-nums text-gray-500 dark:text-zinc-400">{formatarKz(mes)} este mês</p>
        </div>
      </div>
      {total > 0 && <ProgressBar value={parte} className="mt-2" />}
    </li>
  );
}

export function ReceitaGestoresPanel() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["admin-receita-gestores"],
    queryFn: adminApi.getReceitaGestores,
  });
  const [email, setEmail] = useState("");

  const termo = email.trim().toLowerCase();
  const gestores = (data?.gestores ?? []).filter((g) => g.email.toLowerCase().includes(termo));
  const somaFiltrada = (campo: "total" | "mes" | "pagamentos") =>
    gestores.reduce((acc, g) => acc + g[campo], 0);

  return (
    <AdminPanel
      title="Receita por gestor"
      subtitle="Pagamentos confirmados das bolsas, mentorias, cursos e documentos de cada gestor"
      icon={UsersRound}
    >
      {isLoading ? (
        <div className="flex justify-center py-10">
          <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
        </div>
      ) : isError || !data ? (
        <div className="pb-6 text-center">
          <EmptyState
            icon={UsersRound}
            title="Não foi possível carregar a receita"
            description="Verifique a ligação e tente novamente."
          />
          <Button variant="outline" className="rounded-xl dark:text-white" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 border-b border-gray-100 pb-4 dark:border-white/[0.06] sm:grid-cols-3">
            {termo ? (
              <>
                <Resumo rotulo="Receita filtrada" valor={formatarKz(somaFiltrada("total"))} destaque />
                <Resumo rotulo="Este mês" valor={formatarKz(somaFiltrada("mes"))} />
                <Resumo rotulo="Pagamentos" valor={somaFiltrada("pagamentos").toLocaleString("pt-PT")} />
              </>
            ) : (
              <>
                <Resumo rotulo="Receita dos gestores" valor={formatarKz(data.totalGestores)} destaque />
                <Resumo rotulo="Receita total" valor={formatarKz(data.total)} />
                <Resumo rotulo="Total este mês" valor={formatarKz(data.mes)} />
              </>
            )}
          </div>

          {data.gestores.length > 0 && (
            <div className="relative mt-4">
              <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-zinc-500" />
              <Input
                type="text"
                inputMode="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Filtrar por email do gestor"
                aria-label="Filtrar por email do gestor"
                className="h-10 rounded-xl pl-9 pr-9 text-sm dark:text-white"
              />
              {email && (
                <button
                  type="button"
                  onClick={() => setEmail("")}
                  aria-label="Limpar filtro"
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-zinc-500 dark:hover:bg-white/[0.06] dark:hover:text-white"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          )}

          {data.gestores.length === 0 && data.semGestor.total === 0 ? (
            <EmptyState icon={UsersRound} title="Ainda não há gestores nem receita" />
          ) : termo && gestores.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Nenhum gestor com este email"
              description="Verifique o email ou escreva só uma parte dele."
            />
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-white/[0.06]">
              {gestores.map((gestor) => (
                <Linha
                  key={gestor.id}
                  nome={gestor.nome}
                  imagem={gestor.image_path}
                  detalhe={`${gestor.email} · ${gestor.pagamentos.toLocaleString("pt-PT")} ${gestor.pagamentos === 1 ? "pagamento" : "pagamentos"}`}
                  total={gestor.total}
                  mes={gestor.mes}
                  parte={data.total > 0 ? (gestor.total / data.total) * 100 : 0}
                />
              ))}
              {!termo && data.semGestor.total > 0 && (
                <Linha
                  nome="Administração e sem gestor"
                  icon={Building2}
                  detalhe="Conteúdo publicado pela administração ou sem responsável"
                  total={data.semGestor.total}
                  mes={data.semGestor.mes}
                  parte={data.total > 0 ? (data.semGestor.total / data.total) * 100 : 0}
                />
              )}
            </ul>
          )}
        </>
      )}
    </AdminPanel>
  );
}
