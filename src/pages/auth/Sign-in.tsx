import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Mail, Lock, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { jwtDecode } from "jwt-decode";
import Cookies from "js-cookie";
import { signIn, requestMagicLink } from "@/api/auth";
import { toast } from "sonner";
import { env } from "@/env";
import { useQueryClient } from "@tanstack/react-query";

interface MyTokenPayload {
  role: "ADMIN" | "GESTOR" | "USUARIO";
  sub: string;
  exp: number;
}

const shakeVariants = {
  idle:  { x: 0 },
  shake: {
    x: [0, -8, 8, -5, 5, -2, 2, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function Field({
  id,
  label,
  icon: Icon,
  children,
  right,
}: {
  id: string;
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <Label htmlFor={id} className="text-sm font-medium text-gray-700 dark:text-zinc-300">
          {label}
        </Label>
        {right}
      </div>
      <div className="relative group">
        <Icon
          size={16}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-gray-700 dark:group-focus-within:text-white transition-colors"
        />
        {children}
      </div>
    </div>
  );
}

export function SignIn() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [useMagicLink, setUseMagicLink] = useState(false);
  const [rememberEmail, setRememberEmail] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [shakeState, setShakeState] = useState<"idle" | "shake">("idle");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const queryClient = useQueryClient();

  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberEmail(true);
    }
  }, []);

  useEffect(() => {
    const error = searchParams.get("error");
    const reason = searchParams.get("reason");

    if (!error) return;

    const reasonText = reason
      ? decodeURIComponent(reason).toLowerCase()
      : "";

    if (
      reasonText.includes("redirect_uri_mismatch") ||
      reasonText.includes("invalid_client") ||
      reasonText.includes("invalid_request")
    ) {
      toast.error("Falha ao entrar com Google. O endereço de retorno não está configurado no Google — contacta o administrador.");
    } else if (reasonText.includes("access_denied")) {
      toast.error("Autorização com o Google cancelada.");
    } else if (reasonText.includes("conta_suspensa")) {
      toast.error("A tua conta está suspensa. Contacta o suporte.");
    } else if (reasonText.includes("email_nao_verificado")) {
      toast.error("Confirme primeiro o seu e-mail na conta Google e tente novamente.");
    } else if (reasonText.includes("google_not_configured")) {
      toast.error("O login com Google não está disponível de momento. Entre com o seu e-mail.");
    } else if (reasonText.includes("invalid_state") || reasonText.includes("state")) {
      toast.error("Sessão expirada. Tenta novamente.");
    } else {
      toast.error("Falha ao entrar com Google. Tenta novamente.");
    }

    navigate("/sign-in", { replace: true });
  }, [searchParams, navigate]);

  useEffect(() => {
    const token = Cookies.get("token");
    if (token) {
      try {
        const decoded = jwtDecode<MyTokenPayload>(token);
        const isExpired = Date.now() >= decoded.exp * 1000;
        if (!isExpired) {
          if (decoded.role === "ADMIN") {
            navigate("/admin", { replace: true });
          } else if (decoded.role === "GESTOR") {
            navigate("/gestor/estatisticas", { replace: true });
          } else {
            navigate("/", { replace: true });
          }
        } else {
          Cookies.remove("token", { path: "/" });
        }
      } catch {
        Cookies.remove("token", { path: "/" });
      }
    }
  }, [navigate]);

  function mostrarErro(message: string) {
    setErro(message);
    setShakeState("shake");
    setTimeout(() => setShakeState("idle"), 500);
  }

  async function enviarMagicLink() {
    setIsLoading(true);
    try {
      await requestMagicLink(email.trim().toLowerCase());
      setMagicLinkSent(true);
      toast.success("Link de acesso enviado! Verifique o seu e-mail.");
    } catch {
      toast.error("Erro ao enviar o link. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    if (!isValidEmail(email.trim())) return mostrarErro("Insira um e-mail válido.");
    await enviarMagicLink();
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!isValidEmail(email.trim())) return mostrarErro("Insira um e-mail válido.");
    if (!password) return mostrarErro("Insira a sua senha.");

    setIsLoading(true);

    try {
      const response = await signIn(email.trim().toLowerCase(), password);
      Cookies.set("token", response.token, { expires: 7, path: "/" });
      await queryClient.invalidateQueries({ queryKey: ["user-profile"] });

      if (rememberEmail) {
        localStorage.setItem("rememberedEmail", email.trim().toLowerCase());
      } else {
        localStorage.removeItem("rememberedEmail");
      }

      toast.success("Sessão iniciada com sucesso!");

      if (response.user.role === "ADMIN") {
        navigate("/admin", { replace: true });
      } else if (response.user.role === "GESTOR") {
        navigate("/gestor/estatisticas", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    } catch (error: any) {
      const isNetworkError = error?.code === "ERR_NETWORK" || error?.message?.includes("Network");

      if (isNetworkError) {
        toast.error("Servidor indisponível", {
          description: "Usando modo demonstração..."
        });
        const demoToken = "demo." + btoa(JSON.stringify({ role: "USUARIO", sub: email, exp: Math.floor(Date.now() / 1000) + 86400 }));
        Cookies.set("token", demoToken, { expires: 7, path: "/" });
        await queryClient.invalidateQueries({ queryKey: ["user-profile"] });
        navigate("/");
      } else {
        mostrarErro(error?.response?.data?.message || "E-mail ou senha incorretos.");
      }
    } finally {
      setIsLoading(false);
    }
  }

  const inputBase = `pl-10 h-11 rounded-xl text-sm border transition-colors outline-none
    focus-visible:ring-2 focus-visible:ring-gray-900 dark:focus-visible:ring-white focus-visible:ring-offset-0`;

  const linkClass = `font-medium text-gray-900 underline underline-offset-2 transition-colors
    hover:text-gray-600 dark:text-white dark:hover:text-zinc-300`;

  const inputNormal = `bg-white border-gray-200 text-gray-900 placeholder:text-zinc-400
    dark:bg-white/[0.04] dark:border-white/[0.08] dark:text-white`;

  const inputErr = `bg-white border-red-300 text-gray-900 placeholder:text-zinc-400
    dark:bg-white/[0.04] dark:border-red-500/40 dark:text-white`;

  const secondaryBtn = `w-full h-11 rounded-xl text-sm font-medium border border-gray-200 dark:border-white/[0.08]
    text-gray-700 dark:text-zinc-300 hover:bg-gray-50 dark:hover:bg-white/[0.04]
    transition-colors flex items-center justify-center gap-2.5`;

  if (magicLinkSent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-gray-700 dark:bg-white/[0.08] dark:text-white">
          <Mail size={22} />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
            Verifique o seu e-mail
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Enviámos um link de acesso para{" "}
            <strong className="font-medium text-gray-700 dark:text-zinc-300">{email.trim()}</strong>.
          </p>
        </div>
        <div className="space-y-2.5">
          <button type="button" onClick={enviarMagicLink} disabled={isLoading} className={`${secondaryBtn} disabled:opacity-60`}>
            {isLoading && <Loader2 size={16} className="animate-spin" />}
            Reenviar link
          </button>
          <button
            type="button"
            onClick={() => { setMagicLinkSent(false); setUseMagicLink(false); }}
            className={`w-full text-center text-sm ${linkClass}`}
          >
            Voltar ao login
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-7"
    >
      <div className="space-y-1.5">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">
          Entrar na sua conta
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Não tem conta?{" "}
          <Link to="/sign-up" className={linkClass}>
            Criar conta
          </Link>
        </p>
      </div>

      <motion.div variants={shakeVariants} animate={shakeState} className="space-y-4">
        <AnimatePresence initial={false}>
          {erro && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-600 dark:border-red-500/25 dark:bg-red-500/10 dark:text-red-400"
              >
                <AlertCircle size={16} className="shrink-0" />
                {erro}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          type="button"
          onClick={() => window.location.href = `${env.VITE_API_URL}/auth/google`}
          className={secondaryBtn}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Continuar com Google
        </button>

        <div className="relative py-1">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-200 dark:border-white/[0.08]" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-background px-3 text-xs text-zinc-400">ou</span>
          </div>
        </div>

        <form noValidate onSubmit={useMagicLink ? handleMagicLink : handleSignIn} className="space-y-4">
          <Field id="email" label="E-mail" icon={Mail}>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => { setEmail(e.target.value); setErro(null); }}
              placeholder="exemplo@email.com"
              disabled={isLoading}
              aria-invalid={!!erro}
              className={`${inputBase} ${erro ? inputErr : inputNormal}`}
            />
          </Field>

          {!useMagicLink && (
            <>
              <Field
                id="password"
                label="Senha"
                icon={Lock}
                right={
                  <Link
                    to="/password-recover"
                    className={`text-xs ${linkClass}`}
                  >
                    Esqueceu a senha?
                  </Link>
                }
              >
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setErro(null); }}
                  placeholder="••••••••"
                  disabled={isLoading}
                  aria-invalid={!!erro}
                  className={`${inputBase} pr-11 ${erro ? inputErr : inputNormal}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-1.5 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-300"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </Field>

              <div className="flex items-center gap-2.5">
                <Checkbox
                  id="remember"
                  checked={rememberEmail}
                  onCheckedChange={(v) => setRememberEmail(v as boolean)}
                  className="border-zinc-300 dark:border-white/20
                    data-[state=checked]:bg-gray-900 data-[state=checked]:border-gray-900 data-[state=checked]:text-white
                    dark:data-[state=checked]:bg-white dark:data-[state=checked]:border-white dark:data-[state=checked]:text-gray-900"
                />
                <label htmlFor="remember" className="cursor-pointer select-none text-sm text-zinc-600 dark:text-zinc-400">
                  Lembrar o meu e-mail
                </label>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-gray-900 text-sm font-semibold text-white transition-colors hover:bg-gray-700 dark:bg-white dark:text-gray-900 dark:hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isLoading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <>
                {useMagicLink ? "Enviar link de acesso" : "Entrar"}
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        <button
          type="button"
          onClick={() => { setUseMagicLink(!useMagicLink); setErro(null); }}
          className={secondaryBtn}
        >
          {useMagicLink ? <Lock size={16} className="text-zinc-400" /> : <Mail size={16} className="text-zinc-400" />}
          {useMagicLink ? "Entrar com senha" : "Receber link de acesso por e-mail"}
        </button>
      </motion.div>
    </motion.div>
  );
}
