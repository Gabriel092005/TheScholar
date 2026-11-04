import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  Users,
  Award,
  FileText,
  Briefcase,
  GraduationCap,
  TrendingUp,
  Loader2,
  Wallet,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import {
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  ReferenceDot,
} from "recharts";
import { adminApi } from "@/api/admin";
import { useUser } from "@/api/useGetProfile";
import { cn } from "@/lib/utils";
import { ReceitaGestoresPanel } from "./ReceitaGestoresPanel";
import {
  AdminPageHeader,
  AdminPanel,
  EmptyState,
  KpiTile,
  ProgressBar,
  type KpiTone,
} from "@/components/admin/admin-ui";

const ICON_MAP: Record<string, LucideIcon> = {
  Users,
  BookOpen,
  Award,
  FileText,
  Briefcase,
  GraduationCap,
};

const TONE_CYCLE: KpiTone[] = ["emerald", "blue", "amber", "violet", "rose", "teal"];

function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-gray-200/70 bg-white/95 p-4 shadow-sm backdrop-blur dark:border-white/10 dark:bg-[#151819]/95">
      <p className="mb-2 text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-zinc-500">
        {label}
      </p>
      <div className="space-y-0.5">
        {payload.map((item: any) => (
          <div key={item.dataKey} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-zinc-400">
              <span
                className="size-1 rounded"
                style={{ backgroundColor: item.color || item.stroke }}
              />
              {item.name}
            </span>
            <span className="text-[10px] font-medium text-gray-900 dark:text-white">
              {Number(item.value).toLocaleString("pt-PT")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function EstatisticasAdmin() {
  const { user } = useUser();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
  });

  const { data: receita } = useQuery({
    queryKey: ["admin-receita-gestores"],
    queryFn: adminApi.getReceitaGestores,
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    }).format(value);

  const months = data?.crescimentoMensal ?? [];

  const bestMonth = useMemo(() => {
    if (!months.length) return null;
    return months.reduce((best, item) => (item.users > best.users ? item : best), months[0]);
  }, [months]);

  const growth = useMemo(() => {
    if (months.length < 2) return 0;
    const last = months[months.length - 1];
    const prev = months[months.length - 2];
    if (!prev.users) return 0;
    return Math.round(((last.users - prev.users) / prev.users) * 100);
  }, [months]);

  const totalStudents = useMemo(
    () => (data?.cursosPopulares ?? []).reduce((sum, curso) => sum + curso.estudantes, 0),
    [data?.cursosPopulares],
  );

  const maxStudents = useMemo(
    () => Math.max(1, ...(data?.cursosPopulares ?? []).map((curso) => curso.estudantes)),
    [data?.cursosPopulares],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) {
    return (
      <AdminPanel>
        <EmptyState
          icon={TrendingUp}
          title="Sem dados disponíveis"
          description="Ainda não há informação suficiente para construir o dashboard."
        />
      </AdminPanel>
    );
  }

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Dashboard"
        description="Acompanhe o crescimento, receita e envolvimento da plataforma num único lugar."
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="flex flex-col gap-3 lg:col-span-4">
          <KpiTile
            accent
            label="Faturação total"
            value={formatCurrency(receita?.total ?? data.receitaTotal)}
            hint={`${formatCurrency(receita?.mes ?? 0)} este mês · mentorias, bolsas e cursos`}
            icon={Wallet}
            className="min-h-[168px]"
          />
          <div className="grid grid-cols-2 gap-3">
            <KpiTile
              label="Melhor mês"
              value={bestMonth?.month ?? "—"}
              hint={bestMonth ? `${bestMonth.users.toLocaleString("pt-PT")} utilizadores` : "Sem dados"}
              icon={Trophy}
              tone="amber"
            />
            <KpiTile
              label="Estudantes ativos"
              value={totalStudents.toLocaleString("pt-PT")}
              hint="Nos cursos populares"
              icon={GraduationCap}
              tone="violet"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:col-span-8">
          {data.statsCards.map((stat, index) => {
            const Icon = ICON_MAP[stat.icon] || Users;
            return (
              <KpiTile
                key={stat.label}
                label={stat.label}
                value={stat.value.toLocaleString("pt-PT")}
                icon={Icon}
                tone={TONE_CYCLE[index % TONE_CYCLE.length]}
              />
            );
          })}
        </div>
      </div>

      {user?.role === "ADMIN" && <ReceitaGestoresPanel />}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <AdminPanel
          className="lg:col-span-8"
          title="Crescimento mensal"
          subtitle="Evolução de utilizadores, cursos e bolsas"
          icon={TrendingUp}
          action={
            <div className="flex items-center gap-3 text-[9px] text-gray-500 dark:text-zinc-400 sm:flex">
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-emerald-400" /> Utilizadores
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-blue-400" /> Cursos
              </span>
              <span className="flex items-center gap-1.5">
                <i className="size-2 rounded-full bg-amber-400" /> Bolsas
              </span>
            </div>
          }
        >
          {months.length === 0 ? (
            <EmptyState icon={TrendingUp} title="Ainda sem histórico mensal" />
          ) : (
            <div className="h-[290px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={months} margin={{ top: 18, right: 8, left: -18, bottom: 0 }}>
                  <defs>
                    <linearGradient id="growth-bar" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0" stopColor="#6ee7a0" />
                      <stop offset="1" stopColor="#10b981" stopOpacity={0.35} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="4 2"
                    vertical={false}
                    stroke="rgba(113,113,122,0.12)"
                  />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 10, fontWeight: 500 }}
                    dy={6}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#71717a", fontSize: 9 }}
                    width={40}
                  />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(113,113,122,0.05)" }} />
                  <Bar
                    dataKey="users"
                    name="Utilizadores"
                    fill="url(#growth-bar)"
                    radius={[6, 6, 6, 6]}
                    barSize={16}
                    maxBarSize={20}
                  />
                  <Line
                    type="monotone"
                    dataKey="courses"
                    name="Cursos"
                    stroke="#60a5fa"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 1, stroke: "#fff" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="bolsas"
                    name="Bolsas"
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    dot={false}
                    activeDot={{ r: 3, strokeWidth: 1, stroke: "#fff" }}
                  />
                  {bestMonth && (
                    <ReferenceDot
                      x={bestMonth.month}
                      y={bestMonth.users}
                      r={3}
                      fill="#34d399"
                      stroke="#fff"
                      strokeWidth={1}
                      isFront
                    />
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          className="lg:col-span-4"
          title="Evolução de utilizadores"
          subtitle="Tendência dos últimos meses"
          icon={Users}
          action={
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-semibold",
                growth >= 0
                  ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
              )}
            >
              {growth >= 0 ? "+" : ""}
              {growth}%
            </span>
          }
        >
          {months.length === 0 ? (
            <EmptyState icon={Users} title="Ainda sem histórico de utilizadores" />
          ) : (
            <>
              <div className="mb-2 flex items-end justify-between gap-2">
                <div>
                  <p className="text-[9px] font-semibold uppercase tracking-[0.16em] text-gray-400 dark:text-zinc-500">
                    Último mês
                  </p>
                  <p className="mt-0.5 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
                    {months[months.length - 1].users.toLocaleString("pt-PT")}
                  </p>
                </div>
                <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                  {months[months.length - 1].month}
                </p>
              </div>
              <div className="h-[180px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={months} margin={{ top: 3, right: 3, left: 3, bottom: 0 }}>
                    <defs>
                      <linearGradient id="users-area" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0" stopColor="#34d399" stopOpacity={0.4} />
                        <stop offset="1" stopColor="#34d399" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: "#71717a", fontSize: 9 }}
                      dy={3}
                      interval="preserveStartEnd"
                    />
                    <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(113,113,122,0.2)" }} />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="Utilizadores"
                      stroke="#34d399"
                      strokeWidth={1.5}
                      fill="url(#users-area)"
                      activeDot={{ r: 3, strokeWidth: 1, stroke: "#fff" }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </>
          )}
        </AdminPanel>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AdminPanel
          title="Cursos mais populares"
          subtitle="Ordenados por número de estudantes"
          icon={GraduationCap}
          action={
            <a
              href="/admin/cursos"
              className="text-[9px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Ver todos
            </a>
          }
          bodyClassName="px-4 pb-4"
        >
          {data.cursosPopulares.length === 0 ? (
            <EmptyState icon={GraduationCap} title="Nenhum curso ainda" />
          ) : (
            <div className="space-y-3">
              {data.cursosPopulares.slice(0, 6).map((curso, index) => {
                const toneIndex = index % TONE_CYCLE.length;
                const tone = TONE_CYCLE[toneIndex];
                return (
                  <div key={curso.titulo} className="space-y-2 p-3 rounded-lg border border-white/80 dark:border-white/10 hover:bg-white/5 dark:hover:bg-white/10 transition-colors">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex min-w-0 items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded bg-white/90 text-[9px] font-semibold text-gray-500 dark:bg-white/10 dark:text-zinc-400">
                          {index + 1}
                        </span>
                        <div className="min-w-0">
                          <p className="truncate text-[12px] font-medium text-gray-900 dark:text-white">
                            {curso.titulo}
                          </p>
                          <p className="text-[9px] text-gray-400 dark:text-zinc-500">
                            {curso.estudantes.toLocaleString("pt-PT")} estudantes
                          </p>
                        </div>
                      </div>
                      <p className="shrink-0 text-[8px] font-medium text-gray-900 dark:text-white">
                        {formatCurrency(curso.receita)}
                      </p>
                    </div>
                    <ProgressBar
                      value={(curso.estudantes / maxStudents) * 100}
                      tone={tone}
                    />
                  </div>
                );
              })}
            </div>
          )}
        </AdminPanel>

        <AdminPanel
          title="Novos registos"
          subtitle="Utilizadores que entraram recentemente"
          icon={Users}
          action={
            <a
              href="/admin/usuarios"
              className="text-[9px] font-medium text-emerald-600 hover:underline dark:text-emerald-400"
            >
              Gerir
            </a>
          }
          bodyClassName="pb-2"
        >
          {data.usuariosRecentes.length === 0 ? (
            <EmptyState icon={Users} title="Nenhum registo ainda" />
          ) : (
            <div className="space-y-0.5">
              {data.usuariosRecentes.slice(0, 5).map((user) => {
                const initials = user.nome?.substring(0, 2).toUpperCase() || "U";
                return (
                  <div
                    key={user.id}
                    className="flex items-center justify-between gap-2 p-2 rounded-xl border-white/80 dark:border-white/10 hover:bg-white/5 dark:hover:bg-white/10 transition-colors"
                  >
                    <div className="flex min-w-0 items-center gap-2">
                      <div className="relative shrink-0">
                        <div className="grid size-8 place-items-center rounded-full bg-gradient-to-br from-emerald-200 to-emerald-400 text-[9px] font-bold text-black">
                          {initials}
                        </div>
                        <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded border-2 border-white bg-emerald-300 dark:border-[#0a0d0e]" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-[12px] font-medium text-gray-900 dark:text-white">
                          {user.nome}
                        </p>
                        <p className="truncate text-[9px] text-gray-400 dark:text-zinc-500">
                          {user.email}
                        </p>
                      </div>
                    </div>
                    <span className="shrink-0 text-[8px] text-gray-400 dark:text-zinc-500">
                      {new Date(user.created_at).toLocaleDateString("pt-PT", {
                        day: "2-digit",
                        month: "short",
                      })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </AdminPanel>
      </div>
    </div>
  );
}

export default EstatisticasAdmin;
