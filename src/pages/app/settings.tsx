import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import {
  User, Bell, Palette, Shield, Lock, ChevronRight,
  Moon, Sun, Monitor, LogOut, Eye, EyeOff,
  Loader2, CheckCircle2, Smartphone, Mail, Globe,
  Award, GraduationCap, MessageCircle, DollarSign,
  BellRing, BellOff, Clock, Bot, Trash2
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { EditProfileDialog } from "@/components/update-profile";
import { useUser } from "@/api/useGetProfile";
import { useTheme } from "@/components/theme/theme-provider";
import { api, getUploadUrl } from "@/lib/axios";
import { cn } from "@/lib/utils";


import { toast } from "sonner";
import { useMutation } from "@tanstack/react-query";

const NOTIFICATIONS_KEY = "scholar_notification_prefs";

const defaultNotifications = {
  canais: {
    push: true,
    email: true,
    in_app: true,
  },
  eventos: {
    novas_bolsas: true,
    candidatura_aprovada: true,
    candidatura_rejeitada: true,
    mentoria_agendada: true,
    novo_curso: false,
    pagamento: true,
    mensagem: true,
    marketing: false,
  },
  horario_silencioso: {
    ativo: false,
    inicio: "22:00",
    fim: "08:00",
  },
};

type NotificationPrefs = typeof defaultNotifications;

function loadNotificationPrefs(): NotificationPrefs {
  try {
    const saved = localStorage.getItem(NOTIFICATIONS_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return { ...defaultNotifications, ...parsed, canais: { ...defaultNotifications.canais, ...parsed.canais }, eventos: { ...defaultNotifications.eventos, ...parsed.eventos }, horario_silencioso: { ...defaultNotifications.horario_silencioso, ...parsed.horario_silencioso } };
    }
  } catch {}
  return defaultNotifications;
}

const COLORS = ["bg-emerald-500", "bg-blue-500", "bg-yellow-500", "bg-purple-500", "bg-pink-500", "bg-orange-500", "bg-teal-500"];

export function SettingsPage() {
  const { user, handleLogout } = useUser();
  const { theme, setTheme } = useTheme();
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationPrefs>(loadNotificationPrefs);

  useEffect(() => {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(notifications));
  }, [notifications]);

  const updateCanal = useCallback((canal: string, checked: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      canais: { ...prev.canais, [canal]: checked },
    }));
  }, []);

  const updateEvento = useCallback((evento: string, checked: boolean) => {
    setNotifications((prev) => ({
      ...prev,
      eventos: { ...prev.eventos, [evento]: checked },
    }));
  }, []);

  const updateHorario = useCallback((field: string, value: string | boolean) => {
    setNotifications((prev) => ({
      ...prev,
      horario_silencioso: { ...prev.horario_silencioso, [field]: value },
    }));
  }, []);

  const userColor = user?.nome ? COLORS[user.nome.length % COLORS.length] : "bg-emerald-500";
  const avatarSrc = user?.image_path ? getUploadUrl(`/uploads/${user.image_path}`) : "";

  const changePasswordMutation = useMutation({
    mutationFn: async () => {
      const { data } = await api.put("/update/password", {
        current_password: currentPassword,
        new_password: newPassword,
      });
      return data;
    },
    onSuccess: () => {
      toast.success("Senha alterada com sucesso!");
      setShowPasswordForm(false);
      setCurrentPassword("");
      setNewPassword("");
    },
    onError: (err: any) => {
      const message = err?.response?.data?.message || "Erro ao alterar senha";
      toast.error(message);
    },
  });

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPassword.length < 6) {
      toast.error("A nova senha deve ter pelo menos 6 caracteres");
      return;
    }
    changePasswordMutation.mutate();
  }

  function handleLogoutClick() {
    handleLogout();
    setLogoutDialogOpen(false);
  }

  const sectionVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: (i: number) => ({
      opacity: 1, y: 0,
      transition: { delay: i * 0.06, duration: 0.4, ease: [0.22, 1, 0.36, 1] },
    }),
  };

  function SectionCard({ icon: Icon, title, description, children, className }: {
    icon: React.ElementType; title: string; description?: string; children: React.ReactNode; className?: string;
  }) {
    return (
      <motion.div custom={0} initial="hidden" animate="visible" variants={sectionVariants}>
        <Card className={cn("border-gray-100 dark:border-white/[0.06] bg-white dark:bg-[#111113] overflow-hidden", className)}>
          <CardContent className="p-0">
            <div className="flex items-center gap-3 px-6 pt-6 pb-4">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h3>
                {description && (
                  <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">{description}</p>
                )}
              </div>
            </div>
            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />
            <div className="p-6">{children}</div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  function SettingRow({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
    return (
      <div className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
        <div className="space-y-0.5 min-w-0">
          <p className="text-sm font-medium text-gray-900 dark:text-white">{label}</p>
          {description && (
            <p className="text-xs text-gray-500 dark:text-zinc-500">{description}</p>
          )}
        </div>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-4 sm:px-6 py-8 max-w-3xl"
    >
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mb-8"
      >
        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
          Definições
        </h1>
        <p className="text-sm text-gray-500 dark:text-zinc-400 mt-1">
          Gerir as suas preferências e configurações da conta.
        </p>
      </motion.div>

      <div className="space-y-6">

        {/* Profile */}
        <SectionCard icon={User} title="Perfil" description="As suas informações pessoais">
          <div className="flex items-center gap-4">
            <Avatar className="w-14 h-14 border-2 border-gray-100 dark:border-white/[0.08] shrink-0">
              <AvatarImage src={avatarSrc} className="object-cover" />
              <AvatarFallback className={cn(userColor, "text-white text-sm font-bold")}>
                {user?.nome?.substring(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                {user?.nome || "Carregando..."}
              </p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 truncate">
                {user?.email || ""}
              </p>
              {user?.phone && (
                <p className="text-xs text-gray-400 dark:text-zinc-600 mt-0.5">{user.phone}</p>
              )}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setProfileDialogOpen(true)}
              className="shrink-0 h-9 text-xs rounded-xl border-gray-200 dark:border-white/[0.08] hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              Editar
              <ChevronRight className="ml-1 h-3.5 w-3.5" />
            </Button>
          </div>
        </SectionCard>

        <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
          {user && (
            <EditProfileDialog
              user={user}
              onSuccess={() => setProfileDialogOpen(false)}
            />
          )}
        </Dialog>

        {/* Notifications */}
        <SectionCard icon={Bell} title="Notificações" description="Gerir como e quando recebe notificações">
          <div className="space-y-6">

            {/* Canais */}
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-500 mb-3">
                Canais de notificação
              </p>
              <div className="space-y-1">
                {[
                  { id: "push", label: "Push", description: "Alertas no seu dispositivo", icon: Smartphone },
                  { id: "email", label: "E-mail", description: "Notificações por e-mail", icon: Mail },
                  { id: "in_app", label: "In-app", description: "Notificações dentro da plataforma", icon: BellRing },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{opt.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.canais[opt.id as keyof typeof notifications.canais]}
                        onCheckedChange={(checked) => updateCanal(opt.id, checked)}
                        className="data-[state=checked]:bg-emerald-500 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />

            {/* Eventos */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-500">
                  Eventos
                </p>
                <div className="flex items-center gap-1.5">
                  <Bell className="w-3 h-3 text-gray-400" />
                  <span className="text-[10px] text-gray-400 dark:text-zinc-500">
                    {Object.values(notifications.eventos).filter(Boolean).length}/{Object.values(notifications.eventos).length} ativas
                  </span>
                </div>
              </div>
              <div className="space-y-1">
                {[
                  { id: "novas_bolsas", label: "Novas Bolsas", description: "Quando novas bolsas são publicadas", icon: Award },
                  { id: "candidatura_aprovada", label: "Candidatura Aprovada", description: "Quando a sua candidatura for aceite", icon: CheckCircle2 },
                  { id: "candidatura_rejeitada", label: "Candidatura Rejeitada", description: "Quando a sua candidatura for recusada", icon: BellOff },
                  { id: "mentoria_agendada", label: "Mentoria Agendada", description: "Lembretes de mentorias marcadas", icon: MessageCircle },
                  { id: "novo_curso", label: "Novos Cursos", description: "Quando novos cursos são lançados", icon: GraduationCap },
                  { id: "pagamento", label: "Pagamentos", description: "Confirmações e recibos de pagamento", icon: DollarSign },
                  { id: "mensagem", label: "Mensagens", description: "Novas mensagens de mentores ou admin", icon: Mail },
                  { id: "marketing", label: "Marketing", description: "Promoções e novidades da plataforma", icon: Globe },
                ].map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <div key={opt.id} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-gray-50 dark:bg-white/[0.04] flex items-center justify-center shrink-0">
                          <Icon className="w-3.5 h-3.5 text-gray-500 dark:text-zinc-400" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{opt.label}</p>
                          <p className="text-xs text-gray-500 dark:text-zinc-500">{opt.description}</p>
                        </div>
                      </div>
                      <Switch
                        checked={notifications.eventos[opt.id as keyof typeof notifications.eventos]}
                        onCheckedChange={(checked) => updateEvento(opt.id, checked)}
                        className="data-[state=checked]:bg-emerald-500 shrink-0"
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />

            {/* Horário silencioso */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-zinc-500">
                    Horário Silencioso
                  </p>
                </div>
                <Switch
                  checked={notifications.horario_silencioso.ativo}
                  onCheckedChange={(checked) => updateHorario("ativo", checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
              {notifications.horario_silencioso.ativo && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                      Início
                    </Label>
                    <Input
                      type="time"
                      value={notifications.horario_silencioso.inicio}
                      onChange={(e) => updateHorario("inicio", e.target.value)}
                      className="h-10 rounded-xl bg-gray-50 dark:bg-white/[0.04] border text-sm text-gray-900 dark:text-white focus-visible:ring-emerald-500/40"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                      Fim
                    </Label>
                    <Input
                      type="time"
                      value={notifications.horario_silencioso.fim}
                      onChange={(e) => updateHorario("fim", e.target.value)}
                      className="h-10 rounded-xl bg-gray-50 dark:bg-white/[0.04] border text-sm text-gray-900 dark:text-white focus-visible:ring-emerald-500/40"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>
        </SectionCard>

        {/* Appearance */}
        <SectionCard icon={Palette} title="Aparência" description="Personalizar o visual da plataforma">
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: "light", label: "Claro", icon: Sun },
              { value: "dark", label: "Escuro", icon: Moon },
              { value: "system", label: "Sistema", icon: Monitor },
            ].map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value as "light" | "dark" | "system")}
                  className={cn(
                    "flex flex-col items-center gap-2 py-4 px-3 rounded-xl border transition-all duration-200",
                    theme === opt.value
                      ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      : "border-gray-100 dark:border-white/[0.06] bg-gray-50 dark:bg-white/[0.02] text-gray-500 dark:text-zinc-400 hover:border-gray-200 dark:hover:border-white/20"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-xs font-semibold">{opt.label}</span>
                </button>
              );
            })}
          </div>
        </SectionCard>

        {/* Helena AI */}
        <SectionCard icon={Bot} title="Helena — Assistente IA" description="Gerir o assistente virtual de bolsas">
          <div className="flex items-center justify-between">
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white">Assistente Helena</p>
              <p className="text-xs text-gray-500 dark:text-zinc-500 mt-0.5">
                {localStorage.getItem("helena_dismissed") === "true"
                  ? 'Oculto — toque em "Reativar" para exibir novamente'
                  : "Visível no canto inferior direito"}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                localStorage.removeItem("helena_dismissed");
                window.location.reload();
              }}
              className="shrink-0 h-9 text-xs rounded-xl border-gray-200 dark:border-white/[0.08] hover:border-emerald-400 hover:text-emerald-600 dark:hover:text-emerald-400"
            >
              <Trash2 className="mr-1.5 h-3.5 w-3.5" />
              Reativar
            </Button>
          </div>
        </SectionCard>

        {/* Password */}
        <SectionCard icon={Lock} title="Segurança" description="Alterar a palavra-passe da sua conta">
          {showPasswordForm ? (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                  Senha actual
                </Label>
                <div className="relative">
                  <Input
                    type={showCurrent ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrent(!showCurrent)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    {showCurrent ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-zinc-500">
                  Nova senha
                </Label>
                <div className="relative">
                  <Input
                    type={showNew ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="h-11 rounded-xl bg-gray-50 dark:bg-white/[0.04] border text-gray-900 dark:text-white focus-visible:ring-2 focus-visible:ring-emerald-500/40"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNew(!showNew)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-zinc-300"
                  >
                    {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-1">
                <Button
                  type="submit"
                  disabled={changePasswordMutation.isPending}
                  className="h-10 px-5 text-xs font-bold rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-all disabled:opacity-50"
                >
                  {changePasswordMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      Alterar senha
                    </>
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => { setShowPasswordForm(false); setCurrentPassword(""); setNewPassword(""); }}
                  className="h-10 px-5 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          ) : (
            <Button
              variant="outline"
              onClick={() => setShowPasswordForm(true)}
              className="h-10 text-xs rounded-xl border-gray-200 dark:border-white/[0.08]"
            >
              <Lock className="mr-2 h-3.5 w-3.5" />
              Alterar palavra-passe
            </Button>
          )}
        </SectionCard>

        {/* Account */}
        <SectionCard icon={Shield} title="Conta" description="Gerir o acesso à sua conta">
          <div className="space-y-1">
            <SettingRow label="Tipo de conta" description={user?.role === "ADMIN" ? "Administrador" : user?.role === "GESTOR" ? "Gestor" : "Usuário"}>
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg",
                user?.role === "ADMIN"
                  ? "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400"
                  : user?.role === "GESTOR"
                  ? "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400"
                  : "bg-gray-100 text-gray-600 dark:bg-white/[0.06] dark:text-zinc-400"
              )}>
                {user?.role || "—"}
              </span>
            </SettingRow>
            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />
            <SettingRow label="Estado da conta">
              <span className={cn(
                "text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg",
                user?.estado_conta === "ACTIVA"
                  ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
                  : "bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400"
              )}>
                {user?.estado_conta || "—"}
              </span>
            </SettingRow>
            <Separator className="bg-gray-100 dark:bg-white/[0.06]" />
            <SettingRow label="Membro desde" description={user?.created_at ? new Date(user.created_at).toLocaleDateString("pt-PT") : "—"}>
              <div />
            </SettingRow>
          </div>
        </SectionCard>

        {/* Logout */}
        <motion.div custom={5} initial="hidden" animate="visible" variants={sectionVariants}>
          <Card className="border-red-100 dark:border-red-500/10 bg-white dark:bg-[#111113]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                    <LogOut className="w-4 h-4 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">Sair da conta</p>
                    <p className="text-xs text-gray-500 dark:text-zinc-500">Terminar sessão actual</p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setLogoutDialogOpen(true)}
                  className="shrink-0 h-9 text-xs rounded-xl border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  Sair
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

      </div>

      {/* Logout confirmation */}
      <Dialog open={logoutDialogOpen} onOpenChange={setLogoutDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl bg-white dark:bg-[#111113] border border-gray-100 dark:border-white/[0.06]">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Sair da conta
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500 dark:text-zinc-400">
              Tem a certeza que deseja terminar a sessão?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-3 sm:gap-3">
            <Button
              variant="outline"
              onClick={() => setLogoutDialogOpen(false)}
              className="flex-1 h-11 rounded-xl text-sm border-gray-200 dark:border-white/[0.08] dark:text-white"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLogoutClick}
              className="flex-1 h-11 rounded-xl text-sm bg-red-500 hover:bg-red-600 text-white"
            >
              Sair
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
