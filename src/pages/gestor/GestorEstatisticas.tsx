import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Award, BookOpen, FileText, Loader2, Wallet, PlusCircle } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, Cell, Pie, PieChart,
  ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { gestorApi } from "@/api/gestor";
import { PageHeader, SectionCard, StatCard, softText, faintText } from "./ui";
import { Button } from "@/components/ui/button";

const PIE_COLORS = ["#10b981", "#34d399", "#6ee7b7", "#a7f3d0", "#d1fae5", "#a1a1aa"];

const formatCurrency = (value: number) =>
  new Intl.NumberFormat("pt-AO", { style: "currency", currency: "AOA", maximumFractionDigits: 0 }).format(value);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString("pt-PT") : "—";

export function GestorEstatisticas() {
  const { data, isLoading } = useQuery({
    queryKey: ["gestor-dashboard"],
    queryFn: gestorApi.getDashboard,
  });

  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-32">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) return null;

  const m = data.metrics;
  const nomeMentor = data.gestor.nome || "";

  const miniStats = [
    { label: "Estudantes", value: String(m.estudantes), hint: `${m.pagamentosAprovados} pagamentos aprovados` },
    { label: "Receita de bolsas", value: formatCurrency(m.receitaInscricoes), hint: `${m.inscricoesAprovadas} inscrições aprovadas` },
    { label: "Receita de cursos", value: formatCurrency(m.receitaCursos), hint: `${m.pagamentosPendentes} pagamentos pendentes` },
    { label: "Receita de documentos", value: formatCurrency(m.receitaDocumentos), hint: `${m.documentosPublicados} de ${m.documentosTotal} publicados` },
  ];

  const pieData = data.cursosPorCategoria.filter((c) => c.total > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title={nomeMentor ? `Olá mentor, ${nomeMentor}` : "Olá mentor"}
        description="Acompanhe o desempenho das suas bolsas, cursos e documentos."
      />

      <div className="flex items-center justify-between mt-4">
        <Button size="sm" variant="outline" onClick={() => navigate("/gestor/cursos/criar")} className="dark:text-white">
          <PlusCircle className="mr-1.5 h-3.5 w-3.5" /> Novo curso
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          label="Bolsas publicadas"
          value={m.bolsasPublicadas}
          hint={`de ${m.bolsasTotal} criadas`}
          icon={Award}
          highlight
        />
        <StatCard
          label="Cursos publicados"
          value={m.cursosPublicados}
          hint={`de ${m.cursosTotal} criados`}
          icon={BookOpen}
        />
        <StatCard
          label="Inscrições"
          value={m.inscricoesTotal}
          hint={`${m.inscricoesPendentes} pendentes`}
          icon={FileText}
        />
        <StatCard
          label="Receita total"
          value={formatCurrency(m.receitaTotal)}
          hint="bolsas + cursos + documentos"
          icon={Wallet}
        />
      </div>

      <SectionCard>
        <div className="grid grid-cols-2 divide-zinc-100 dark:divide-white/[0.06] md:grid-cols-4 md:divide-x">
          {miniStats.map((stat, index) => (
            <div
              key={stat.label}
              className={`p-5 ${index < 2 ? "border-b border-zinc-100 dark:border-white/[0.06] md:border-b-0" : ""}`}
            >
              <p className={`text-[10px] font-medium uppercase tracking-[0.14em] ${faintText}`}>
                {stat.label}
              </p>
              <p className="mt-2 text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
                {stat.value}
              </p>
              <p className={`mt-0.5 text-[11px] ${faintText}`}>{stat.hint}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <SectionCard
          title="Publicações"
          description="Últimos 6 meses"
          className="lg:col-span-2"
        >
          <div className="h-[290px] p-4 pt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crescimentoMensal} barGap={4}>
                <CartesianGrid vertical={false} stroke="#71717a" strokeOpacity={0.15} strokeDasharray="4 4" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} dy={6} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#a1a1aa", fontSize: 11 }} allowDecimals={false} width={28} />
                <Tooltip
                  cursor={{ fill: "#71717a", fillOpacity: 0.08 }}
                  contentStyle={{
                    backgroundColor: "#18181b",
                    border: "1px solid #27272a",
                    borderRadius: "10px",
                    fontSize: "12px",
                    color: "#fafafa",
                  }}
                />
                <Bar dataKey="bolsas" name="Bolsas" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="cursos" name="Cursos" fill="#6ee7b7" radius={[4, 4, 0, 0]} maxBarSize={20} />
                <Bar dataKey="inscricoes" name="Inscrições" fill="#a1a1aa" radius={[4, 4, 0, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </SectionCard>

        <SectionCard title="Cursos por categoria">
          {pieData.length === 0 ? (
            <div className={`flex h-[290px] items-center justify-center text-xs ${faintText}`}>
              Ainda sem cursos
            </div>
          ) : (
            <div className="h-[290px] p-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="total"
                    nameKey="nome"
                    innerRadius={54}
                    outerRadius={88}
                    paddingAngle={3}
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={entry.nome} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #27272a",
                      borderRadius: "10px",
                      fontSize: "12px",
                      color: "#fafafa",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="-mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1.5">
                {pieData.slice(0, 5).map((entry, index) => (
                  <span key={entry.nome} className={`flex items-center gap-1.5 text-[11px] ${softText}`}>
                    <span
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}
                    />
                    {entry.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Últimas bolsas" description="As suas publicações mais recentes">
          {data.ultimasBolsas.length === 0 ? (
            <div className={`p-8 text-center text-xs ${faintText}`}>Ainda não publicou bolsas</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {data.ultimasBolsas.map((bolsa) => (
                <div key={bolsa.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-white/[0.05] dark:text-zinc-500">
                    <Award size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {bolsa.titulo}
                    </p>
                    <p className={`mt-0.5 truncate text-[11px] ${faintText}`}>
                      {bolsa.pais || "Sem país"} · Prazo {formatDate(bolsa.prazo)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[13px] font-semibold text-zinc-800 dark:text-zinc-200">{bolsa.inscricoes}</p>
                    <p className={`text-[10px] ${faintText}`}>inscrições</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </SectionCard>

        <SectionCard title="Últimos cursos" description="As suas publicações mais recentes">
          {data.ultimosCursos.length === 0 ? (
            <div className={`p-8 text-center text-xs ${faintText}`}>Ainda não publicou cursos</div>
          ) : (
            <div className="divide-y divide-zinc-100 dark:divide-white/[0.06]">
              {data.ultimosCursos.map((curso) => (
                <div key={curso.id} className="flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-white/[0.02]">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400 dark:bg-white/[0.05] dark:text-zinc-500">
                    <BookOpen size={15} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-medium text-zinc-800 dark:text-zinc-200">
                      {curso.titulo}
                    </p>
                    <p className={`mt-0.5 truncate text-[11px] ${faintText}`}>
                      {curso.estudantes} estudante(s) · {formatCurrency(curso.preco)}
                    </p>
                  </div>
                  <span className={`shrink-0 text-[10px] font-medium uppercase tracking-wide ${
                    curso.status === "PUBLICADO"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-zinc-400 dark:text-zinc-500"
                  }`}>
                    {curso.status === "PUBLICADO" ? "Publicado" : "Rascunho"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  );
}

export default GestorEstatisticas;
