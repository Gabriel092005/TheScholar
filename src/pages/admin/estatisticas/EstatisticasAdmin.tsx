import { useQuery } from "@tanstack/react-query";
import {
  BookOpen, Users, Award, FileText, Briefcase, GraduationCap,
  TrendingUp, Loader2,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line,
} from "recharts";
import { adminApi } from "@/api/admin";

const ICON_MAP: Record<string, React.ElementType> = {
  Users, BookOpen, Award, FileText, Briefcase, GraduationCap,
};

const COLOR_MAP: Record<string, { bg: string; text: string }> = {
  purple: { bg: "bg-purple-50 dark:bg-purple-500/10", text: "text-purple-500" },
  emerald: { bg: "bg-emerald-50 dark:bg-emerald-500/10", text: "text-emerald-500" },
  amber: { bg: "bg-amber-50 dark:bg-amber-500/10", text: "text-amber-500" },
  blue: { bg: "bg-blue-50 dark:bg-blue-500/10", text: "text-blue-500" },
  rose: { bg: "bg-rose-50 dark:bg-rose-500/10", text: "text-rose-500" },
  teal: { bg: "bg-teal-50 dark:bg-teal-500/10", text: "text-teal-500" },
};

export function EstatisticasAdmin() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: adminApi.getDashboard,
  });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency", currency: "AOA", maximumFractionDigits: 0,
    }).format(value);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard</h2>
          <p className="text-sm text-gray-500 dark:text-zinc-500">Visão geral da plataforma</p>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-zinc-400">
          <span className="flex items-center gap-1">
            <Award size={14} className="text-emerald-500" />
            {formatCurrency(data.receitaTotal)} em receitas
          </span>
          <span className="flex items-center gap-1">
            <FileText size={14} className="text-blue-500" />
            {data.totalPagamentosAprovados} pagamentos
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {data.statsCards.map((stat) => {
          const Icon = ICON_MAP[stat.icon] || Users;
          const colors = COLOR_MAP[stat.color] || COLOR_MAP.emerald;
          return (
            <div
              key={stat.label}
              className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-4"
            >
              <div className="flex items-center justify-between">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${colors.bg}`}>
                  <Icon size={16} className={colors.text} />
                </div>
              </div>
              <div className="mt-3">
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {stat.value.toLocaleString("pt-AO")}
                </p>
                <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{stat.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-emerald-500" />
            Crescimento Mensal
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.crescimentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
                <Bar dataKey="users" name="Utilizadores" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="courses" name="Cursos" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="bolsas" name="Bolsas" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] p-5">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <TrendingUp size={18} className="text-blue-500" />
            Evolução de Utilizadores
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.crescimentoMensal}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#71717a", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "#18181b", border: "1px solid #27272a", borderRadius: "8px", color: "#fafafa" }} />
                <Line type="monotone" dataKey="users" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.06]">
            <h3 className="font-semibold text-gray-900 dark:text-white">Cursos Mais Populares</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {data.cursosPopulares.length === 0 ? (
              <div className="p-5 text-sm text-gray-400 dark:text-zinc-500 text-center">Nenhum curso ainda</div>
            ) : (
              data.cursosPopulares.map((curso, idx) => (
                <div key={curso.titulo} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/[0.06] flex items-center justify-center text-xs font-medium text-gray-500 dark:text-zinc-400">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{curso.titulo}</p>
                      <p className="text-xs text-gray-500 dark:text-zinc-500">{curso.estudantes} estudantes</p>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{formatCurrency(curso.receita)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-[#111113] rounded-2xl border border-gray-100 dark:border-white/[0.06] overflow-hidden">
          <div className="p-5 border-b border-gray-100 dark:border-white/[0.06]">
            <h3 className="font-semibold text-gray-900 dark:text-white">Novos Registos Recentes</h3>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-white/[0.06]">
            {data.usuariosRecentes.length === 0 ? (
              <div className="p-5 text-sm text-gray-400 dark:text-zinc-500 text-center">Nenhum registo ainda</div>
            ) : (
              data.usuariosRecentes.map((user) => {
                const initials = user.nome?.substring(0, 2).toUpperCase() || "U";
                return (
                  <div key={user.id} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-xs">
                        {initials}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{user.nome}</p>
                        <p className="text-xs text-gray-500 dark:text-zinc-500">{user.email}</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 dark:text-zinc-500">
                      {new Date(user.created_at).toLocaleDateString("pt-PT")}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default EstatisticasAdmin;